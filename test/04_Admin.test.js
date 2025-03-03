const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");

describe("HashKeyChain Staking - Admin Functions", function () {
  let staking, owner, addr1;
  const minStakeAmount = ethers.parseEther("100");
  
  before(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    // Deploy contract
    const HashKeyChainStaking = await ethers.getContractFactory("HashKeyChainStaking");
    staking = await upgrades.deployProxy(HashKeyChainStaking, [
      ethers.parseEther("0.01"),
      (await ethers.provider.getBlockNumber()) + 10,
      ethers.parseEther("0.1"),
      minStakeAmount,
      ethers.parseEther("1000"),
      2
    ]);
    
    await staking.waitForDeployment();
  });

  it("Should allow updating HSK per block", async function() {
    const newHskPerBlock = ethers.parseEther("0.02");
    
    await staking.connect(owner).updateHskPerBlock(newHskPerBlock);
    
    expect(await staking.hskPerBlock()).to.equal(newHskPerBlock);
  });
  
  it("Should allow updating minimum stake amount", async function() {
    const newMinStakeAmount = ethers.parseEther("150");
    
    await staking.connect(owner).updateMinStakeAmount(newMinStakeAmount);
    
    expect(await staking.minStakeAmount()).to.equal(newMinStakeAmount);
  });
  
  it("Should allow pausing and unpausing", async function() {
    // Pause contract
    await staking.connect(owner).pause();
    
    // Try to stake (should fail)
    await expect(
      staking.connect(addr1).stake({ value: ethers.parseEther("200") })
    ).to.be.revertedWithCustomError(staking, "EnforcedPause");
    
    // Unpause contract
    await staking.connect(owner).unpause();
  });
}); 