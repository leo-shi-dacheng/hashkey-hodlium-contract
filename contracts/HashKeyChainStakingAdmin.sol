// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./HashKeyChainStakingOperations.sol";

/**
 * @title HashKeyChainStakingAdmin
 * @dev 管理功能实现
 */
abstract contract HashKeyChainStakingAdmin is HashKeyChainStakingOperations {
    /**
     * @dev 更新每区块HSK奖励
     * @param _hskPerBlock 新的每区块HSK奖励
     */
    function updateHskPerBlock(uint256 _hskPerBlock) external onlyOwner {
        require(_hskPerBlock <= maxHskPerBlock, "Exceeds maximum HSK per block");
        
        updateRewardPool();
        uint256 oldValue = hskPerBlock;
        hskPerBlock = _hskPerBlock;
        
        emit HskPerBlockUpdated(oldValue, _hskPerBlock);
    }

    /**
     * @dev 更新最大每区块HSK奖励
     * @param _maxHskPerBlock 新的最大每区块HSK奖励
     */
    function updateMaxHskPerBlock(uint256 _maxHskPerBlock) external onlyOwner {
        require(_maxHskPerBlock >= hskPerBlock, "Must be >= current hskPerBlock");
        
        uint256 oldValue = maxHskPerBlock;
        maxHskPerBlock = _maxHskPerBlock;
        
        emit MaxHskPerBlockUpdated(oldValue, _maxHskPerBlock);
    }

    /**
     * @dev 更新最小质押量
     * @param _minStakeAmount 新的最小质押量
     */
    function updateMinStakeAmount(uint256 _minStakeAmount) external onlyOwner {
        require(_minStakeAmount > 0, "Min stake amount must be positive");
        
        uint256 oldValue = minStakeAmount;
        minStakeAmount = _minStakeAmount;
        
        emit MinStakeAmountUpdated(oldValue, _minStakeAmount);
    }

    /**
     * @dev 更新提前解锁惩罚率
     * @param _stakeType 质押类型
     * @param _penalty 新的惩罚率（基点）
     */
    function updateEarlyWithdrawalPenalty(StakeType _stakeType, uint256 _penalty) external onlyOwner {
        require(_penalty <= MAX_PENALTY, "Penalty too high");
        
        uint256 oldValue = earlyWithdrawalPenalty[_stakeType];
        earlyWithdrawalPenalty[_stakeType] = _penalty;
        
        emit EarlyWithdrawalPenaltyUpdated(_stakeType, oldValue, _penalty);
    }

    /**
     * @dev 更新质押奖励加成
     * @param _stakeType 质押类型
     * @param _bonus 新的奖励加成（基点）
     */
    function updateStakingBonus(StakeType _stakeType, uint256 _bonus) external onlyOwner {
        uint256 oldValue = stakingBonus[_stakeType];
        stakingBonus[_stakeType] = _bonus;
        
        emit StakingBonusUpdated(_stakeType, oldValue, _bonus);
    }

    /**
     * @dev 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 解除暂停
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev 更新实现版本（用于升级）
     * @param _version 新版本号
     */
    function updateVersion(uint256 _version) external onlyOwner {
        require(_version > version, "New version must be higher");
        version = _version;
        emit StakingContractUpgraded(version);
    }
    
    /**
    * @dev 设置年度奖励预算（用于APR计算）
    * @param _annualBudget 年度预算金额（HSK）
    */
    function setAnnualRewardsBudget(uint256 _annualBudget) external onlyOwner {
        uint256 oldValue = annualRewardsBudget;
        annualRewardsBudget = _annualBudget;
        
        // 计算对应的每区块奖励
        uint256 blocksPerYear = (365 * 24 * 3600) / 2; // 每年区块数（假设2秒出块）
        uint256 newHskPerBlock = _annualBudget / blocksPerYear;
        
        // 更新每区块奖励率（不超过最大值）
        if (newHskPerBlock <= maxHskPerBlock) {
            updateRewardPool();
            hskPerBlock = newHskPerBlock;
            emit HskPerBlockUpdated(oldValue, hskPerBlock);
        }
        
        emit AnnualBudgetUpdated(oldValue, _annualBudget);
    }
}