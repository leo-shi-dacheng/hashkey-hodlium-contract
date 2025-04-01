import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Stake types
const FIXED_30_DAYS = 0;
const FIXED_90_DAYS = 1;
const FIXED_180_DAYS = 2;
const FIXED_365_DAYS = 3;
const FLEXIBLE = 4;

const PROXY_ADDRESS = "0xD30A4CA3b40ea4FF00e81b0471750AA9a94Ce9b1";

async function main() {
  // 使用管理员账户
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);

  // Instead of using the factory directly, get it dynamically
  const StakingFactory = await ethers.getContractFactory("HashKeyChainStaking");
  const stakingContract = StakingFactory.attach(PROXY_ADDRESS).connect(signer);

  try {
    // 获取当前状态
    const maxAPR30 = await stakingContract.maxAPRs(FIXED_30_DAYS);
    const maxAPR90 = await stakingContract.maxAPRs(FIXED_90_DAYS);
    const maxAPR180 = await stakingContract.maxAPRs(FIXED_180_DAYS);
    const maxAPR365 = await stakingContract.maxAPRs(FIXED_365_DAYS);
    const maxAPRFlexible = await stakingContract.maxAPRs(FLEXIBLE);

    console.log("Current maxAPR30:", maxAPR30);
    console.log("Current maxAPR90:", maxAPR90);
    console.log("Current maxAPR180:", maxAPR180);
    console.log("Current maxAPR365:", maxAPR365);
    console.log("Current maxAPRFlexible:", maxAPRFlexible);

    // Update 30 days APR
    console.log("\nUpdating 30 DAYS MAX APR...");
    const tx30 = await stakingContract.updateMaxAPRs(FIXED_30_DAYS, 10);
    await tx30.wait();
    console.log("Successfully updated 30 DAYS MAX APR to 3.6%!");

    // Update 90 days APR
    console.log("\nUpdating 90 DAYS MAX APR...");
    const tx90 = await stakingContract.updateMaxAPRs(FIXED_90_DAYS, 10);
    await tx90.wait();
    console.log("Successfully updated 90 DAYS MAX APR to 10%!");

    // Update 180 days APR
    console.log("\nUpdating 180 DAYS MAX APR...");
    const tx180 = await stakingContract.updateMaxAPRs(FIXED_180_DAYS, 10);
    await tx180.wait();
    console.log("Successfully updated 180 DAYS MAX APR to 18%!");

    // Update 365 days APR
    console.log("\nUpdating 365 DAYS MAX APR...");
    const tx365 = await stakingContract.updateMaxAPRs(FIXED_365_DAYS, 10);
    await tx365.wait();
    console.log("Successfully updated 365 DAYS MAX APR to 36%!");

    // Update flexible APR
    console.log("\nUpdating FLEXIBLE MAX APR...");
    const txFlexible = await stakingContract.updateMaxAPRs(FLEXIBLE, 10);
    await txFlexible.wait();
    console.log("Successfully updated FLEXIBLE MAX APR to 1.8%!");

    // Verify changes
    setTimeout(async() => {
      const afterMaxAPR30 = await stakingContract.maxAPRs(FIXED_30_DAYS);
      const afterMaxAPR90 = await stakingContract.maxAPRs(FIXED_90_DAYS);
      const afterMaxAPR180 = await stakingContract.maxAPRs(FIXED_180_DAYS);
      const afterMaxAPR365 = await stakingContract.maxAPRs(FIXED_365_DAYS);
      const afterMaxAPRFlexible = await stakingContract.maxAPRs(FLEXIBLE);
      
      console.log("\nAfter adjustments:");
      console.log("30 DAYS MAX APR:", afterMaxAPR30.toString());
      console.log("90 DAYS MAX APR:", afterMaxAPR90.toString());
      console.log("180 DAYS MAX APR:", afterMaxAPR180.toString());
      console.log("365 DAYS MAX APR:", afterMaxAPR365.toString());
      console.log("FLEXIBLE MAX APR:", afterMaxAPRFlexible.toString());
    }, 2000);
  } catch (error) {
    console.error("Error executing transaction:", error);
    // If there's a reason string in the error message, extract and log it
    if (error.message && error.message.includes("reason=")) {
      const reasonMatch = error.message.match(/reason="([^"]+)"/);
      if (reasonMatch && reasonMatch[1]) {
        console.error("Revert reason:", reasonMatch[1]);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// npx hardhat run scripts/updateMaxAprs.ts --network hashkeyMainnet