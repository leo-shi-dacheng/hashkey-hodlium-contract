// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./HashKeyChainStakingStorage.sol";

/**
 * @title HashKeyChainStakingEvents
 * @dev Definition of events for the staking contract
 */
abstract contract HashKeyChainStakingEvents is HashKeyChainStakingStorage {
    // Events
    event Stake(address indexed user, uint256 hskAmount, uint256 sharesAmount, StakeType stakeType, uint256 lockEndTime, uint256 stakeId);
    event Unstake(address indexed user, uint256 sharesAmount, uint256 hskAmount, bool isEarlyWithdrawal, uint256 penalty, uint256 stakeId);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsAdded(uint256 amount, address indexed from);
    event InsufficientRewards(uint256 required, uint256 available);
    event HskPerBlockUpdated(uint256 oldValue, uint256 newValue);
    event MinStakeAmountUpdated(uint256 oldValue, uint256 newValue);
    event EarlyWithdrawalPenaltyUpdated(StakeType stakeType, uint256 oldValue, uint256 newValue);
    event StakingBonusUpdated(StakeType stakeType, uint256 oldValue, uint256 newValue);
    event MaxHskPerBlockUpdated(uint256 oldValue, uint256 newValue);
    event EmergencyWithdraw(address indexed user, uint256 sharesAmount, uint256 hskAmount);
    event StakingContractUpgraded(uint256 newVersion);
    event ExchangeRateUpdated(uint256 totalPooledHSK, uint256 totalShares, uint256 newRate);
    event AnnualBudgetUpdated(uint256 oldValue, uint256 newValue);
    event BlockTimeUpdated(uint256 oldBlockTime, uint256 newBlockTime);
}