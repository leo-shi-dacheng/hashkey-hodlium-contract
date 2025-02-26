import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { HashKeyChainStaking__factory } from "../typechain-types";

dotenv.config();

const PROXY_ADDRESS = "0x82cd343eed191E02E2b4D33bbA08F83C78Ee87AA";  // Staking Proxy address
const PROXY_ADMIN = "0xB5735F60B45540f491cd2cD6D7604b961e136e2c";
const IMPLEMENTATION_ADDRESS = "0xC3a52E6880Df0Ce6b3CDeAF6D91D4C6a0CdA0D0F";

async function main() {
  try {
    // 检查合约代码是否存在
    const code = await ethers.provider.getCode(PROXY_ADDRESS);
    console.log("Contract code exists:", code !== "0x");

    if (code === "0x") {
      console.error("No contract code found at this address!");
      return;
    }

    const signer = new ethers.Wallet(process.env.TEST_STAKE!, ethers.provider);
    
    // 尝试获取合约版本
    const stakingContract = HashKeyChainStaking__factory.connect(PROXY_ADDRESS, signer);
    try {
      const version = await stakingContract.version();
      console.log("Contract version:", version.toString());
    } catch (error) {
      console.log("Could not get version:", error);
    }

    // 尝试获取代理管理员
    try {
      const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
      const adminSlot = await ethers.provider.getStorage(PROXY_ADDRESS, ADMIN_SLOT);
      console.log("Proxy admin:", adminSlot);
    } catch (error) {
      console.log("Could not get admin:", error);
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 