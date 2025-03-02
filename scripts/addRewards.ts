import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { HashKeyChainStaking__factory } from "../typechain-types";

dotenv.config();

const PROXY_ADDRESS = "0xDbFF0dCE82E9e9D0BAda19Ef578227c5FB978253";

async function main() {
  const signer = new ethers.Wallet(process.env.TEST_STAKE!, ethers.provider);
  const stakingContract = HashKeyChainStaking__factory.connect(PROXY_ADDRESS, signer);

  // 添加 100 HSK 作为奖励（从原来的1000 HSK改为100 HSK）
  const rewardAmount = ethers.parseEther("100");
  
  console.log("Adding rewards...");
  
  // 使用直接发送交易的方式添加奖励
  const tx = await signer.sendTransaction({
    to: PROXY_ADDRESS,
    value: rewardAmount
  });
  
  await tx.wait();
  
  console.log("Added", ethers.formatEther(rewardAmount), "HSK as rewards");
  
  // 验证
  const reservedRewards = await stakingContract.reservedRewards();
  console.log("New reserved rewards:", ethers.formatEther(reservedRewards), "HSK");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
}); 