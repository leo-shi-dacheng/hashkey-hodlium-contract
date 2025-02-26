// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./HashKeyChainStakingAdmin.sol";

/**
 * @title HashKeyChainStakingEmergency
 * @dev Implementation of emergency functions
 */
abstract contract HashKeyChainStakingEmergency is HashKeyChainStakingAdmin {
    /**
     * @dev Emergency withdrawal (without rewards)
     */
    function emergencyWithdraw() external nonReentrant {
        uint256 shareBalance = stHSK.balanceOf(msg.sender);
        require(shareBalance > 0, "Nothing to withdraw");
        
        // Calculate HSK amount to return
        uint256 hskToReturn = getHSKForShares(shareBalance);
        
        // Update total staked amount
        totalPooledHSK -= hskToReturn;
        
        // Burn stHSK tokens
        stHSK.burn(msg.sender, shareBalance);
        
        // Return HSK tokens
        bool success = safeHskTransfer(payable(msg.sender), hskToReturn);
        require(success, "HSK transfer failed");
        
        // Mark all locked stakes as withdrawn
        LockedStake[] storage userStakes = lockedStakes[msg.sender];
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (!userStakes[i].withdrawn) {
                userStakes[i].withdrawn = true;
            }
        }
        
        emit EmergencyWithdraw(msg.sender, shareBalance, hskToReturn);
    }

    /**
     * @dev Administrator emergency HSK withdrawal (only from reserved rewards)
     * @param _amount Withdrawal amount
     */
    function emergencyWithdrawHSK(uint256 _amount) external onlyOwner {
        uint256 availableBalance = address(this).balance - totalPooledHSK;
        require(_amount <= availableBalance, "Cannot withdraw staked HSK");
        
        // Update reserved rewards
        if (_amount > reservedRewards) {
            reservedRewards = 0;
        } else {
            reservedRewards -= _amount;
        }
        
        // Transfer HSK
        (bool success, ) = owner().call{value: _amount}("");
        require(success, "HSK transfer failed");
    }

    /**
     * @dev Recover other tokens
     * @param _token Token address
     * @param _amount Withdrawal amount
     */
    function recoverToken(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(stHSK), "Cannot recover staked token");
        IERC20(_token).transfer(owner(), _amount);
    }
}