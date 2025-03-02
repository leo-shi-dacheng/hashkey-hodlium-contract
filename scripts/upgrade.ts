import { ethers } from "hardhat";
import { Contract } from "ethers";
import fs from "fs";
import path from "path";
import { network } from "hardhat";

async function main() {
  console.log("Starting upgrade process...");

  // 获取部署信息
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found for network: ${network.name}`);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  console.log(`Loaded deployment info for network: ${network.name}`);
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`Upgrading contracts with the account: ${deployer.address}`);
  
  // 检查是否是合约所有者
  const HashKeyChainStakingProxyAdmin = await ethers.getContractFactory("HashKeyChainStakingProxyAdmin");
  const proxyAdmin = HashKeyChainStakingProxyAdmin.attach(deploymentInfo.proxyAdmin);
  
  try {
    const owner = await proxyAdmin.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error(`Deployer is not the owner of the ProxyAdmin contract. Owner: ${owner}`);
    }
    console.log("Deployer is the owner of the ProxyAdmin contract");
  } catch (error) {
    console.error("Failed to verify ownership:", error);
    throw error;
  }
  
  // 部署新的实现合约
  console.log("Deploying new HashKeyChainStaking implementation...");
  const HashKeyChainStaking = await ethers.getContractFactory("HashKeyChainStaking");
  const newImplementation = await HashKeyChainStaking.deploy();
  await newImplementation.waitForDeployment();
  const newImplementationAddress = await newImplementation.getAddress();
  console.log(`New HashKeyChainStaking implementation deployed to: ${newImplementationAddress}`);
  
  // 准备升级数据（如果需要）
  const upgradeData = "0x"; // 如果不需要调用初始化函数，使用空数据
  
  // 如果需要在升级时调用初始化函数，可以使用以下代码
  // const upgradeData = HashKeyChainStaking.interface.encodeFunctionData("reinitialize", [
  //   // 初始化参数
  // ]);
  
  // 执行升级
  console.log("Upgrading proxy...");
  if (upgradeData === "0x") {
    // 如果不需要调用初始化函数，使用upgradeProxy
    await proxyAdmin.upgradeProxy(deploymentInfo.proxy, newImplementationAddress);
  } else {
    // 如果需要调用初始化函数，使用upgradeProxyAndCall
    await proxyAdmin.upgradeProxyAndCall(deploymentInfo.proxy, newImplementationAddress, upgradeData);
  }
  
  console.log("Proxy upgraded successfully!");
  
  // 验证升级
  console.log("Verifying upgrade...");
  const stakingContract = HashKeyChainStaking.attach(deploymentInfo.proxy) as Contract;
  
  try {
    // 检查合约版本或其他属性以确认升级成功
    const version = await stakingContract.version();
    console.log(`New contract version: ${version.toString()}`);
    console.log("Upgrade verification completed successfully!");
  } catch (error) {
    console.error("Upgrade verification failed:", error);
    throw error;
  }
  
  // 更新部署信息
  deploymentInfo.previousImplementation = deploymentInfo.implementation;
  deploymentInfo.implementation = newImplementationAddress;
  deploymentInfo.lastUpgraded = new Date().toISOString();
  
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Updated deployment information saved to deployments/${network.name}.json`);
}

// 执行升级脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 