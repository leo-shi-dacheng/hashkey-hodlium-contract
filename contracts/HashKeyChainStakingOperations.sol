// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./HashKeyChainStakingBase.sol";

/**
 * @title HashKeyChainStakingOperations
 * @dev 质押操作实现，采用基于份额的模型
 */
abstract contract HashKeyChainStakingOperations is HashKeyChainStakingBase {
    /**
     * @dev 普通质押（非锁定），直接获取stHSK
     */
    function stake() external payable nonReentrant whenNotPaused {
        require(msg.value >= minStakeAmount, "Amount below minimum stake");
        require(block.timestamp < stakeEndTime, "Staking ended");
        
        // 更新奖励池
        updateRewardPool();
        
        // 计算应铸造的份额
        uint256 sharesAmount = getSharesForHSK(msg.value);
        
        // 更新总质押量
        totalPooledHSK += msg.value;
        
        // 铸造stHSK代币
        stHSK.mint(msg.sender, sharesAmount);
        
        emit Stake(msg.sender, msg.value, sharesAmount, StakeType.FIXED_30_DAYS, 0, 0);
    }

    /**
     * @dev 锁定质押，有固定锁定期和额外奖励
     * @param _stakeType 质押类型（决定锁定期和奖励）
     */
    function stakeLocked(StakeType _stakeType) external payable nonReentrant whenNotPaused {
        require(msg.value >= minStakeAmount, "Amount below minimum stake");
        require(block.timestamp < stakeEndTime, "Staking ended");
        
        // 更新奖励池
        updateRewardPool();
        
        // 计算应铸造的份额
        uint256 sharesAmount = getSharesForHSK(msg.value);
        
        // 确定锁定期
        uint256 lockDuration;
        if (_stakeType == StakeType.FIXED_30_DAYS) lockDuration = 30 days;
        else if (_stakeType == StakeType.FIXED_90_DAYS) lockDuration = 90 days;
        else if (_stakeType == StakeType.FIXED_180_DAYS) lockDuration = 180 days;
        else if (_stakeType == StakeType.FIXED_365_DAYS) lockDuration = 365 days;
        else revert("Invalid stake type");
        
        // 创建锁定质押记录
        lockedStakes[msg.sender].push(LockedStake({
            sharesAmount: sharesAmount,
            hskAmount: msg.value,
            lockEndTime: block.timestamp + lockDuration,
            lockDuration: lockDuration,
            withdrawn: false
        }));
        
        // 更新总质押量
        totalPooledHSK += msg.value;
        
        // 铸造stHSK代币
        stHSK.mint(msg.sender, sharesAmount);
        
        uint256 stakeId = lockedStakes[msg.sender].length - 1;
        emit Stake(msg.sender, msg.value, sharesAmount, _stakeType, block.timestamp + lockDuration, stakeId);
    }

    /**
     * @dev 解除锁定质押
     * @param _stakeId 质押ID
     */
    function unstakeLocked(uint256 _stakeId) external nonReentrant {
        require(_stakeId < lockedStakes[msg.sender].length, "Invalid stake ID");
        LockedStake storage lockedStake = lockedStakes[msg.sender][_stakeId];
        
        require(!lockedStake.withdrawn, "Stake already withdrawn");
        require(lockedStake.sharesAmount > 0, "Stake amount is zero");
        
        // 更新奖励池
        updateRewardPool();
        
        // 检查是否提前解锁
        bool isEarlyWithdrawal = (block.timestamp < lockedStake.lockEndTime);
        
        // 计算惩罚（如果提前解锁）
        uint256 penalty = 0;
        uint256 sharesToBurn = lockedStake.sharesAmount;
        uint256 hskToReturn = getHSKForShares(sharesToBurn);
        
        if (isEarlyWithdrawal) {
            // 确定质押类型
            StakeType stakeType;
            if (lockedStake.lockDuration == 30 days) stakeType = StakeType.FIXED_30_DAYS;
            else if (lockedStake.lockDuration == 90 days) stakeType = StakeType.FIXED_90_DAYS;
            else if (lockedStake.lockDuration == 180 days) stakeType = StakeType.FIXED_180_DAYS;
            else stakeType = StakeType.FIXED_365_DAYS;
            
            // 计算已经经过的锁定期比例
            uint256 elapsedTime = block.timestamp - (lockedStake.lockEndTime - lockedStake.lockDuration);
            uint256 completionRatio = (elapsedTime * BASIS_POINTS) / lockedStake.lockDuration;
            
            // 根据完成度调整惩罚（完成度越高，惩罚越低）
            uint256 adjustedPenalty = earlyWithdrawalPenalty[stakeType] * (BASIS_POINTS - completionRatio) / BASIS_POINTS;
            
            // 应用惩罚
            penalty = (hskToReturn * adjustedPenalty) / BASIS_POINTS;
            hskToReturn -= penalty;
            
            // 将惩罚添加到预留奖励
            reservedRewards += penalty;
        }
        
        // 标记质押为已提取
        lockedStake.withdrawn = true;
        
        // 更新总质押量
        totalPooledHSK -= hskToReturn + penalty;
        
        // 检查用户是否有足够的stHSK
        require(stHSK.balanceOf(msg.sender) >= sharesToBurn, "Insufficient stHSK balance");
        
        // 销毁stHSK代币
        stHSK.burn(msg.sender, sharesToBurn);
        
        // 返还HSK代币
        bool transferSuccess = safeHskTransfer(payable(msg.sender), hskToReturn);
        require(transferSuccess, "HSK transfer failed");
        
        emit Unstake(msg.sender, sharesToBurn, hskToReturn, isEarlyWithdrawal, penalty, _stakeId);
    }

    /**
     * @dev 解除普通质押（非锁定）
     * @param _sharesAmount 要解除的份额数量
     */
    function unstake(uint256 _sharesAmount) external nonReentrant {
        require(_sharesAmount > 0, "Cannot unstake 0");
        require(stHSK.balanceOf(msg.sender) >= _sharesAmount, "Insufficient stHSK balance");
        
        // 更新奖励池
        updateRewardPool();
        
        // 计算应返还的HSK数量
        uint256 hskToReturn = getHSKForShares(_sharesAmount);
        
        // 更新总质押量
        totalPooledHSK -= hskToReturn;
        
        // 销毁stHSK代币
        stHSK.burn(msg.sender, _sharesAmount);
        
        // 返还HSK代币
        bool success = safeHskTransfer(payable(msg.sender), hskToReturn);
        require(success, "HSK transfer failed");
        
        emit Unstake(msg.sender, _sharesAmount, hskToReturn, false, 0, type(uint256).max);
    }
}