// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ReentrancyAttacker
 * @dev Contract used to test reentrancy protection of the staking contract
 */
contract ReentrancyAttacker {
    address public immutable targetContract;
    uint256 public attackCount;
    bool public attacking;

    constructor(address _targetContract) {
        targetContract = _targetContract;
    }

    // The attack function that will initiate the reentrancy attempt
    function attack() external payable {
        // Start the attack sequence
        attacking = true;
        
        // First call to stake
        (bool success, ) = targetContract.call{value: msg.value}(
            abi.encodeWithSignature("stake()")
        );
        require(success, "Initial stake failed");
        
        // Attack is complete
        attacking = false;
    }

    // This function will be called when receiving ETH
    // This is where the reentrancy attack happens
    receive() external payable {
        if (attacking && attackCount < 3) {
            attackCount++;
            
            // Try to call unstake during the callback
            (bool success, ) = targetContract.call(
                abi.encodeWithSignature("unstake(uint256)", msg.value)
            );
            
            // If successful, would mean vulnerable to reentrancy
            if (success) {
                attackCount += 10; // Record successful reentrant call
            }
        }
    }

    // Allow the contract owner to withdraw funds
    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }
} 