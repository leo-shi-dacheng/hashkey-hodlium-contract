// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StHSK
 * @dev Token representing shares in the staking pool, value increases as staking rewards accumulate
 */
contract StHSK is ERC20, Ownable {
    constructor() ERC20("Staked HashKeyChain", "stHSK") Ownable(msg.sender) {
        // Token is initialized without minting any supply
    }

    /**
     * @dev Mint new share tokens, can only be called by the staking contract (owner)
     * @param to Recipient address
     * @param sharesAmount Share amount
     */
    function mint(address to, uint256 sharesAmount) external onlyOwner {
        _mint(to, sharesAmount);
    }

    /**
     * @dev Burn share tokens, can only be called by the staking contract (owner)
     * @param from Address to burn from
     * @param sharesAmount Share amount
     */
    function burn(address from, uint256 sharesAmount) external onlyOwner {
        _burn(from, sharesAmount);
    }
}