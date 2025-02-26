import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { HashKeyChainStaking__factory } from "../typechain-types";

dotenv.config();

const PROXY_ADDRESS = "0xdd5Af36ba573A95836B5A80fDC6eb2Bd2509d942";
const TOTAL_YEARLY_REWARDS = ethers.parseEther("7500000"); // 750万 HSK/年
const SECONDS_PER_BLOCK = 2n;
const BLOCKS_PER_YEAR = 31536000n / SECONDS_PER_BLOCK;
const MAX_APR = 30;

async function main() {
  // 使用管理员账户
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  const stakingContract = HashKeyChainStaking__factory.connect(PROXY_ADDRESS, signer);

  // 获取当前状态
  const totalStaked = await stakingContract.totalValueLocked();
  const currentHskPerBlock = await stakingContract.hskPerBlock();

  // 计算建议的每区块奖励
  const MIN_TOTAL_STAKED_FOR_MAX_APR = TOTAL_YEARLY_REWARDS * 100n / (30n * 100n);
  let suggestedRewardPerBlock = TOTAL_YEARLY_REWARDS / BLOCKS_PER_YEAR;
  if (totalStaked < MIN_TOTAL_STAKED_FOR_MAX_APR) {
    suggestedRewardPerBlock = (totalStaked * 30n * 100n) / (100n * BLOCKS_PER_YEAR);
  }

  console.log("Current status:");
  console.log("Total staked:", ethers.formatEther(totalStaked), "HSK");
  console.log("Current reward per block:", ethers.formatEther(currentHskPerBlock), "HSK");
  console.log("Suggested reward per block:", ethers.formatEther(suggestedRewardPerBlock), "HSK");

  // 如果需要调整
  if (currentHskPerBlock !== suggestedRewardPerBlock) {
    console.log("\nUpdating reward per block...");
    const tx = await stakingContract.updateHskPerBlock(suggestedRewardPerBlock);
    await tx.wait();
    console.log("Successfully updated reward per block!");
  } else {
    console.log("\nNo adjustment needed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 