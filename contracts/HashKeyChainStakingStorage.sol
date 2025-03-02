// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./StHSK.sol";

/**
 * @title HashKeyChainStakingStorage
 * @dev Modified storage contract for share-based model
 */
abstract contract HashKeyChainStakingStorage {
    // Locked stake information
    struct LockedStake {
        uint256 sharesAmount;       // Amount of locked shares
        uint256 hskAmount;          // Original HSK amount staked (for record only)
        uint256 lockEndTime;        // Lock period end time
        uint256 lockDuration;       // Lock duration (seconds)
        bool withdrawn;             // Whether withdrawn
    }

    // Stake types
    enum StakeType { FIXED_30_DAYS, FIXED_90_DAYS, FIXED_180_DAYS, FIXED_365_DAYS, FIXED_1_MINUTE, FIXED_3_MINUTES, FIXED_5_MINUTES }

    // stHSK token
    StHSK public stHSK;
    
    // Total HSK in pool (including rewards)
    uint256 public totalPooledHSK;
    
    // Block reward configuration
    uint256 public hskPerBlock;
    uint256 public lastRewardBlock;
    uint256 public startBlock;
    uint256 public maxHskPerBlock;
    
    // Locked stake records (only for fixed lock period stakes)
    mapping(address => LockedStake[]) public lockedStakes;
    
    // Reserved rewards (contract balance - total staked)
    uint256 public reservedRewards;
    
    // Minimum stake amount
    uint256 public minStakeAmount;
    
    // Early withdrawal penalty rates (basis points, 1000 = 10%)
    mapping(StakeType => uint256) public earlyWithdrawalPenalty;
    
    // Base reward bonus for different staking periods (basis points)
    mapping(StakeType => uint256) public stakingBonus;
    
    // Staking end time
    uint256 public stakeEndTime;
    
    // Contract version
    uint256 public version;

    uint256 public annualRewardsBudget;
}