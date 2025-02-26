// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StHSK
 * @dev 代表对质押池份额的代币，价值会随着质押奖励积累而增加
 */
contract StHSK is ERC20, Ownable {
    constructor() ERC20("Staked HashKeyChain", "stHSK") Ownable(msg.sender) {
        // Token is initialized without minting any supply
    }

    /**
     * @dev 铸造新的份额代币，只能由质押合约（所有者）调用
     * @param to 接收者地址
     * @param sharesAmount 份额数量
     */
    function mint(address to, uint256 sharesAmount) external onlyOwner {
        _mint(to, sharesAmount);
    }

    /**
     * @dev 销毁份额代币，只能由质押合约（所有者）调用
     * @param from 销毁地址
     * @param sharesAmount 份额数量
     */
    function burn(address from, uint256 sharesAmount) external onlyOwner {
        _burn(from, sharesAmount);
    }
}