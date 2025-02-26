// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./HashKeyChainStakingEvents.sol";
import "./StHSK.sol";

/**
 * @title HashKeyChainStakingBase
 * @dev 基础功能实现，使用基于份额的质押模型
 */
abstract contract HashKeyChainStakingBase is 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    HashKeyChainStakingEvents
{
    // Constants
    uint256 internal constant PRECISION_FACTOR = 1e18;
    uint256 internal constant MAX_PENALTY = 5000;      // Maximum penalty: 50%
    uint256 internal constant BASIS_POINTS = 10000;    // 100% in basis points
    uint256 internal constant MAX_APR = 3000;         // Maximum APR: 30%

    function __HashKeyChainStakingBase_init(
        uint256 _hskPerBlock,
        uint256 _startBlock,
        uint256 _maxHskPerBlock,
        uint256 _minStakeAmount
    ) internal onlyInitializing {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);
        
        require(_hskPerBlock > 0, "HSK per block must be positive");
        require(_startBlock >= block.number, "Start block must be in the future");
        require(_maxHskPerBlock >= _hskPerBlock, "Max HSK per block must be >= HSK per block");
        require(_minStakeAmount >= 100 ether, "Min stake amount must be >= 100 HSK");
        
        stHSK = new StHSK();
        
        hskPerBlock = _hskPerBlock;
        startBlock = _startBlock;
        lastRewardBlock = startBlock;
        maxHskPerBlock = _maxHskPerBlock;
        minStakeAmount = _minStakeAmount;
        totalPooledHSK = 0;
        stakeEndTime = type(uint256).max;  // 默认设为最大值
        version = 1;
        
        // 计算并设置默认年度预算
        uint256 blocksPerYear = (365 * 24 * 3600) / 2; // 每年区块数（假设2秒出块）
        annualRewardsBudget = _hskPerBlock * blocksPerYear;
        
        // 设置提前解锁惩罚
        earlyWithdrawalPenalty[StakeType.FIXED_30_DAYS] = 500;    // 5%
        earlyWithdrawalPenalty[StakeType.FIXED_90_DAYS] = 1000;   // 10%
        earlyWithdrawalPenalty[StakeType.FIXED_180_DAYS] = 1500;  // 15%
        earlyWithdrawalPenalty[StakeType.FIXED_365_DAYS] = 2000;  // 20%
        
        // 设置不同质押期的奖励加成
        stakingBonus[StakeType.FIXED_30_DAYS] = 0;      // 0%
        stakingBonus[StakeType.FIXED_90_DAYS] = 80;     // 0.8%
        stakingBonus[StakeType.FIXED_180_DAYS] = 200;   // 2.0%
        stakingBonus[StakeType.FIXED_365_DAYS] = 400;   // 4.0%
        
        emit StakingContractUpgraded(version);
        emit HskPerBlockUpdated(0, _hskPerBlock);
        emit MaxHskPerBlockUpdated(0, _maxHskPerBlock);
        emit MinStakeAmountUpdated(0, _minStakeAmount);
    }

    /**
     * @dev 更新奖励池
     */
    function updateRewardPool() public {
        if (block.number <= lastRewardBlock) {
            return;
        }
        
        if (totalPooledHSK == 0) {
            lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = block.number - lastRewardBlock;
        uint256 hskReward = multiplier * hskPerBlock;
        
        // 计算并限制 APR
        uint256 annualReward = hskPerBlock * (365 days / 2); // 2秒一个块
        uint256 currentAPR = (annualReward * BASIS_POINTS) / totalPooledHSK;
        if (currentAPR > MAX_APR) {
            hskReward = (totalPooledHSK * MAX_APR * multiplier) / (BASIS_POINTS * (365 days / 2));
        }
        
        // 检查合约是否有足够的HSK
        if (reservedRewards >= hskReward) {
            totalPooledHSK += hskReward;
            reservedRewards -= hskReward;
            
            // 更新汇率
            emit ExchangeRateUpdated(totalPooledHSK, stHSK.totalSupply(), getHSKForShares(PRECISION_FACTOR));
        } else {
            if (reservedRewards > 0) {
                totalPooledHSK += reservedRewards;
                hskReward = reservedRewards;
                reservedRewards = 0;
                
                // 更新汇率
                emit ExchangeRateUpdated(totalPooledHSK, stHSK.totalSupply(), getHSKForShares(PRECISION_FACTOR));
            }
            emit InsufficientRewards(hskReward, reservedRewards);
        }
        
        lastRewardBlock = block.number;
    }

    /**
     * @dev 计算指定份额对应的HSK数量
     * @param _sharesAmount 份额数量
     * @return HSK数量
     */
    function getHSKForShares(uint256 _sharesAmount) public view returns (uint256) {
        uint256 totalShares = stHSK.totalSupply();
        if (totalShares == 0) {
            return _sharesAmount; // 初始1:1兑换率
        }
        return (_sharesAmount * totalPooledHSK) / totalShares;
    }

    /**
     * @dev 计算指定HSK数量对应的份额
     * @param _hskAmount HSK数量
     * @return 份额数量
     */
    function getSharesForHSK(uint256 _hskAmount) public view returns (uint256) {
        uint256 totalShares = stHSK.totalSupply();
        if (totalShares == 0 || totalPooledHSK == 0) {
            return _hskAmount; // 初始1:1兑换率
        }
        return (_hskAmount * totalShares) / totalPooledHSK;
    }

    /**
     * @dev 安全HSK转账函数
     * @param _to 接收地址
     * @param _amount 金额
     * @return 转账是否成功
     */
    function safeHskTransfer(address payable _to, uint256 _amount) internal returns (bool) {
        uint256 availableBalance = address(this).balance - totalPooledHSK;
        uint256 amountToSend = _amount > availableBalance ? availableBalance : _amount;
        
        if (amountToSend > 0) {
            (bool success, ) = _to.call{value: amountToSend}("");
            return success;
        }
        return true;
    }

    /**
     * @dev 获取当前HSK的年化收益率
     * @param _stakeAmount 模拟质押金额
     * @param _stakeType 质押类型
     * @return 当前APR（基点）
     */
    function getCurrentAPR(uint256 _stakeAmount, StakeType _stakeType) public view returns (uint256) {
        // 基础APR计算 - 使用年度预算而非每区块奖励计算
        uint256 yearlyRewards = annualRewardsBudget;
        
        uint256 baseApr;
        if (totalPooledHSK == 0) {
            baseApr = MAX_APR;
        } else {
            uint256 newTotal = totalPooledHSK + _stakeAmount;
            baseApr = (yearlyRewards * BASIS_POINTS) / newTotal;
            
            // 确保不超过最大APR
            if (baseApr > MAX_APR) {
                baseApr = MAX_APR;
            }
        }
        
        // 添加质押期限加成
        uint256 totalApr = baseApr + stakingBonus[_stakeType];
        
        // 获取对应质押类型的最大APR
        uint256 maxTypeApr;
        if (_stakeType == StakeType.FIXED_30_DAYS) {
            maxTypeApr = 120; // 1.2%
        } else if (_stakeType == StakeType.FIXED_90_DAYS) {
            maxTypeApr = 350; // 3.5%
        } else if (_stakeType == StakeType.FIXED_180_DAYS) {
            maxTypeApr = 650; // 6.5%
        } else {
            maxTypeApr = 1200; // 12.0%
        }
        
        // 确保不超过该类型的最大APR
        return totalApr > maxTypeApr ? maxTypeApr : totalApr;
    }

    
}