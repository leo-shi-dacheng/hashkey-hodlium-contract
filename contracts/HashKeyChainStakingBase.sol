// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./HashKeyChainStakingEvents.sol";
import "./StHSK.sol";

/**
 * @title HashKeyChainStakingBase
 * @dev Basic functionality implementation, using a share-based staking model
 */
abstract contract HashKeyChainStakingBase is 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    HashKeyChainStakingEvents
{
    function __HashKeyChainStakingBase_init(
        uint256 _hskPerBlock,
        uint256 _startBlock,
        uint256 _maxHskPerBlock,
        uint256 _minStakeAmount,
        uint256 _blockTime
    ) internal onlyInitializing {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        
        require(_hskPerBlock > 0, "HSK per block must be positive");
        require(_startBlock >= block.number, "Start block must be in the future");
        require(_maxHskPerBlock >= _hskPerBlock, "Max HSK per block must be >= HSK per block");
        require(_minStakeAmount >= 100 ether, "Min stake amount must be >= 100 HSK");
        require(_blockTime > 0, "Block time must be positive");
        
        blockTime = _blockTime;
        
        // 只有在StHSK合约地址为0时才部署新的StHSK合约
        if (address(stHSK) == address(0)) {
            stHSK = new StHSK();
            // 只有在初始化时才将totalPooledHSK设置为0
            totalPooledHSK = 0;
            initialLiquidityMinted = false;  // 初始化最小流动性标志
            
            // 初始化新添加的跟踪变量
            totalUnlockedShares = 0;
            totalSharesByStakeType[StakeType.FIXED_30_DAYS] = 0;
            totalSharesByStakeType[StakeType.FIXED_90_DAYS] = 0;
            totalSharesByStakeType[StakeType.FIXED_180_DAYS] = 0;
            totalSharesByStakeType[StakeType.FIXED_365_DAYS] = 0;
            
            // 初始化已支付奖励总量
            totalPaidRewards = 0;
        }
        
        hskPerBlock = _hskPerBlock;
        startBlock = _startBlock;
        lastRewardBlock = startBlock;
        maxHskPerBlock = _maxHskPerBlock;
        minStakeAmount = _minStakeAmount;
        stakeEndTime = type(uint256).max;  // Default set to maximum value
        version = 1;
        
        // Calculate and set default annual budget using configurable block time
        // SECONDS_PER_YEAR is 365 days (31,536,000 seconds)
        // Explicitly calculate blocks per year based on the configured block time
        uint256 blocksPerYear = SECONDS_PER_YEAR / blockTime;  // 31,536,000 / blockTime
        annualRewardsBudget = _hskPerBlock * blocksPerYear;
        
        // Set early withdrawal penalties
        earlyWithdrawalPenalty[StakeType.FIXED_30_DAYS] = 1;     // 0.01%
        earlyWithdrawalPenalty[StakeType.FIXED_90_DAYS] = 1;     // 0.01%
        earlyWithdrawalPenalty[StakeType.FIXED_180_DAYS] = 1;    // 0.01%
        earlyWithdrawalPenalty[StakeType.FIXED_365_DAYS] = 1;    // 0.01%
        
        // Set bonus for different staking periods
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
     * @dev Update reward pool
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
        
        // Calculate and limit APR using configurable block time
        // SECONDS_PER_YEAR is 365 days (31,536,000 seconds)
        // Explicitly calculate blocks per year based on the configured block time
        uint256 blocksPerYear = SECONDS_PER_YEAR / blockTime;  // 31,536,000 / blockTime
        uint256 annualReward = hskPerBlock * blocksPerYear;
        uint256 currentAPR = (annualReward * BASIS_POINTS) / totalPooledHSK;
        if (currentAPR > MAX_APR) {
            hskReward = (totalPooledHSK * MAX_APR * multiplier) / (BASIS_POINTS * blocksPerYear);
        }
        
        // 计算额外的锁定期奖励
        uint256 additionalBonusRewards = 0;
        
        // 获取总shares数量
        uint256 totalShares = stHSK.totalSupply();
        
        if (totalShares > 0) {
            // 计算每种锁定期类型的额外奖励
            uint256 bonusReward30Days = 0;
            uint256 bonusReward90Days = 0;
            uint256 bonusReward180Days = 0;
            uint256 bonusReward365Days = 0;
            
            // 只有当该类型有质押时才计算奖励
            if (totalSharesByStakeType[StakeType.FIXED_30_DAYS] > 0) {
                // 计算该类型质押占总质押的比例
                uint256 shareRatio30Days = (totalSharesByStakeType[StakeType.FIXED_30_DAYS] * PRECISION_FACTOR) / totalShares;
                // 计算该类型的基础奖励
                uint256 baseReward30Days = (hskReward * shareRatio30Days) / PRECISION_FACTOR;
                // 计算该类型的额外奖励
                bonusReward30Days = (baseReward30Days * stakingBonus[StakeType.FIXED_30_DAYS]) / BASIS_POINTS;
            }
            
            if (totalSharesByStakeType[StakeType.FIXED_90_DAYS] > 0) {
                uint256 shareRatio90Days = (totalSharesByStakeType[StakeType.FIXED_90_DAYS] * PRECISION_FACTOR) / totalShares;
                uint256 baseReward90Days = (hskReward * shareRatio90Days) / PRECISION_FACTOR;
                bonusReward90Days = (baseReward90Days * stakingBonus[StakeType.FIXED_90_DAYS]) / BASIS_POINTS;
            }
            
            if (totalSharesByStakeType[StakeType.FIXED_180_DAYS] > 0) {
                uint256 shareRatio180Days = (totalSharesByStakeType[StakeType.FIXED_180_DAYS] * PRECISION_FACTOR) / totalShares;
                uint256 baseReward180Days = (hskReward * shareRatio180Days) / PRECISION_FACTOR;
                bonusReward180Days = (baseReward180Days * stakingBonus[StakeType.FIXED_180_DAYS]) / BASIS_POINTS;
            }
            
            if (totalSharesByStakeType[StakeType.FIXED_365_DAYS] > 0) {
                uint256 shareRatio365Days = (totalSharesByStakeType[StakeType.FIXED_365_DAYS] * PRECISION_FACTOR) / totalShares;
                uint256 baseReward365Days = (hskReward * shareRatio365Days) / PRECISION_FACTOR;
                bonusReward365Days = (baseReward365Days * stakingBonus[StakeType.FIXED_365_DAYS]) / BASIS_POINTS;
            }
            
            // 计算总的额外奖励
            additionalBonusRewards = bonusReward30Days + bonusReward90Days + bonusReward180Days + bonusReward365Days;
        }
        
        // 总奖励 = 基础奖励 + 额外的锁定期奖励
        uint256 totalReward = hskReward + additionalBonusRewards;
        
        // 检查合约是否有足够的奖励资金
        // 使用annualRewardsBudget来计算可用奖励，而不是依赖实际合约余额
        // !!! 这里需要修改  不需要检查，定期打钱进去
        uint256 availableRewards = reservedRewards;
        
        if (availableRewards >= totalReward) {
            totalPooledHSK += totalReward;
            reservedRewards -= totalReward;
            
            // 更新已支付的奖励总量
            totalPaidRewards += totalReward;
            
            // Update exchange rate
            emit ExchangeRateUpdated(totalPooledHSK, stHSK.totalSupply(), getHSKForShares(PRECISION_FACTOR));
        } else {
            if (availableRewards > 0) {
                totalPooledHSK += availableRewards;
                
                // 更新已支付的奖励总量
                totalPaidRewards += availableRewards;
                
                totalReward = availableRewards;
                reservedRewards = 0;
                
                // Update exchange rate
                emit ExchangeRateUpdated(totalPooledHSK, stHSK.totalSupply(), getHSKForShares(PRECISION_FACTOR));
            }
            emit InsufficientRewards(totalReward, reservedRewards);
        }
        
        lastRewardBlock = block.number;
    }

    /**
     * @dev Calculate HSK amount for specified share amount
     * @param _sharesAmount Share amount
     * @return HSK amount
     */
    function getHSKForShares(uint256 _sharesAmount) public view returns (uint256) {
        uint256 totalShares = stHSK.totalSupply();
        if (totalShares == 0) {
            return _sharesAmount; // Initial 1:1 exchange rate
        }
        return (_sharesAmount * totalPooledHSK) / totalShares;
    }

    /**
     * @dev Calculate share amount for specified HSK amount
     * @param _hskAmount HSK amount
     * @return Share amount
     */
    function getSharesForHSK(uint256 _hskAmount) public view returns (uint256) {
        uint256 totalShares = stHSK.totalSupply();
        
        // Initial 1:1 exchange rate
        if (totalShares == 0 || totalPooledHSK == 0) {
            return _hskAmount;
        }
        
        // 保护措施：当totalPooledHSK或totalShares小于阈值时，使用1:1汇率
        // 这解决了全部unstakeLocked后再stake的问题
        if (totalShares < MINIMUM_SHARES_THRESHOLD || totalPooledHSK < MINIMUM_SHARES_THRESHOLD) {
            return _hskAmount;
        }
         
        // 计算实际的总份额（减去最小流动性）
        uint256 effectiveTotalShares = totalShares;
        if (initialLiquidityMinted) {
            effectiveTotalShares = totalShares - MINIMUM_LIQUIDITY;
        }
        
        // 计算实际的总质押HSK（减去最小流动性对应的HSK）
        uint256 effectiveTotalPooledHSK = totalPooledHSK;
        if (initialLiquidityMinted) {
            effectiveTotalPooledHSK = totalPooledHSK - MINIMUM_LIQUIDITY;
        }
        
        // Calculate shares based on the current pool ratio
        return (_hskAmount * effectiveTotalShares) / effectiveTotalPooledHSK;
    }

    /**
     * @dev Safe HSK transfer function
     * @param _to Recipient address
     * @param _amount Amount
     * @return Whether transfer was successful
     */
    function safeHskTransfer(address payable _to, uint256 _amount) internal returns (bool) {
        // 只检查合约总余额是否足够
        require(address(this).balance >= _amount, "Insufficient contract balance");
        
        // 发送资金
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "HSK transfer failed");
        return true;
    }

    /**
     * @dev Get current annual yield rate for HSK
     * @param _stakeAmount Simulated staking amount
     * @param _stakeType Stake type
     * @return Current APR (basis points)
     */
    function getCurrentAPR(uint256 _stakeAmount, StakeType _stakeType) public view returns (uint256) {
        // Base APR calculation - using annual budget instead of per-block rewards
        uint256 yearlyRewards = annualRewardsBudget;
        
        uint256 baseApr;
        if (totalPooledHSK == 0) {
            // Use a reasonable initial stake amount for calculation
            uint256 initialStake = minStakeAmount > 0 ? minStakeAmount : 100 ether;
            // Calculate APR based on this initial stake
            baseApr = (yearlyRewards * BASIS_POINTS) / initialStake;
            
            // Cap at MAX_APR
            if (baseApr > MAX_APR) {
                baseApr = MAX_APR;
            }
        } else {
            uint256 newTotal = totalPooledHSK + _stakeAmount;
            
            // Calculate APR based on annual rewards distributed over time
            baseApr = (yearlyRewards * BASIS_POINTS) / newTotal;
            
            // Ensure not exceeding maximum APR
            if (baseApr > MAX_APR) {
                baseApr = MAX_APR;
            }
        }
        
        // Add staking duration bonus
        uint256 totalApr = baseApr + stakingBonus[_stakeType];
        
        // Get maximum APR for corresponding stake type
        uint256 maxTypeApr;
        if (_stakeType == StakeType.FIXED_30_DAYS) {
            maxTypeApr = 360; // 3.6%
        } else if (_stakeType == StakeType.FIXED_90_DAYS) {
            maxTypeApr = 1000; // 10%
        } else if (_stakeType == StakeType.FIXED_180_DAYS) {
            maxTypeApr = 1800; // 18%
        } else  if (_stakeType == StakeType.FIXED_365_DAYS){
            maxTypeApr = 3600; // 36%
        }
        
        // Ensure not exceeding this type's maximum APR
        return totalApr > maxTypeApr ? maxTypeApr : totalApr;
    }

    /**
     * @dev Get current reward status
     * @return totalPooled Total pooled HSK
     * @return totalShares Total shares
     * @return totalPaid Total paid rewards
     * @return reserved Reserved rewards
     * @return contractBalance Contract balance
     */
    function getRewardStatus() external view returns (
        uint256 totalPooled,
        uint256 totalShares,
        uint256 totalPaid,
        uint256 reserved,
        uint256 contractBalance
    ) {
        return (
            totalPooledHSK,
            stHSK.totalSupply(),
            totalPaidRewards,
            reservedRewards,
            address(this).balance
        );
    }
}