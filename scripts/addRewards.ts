import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { HashKeyChainStaking__factory } from "../typechain-types";

dotenv.config();

const PROXY_ADDRESS = "0x31De30BDBB58E890a10CB1C579B16592F7b5c041";

async function main() {
  const signer = new ethers.Wallet(process.env.TEST_STAKE!, ethers.provider);
  const stakingContract = HashKeyChainStaking__factory.connect(PROXY_ADDRESS, signer);

  // 添加 1000 HSK 作为奖励
  const rewardAmount = ethers.parseEther("1000");
  
  console.log("Adding rewards...");
  const tx = await stakingContract.addRewards({ value: rewardAmount });
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