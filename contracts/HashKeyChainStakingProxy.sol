// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

/**
 * @title HashKeyChainStakingProxy
 * @dev Proxy contract for upgrading the staking contract
 */
contract HashKeyChainStakingProxy is TransparentUpgradeableProxy {
    constructor(
        address _logic,
        address _admin,
        bytes memory _data
    ) payable TransparentUpgradeableProxy(_logic, _admin, _data) {}
}

/**
 * @title HashKeyChainStakingProxyAdmin
 * @dev Admin contract for managing proxy upgrades
 */
contract HashKeyChainStakingProxyAdmin is ProxyAdmin {
    constructor() {}
    
    /**
     * @dev Upgrades the proxy to a new implementation.
     * @param proxy Proxy to upgrade.
     * @param implementation Address of the new implementation.
     */
    function upgradeProxy(
        ITransparentUpgradeableProxy proxy,
        address implementation
    ) external onlyOwner {
        super.upgradeAndCall(proxy, implementation, bytes(""));
    }
    
    /**
     * @dev Upgrades the proxy to a new implementation and calls a function on the new implementation.
     * @param proxy Proxy to upgrade.
     * @param implementation Address of the new implementation.
     * @param data Data to send as msg.data in the low level call.
     * Will be passed to the new implementation as initialization code.
     */
    function upgradeProxyAndCall(
        ITransparentUpgradeableProxy proxy,
        address implementation,
        bytes memory data
    ) external payable onlyOwner {
        super.upgradeAndCall(proxy, implementation, data);
    }
}