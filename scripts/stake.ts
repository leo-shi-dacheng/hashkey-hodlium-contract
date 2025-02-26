import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { HashKeyChainStaking__factory } from "../typechain-types";

dotenv.config();

const PROXY_ADDRESS = "0x31De30BDBB58E890a10CB1C579B16592F7b5c041";

async function main() {
  const signer = new ethers.Wallet(process.env.TEST_STAKE!, ethers.provider);
  const stakingContract = HashKeyChainStaking__factory.connect(PROXY_ADDRESS, signer);

  console.log("Using address:", signer.address);
  console.log("Current balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "HSK");

  try {
    // 质押 1 HSK
    const stakeAmount = ethers.parseEther("1");
    console.log("\nStaking", ethers.formatEther(stakeAmount), "HSK...");
    
    // 0 代表 FIXED_30_DAYS
    const tx = await stakingContract.stake(0, { value: stakeAmount });
    console.log("Transaction hash:", tx.hash);
    
    await tx.wait();
    console.log("Stake transaction confirmed!");

    // 验证质押
    const userInfo = await stakingContract.userInfo(signer.address);
    console.log("\nStake verified:");
    console.log("Total staked:", ethers.formatEther(userInfo.totalStaked), "HSK");

  } catch (error: any) {
    console.error("Error staking:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
}); 