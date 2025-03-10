// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../contracts/HashKeyChainStaking.sol";
import { HashKeyChainStakingProxy, HashKeyChainStakingProxyAdmin } from "../contracts/HashKeyChainStakingProxy.sol";
import { ITransparentUpgradeableProxy } from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract ProxyUpgradeTest is Test {
    HashKeyChainStaking public implementation;
    HashKeyChainStakingProxyAdmin public proxyAdmin;
    address public proxy;
    HashKeyChainStaking public stakingContract;
    address public deployer;

    function setUp() public {
        deployer = vm.addr(1);
        vm.startPrank(deployer);

        // Deploy implementation
        implementation = new HashKeyChainStaking();
        console.log("Implementation deployed at:", address(implementation));

        // ----- Deploy proxy admin - this goes unused !!!!!
        proxyAdmin = new HashKeyChainStakingProxyAdmin();
        console.log("ProxyAdmin deployed at:", address(proxyAdmin));
        // --------------------------------------------

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSignature(
            "initialize(uint256,uint256,uint256,uint256,uint256,uint256)",
            0.1 ether,    // hskPerBlock
            block.number + 100, // startBlock
            1 ether,      // maxHskPerBlock
            100 ether,    // minStakeAmount
            1000 ether,   // annualBudget
            2            // blockTime
        );

        // Deploy proxy - this creates a new ProxyAdmin instance
        proxy = address(new HashKeyChainStakingProxy(
            address(implementation),
            address(deployer),  // NOTE: deployer address here, not proxyAdmin address
            initData
        ));
        console.log("Proxy deployed at:", proxy);

        vm.stopPrank();
    }

    function testUpgrade() public {
        vm.startPrank(deployer);

        // Deploy new implementation
        HashKeyChainStaking newImplementation = new HashKeyChainStaking();
        console.log("New implementation deployed at:", address(newImplementation));

        // Upgrade proxy - 0x5a75b0f2a1547F6C00bd795f81FbFcE9200CAa40 is the ProxyAdmin address created during the HashKeyChainStakingProxy call
        ProxyAdmin(0x5a75b0f2a1547F6C00bd795f81FbFcE9200CAa40).upgradeAndCall(ITransparentUpgradeableProxy(proxy), address(newImplementation), bytes(""));
        console.log("Proxy upgraded to new implementation");

        vm.stopPrank();

    }
}
