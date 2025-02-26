const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");

describe("Basic Staking Tests", function () {
  let staking, stHSK, owner, addr1;
  const minStakeAmount = ethers.parseEther("100");
  
  before(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    // Get current block number
    const blockNumber = await ethers.provider.getBlockNumber();
    const startBlock = blockNumber + 10;
    
    // Deploy contract
    const HashKeyChainStaking = await ethers.getContractFactory("HashKeyChainStaking");
    staking = await upgrades.deployProxy(HashKeyChainStaking, [
      ethers.parseEther("0.01"), // hskPerBlock
      startBlock,
      ethers.parseEther("0.1"),  // maxHskPerBlock
      minStakeAmount,
      0 // Annual budget
    ]);
    
    await staking.waitForDeployment();
    
    // Get stHSK contract
    const stHSKAddress = await staking.stHSK();
    const StHSK = await ethers.getContractFactory("StHSK");
    stHSK = StHSK.attach(stHSKAddress);
    
    // Add small amount of rewards
    await owner.sendTransaction({
      to: await staking.getAddress(),
      value: ethers.parseEther("5")
    });
  });

  it("Should initialize correctly", async function () {
    expect(await staking.minStakeAmount()).to.equal(minStakeAmount);
    expect(await stHSK.totalSupply()).to.equal(0);
  });
  
  it("Should reject stake below minimum", async function () {
    await expect(
      addr1.sendTransaction({
        to: await staking.getAddress(),
        value: ethers.parseEther("50"),
        data: staking.interface.encodeFunctionData("stake", [])
      })
    ).to.be.revertedWith("Amount below minimum stake");
  });
  
  it("Should accept valid stake", async function () {
    // Use low-level call directly
    const stakeTx = await addr1.sendTransaction({
      to: await staking.getAddress(),
      value: minStakeAmount,
      data: staking.interface.encodeFunctionData("stake", [])
    });
    await stakeTx.wait();
    
    // Verify results
    expect(await staking.totalPooledHSK()).to.equal(minStakeAmount);
    expect(await stHSK.balanceOf(addr1.address)).to.equal(minStakeAmount);
  });
}); 