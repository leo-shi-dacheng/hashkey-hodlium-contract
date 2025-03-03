const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");

describe("HashKeyChain Staking - Emergency Functions", function () {
  let staking, stHSK, owner, addr1;
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

  it("Should allow emergency withdrawal", async function() {
    const stakeAmount = ethers.parseEther("200");
    
    await staking.connect(addr1).stake({ value: stakeAmount });
    
    const balanceBefore = await ethers.provider.getBalance(addr1.address);
    
    // Emergency withdraw
    const tx = await staking.connect(addr1).emergencyWithdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    
    const balanceAfter = await ethers.provider.getBalance(addr1.address);
    
    // Should get back original stake
    expect(balanceAfter - balanceBefore + gasUsed).to.be.closeTo(
      stakeAmount, 
      ethers.parseEther("0.01")
    );
  });
  
  it("Should not allow recovery of stHSK token", async function() {
    await expect(
      staking.connect(owner).recoverToken(await stHSK.getAddress(), 1)
    ).to.be.revertedWith("Cannot recover staked token");
  });
}); 