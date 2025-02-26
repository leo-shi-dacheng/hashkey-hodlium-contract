import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { HashKeyChainStaking__factory } from "../typechain-types";

dotenv.config();

const PROXY_ADDRESS = "0xCd13DE9f9AFfE73Ed19A2afaF28749b5fc837A85";
const IMPLEMENTATION_ADDRESS = "0x0cD32176F991451621936399B39261e5d323CCd6";
const PROXY_ADMIN = "0xF6F1EaB158e22fa694A43564074f3271919D495c";
const TOTAL_YEARLY_REWARDS = ethers.parseEther("7500000"); // 750万 HSK/年
const BLOCKS_PER_YEAR = 31536000n / 2n; // 一年的秒数/每块秒数

async function main() {
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  console.log("Using address:", signer.address);

  // 检查合约状态
  console.log("\nContract Addresses:");
  console.log("Proxy:", PROXY_ADDRESS);
  console.log("Implementation:", IMPLEMENTATION_ADDRESS);
  console.log("Proxy Admin:", PROXY_ADMIN);

  // 连接到代理合约
  const stakingContract = HashKeyChainStaking__factory.connect(PROXY_ADDRESS, signer);

  // 计算每区块应该发放的奖励
  const newHskPerBlock = TOTAL_YEARLY_REWARDS / BLOCKS_PER_YEAR;
  const maxHskPerBlock = await stakingContract.maxHskPerBlock();
  const minHskPerBlock = ethers.parseEther("0.01"); // 设置一个最小值

  console.log("\nLimits:");
  console.log("Max HSK per block:", ethers.formatEther(maxHskPerBlock));
  console.log("Min HSK per block:", ethers.formatEther(minHskPerBlock));
  
  console.log("\nCurrent settings:");
  const currentHskPerBlock = await stakingContract.hskPerBlock();
  console.log("Current HSK per block:", ethers.formatEther(currentHskPerBlock));
  
  // 确保新值在合理范围内
  const adjustedHskPerBlock = newHskPerBlock < minHskPerBlock ? minHskPerBlock : newHskPerBlock;
  
  console.log("\nNew settings:");
  console.log("Calculated HSK per block:", ethers.formatEther(newHskPerBlock));
  console.log("Adjusted HSK per block:", ethers.formatEther(adjustedHskPerBlock));
  
  if (adjustedHskPerBlock > maxHskPerBlock) {
    console.error("Error: New value exceeds maximum HSK per block!");
    return;
  }
  
  // 更新区块奖励
  console.log("\nUpdating HSK per block...");
  const tx = await stakingContract.updateHskPerBlock(adjustedHskPerBlock);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  
  // 验证更新
  const updatedHskPerBlock = await stakingContract.hskPerBlock();
  console.log("\nVerification:");
  console.log("Updated HSK per block:", ethers.formatEther(updatedHskPerBlock));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  if (error.data) {
    console.error("Error data:", error.data);
  }
  process.exitCode = 1;
}); 