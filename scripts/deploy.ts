// This is a deployment script that can be used with Hardhat

import { ethers, upgrades } from "hardhat";
import { HashKeyChainStaking } from "../typechain-types";

async function main() {
  console.log("Starting deployment of HashKeyChain Staking contracts...");

  const HashKeyChainStaking = await ethers.getContractFactory("HashKeyChainStaking");
  
  const currentBlock = await ethers.provider.getBlockNumber();
  const TOTAL_YEARLY_REWARDS = ethers.parseEther("7500000");
  const BLOCKS_PER_YEAR = 31536000n / 2n;
  const hskPerBlock = TOTAL_YEARLY_REWARDS / BLOCKS_PER_YEAR;
  const startBlock = currentBlock + 100;
  const maxHskPerBlock = ethers.parseEther("500");
  const minStakeAmount = ethers.parseEther("100");

  console.log("Deploying HashKeyChainStaking...");
  const staking = await upgrades.deployProxy(HashKeyChainStaking, [
    hskPerBlock,
    startBlock,
    maxHskPerBlock,
    minStakeAmount,
    TOTAL_YEARLY_REWARDS
  ]);

  await staking.waitForDeployment();
  console.log("HashKeyChainStaking deployed to:", await staking.getAddress());

  // Create a proxy instance of the staking contract with correct typing
  const stakingContract = HashKeyChainStaking.attach(await staking.getAddress()) as HashKeyChainStaking;

  // Verify initialization
  const fetchedHskPerBlock = await stakingContract.hskPerBlock();
  console.log("Verified hskPerBlock:", ethers.formatEther(fetchedHskPerBlock));
  const fetchedStartBlock = await stakingContract.startBlock();
  console.log("Verified startBlock:", fetchedStartBlock.toString());
  const version = await stakingContract.version();
  console.log("Contract version:", version.toString());
  const owner = await stakingContract.owner();
  console.log("Contract owner:", owner);

  console.log("Deployment complete!");
  console.log("-----------------------------------");
  console.log("Important Addresses:");
  console.log("StHSK Token:", await stakingContract.stHSK());
  console.log("Staking Implementation:", await staking.getAddress());
  console.log("-----------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});