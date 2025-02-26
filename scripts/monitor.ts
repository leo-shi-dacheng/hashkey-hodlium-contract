import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { HashKeyChainStaking__factory } from "../typechain-types";

dotenv.config();

const PROXY_ADDRESS = "0x0dabF32b4c8C58aa404c66Afcd038B96EEDb3F78";
const MONITOR_INTERVAL = 10;  // 每10秒检查一次

async function getStakeInfo(contract: any, address: string) {
    try {
        const stakeCount = await contract.getUserStakeCount(address);
        const stakes = [];
        
        for (let i = 0; i < stakeCount; i++) {
            try {
                const [amount, lockEndTime, isWithdrawn, isLocked, startTime, lockDuration, hskPerBlock, accHskPerShare] = 
                    await contract.getStakeInfo(address, i);
                const reward = await contract.pendingRewardForStake(address, i);
                const totalStaked = await contract.totalValueLocked();
                
                stakes.push({
                    amount: ethers.formatEther(amount),
                    startTime: new Date(Number(startTime) * 1000).toLocaleString(),
                    lockEndTime: new Date(Number(lockEndTime) * 1000).toLocaleString(),
                    isWithdrawn,
                    isLocked,
                    lockDuration: Number(lockDuration),
                    reward: ethers.formatEther(reward),
                    hskPerBlock: ethers.formatEther(hskPerBlock),
                    accHskPerShare: ethers.formatEther(accHskPerShare),
                    totalStaked: ethers.formatEther(totalStaked)
                });
            } catch (error) {
                console.error(`Error getting stake info for index ${i}:`, error);
            }
        }
        return stakes;
    } catch (error) {
        console.error("Error in getStakeInfo:", error);
        return [];
    }
}

function calculateActualAPR(stakeAmount: number, reward: number, seconds: number): number {
    const yearInSeconds = 365 * 24 * 3600;
    return (reward / stakeAmount) * (yearInSeconds / seconds) * 100;
}

function calculateExpectedAPR(stakeAmount: number, hskPerBlock: number, totalStaked: number): number {
    const blocksPerYear = (365 * 24 * 3600) / 2; // 2秒一个块
    const yearlyRewards = hskPerBlock * blocksPerYear;
    const userShare = stakeAmount / totalStaked;
    const expectedYearlyReward = yearlyRewards * userShare;
    return (expectedYearlyReward / stakeAmount) * 100;
}

async function main() {
    const wallet1 = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
    const wallet2 = new ethers.Wallet(process.env.TEST_STAKE!, ethers.provider);
    const stakingContract = HashKeyChainStaking__factory.connect(PROXY_ADDRESS, wallet1);

    console.log("Starting monitoring for addresses:");
    console.log("Address 1:", wallet1.address);
    console.log("Address 2:", wallet2.address);

    setInterval(async () => {
        try {
            // 获取质押统计信息
            const [tvl, stakingsByDuration, apysByDuration] = await stakingContract.getStakingStats();
            console.log("\nTotal Value Locked:", ethers.formatEther(tvl), "HSK");
            console.log("\nStaking Statistics:");

            const durations = ["30 Days", "90 Days", "180 Days", "365 Days"];
            for (let i = 0; i < 4; i++) {
                const percentage = (Number(stakingsByDuration[i]) / Number(tvl) * 100).toFixed(2);
                console.log(`\n${durations[i]}:`);
                console.log(`  Amount: ${ethers.formatEther(stakingsByDuration[i])} HSK (${percentage}%)`);
                console.log(`  APY: ${(Number(apysByDuration[i]) / 100).toFixed(2)}%`);
            }

            for (const [index, wallet] of [wallet1, wallet2].entries()) {
                const stakes = await getStakeInfo(stakingContract, wallet.address);
                const totalReward = await stakingContract.pendingReward(wallet.address);
                
                console.log(`\nAddress ${index + 1}: ${wallet.address}`);
                console.log("Total Pending Rewards:", ethers.formatEther(totalReward), "HSK");
                
                if (stakes.length > 0) {
                    console.log("Stakes:");
                    stakes.forEach((stake, i) => {
                        const stakeAmount = Number(stake.amount);
                        const reward = Number(stake.reward);
                        const stakeDuration = (Date.now() / 1000 - new Date(stake.startTime).getTime() / 1000);
                        const actualAPR = calculateActualAPR(stakeAmount, reward, stakeDuration);
                        const expectedAPR = calculateExpectedAPR(
                            stakeAmount,
                            Number(stake.hskPerBlock),
                            Number(stake.totalStaked)
                        );
                        
                        console.log(`  Stake ${i}:`);
                        console.log(`    Amount: ${stake.amount} HSK`);
                        console.log(`    Start Time: ${stake.startTime}`);
                        console.log(`    Lock End: ${stake.lockEndTime}`);
                        console.log(`    Reward: ${stake.reward} HSK`);
                        console.log(`    Duration: ${(stakeDuration / 60).toFixed(2)} minutes`);
                        console.log(`    Actual APR: ${actualAPR.toFixed(2)}%`);
                        console.log(`    Expected APR: ${expectedAPR.toFixed(2)}%`);
                        console.log(`    HSK Per Block: ${stake.hskPerBlock}`);
                        console.log(`    Total Staked: ${stake.totalStaked} HSK`);
                        console.log(`    Status: ${stake.isLocked ? "Locked" : "Unlocked"}${stake.isWithdrawn ? " (Withdrawn)" : ""}`);
                    });
                } else {
                    console.log("No stakes found");
                }
            }
            console.log("\n-----------------------------------");
        } catch (error) {
            console.error("Error checking rewards:", error);
        }
    }, MONITOR_INTERVAL * 1000);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 