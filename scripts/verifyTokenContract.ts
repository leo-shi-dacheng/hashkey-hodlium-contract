import { run } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    console.log("开始执行stHSK代币合约验证脚本...");
    
    // 合约地址
    const stHSKTokenAddress = process.env.STHSK_TOKEN_ADDRESS || "0x81f4B01E26707Edbaf2168Ed4E20C17f8d28fd8F";
    
    console.log(`stHSK代币地址: ${stHSKTokenAddress}`);
    
    // 获取网络参数
    const network = process.env.VERIFY_NETWORK || "hashkeyTestnet";
    console.log(`验证网络: ${network}`);
    
    // stHSK代币合约的构造函数参数
    const constructorArguments: any[] = [];
    
    console.log("开始验证stHSK代币合约...");
    
    // 使用Hardhat的verify任务验证合约
    await run("verify:verify", {
      address: stHSKTokenAddress,
      constructorArguments: constructorArguments,
      contract: "contracts/StHSK.sol:StHSK",
      network: network
    });
    
    console.log("stHSK代币合约验证成功!");
    
  } catch (error: any) {
    if (
      error.message.includes("Already Verified") ||
      error.message.includes("Already verified")
    ) {
      console.log("合约已经验证过，无需重复验证");
    } else {
      console.error("验证合约时出错:", error);
      process.exit(1);
    }
  }
}

// 执行脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/**
 * 使用方法:
 * 
 * 1. 设置环境变量:
 *    - VERIFY_NETWORK: 要验证的网络 (hashkeyTestnet 或 hashkeyMainnet)
 *    - STHSK_TOKEN_ADDRESS: stHSK代币合约地址
 * 
 * 2. 运行脚本:
 *    npx hardhat run scripts/verifyTokenContract.ts --network hashkeyTestnet
 *    或
 *    npx hardhat run scripts/verifyTokenContract.ts --network hashkeyMainnet
 * 
 * 示例:
 *    npx hardhat run scripts/verifyTokenContract.ts --network hashkeyTestnet
 */ 