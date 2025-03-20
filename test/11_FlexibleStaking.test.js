const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-network-helpers");
const { Console } = require("console");

describe("HashKeyChain Staking - Flexible Staking", function () {
  let staking, stHSK, owner, addr1, addr2;
  const minStakeAmount = ethers.parseEther("100");
  const FLEXIBLE = 4; // 假设 StakeType.FLEXIBLE 的枚举值为 4

  before(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署合约
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

    // 获取 stHSK 合约
    const stHSKAddress = await staking.stHSK();
    const StHSK = await ethers.getContractFactory("StHSK");
    stHSK = StHSK.attach(stHSKAddress);

    // 添加奖励
    await owner.sendTransaction({
      to: await staking.getAddress(),
      value: ethers.parseEther("10")
    });
  });

  describe("Flexible Staking", function () {
    it("Should reject flexible stake below minimum", async function () {
      await expect(
        staking.connect(addr1).stakeFlexible({ value: ethers.parseEther("50") })
      ).to.be.revertedWith("Amount below minimum stake");
    });

    it("Should accept valid flexible stake", async function () {
      const tx = await staking.connect(addr1).stakeFlexible({
        value: minStakeAmount
      });
      await tx.wait();

      expect(await staking.totalPooledHSK()).to.equal(minStakeAmount);
      const expectedStHSK = ethers.toBigInt(minStakeAmount) - 1000n; // 减去最小流动性 1000
      expect(await stHSK.balanceOf(addr1.address)).to.equal(expectedStHSK);
    });

    it("Should not allow unstake request before minWithdrawalRequestBlocks", async function () {
      const stakeId = 0; // 第一个质押
      await expect(
        staking.connect(addr1).requestUnstakeFlexible(stakeId)
      ).to.be.revertedWith("Too early to request withdrawal");
    });

    it("Should allow unstake request after minWithdrawalRequestBlocks", async function () {
      await mine(3); // 快进 3 个区块，超过 minWithdrawalRequestBlocks (2)

      const stakeId = 0;
      const tx = await staking.connect(addr1).requestUnstakeFlexible(stakeId);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log?.fragment?.name === "RequestUnstakeFlexible");
      expect(event).to.not.be.undefined;
    });

    it("Should not allow claim before claimableBlock", async function () {
      const withdrawalId = 0; // 第一个提款请求
      await expect(
        staking.connect(addr1).claimWithdrawal(withdrawalId)
      ).to.be.revertedWith("Too early to claim");
    });

    it("Should allow claim after claimableBlock", async function () {
      const withdrawalWaitingBlocks = await staking.withdrawalWaitingBlocks();
      await mine(Number(withdrawalWaitingBlocks) + 1); // 快进到超过等待区块数

      const withdrawalId = 0;
      const tx = await staking.connect(addr1).claimWithdrawal(withdrawalId);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log?.fragment?.name === "WithdrawalClaimed");
      expect(event).to.not.be.undefined;
    });

    it("Should correctly calculate rewards for flexible staking", async function () {
        await staking.connect(addr1).stakeFlexible({ value: ethers.parseEther("1000") });
        // addr2 进行质押
      const stakeAmount = ethers.parseEther("100");
      const tx = await staking.connect(addr2).stakeFlexible({ value: stakeAmount });
      await tx.wait();

      const stakeId = 0; // addr2 的第一个质押
      const sharesAmount = ethers.toBigInt(stakeAmount) - 1000n; // 减去最小流动性
      const days_365 = 365 * 24 * 60 * 30;
      await mine(days_365); // 快进 10 个区块以累积奖励

      // 计算当前价值
      const currentValue = await staking.getHSKForShares(sharesAmount);
      const originalStake = stakeAmount;
    //   const reward = currentValue - originalStake;
    //   console.log('currentValue', currentValue);
      console.log('originalStake', ethers.formatEther(originalStake.toString()));
    //   console.log('reward', reward);
      const reward = await staking.connect(addr2).requestUnstakeFlexible(stakeId);
      await reward.wait();
      const receipt = await reward.wait();
      const event = receipt.logs.find(log => log?.fragment?.name === "RequestUnstakeFlexible");
      expect(event).to.not.be.undefined;
      const hskToReturn = event.args[2];
      const claimableBlock = event.args[3];
      console.log('hskToReturn', ethers.formatEther(hskToReturn.toString()));
    //   console.log('claimableBlock', claimableBlock);

      const actualReward = hskToReturn - originalStake;
      console.log('actualReward', ethers.formatEther(actualReward.toString()));
      
    //   expect(reward).to.be.closeTo(expectedReward, ethers.parseEther("0.001")); // 允许小误差
    });

    it("Should handle multiple flexible stakes and withdrawals", async function () {
      // addr1 进行两次新的质押
      await staking.connect(addr1).stakeFlexible({ value: minStakeAmount }); // stakeId = 1
      await staking.connect(addr1).stakeFlexible({ value: minStakeAmount }); // stakeId = 2
      await mine(3); // 快进到可以请求提款

      // 请求两个质押的提款
      await staking.connect(addr1).requestUnstakeFlexible(1);
      await staking.connect(addr1).requestUnstakeFlexible(2);

      const withdrawalWaitingBlocks = await staking.withdrawalWaitingBlocks();
      await mine(Number(withdrawalWaitingBlocks) + 1); // 快进到可提取

      // 提取两个提款请求
      const balanceBefore = await ethers.provider.getBalance(addr1.address);
      await staking.connect(addr1).claimWithdrawal(1); // withdrawalId = 1
      await staking.connect(addr1).claimWithdrawal(2); // withdrawalId = 2
      const balanceAfter = await ethers.provider.getBalance(addr1.address);

      expect(balanceAfter).to.be.above(balanceBefore); // 余额应增加
    });

    it("Should handle admin update withdrawal waiting blocks", async function () {
      const newWithdrawalWaitingBlocks = 1209600;
    // 默认应该是 14天
      expect(await staking.withdrawalWaitingBlocks()).to.equal(14 * 24 * 60 * 30);
      // 更新为 28天
      await staking.updateWithdrawalWaitingBlocks(newWithdrawalWaitingBlocks);
      expect(await staking.withdrawalWaitingBlocks()).to.equal(newWithdrawalWaitingBlocks);
      expect(await staking.withdrawalWaitingBlocks()).to.equal(28 * 24 * 60 * 30);
    });
  });
});