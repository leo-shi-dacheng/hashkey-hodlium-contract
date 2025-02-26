// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./StHSK.sol";
import "./HashKeyChainStakingOperations.sol";
import "./HashKeyChainStakingAdmin.sol";
import "./HashKeyChainStakingEmergency.sol";

/**
 * @title HashKeyChainStaking
 * @dev 主质押合约，基于份额模型，用户可以选择锁定或非锁定质押
 */
contract HashKeyChainStaking is 
    Initializable,
    HashKeyChainStakingOperations,
    HashKeyChainStakingAdmin,
    HashKeyChainStakingEmergency
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
    * @dev 初始化合约
    * @param _hskPerBlock 每区块HSK奖励
    * @param _startBlock 开始区块
    * @param _maxHskPerBlock 每区块最大奖励
    * @param _minStakeAmount 最小质押量
    * @param _annualBudget 年度预算（可选，如果为0则根据hskPerBlock计算）
    */
    function initialize(
        uint256 _hskPerBlock,
        uint256 _startBlock,
        uint256 _maxHskPerBlock,
        uint256 _minStakeAmount,
        uint256 _annualBudget
    ) public reinitializer(2) {
        __HashKeyChainStakingBase_init(
            _hskPerBlock,
            _startBlock,
            _maxHskPerBlock,
            _minStakeAmount
        );
        
        if (_annualBudget > 0) {
            annualRewardsBudget = _annualBudget;
        }
    }

    /**
     * @dev 设置质押截止时间
     * @param _endTime 新的截止时间
     */
    function setStakeEndTime(uint256 _endTime) external onlyOwner {
        require(_endTime > block.timestamp, "End time must be in future");
        stakeEndTime = _endTime;
    }

    /**
     * @dev 检查质押是否开放
     */
    function isStakingOpen() public view returns (bool) {
        return block.timestamp < stakeEndTime;
    }

    /**
     * @dev 获取当前stHSK兑换率（1 stHSK = ? HSK）
     */
    function getCurrentExchangeRate() external view returns (uint256) {
        return getHSKForShares(PRECISION_FACTOR);
    }

    /**
     * @dev 获取用户锁定质押数量
     * @param _user 用户地址
     */
    function getUserLockedStakeCount(address _user) external view returns (uint256) {
        return lockedStakes[_user].length;
    }

    /**
     * @dev 获取用户活跃（未提取）的锁定质押数量
     * @param _user 用户地址
     */
    function getUserActiveLockedStakes(address _user) external view returns (uint256) {
        LockedStake[] storage userStakes = lockedStakes[_user];
        uint256 activeStakes = 0;
        
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (!userStakes[i].withdrawn && userStakes[i].sharesAmount > 0) {
                activeStakes++;
            }
        }
        
        return activeStakes;
    }

    /**
     * @dev 获取锁定质押信息
     * @param _user 用户地址
     * @param _stakeId 质押ID
     */
    function getLockedStakeInfo(address _user, uint256 _stakeId) external view returns (
        uint256 sharesAmount,
        uint256 hskAmount,
        uint256 currentHskValue,
        uint256 lockEndTime,
        bool isWithdrawn,
        bool isLocked
    ) {
        require(_stakeId < lockedStakes[_user].length, "Invalid stake ID");
        LockedStake storage stake = lockedStakes[_user][_stakeId];
        
        return (
            stake.sharesAmount,
            stake.hskAmount,
            getHSKForShares(stake.sharesAmount),
            stake.lockEndTime,
            stake.withdrawn,
            block.timestamp < stake.lockEndTime
        );
    }

    /**
     * @dev 获取合约总锁仓价值
     */
    function totalValueLocked() external view returns (uint256) {
        return totalPooledHSK;
    }

    /**
     * @dev 获取所有质押期限的APR
     * @param _stakeAmount 模拟质押金额
     */
    function getAllStakingAPRs(uint256 _stakeAmount) external view returns (
        uint256[4] memory estimatedAPRs,
        uint256[4] memory maxAPRs
    ) {
        estimatedAPRs[0] = getCurrentAPR(_stakeAmount, StakeType.FIXED_30_DAYS);
        estimatedAPRs[1] = getCurrentAPR(_stakeAmount, StakeType.FIXED_90_DAYS);
        estimatedAPRs[2] = getCurrentAPR(_stakeAmount, StakeType.FIXED_180_DAYS);
        estimatedAPRs[3] = getCurrentAPR(_stakeAmount, StakeType.FIXED_365_DAYS);
        
        maxAPRs[0] = 120;   // MAX_APR_30_DAYS
        maxAPRs[1] = 350;   // MAX_APR_90_DAYS 
        maxAPRs[2] = 650;   // MAX_APR_180_DAYS
        maxAPRs[3] = 1200;  // MAX_APR_365_DAYS
        
        return (estimatedAPRs, maxAPRs);
    }

    /**
     * @dev 获取更详细的质押统计信息
     * @param _simulatedStakeAmount 模拟质押金额
     */
    function getDetailedStakingStats(uint256 _simulatedStakeAmount) external view returns (
        uint256 totalStakedAmount,
        uint256[4] memory durations,
        uint256[4] memory currentAPRs,
        uint256[4] memory maxPossibleAPRs,
        uint256[4] memory baseBonus
    ) {
        totalStakedAmount = totalPooledHSK;
        
        // 设置不同的质押期限（秒）
        durations[0] = 30 days;
        durations[1] = 90 days;
        durations[2] = 180 days;
        durations[3] = 365 days;
        
        // 基础奖励
        baseBonus[0] = stakingBonus[StakeType.FIXED_30_DAYS];
        baseBonus[1] = stakingBonus[StakeType.FIXED_90_DAYS];
        baseBonus[2] = stakingBonus[StakeType.FIXED_180_DAYS];
        baseBonus[3] = stakingBonus[StakeType.FIXED_365_DAYS];
        
        // 最大可能APR
        maxPossibleAPRs[0] = 120;   // MAX_APR_30_DAYS
        maxPossibleAPRs[1] = 350;   // MAX_APR_90_DAYS 
        maxPossibleAPRs[2] = 650;   // MAX_APR_180_DAYS
        maxPossibleAPRs[3] = 1200;  // MAX_APR_365_DAYS
        
        // 计算当前估计APR
        currentAPRs[0] = getCurrentAPR(_simulatedStakeAmount, StakeType.FIXED_30_DAYS);
        currentAPRs[1] = getCurrentAPR(_simulatedStakeAmount, StakeType.FIXED_90_DAYS);
        currentAPRs[2] = getCurrentAPR(_simulatedStakeAmount, StakeType.FIXED_180_DAYS);
        currentAPRs[3] = getCurrentAPR(_simulatedStakeAmount, StakeType.FIXED_365_DAYS);
        
        return (totalStakedAmount, durations, currentAPRs, maxPossibleAPRs, baseBonus);
    }

    /**
     * @dev 获取HSK质押的APR信息
     * @param _stakeAmount 模拟质押金额
     */
    function getHSKStakingAPR(uint256 _stakeAmount) public view returns (
        uint256 baseApr,
        uint256 minApr,
        uint256 maxApr
    ) {
        // 计算基础APR - 使用年度预算
        uint256 yearlyRewards = annualRewardsBudget;
        
        if (totalPooledHSK == 0) {
            baseApr = MAX_APR > 1200 ? 1200 : MAX_APR; // MAX_APR_365_DAYS = 1200
            return (baseApr, 120, 1200); // 返回默认值
        }
        
        uint256 newTotal = totalPooledHSK + _stakeAmount;
        baseApr = (yearlyRewards * BASIS_POINTS) / newTotal;
        
        // 30天锁定的最小APR
        minApr = (baseApr + stakingBonus[StakeType.FIXED_30_DAYS]) > 120 ? 
            120 : (baseApr + stakingBonus[StakeType.FIXED_30_DAYS]);
        
        // 365天锁定的最大APR
        maxApr = (baseApr + stakingBonus[StakeType.FIXED_365_DAYS]) > 1200 ? 
            1200 : (baseApr + stakingBonus[StakeType.FIXED_365_DAYS]);
            
        return (baseApr, minApr, maxApr);
    }

    /**
     * @dev 接收HSK的回调函数
     */
    receive() external payable {
        // 将接收的HSK视为奖励
        reservedRewards += msg.value;
        emit RewardsAdded(msg.value, msg.sender);
    }
}