import { run } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    console.log("开始执行合约验证脚本...");
    
    // 合约地址
    const stakingContractAddress = "0xDbFF0dCE82E9e9D0BAda19Ef578227c5FB978253";
    const stHSKTokenAddress = "0x81f4B01E26707Edbaf2168Ed4E20C17f8d28fd8F";
    
    console.log(`质押合约地址: ${stakingContractAddress}`);
    console.log(`stHSK代币地址: ${stHSKTokenAddress}`);
    
    // 获取网络参数
    const network = process.env.VERIFY_NETWORK || "hashkeyTestnet";
    console.log(`验证网络: ${network}`);
    
    // 确定要验证的合约类型
    const contractType = process.env.CONTRACT_TYPE || "implementation";
    console.log(`验证合约类型: ${contractType}`);
    
    if (contractType === "implementation") {
      // 验证实现合约 (HashKeyChainStaking)
      console.log("开始验证实现合约...");
      
      // 实现合约没有构造函数参数，因为它使用initialize函数初始化
      const constructorArguments: any[] = [];
      
      await run("verify:verify", {
        address: stakingContractAddress,
        constructorArguments: constructorArguments,
        contract: "contracts/HashKeyChainStaking.sol:HashKeyChainStaking",
        network: network
      });
      
      console.log("实现合约验证成功!");
    } 
    else if (contractType === "proxy") {
      // 验证代理合约 (HashKeyChainStakingProxy)
      console.log("开始验证代理合约...");
      
      // 代理合约的构造函数参数
      // 注意：您需要根据实际部署时使用的参数进行调整
      const proxyAdmin = process.env.PROXY_ADMIN_ADDRESS;
      if (!proxyAdmin) {
        throw new Error("环境变量中未设置PROXY_ADMIN_ADDRESS");
      }
      
      // 代理合约构造函数参数: _logic, _admin, _data
      const constructorArguments: any[] = [
        stakingContractAddress, // 逻辑合约地址
        proxyAdmin,            // 管理员地址
        "0x"                   // 初始化数据 (如果有的话)
      ];
      
      await run("verify:verify", {
        address: stakingContractAddress, // 这里应该是代理合约地址
        constructorArguments: constructorArguments,
        contract: "contracts/HashKeyChainStakingProxy.sol:HashKeyChainStakingProxy",
        network: network
      });
      
      console.log("代理合约验证成功!");
    }
    else if (contractType === "token") {
      // 验证stHSK代币合约
      console.log("开始验证stHSK代币合约...");
      
      // stHSK代币合约的构造函数参数
      const constructorArguments: any[] = [];
      
      await run("verify:verify", {
        address: stHSKTokenAddress,
        constructorArguments: constructorArguments,
        contract: "contracts/StHSK.sol:StHSK",
        network: network
      });
      
      console.log("stHSK代币合约验证成功!");
    }
    else {
      throw new Error(`不支持的合约类型: ${contractType}`);
    }
    
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
 *    - CONTRACT_TYPE: 要验证的合约类型 (implementation, proxy, 或 token)
 *    - PROXY_ADMIN_ADDRESS: 代理合约管理员地址 (仅在验证代理合约时需要)
 * 
 * 2. 运行脚本:
 *    npx hardhat run scripts/verifyContract.ts --network hashkeyTestnet
 *    或
 *    npx hardhat run scripts/verifyContract.ts --network hashkeyMainnet
 * 
 * 示例:
 *    # 验证实现合约
 *    CONTRACT_TYPE=implementation npx hardhat run scripts/verifyContract.ts --network hashkeyTestnet
 * 
 *    # 验证代理合约
 *    CONTRACT_TYPE=proxy PROXY_ADMIN_ADDRESS=0x... npx hardhat run scripts/verifyContract.ts --network hashkeyTestnet
 * 
 *    # 验证stHSK代币合约
 *    CONTRACT_TYPE=token npx hardhat run scripts/verifyContract.ts --network hashkeyTestnet
 */ 