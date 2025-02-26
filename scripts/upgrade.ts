import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0x0dabF32b4c8C58aa404c66Afcd038B96EEDb3F78";

async function main() {
  try {
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
    console.log("Using admin address:", signer.address);

    console.log("Upgrading HashKeyChainStaking contract...");

    const HashKeyChainStaking = await ethers.getContractFactory("HashKeyChainStaking");
    
    // 升级合约
    const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, HashKeyChainStaking);
    await upgraded.waitForDeployment();

    // 获取新的实现合约地址
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
    console.log("New implementation deployed to:", implementationAddress);

    // 等待确认
    console.log("Waiting for confirmations...");
    await upgraded.deploymentTransaction()?.wait(6);

    console.log("Upgrade completed!");
  } catch (error) {
    console.error("Upgrade failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 