// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./HashKeyChainStakingOperations.sol";

/**
 * @title HashKeyChainStakingAdmin
 * @dev Implementation of administrative functions
 */
abstract contract HashKeyChainStakingAdmin is HashKeyChainStakingOperations {
    /**
     * @dev Update HSK reward per block
     * @param _hskPerBlock New HSK reward per block
     */
    function updateHskPerBlock(uint256 _hskPerBlock) external onlyOwner {
        require(_hskPerBlock <= maxHskPerBlock, "Exceeds maximum HSK per block");
        
        updateRewardPool();
        uint256 oldValue = hskPerBlock;
        hskPerBlock = _hskPerBlock;
        
        emit HskPerBlockUpdated(oldValue, _hskPerBlock);
    }

    /**
     * @dev Update maximum HSK reward per block
     * @param _maxHskPerBlock New maximum HSK reward per block
     */
    function updateMaxHskPerBlock(uint256 _maxHskPerBlock) external onlyOwner {
        require(_maxHskPerBlock >= hskPerBlock, "Must be >= current hskPerBlock");
        
        uint256 oldValue = maxHskPerBlock;
        maxHskPerBlock = _maxHskPerBlock;
        
        emit MaxHskPerBlockUpdated(oldValue, _maxHskPerBlock);
    }

    /**
     * @dev Update minimum staking amount
     * @param _minStakeAmount New minimum staking amount
     */
    function updateMinStakeAmount(uint256 _minStakeAmount) external onlyOwner {
        require(_minStakeAmount > 0, "Min stake amount must be positive");
        
        uint256 oldValue = minStakeAmount;
        minStakeAmount = _minStakeAmount;
        
        emit MinStakeAmountUpdated(oldValue, _minStakeAmount);
    }

    /**
     * @dev Update early withdrawal penalty rate
     * @param _stakeType Stake type
     * @param _penalty New penalty rate (basis points)
     */
    function updateEarlyWithdrawalPenalty(StakeType _stakeType, uint256 _penalty) external onlyOwner {
        require(_penalty <= MAX_PENALTY, "Penalty too high");
        
        uint256 oldValue = earlyWithdrawalPenalty[_stakeType];
        earlyWithdrawalPenalty[_stakeType] = _penalty;
        
        emit EarlyWithdrawalPenaltyUpdated(_stakeType, oldValue, _penalty);
    }

    /**
     * @dev Update staking bonus
     * @param _stakeType Stake type
     * @param _bonus New bonus (basis points)
     */
    function updateStakingBonus(StakeType _stakeType, uint256 _bonus) external onlyOwner {
        uint256 oldValue = stakingBonus[_stakeType];
        stakingBonus[_stakeType] = _bonus;
        
        emit StakingBonusUpdated(_stakeType, oldValue, _bonus);
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Update implementation version (for upgrades)
     * @param _version New version number
     */
    function updateVersion(uint256 _version) external onlyOwner {
        require(_version > version, "New version must be higher");
        version = _version;
        emit StakingContractUpgraded(version);
    }
    
    /**
    * @dev Set annual rewards budget (for APR calculation)
    * @param _annualBudget Annual budget amount (HSK)
    */
    function setAnnualRewardsBudget(uint256 _annualBudget) external onlyOwner {
        uint256 oldValue = annualRewardsBudget;
        annualRewardsBudget = _annualBudget;
        
        // Calculate corresponding reward per block
        uint256 blocksPerYear = (365 * 24 * 3600) / 2; // Blocks per year (assuming 2 seconds per block)
        uint256 newHskPerBlock = _annualBudget / blocksPerYear;
        
        // Update reward rate per block (not exceeding maximum)
        if (newHskPerBlock <= maxHskPerBlock) {
            updateRewardPool();
            hskPerBlock = newHskPerBlock;
            emit HskPerBlockUpdated(oldValue, hskPerBlock);
        }
        
        emit AnnualBudgetUpdated(oldValue, _annualBudget);
    }

    /**
     * @dev Update block time
     * @param _newBlockTime New block time in seconds
     */
    function updateBlockTime(uint256 _newBlockTime) external onlyOwner {
        require(_newBlockTime > 0, "Block time must be positive");
        
        uint256 oldBlockTime = blockTime;
        blockTime = _newBlockTime;
        
        // Recalculate annual rewards budget
        uint256 blocksPerYear = SECONDS_PER_YEAR / blockTime;
        annualRewardsBudget = hskPerBlock * blocksPerYear;
        
        emit BlockTimeUpdated(oldBlockTime, _newBlockTime);
    }
}