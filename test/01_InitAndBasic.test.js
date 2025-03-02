const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");

describe("HashKeyChain Staking - Initialization & Basic", function () {
  let stakingContract, stHSK, owner, addr1, addr2;
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
    stakingContract = await upgrades.deployProxy(HashKeyChainStaking, [
      ethers.parseEther("0.01"), // hskPerBlock
      (await ethers.provider.getBlockNumber()) + 10, // startBlock
      ethers.parseEther("0.1"),  // maxHskPerBlock
      minStakeAmount,
      0 // Annual budget
    ]);
    
    await stakingContract.waitForDeployment();
    
    // Get stHSK contract
    const stHSKAddress = await stakingContract.stHSK();
    const StHSK = await ethers.getContractFactory("StHSK");
    stHSK = StHSK.attach(stHSKAddress);
    
    // Add rewards
    await owner.sendTransaction({
      to: await stakingContract.getAddress(),
      value: ethers.parseEther("10")
    });
  });

  describe("Initialization", function() {
    it("Should initialize with correct values", async function() {
      expect(await stakingContract.minStakeAmount()).to.equal(minStakeAmount);
      expect(await stHSK.totalSupply()).to.equal(0);
    });
    
    it("Should set correct bonuses", async function() {
      // Check bonus rates for different staking periods
      const bonus30Days = await stakingContract.stakingBonusRate(await stakingContract.FIXED_30_DAYS());
      const bonus90Days = await stakingContract.stakingBonusRate(await stakingContract.FIXED_90_DAYS());
      const bonus180Days = await stakingContract.stakingBonusRate(await stakingContract.FIXED_180_DAYS());
      const bonus365Days = await stakingContract.stakingBonusRate(await stakingContract.FIXED_365_DAYS());
      
      expect(bonus30Days).to.equal(0);    // 0% bonus
      expect(bonus90Days).to.equal(800);  // 8% bonus
      expect(bonus180Days).to.equal(2000); // 20% bonus
      expect(bonus365Days).to.equal(4000); // 40% bonus
    });
  });
  
  describe("Basic Staking", function() {
    it("Should reject stake below minimum", async function() {
      await expect(
        stakingContract.connect(addr1).stake({ value: ethers.parseEther("50") })
      ).to.be.revertedWith("Amount below minimum stake");
    });
    
    it("Should accept valid stake", async function() {
      const tx = await stakingContract.connect(addr1).stake({
        value: minStakeAmount
      });
      await tx.wait();
      
      expect(await stakingContract.totalPooledHSK()).to.equal(minStakeAmount);
      expect(await stHSK.balanceOf(addr1.address)).to.equal(minStakeAmount);
    });
  });
}); 