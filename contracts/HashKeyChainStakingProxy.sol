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
    constructor() ProxyAdmin(msg.sender) {}
}