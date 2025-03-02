// This is a deployment script that can be used with Hardhat

import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import fs from "fs";
import path from "path";
import { network } from "hardhat";

async function main() {
  console.log("Starting deployment process...");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // 部署实现合约
  console.log("Deploying HashKeyChainStaking implementation...");
  const HashKeyChainStaking = await ethers.getContractFactory("HashKeyChainStaking");
  const implementation = await HashKeyChainStaking.deploy();
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();
  console.log(`HashKeyChainStaking implementation deployed to: ${implementationAddress}`);

  // 部署代理管理员合约
  console.log("Deploying HashKeyChainStakingProxyAdmin...");
  const HashKeyChainStakingProxyAdmin = await ethers.getContractFactory("HashKeyChainStakingProxyAdmin");
  const proxyAdmin = await HashKeyChainStakingProxyAdmin.deploy();
  await proxyAdmin.waitForDeployment();
  const proxyAdminAddress = await proxyAdmin.getAddress();
  console.log(`HashKeyChainStakingProxyAdmin deployed to: ${proxyAdminAddress}`);

  // 准备初始化数据
  console.log("Preparing initialization data...");
  const initData = HashKeyChainStaking.interface.encodeFunctionData("initialize", [
    // 这里填入initialize函数的参数
    // 例如: 
    // deployer.address, // owner
    // ethers.parseEther("0.1"), // minStakeAmount
    // 3600 * 24 * 365, // 一年的秒数
    // ethers.parseEther("1000") // annualRewardsBudget
  ]);

  // 部署代理合约
  console.log("Deploying HashKeyChainStakingProxy...");
  const HashKeyChainStakingProxy = await ethers.getContractFactory("HashKeyChainStakingProxy");
  const proxy = await HashKeyChainStakingProxy.deploy(
    implementationAddress,
    proxyAdminAddress,
    initData,
    { value: 0 } // 如果需要发送ETH，可以在这里设置
  );
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log(`HashKeyChainStakingProxy deployed to: ${proxyAddress}`);

  // 创建代理合约的接口实例，用于与合约交互
  const stakingContract = HashKeyChainStaking.attach(proxyAddress) as Contract;
  console.log("Deployment completed successfully!");

  // 保存部署信息到文件
  const deploymentInfo = {
    network: network.name,
    implementation: implementationAddress,
    proxyAdmin: proxyAdminAddress,
    proxy: proxyAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment information saved to deployments/${network.name}.json`);

  // 验证部署是否成功
  console.log("Verifying deployment...");
  try {
    // 检查合约是否已初始化
    const owner = await stakingContract.owner();
    console.log(`Contract owner set to: ${owner}`);
    console.log("Verification completed successfully!");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

// 执行部署脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });