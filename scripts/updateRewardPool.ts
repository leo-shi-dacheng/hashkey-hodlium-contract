import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    console.log("开始执行更新奖励池脚本...");
    
    // 获取部署者账户
    const [deployer] = await ethers.getSigners();
    console.log(`使用账户: ${deployer.address}`);
    
    // 获取合约地址
    const stakingContractAddress = "0xDbFF0dCE82E9e9D0BAda19Ef578227c5FB978253";
    console.log(`质押合约地址: ${stakingContractAddress}`);
    
    // 连接到合约
    const stakingContract = await ethers.getContractAt(
      "HashKeyChainStaking", // 合约名称，确保与您的合约名称匹配
      stakingContractAddress
    );
    
    console.log("调用updateRewardPool函数...");
    
    // 调用updateRewardPool函数
    const tx = await stakingContract.updateRewardPool();
    
    // 等待交易确认
    console.log(`交易已提交，等待确认: ${tx.hash}`);
    await tx.wait();
    
    console.log("奖励池更新成功!");
    
    // 获取更新后的奖励池信息（如果合约有相关查询函数）
    try {
      const lastRewardBlock = await stakingContract.lastRewardBlock();
      console.log(`最新奖励区块: ${lastRewardBlock}`);
      
      const hskPerBlock = await stakingContract.hskPerBlock();
      console.log(`每区块HSK奖励: ${ethers.formatEther(hskPerBlock)} HSK`);
      
      const totalPooledHSK = await stakingContract.totalPooledHSK();
      console.log(`总质押HSK: ${ethers.formatEther(totalPooledHSK)} HSK`);
    } catch (error) {
      console.log("无法获取更新后的奖励池信息，但更新操作已完成");
    }
    
  } catch (error) {
    console.error("更新奖励池时出错:", error);
    process.exit(1);
  }
}

// 执行脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 