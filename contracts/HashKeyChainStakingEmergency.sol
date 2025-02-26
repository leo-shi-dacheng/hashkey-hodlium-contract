// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./HashKeyChainStakingAdmin.sol";

/**
 * @title HashKeyChainStakingEmergency
 * @dev 紧急功能实现
 */
abstract contract HashKeyChainStakingEmergency is HashKeyChainStakingAdmin {
    /**
     * @dev 紧急提取（无奖励）
     */
    function emergencyWithdraw() external nonReentrant {
        uint256 shareBalance = stHSK.balanceOf(msg.sender);
        require(shareBalance > 0, "Nothing to withdraw");
        
        // 计算应返还的HSK
        uint256 hskToReturn = getHSKForShares(shareBalance);
        
        // 更新总质押量
        totalPooledHSK -= hskToReturn;
        
        // 销毁stHSK代币
        stHSK.burn(msg.sender, shareBalance);
        
        // 返还HSK代币
        bool success = safeHskTransfer(payable(msg.sender), hskToReturn);
        require(success, "HSK transfer failed");
        
        // 将所有锁定质押标记为已提取
        LockedStake[] storage userStakes = lockedStakes[msg.sender];
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (!userStakes[i].withdrawn) {
                userStakes[i].withdrawn = true;
            }
        }
        
        emit EmergencyWithdraw(msg.sender, shareBalance, hskToReturn);
    }

    /**
     * @dev 管理员紧急提取HSK（仅从预留奖励中）
     * @param _amount 提取金额
     */
    function emergencyWithdrawHSK(uint256 _amount) external onlyOwner {
        uint256 availableBalance = address(this).balance - totalPooledHSK;
        require(_amount <= availableBalance, "Cannot withdraw staked HSK");
        
        // 更新预留奖励
        if (_amount > reservedRewards) {
            reservedRewards = 0;
        } else {
            reservedRewards -= _amount;
        }
        
        // 转账HSK
        (bool success, ) = owner().call{value: _amount}("");
        require(success, "HSK transfer failed");
    }

    /**
     * @dev 恢复其他代币
     * @param _token 代币地址
     * @param _amount 提取金额
     */
    function recoverToken(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(stHSK), "Cannot recover staked token");
        IERC20(_token).transfer(owner(), _amount);
    }
}