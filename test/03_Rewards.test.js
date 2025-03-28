const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("HashKeyChain Staking - Rewards", function () {
  let staking, stHSK, owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10,
      addr11, addr12, addr13, addr14, addr15, addr16, addr17, addr18, addr19;
  const minStakeAmount = ethers.parseEther("100");
  
  // Stake types
  const FIXED_30_DAYS = 0;
  const FIXED_90_DAYS = 1;
  const FIXED_180_DAYS = 2;
  const FIXED_365_DAYS = 3;
  const FLEXIBLE = 4;
  before(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10,
     addr11, addr12, addr13, addr14, addr15, addr16, addr17, addr18, addr19] = await ethers.getSigners();
    
    // Deploy contract
    const HashKeyChainStaking = await ethers.getContractFactory("HashKeyChainStaking");
    staking = await upgrades.deployProxy(HashKeyChainStaking, [
      ethers.parseEther("0.0017"),
      (await ethers.provider.getBlockNumber()) + 10,
      ethers.parseEther("1"),
      minStakeAmount,
      ethers.parseEther("6000000"),
      2
    ]);
    
    await staking.waitForDeployment();
    
    // Get stHSK contract
    const stHSKAddress = await staking.stHSK();
    const StHSK = await ethers.getContractFactory("StHSK");
    stHSK = StHSK.attach(stHSKAddress);
    
    // Add rewards
    await owner.sendTransaction({
      to: await staking.getAddress(),
      value: ethers.parseEther("2000")
    });
  });

  it("Should accumulate rewards with 20 users staking", async function() {
    const stakeAmount = ethers.parseEther("9999");
    
    // Stake for all 20 users with different lock periods
    await staking.connect(addr1).stakeLocked(FIXED_365_DAYS, { value: stakeAmount });
    await staking.connect(addr2).stakeLocked(FIXED_365_DAYS, { value: stakeAmount });
    await staking.connect(addr3).stakeLocked(FIXED_180_DAYS, { value: stakeAmount });
    await staking.connect(addr4).stakeLocked(FIXED_180_DAYS, { value: stakeAmount });
    await staking.connect(addr5).stakeLocked(FIXED_90_DAYS, { value: stakeAmount });
    await staking.connect(addr6).stakeLocked(FIXED_90_DAYS, { value: stakeAmount });
    await staking.connect(addr7).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
    await staking.connect(addr8).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
    await staking.connect(addr9).stakeFlexible({ value: stakeAmount });
    await staking.connect(addr10).stakeFlexible({ value: stakeAmount });
    await staking.connect(addr11).stakeLocked(FIXED_365_DAYS, { value: stakeAmount });
    await staking.connect(addr12).stakeLocked(FIXED_365_DAYS, { value: stakeAmount });
    await staking.connect(addr13).stakeLocked(FIXED_180_DAYS, { value: stakeAmount });
    await staking.connect(addr14).stakeLocked(FIXED_180_DAYS, { value: stakeAmount });
    await staking.connect(addr15).stakeLocked(FIXED_90_DAYS, { value: stakeAmount });
    await staking.connect(addr16).stakeLocked(FIXED_90_DAYS, { value: stakeAmount });
    await staking.connect(addr17).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
    await staking.connect(addr18).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
    await staking.connect(addr19).stakeFlexible({ value: stakeAmount });
    
    const initialPooledHSK = await staking.totalPooledHSK();
    
    // Fast forward time and mine blocks
    await mine(365 * 24 * 60 * 30); // Mine blocks for 1 year
  
    // Force reward pool update
    await staking.updateRewardPool();

    // Check rewards for different staking periods
    const stakeReward365 = await staking.getStakeReward(addr1.address, 0);
    const stakeReward180 = await staking.getStakeReward(addr3.address, 0);
    const stakeReward90 = await staking.getStakeReward(addr5.address, 0);
    const stakeReward30 = await staking.getStakeReward(addr7.address, 0);
    const stakeRewardFlex = await staking.getFlexibleStakeReward(addr9.address, 0);

    const totalPooledHSK = await staking.totalPooledHSK();
    const annualRewardsBudget = await staking.annualRewardsBudget();
    
    console.log(`总质押 ${ethers.formatEther(totalPooledHSK)} hsk,  一年总奖励为 ${ethers.formatEther(annualRewardsBudget)} hsk`);
    console.log(`9999 hsk 365-day stake one year reward: ${ethers.formatEther(stakeReward365[1])} HSK`);

    console.log(`9999 hsk 180-day stake one year reward: ${ethers.formatEther(stakeReward180[1])} HSK`);
    console.log(`9999 hsk 90-day stake one year reward: ${ethers.formatEther(stakeReward90[1])} HSK`);
    console.log(`9999 hsk 30-day stake one year reward: ${ethers.formatEther(stakeReward30[1])} HSK`);
    console.log(`9999 hsk Flexible stake one year reward: ${ethers.formatEther(stakeRewardFlex[1])} HSK`);
    // Total pooled HSK should have increased
    expect(await staking.totalPooledHSK()).to.be.gt(initialPooledHSK);
  });
  
  // it("Should apply correct bonus rates for locked staking", async function() {
  //   // // 1. 用户1进行质押
  //   // const stakeAmount = ethers.parseEther("200");
  //   // await staking.connect(addr1).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });

  //   // Get APRs, convert to numbers for easier comparison
  //   const apr30Number = Number(await staking.getCurrentAPR(ethers.parseEther("1000"), FIXED_30_DAYS));
  //   const apr90Number = Number(await staking.getCurrentAPR(ethers.parseEther("1000"), FIXED_90_DAYS));
    
  //   // Verify longer lock periods have higher APR
  //   expect(apr90Number).to.be.gt(apr30Number);
    
  //   // Get the baseline reward as reference
  //   console.log(`APR 30 days: ${apr30Number}, APR 90 days: ${apr90Number}, Difference: ${apr90Number - apr30Number}`);
    
  //   // Can choose not to compare exact values, just ensure 90-day APR > 30-day APR
  //   // If we must compare the difference, use more relaxed error range
  //   const bonus90 = Number(await staking.stakingBonus(FIXED_90_DAYS));
  //   console.log(`Bonus for 90 days: ${bonus90}`);
    
  //   // Don't do precise comparison, just ensure 90-day APR is higher than 30-day APR
  // });
  // it("Should 20 users unstake", async function() {
  //   const stakeAmount = ethers.parseEther("9999");
    
  //   // Stake for all 20 users with different lock periods
  //   await staking.connect(addr1).stakeLocked(FIXED_365_DAYS, { value: stakeAmount });
  //   await staking.connect(addr2).stakeLocked(FIXED_365_DAYS, { value: stakeAmount });
  //   await staking.connect(addr3).stakeLocked(FIXED_180_DAYS, { value: stakeAmount });
  //   await staking.connect(addr4).stakeLocked(FIXED_180_DAYS, { value: stakeAmount });
  //   await staking.connect(addr5).stakeLocked(FIXED_90_DAYS, { value: stakeAmount });
  //   await staking.connect(addr6).stakeLocked(FIXED_90_DAYS, { value: stakeAmount });
  //   await staking.connect(addr7).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
  //   await staking.connect(addr8).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
  //   await staking.connect(addr9).stakeLocked(FLEXIBLE, { value: stakeAmount });
  //   await staking.connect(addr10).stakeLocked(FLEXIBLE, { value: stakeAmount });
  //   await staking.connect(addr11).stakeLocked(FIXED_365_DAYS, { value: stakeAmount });
  //   await staking.connect(addr12).stakeLocked(FIXED_365_DAYS, { value: stakeAmount });
  //   await staking.connect(addr13).stakeLocked(FIXED_180_DAYS, { value: stakeAmount });
  //   await staking.connect(addr14).stakeLocked(FIXED_180_DAYS, { value: stakeAmount });
  //   await staking.connect(addr15).stakeLocked(FIXED_90_DAYS, { value: stakeAmount });
  //   await staking.connect(addr16).stakeLocked(FIXED_90_DAYS, { value: stakeAmount });
  //   await staking.connect(addr17).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
  //   await staking.connect(addr18).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
  //   await staking.connect(addr19).stakeLocked(FLEXIBLE, { value: stakeAmount });
    
  //   const initialPooledHSK = await staking.totalPooledHSK();
    
  //   // Fast forward time and mine blocks
  //   await mine(365 * 24 * 60 * 30); // Mine blocks for 1 year
  
  //   // Force reward pool update
  //   await staking.updateRewardPool();

  //   // Check rewards for different staking periods


  //   const totalPooledHSK = await staking.totalPooledHSK();
  //   const annualRewardsBudget = await staking.annualRewardsBudget();
    
  //   const stakeReward365 = await staking.getStakeReward(addr1.address, 0);
  //   console.log(`9999 hsk 365-day stake one year reward: ${ethers.formatEther(stakeReward365[1])} HSK`);
  //   await staking.connect(addr1).unstakeLocked(0);
  //   // Total pooled HSK should have increased
  //   // expect(await staking.totalPooledHSK()).to.be.gt(initialPooledHSK);
  // });
}); 
