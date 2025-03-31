const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("HashKeyChain Staking - Emergency Functions", function () {
  let staking, stHSK, owner, addr1, addr2, addr3;
  const minStakeAmount = ethers.parseEther("100");
  // Stake types
  const FIXED_30_DAYS = 0;
  const FIXED_90_DAYS = 1;
  const FIXED_180_DAYS = 2;
  const FIXED_365_DAYS = 3;

  before(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
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

  describe("emergencyWithdraw", function() {
    it("Should allow emergency withdrawal for single stake", async function() {
      const stakeAmount = ethers.parseEther("200");
      
      await staking.connect(addr1).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
      
      const balanceBefore = await ethers.provider.getBalance(addr1.address);

      const mineBlockNum = 3 * 24 * 60 * 30;
      await mine(mineBlockNum);

      // Get penalty rate
      const penaltyRate = await staking.earlyWithdrawalPenalty(FIXED_30_DAYS);
      const expectedPenalty = (stakeAmount * BigInt(penaltyRate)) / BigInt(10000); // Convert basis points to actual amount
      const expectedReturn = stakeAmount - expectedPenalty;

      // Emergency withdraw
      const tx = await staking.connect(addr1).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(addr1.address);

      expect(balanceAfter - balanceBefore + gasUsed).to.be.closeTo(
        expectedReturn, 
        ethers.parseEther("1")
      );
    });

    it("Should allow emergency withdrawal for multiple stakes", async function() {
      const stakeAmount1 = ethers.parseEther("200");
      const stakeAmount2 = ethers.parseEther("300");
      
      await staking.connect(addr2).stakeLocked(FIXED_30_DAYS, { value: stakeAmount1 });
      await staking.connect(addr2).stakeLocked(FIXED_90_DAYS, { value: stakeAmount2 });
      
      const balanceBefore = await ethers.provider.getBalance(addr2.address);
      
      await mine(30);
      
      // Get penalty rates
      const penaltyRate1 = await staking.earlyWithdrawalPenalty(FIXED_30_DAYS);
      const penaltyRate2 = await staking.earlyWithdrawalPenalty(FIXED_90_DAYS);
      
      const expectedPenalty1 = (stakeAmount1 * BigInt(penaltyRate1)) / BigInt(10000);
      const expectedPenalty2 = (stakeAmount2 * BigInt(penaltyRate2)) / BigInt(10000);
      const expectedReturn = (stakeAmount1 + stakeAmount2) - (expectedPenalty1 + expectedPenalty2);
      
      // Emergency withdraw
      const tx = await staking.connect(addr2).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(addr2.address);
      
      expect(balanceAfter - balanceBefore + gasUsed).to.be.closeTo(
        expectedReturn, 
        ethers.parseEther("1")
      );
    });

    it("Should not allow emergency withdrawal with zero balance", async function() {
      // 确保用户没有质押
      const stHSKBalance = await stHSK.balanceOf(addr1.address);
      if (stHSKBalance > 0) {
        await mine(30);
        await staking.connect(addr1).emergencyWithdraw();
      }
      
      await expect(
        staking.connect(addr1).emergencyWithdraw()
      ).to.be.revertedWith("Nothing to withdraw");
    });

    it("Should mark all locked stakes as withdrawn after emergency withdrawal", async function() {
      const stakeAmount = ethers.parseEther("200");
      await staking.connect(addr1).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });

      const mineBlockNum = 3 * 24 * 60 * 30;
      await mine(mineBlockNum);
      await mine(30);

      await staking.connect(addr1).emergencyWithdraw();

      const userStakes = await staking.getLockedStakeInfo(addr1.address, 0);
      const withdrawn = userStakes[4];
      expect(withdrawn).to.be.true;
    });

    it("Should allow withdrawal during lock period", async function() {
      const stakeAmount = ethers.parseEther("200");
      await staking.connect(addr3).stakeLocked(FIXED_365_DAYS, { value: stakeAmount });
      
      const balanceBefore = await ethers.provider.getBalance(addr3.address);

      const mineBlockNum = 20;
      await mine(mineBlockNum);
      await mine(30);

      // Get penalty rate
      const penaltyRate = await staking.earlyWithdrawalPenalty(FIXED_365_DAYS);
      const expectedPenalty = (stakeAmount * BigInt(penaltyRate)) / BigInt(10000);
      const expectedReturn = stakeAmount - expectedPenalty;

      const tx = await staking.connect(addr3).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(addr3.address);

      expect(balanceAfter - balanceBefore + gasUsed).to.be.closeTo(
        expectedReturn,
        ethers.parseEther("1")
      );
    });
  });

  describe("emergencyWithdrawHSK", function() {
    it("Should allow owner to withdraw reserved rewards", async function() {
      const withdrawAmount = ethers.parseEther("5");
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      const tx = await staking.connect(owner).emergencyWithdrawHSK(withdrawAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(ownerBalanceAfter - ownerBalanceBefore + gasUsed).to.be.closeTo(
        withdrawAmount,
        ethers.parseEther("0.01")
      );
    });
    it("Should not allow withdrawal of staked HSK", async function() {
      const stakeAmount = ethers.parseEther("200");
      await staking.connect(addr1).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
      
      const totalPooledHSK = await staking.totalPooledHSK();
      const contractBalance = await ethers.provider.getBalance(await staking.getAddress());
      const withdrawAmount = contractBalance - totalPooledHSK + ethers.parseEther("1");
      
      await expect(
        staking.connect(owner).emergencyWithdrawHSK(withdrawAmount)
      ).to.be.revertedWith("Cannot withdraw staked HSK");
    });
    it("Should not allow non-owner to withdraw HSK", async function() {
      await expect(
        staking.connect(addr1).emergencyWithdrawHSK(ethers.parseEther("1"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
  
  it("Should not allow recovery of stHSK token", async function() {
    await expect(
      staking.connect(owner).recoverToken(await stHSK.getAddress(), 1)
    ).to.be.revertedWith("Cannot recover staked token");
  });

  describe("emergencyWithdraw additional tests", function() {
    it("Should burn stHSK tokens after emergency withdrawal", async function() {
      const stakeAmount = ethers.parseEther("200");
      await staking.connect(addr1).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
      
      const stHSKBalanceBefore = await stHSK.balanceOf(addr1.address);
      const mineBlockNum = 20;
      await mine(mineBlockNum);
      await mine(30);

      await staking.connect(addr1).emergencyWithdraw();
      const stHSKBalanceAfter = await stHSK.balanceOf(addr1.address);
      
      expect(stHSKBalanceAfter).to.be.equal(0);
      expect(stHSKBalanceBefore).to.be.gt(0);
    });
  });

  describe("emergencyWithdrawHSK additional tests", function() {
    it("Should not allow withdrawal more than contract balance", async function() {
      const contractBalance = await ethers.provider.getBalance(await staking.getAddress());
      const excessiveAmount = contractBalance + ethers.parseEther("1");
      
      await expect(
        staking.connect(owner).emergencyWithdrawHSK(excessiveAmount)
      ).to.be.revertedWith("Cannot withdraw staked HSK");
    });

    it("Should correctly update contract balance after withdrawal", async function() {
      const withdrawAmount = ethers.parseEther("1");
      const contractBalanceBefore = await ethers.provider.getBalance(await staking.getAddress());
      
      await staking.connect(owner).emergencyWithdrawHSK(withdrawAmount);
      
      const contractBalanceAfter = await ethers.provider.getBalance(await staking.getAddress());
      expect(contractBalanceAfter).to.equal(contractBalanceBefore - withdrawAmount);
    });

    it("Should not affect user staked amounts", async function() {
      const stakeAmount = ethers.parseEther("200");
      await staking.connect(addr1).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
      const contractBalance = await ethers.provider.getBalance(await staking.getAddress());
      const totalPooledHSK = await staking.totalPooledHSK();


      const mineBlockNum = 20;
      await mine(mineBlockNum);
      
      const userStakeBefore = await staking.getLockedStakeInfo(addr1.address, 0);
      //  这里因为 sharesAmount 的原因 有很小的误差
      // 210000000000000000000 address(this).balance
      // 200000057077625570776 totalPooledHSK
      await staking.connect(owner).emergencyWithdrawHSK(contractBalance - totalPooledHSK - ethers.parseEther("1"));
      const userStakeAfter = await staking.getLockedStakeInfo(addr1.address, 0);
      
      expect(userStakeAfter[1]).to.equal(userStakeBefore[1]);
    });
  });
}); 