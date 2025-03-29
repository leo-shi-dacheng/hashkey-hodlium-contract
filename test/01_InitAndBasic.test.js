const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");

describe("HashKeyChain Staking - Initialization & Basic", function () {
  let staking, stHSK, owner, addr1, addr2;
  const minStakeAmount = ethers.parseEther("100");
  
  // Stake types
  const FIXED_30_DAYS = 0;
  const FIXED_90_DAYS = 1;
  const FIXED_180_DAYS = 2;
  const FIXED_365_DAYS = 3;
  
  before(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy contract
    const HashKeyChainStaking = await ethers.getContractFactory("HashKeyChainStaking");
    staking = await upgrades.deployProxy(HashKeyChainStaking, [
      ethers.parseEther("0.01"), // hskPerBlock
      (await ethers.provider.getBlockNumber()) + 10, // startBlock
      ethers.parseEther("0.1"),  // maxHskPerBlock
      minStakeAmount,
      ethers.parseEther("1000"), // annualBudget
      2 // blockTime
    ]);
    
    await staking.waitForDeployment();
    
    // Get stHSK contract
    const stHSKAddress = await staking.stHSK();
    const StHSK = await ethers.getContractFactory("StHSK");
    stHSK = StHSK.attach(stHSKAddress);
    
    // Add rewards
    await owner.sendTransaction({
      to: await staking.getAddress(),
      value: ethers.parseEther("10")
    });
  });

  describe("Initialization", function() {
    it("Should initialize with correct values", async function() {
      expect(await staking.minStakeAmount()).to.equal(minStakeAmount);
      expect(await stHSK.totalSupply()).to.equal(0);
    });
    
    it("Should set correct bonuses", async function() {
      expect(await staking.stakingBonus(FIXED_30_DAYS)).to.equal(0);
      expect(await staking.stakingBonus(FIXED_90_DAYS)).to.equal(80);
      expect(await staking.stakingBonus(FIXED_180_DAYS)).to.equal(200);
      expect(await staking.stakingBonus(FIXED_365_DAYS)).to.equal(400);
    });
  });
  
  describe("Basic Staking", function() {
    it("Should reject stake below minimum", async function() {
      await expect(
        staking.connect(addr1).stakeLocked(FIXED_90_DAYS, { value: ethers.parseEther("50") })
      ).to.be.revertedWith("Amount below minimum stake");
    });
    
    it("Should accept valid stake", async function() {
      const tx = await staking.connect(addr1).stakeLocked(FIXED_90_DAYS, {
        value: minStakeAmount
      });
      await tx.wait();
      
      expect(await staking.totalPooledHSK()).to.equal(minStakeAmount);
      const expectedStHSK = ethers.toBigInt(minStakeAmount) - 1000n;  // 减去最小流动性 1000
      expect(await stHSK.balanceOf(addr1.address)).to.equal(expectedStHSK);
    });
  });
}); 