import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { HashKeyChainStaking__factory } from "../typechain-types";

dotenv.config();

const PROXY_ADDRESS = "0x31De30BDBB58E890a10CB1C579B16592F7b5c041";
const IMPLEMENTATION_ADDRESS = "0xA3bAFec9eC09f6BBcA3ae13d7e384f548D262E40";
const STHSK_ADDRESS = "0x904E88cF88BBD5d184626E5832cF43c78F9A3Fd7";

async function main() {
  const signer = new ethers.Wallet(process.env.TEST_STAKE!, ethers.provider);
  const stakingContract = HashKeyChainStaking__factory.connect(PROXY_ADDRESS, signer);

  console.log("Checking stakes for address:", signer.address);

  try {
    // 先检查合约状态
    const startBlock = await stakingContract.startBlock();
    const currentBlock = await ethers.provider.getBlockNumber();
    const hskPerBlock = await stakingContract.hskPerBlock();
    const reservedRewards = await stakingContract.reservedRewards();

    console.log("\nContract Status:");
    console.log("Start Block:", startBlock.toString());
    console.log("Current Block:", currentBlock);
    console.log("HSK per Block:", ethers.formatEther(hskPerBlock), "HSK");
    console.log("Reserved Rewards:", ethers.formatEther(reservedRewards), "HSK");

    // 获取用户所有质押信息
    const [totalStaked, rewardDebt, stakes] = await stakingContract.userInfo(signer.address);
    const stakeCount = await stakingContract.getUserStakeCount(signer.address);
    
    console.log("\nStake Details:");
    // 遍历所有质押
    for (let i = 0; i < Number(stakeCount); i++) {
      const stake = await stakingContract.getStakeInfo(signer.address, i);
      if (!stake.isWithdrawn && stake.amount > 0n) {
        const stakeReward = await stakingContract.pendingRewardForStake(signer.address, i);
        const lockEndTime = new Date(Number(stake.lockEndTime) * 1000);
        const remainingTime = Math.max(0, Number(stake.lockEndTime) - Math.floor(Date.now() / 1000));
        const remainingDays = Math.ceil(remainingTime / 86400);

        console.log(`\nStake #${i}:`);
        console.log("Amount:", ethers.formatEther(stake.amount), "HSK");
        console.log("Lock End Time:", lockEndTime.toLocaleString());
        console.log("Remaining Lock Time:", remainingDays, "days");
        console.log("Pending Rewards:", ethers.formatEther(stakeReward), "HSK");
      }
    }

    // 显示总计信息
    console.log("\nTotal Summary:");
    console.log("Total Staked:", ethers.formatEther(totalStaked), "HSK");
    const totalRewards = await stakingContract.pendingReward(signer.address);
    console.log("Total Pending Rewards:", ethers.formatEther(totalRewards), "HSK");

  } catch (error: any) {
    console.error("Error checking stakes:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
}); 