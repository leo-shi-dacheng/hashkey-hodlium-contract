// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./HashKeyChainStakingBase.sol";

/**
 * @title HashKeyChainStakingOperations
 * @dev Implementation of staking operations, using a share-based model
 */
abstract contract HashKeyChainStakingOperations is HashKeyChainStakingBase {
    /**
     * @dev Regular staking (unlocked), directly receives stHSK
     */
    function stake() external payable nonReentrant whenNotPaused {
        // Strict validation of minimum stake amount
        require(msg.value >= minStakeAmount, "Amount below minimum stake");
        require(block.timestamp < stakeEndTime, "Staking ended");
        
        // Update reward pool
        updateRewardPool();
        
        // Calculate shares to mint
        uint256 sharesAmount = getSharesForHSK(msg.value);
        
        // Update total staked amount
        totalPooledHSK += msg.value;
        
        // Mint stHSK tokens
        stHSK.mint(msg.sender, sharesAmount);
        
        emit Stake(msg.sender, msg.value, sharesAmount, StakeType.FIXED_30_DAYS, 0, 0);
    }

    /**
     * @dev Locked staking, with fixed lock period and additional rewards
     * @param _stakeType Stake type (determines lock period and rewards)
     */
    function stakeLocked(StakeType _stakeType) external payable nonReentrant whenNotPaused {
        // Strict validation of minimum stake amount
        require(msg.value >= minStakeAmount, "Amount below minimum stake");
        require(block.timestamp < stakeEndTime, "Staking ended");
        
        // Update reward pool
        updateRewardPool();
        
        // Calculate shares to mint
        uint256 sharesAmount = getSharesForHSK(msg.value);
        
        // Determine lock period
        uint256 lockDuration;
        if (_stakeType == StakeType.FIXED_30_DAYS) lockDuration = 30 days;
        else if (_stakeType == StakeType.FIXED_90_DAYS) lockDuration = 90 days;
        else if (_stakeType == StakeType.FIXED_180_DAYS) lockDuration = 180 days;
        else if (_stakeType == StakeType.FIXED_365_DAYS) lockDuration = 365 days;
        else if (_stakeType == StakeType.FIXED_1_MINUTE) lockDuration = 1 minutes;
        else if (_stakeType == StakeType.FIXED_3_MINUTES) lockDuration = 3 minutes;
        else if (_stakeType == StakeType.FIXED_5_MINUTES) lockDuration = 5 minutes;
        else revert("Invalid stake type");
        
        // Create locked stake record
        lockedStakes[msg.sender].push(LockedStake({
            sharesAmount: sharesAmount,
            hskAmount: msg.value,
            lockEndTime: block.timestamp + lockDuration,
            lockDuration: lockDuration,
            withdrawn: false
        }));
        
        // Update total staked amount
        totalPooledHSK += msg.value;
        
        // Mint stHSK tokens
        stHSK.mint(msg.sender, sharesAmount);
        
        uint256 stakeId = lockedStakes[msg.sender].length - 1;
        emit Stake(msg.sender, msg.value, sharesAmount, _stakeType, block.timestamp + lockDuration, stakeId);
    }

    /**
     * @dev Unlock locked stake
     * @param _stakeId Stake ID
     */
    function unstakeLocked(uint256 _stakeId) external nonReentrant {
        require(_stakeId < lockedStakes[msg.sender].length, "Invalid stake ID");
        LockedStake storage lockedStake = lockedStakes[msg.sender][_stakeId];
        
        require(!lockedStake.withdrawn, "Stake already withdrawn");
        require(lockedStake.sharesAmount > 0, "Stake amount is zero");
        
        // Update reward pool
        updateRewardPool();
        
        // Check if early withdrawal
        bool isEarlyWithdrawal = (block.timestamp < lockedStake.lockEndTime);
        
        // Calculate penalty (if early withdrawal)
        uint256 penalty = 0;
        uint256 sharesToBurn = lockedStake.sharesAmount;
        uint256 hskToReturn = getHSKForShares(sharesToBurn);
        
        if (isEarlyWithdrawal) {
            // Determine stake type
            StakeType stakeType;
            if (lockedStake.lockDuration == 30 days) stakeType = StakeType.FIXED_30_DAYS;
            else if (lockedStake.lockDuration == 90 days) stakeType = StakeType.FIXED_90_DAYS;
            else if (lockedStake.lockDuration == 180 days) stakeType = StakeType.FIXED_180_DAYS;
            else stakeType = StakeType.FIXED_365_DAYS;
            
            // Calculate elapsed lock period ratio
            uint256 elapsedTime = block.timestamp - (lockedStake.lockEndTime - lockedStake.lockDuration);
            uint256 completionRatio = (elapsedTime * BASIS_POINTS) / lockedStake.lockDuration;
            
            // Adjust penalty based on completion (higher completion, lower penalty)
            uint256 adjustedPenalty = earlyWithdrawalPenalty[stakeType] * (BASIS_POINTS - completionRatio) / BASIS_POINTS;
            
            // Apply penalty
            penalty = (hskToReturn * adjustedPenalty) / BASIS_POINTS;
            hskToReturn -= penalty;
            
            // Add penalty to reserved rewards
            reservedRewards += penalty;
        }
        
        // Mark stake as withdrawn
        lockedStake.withdrawn = true;
        
        // Update total staked amount
        totalPooledHSK -= hskToReturn + penalty;
        
        // Check if user has enough stHSK
        require(stHSK.balanceOf(msg.sender) >= sharesToBurn, "Insufficient stHSK balance");
        
        // Burn stHSK tokens
        stHSK.burn(msg.sender, sharesToBurn);
        
        // Return HSK tokens
        bool transferSuccess = safeHskTransfer(payable(msg.sender), hskToReturn);
        require(transferSuccess, "HSK transfer failed");
        
        emit Unstake(msg.sender, sharesToBurn, hskToReturn, isEarlyWithdrawal, penalty, _stakeId);
    }

    /**
     * @dev Unstake regular (unlocked) stake
     * @param _sharesAmount Share amount to unstake
     */
    function unstake(uint256 _sharesAmount) external nonReentrant {
        require(_sharesAmount > 0, "Cannot unstake 0");
        require(stHSK.balanceOf(msg.sender) >= _sharesAmount, "Insufficient stHSK balance");
        
        // Update reward pool
        updateRewardPool();
        
        // Calculate HSK amount to return
        uint256 hskToReturn = getHSKForShares(_sharesAmount);
        
        // Update total staked amount
        totalPooledHSK -= hskToReturn;
        
        // Burn stHSK tokens
        stHSK.burn(msg.sender, _sharesAmount);
        
        // Return HSK tokens
        bool success = safeHskTransfer(payable(msg.sender), hskToReturn);
        require(success, "HSK transfer failed");
        
        emit Unstake(msg.sender, _sharesAmount, hskToReturn, false, 0, type(uint256).max);
    }
}