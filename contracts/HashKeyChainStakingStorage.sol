// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./StHSK.sol";

/**
 * @title HashKeyChainStakingStorage
 * @dev 修改后的存储合约，适用于基于份额的模型
 */
abstract contract HashKeyChainStakingStorage {
    // 锁定质押信息
    struct LockedStake {
        uint256 sharesAmount;       // 锁定的份额数量
        uint256 hskAmount;          // 原始质押的HSK数量（仅用于记录）
        uint256 lockEndTime;        // 锁定期结束时间
        uint256 lockDuration;       // 锁定期（秒）
        bool withdrawn;             // 是否已提取
    }

    // 质押类型
    enum StakeType { FIXED_30_DAYS, FIXED_90_DAYS, FIXED_180_DAYS, FIXED_365_DAYS }

    // stHSK 代币
    StHSK public stHSK;
    
    // 池中总HSK数量（包括奖励）
    uint256 public totalPooledHSK;
    
    // 区块奖励配置
    uint256 public hskPerBlock;
    uint256 public lastRewardBlock;
    uint256 public startBlock;
    uint256 public maxHskPerBlock;
    
    // 锁定质押记录（仅用于有固定锁定期的质押）
    mapping(address => LockedStake[]) public lockedStakes;
    
    // 预留奖励（合约余额 - 总质押量）
    uint256 public reservedRewards;
    
    // 最小质押数量
    uint256 public minStakeAmount;
    
    // 提前解锁惩罚率（基点，1000 = 10%）
    mapping(StakeType => uint256) public earlyWithdrawalPenalty;
    
    // 不同质押期的基础奖励加成（基点）
    mapping(StakeType => uint256) public stakingBonus;
    
    // 质押截止时间
    uint256 public stakeEndTime;
    
    // 合约版本
    uint256 public version;

    uint256 public annualRewardsBudget;

}