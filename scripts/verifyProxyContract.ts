import { run } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    console.log("开始执行代理合约验证脚本...");
    
    // 合约地址
    const proxyContractAddress = process.env.PROXY_CONTRACT_ADDRESS || "0xDbFF0dCE82E9e9D0BAda19Ef578227c5FB978253";
    const implementationAddress = process.env.IMPLEMENTATION_ADDRESS || "0xDbFF0dCE82E9e9D0BAda19Ef578227c5FB978253";
    const proxyAdminAddress = process.env.PROXY_ADMIN_ADDRESS;
    
    if (!proxyAdminAddress) {
      throw new Error("环境变量中未设置PROXY_ADMIN_ADDRESS");
    }
    
    console.log(`代理合约地址: ${proxyContractAddress}`);
    console.log(`实现合约地址: ${implementationAddress}`);
    console.log(`代理管理员地址: ${proxyAdminAddress}`);
    
    // 获取网络参数
    const network = process.env.VERIFY_NETWORK || "hashkeyTestnet";
    console.log(`验证网络: ${network}`);
    
    // 代理合约构造函数参数: _logic, _admin, _data
    const constructorArguments: any[] = [
      implementationAddress,  // 逻辑合约地址
      proxyAdminAddress,      // 管理员地址
      "0x"                    // 初始化数据 (如果有的话)
    ];
    
    console.log("开始验证代理合约...");
    
    // 使用Hardhat的verify任务验证合约
    await run("verify:verify", {
      address: proxyContractAddress,
      constructorArguments: constructorArguments,
      contract: "contracts/HashKeyChainStakingProxy.sol:HashKeyChainStakingProxy",
      network: network
    });
    
    console.log("代理合约验证成功!");
    
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
 *    - PROXY_CONTRACT_ADDRESS: 代理合约地址
 *    - IMPLEMENTATION_ADDRESS: 实现合约地址
 *    - PROXY_ADMIN_ADDRESS: 代理合约管理员地址
 * 
 * 2. 运行脚本:
 *    npx hardhat run scripts/verifyProxyContract.ts --network hashkeyTestnet
 *    或
 *    npx hardhat run scripts/verifyProxyContract.ts --network hashkeyMainnet
 * 
 * 示例:
 *    PROXY_ADMIN_ADDRESS=0x... npx hardhat run scripts/verifyProxyContract.ts --network hashkeyTestnet
 */ 