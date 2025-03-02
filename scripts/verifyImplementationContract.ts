import { run } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    console.log("开始执行实现合约验证脚本...");
    
    // 合约地址
    const implementationAddress = process.env.IMPLEMENTATION_ADDRESS || "0xDbFF0dCE82E9e9D0BAda19Ef578227c5FB978253";
    
    console.log(`实现合约地址: ${implementationAddress}`);
    
    // 获取网络参数
    const network = process.env.VERIFY_NETWORK || "hashkeyTestnet";
    console.log(`验证网络: ${network}`);
    
    // 实现合约没有构造函数参数，因为它使用initialize函数初始化
    const constructorArguments: any[] = [];
    
    console.log("开始验证实现合约...");
    
    // 使用Hardhat的verify任务验证合约
    await run("verify:verify", {
      address: implementationAddress,
      constructorArguments: constructorArguments,
      contract: "contracts/HashKeyChainStaking.sol:HashKeyChainStaking",
      network: network
    });
    
    console.log("实现合约验证成功!");
    
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
 *    - IMPLEMENTATION_ADDRESS: 实现合约地址
 * 
 * 2. 运行脚本:
 *    npx hardhat run scripts/verifyImplementationContract.ts --network hashkeyTestnet
 *    或
 *    npx hardhat run scripts/verifyImplementationContract.ts --network hashkeyMainnet
 * 
 * 示例:
 *    npx hardhat run scripts/verifyImplementationContract.ts --network hashkeyTestnet
 */ 