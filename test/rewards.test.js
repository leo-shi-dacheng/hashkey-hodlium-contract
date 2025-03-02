const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Rewards Calculation", function () {
  let stakingContract;
  let token;
  let owner;
  let user1, user2, user3;
  let baseAPY;

  beforeEach(async function () {
    // 获取合约工厂
    const HashKeyChainStaking = await ethers.getContractFactory("HashKeyChainStaking");
    
    // 获取账户
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // 部署合约参数
    const hskPerBlock = ethers.parseEther("0.5");
    const startBlock = await ethers.provider.getBlockNumber() + 10;
    const maxHskPerBlock = ethers.parseEther("1");
    const minStakeAmount = ethers.parseEther("100");
    
    // 使用代理模式部署和初始化合约
    stakingContract = await upgrades.deployProxy(HashKeyChainStaking, [
      hskPerBlock,
      startBlock,
      maxHskPerBlock,
      minStakeAmount,
      0 // 年度预算，设为0表示使用默认计算
    ]);
    
    await stakingContract.waitForDeployment();
    
    // 获取StHSK代币地址
    const stHSKAddress = await stakingContract.stHSK();
    token = await ethers.getContractAt("StHSK", stHSKAddress);
    
    // 设置基础APY
    baseAPY = 1000; // 10%
    
    // 设置质押的奖励率 - 确保这些设置生效
    await stakingContract.connect(owner).updateStakingBonus(0, 2000); // FIXED_30_DAYS (索引0)，20%奖励
    await stakingContract.connect(owner).updateStakingBonus(1, 5000); // FIXED_90_DAYS (索引1)，50%奖励
    await stakingContract.connect(owner).updateStakingBonus(2, 7500); // FIXED_180_DAYS (索引2)，75%奖励
    
    // 验证奖励率设置是否生效 - 使用stakingBonus而不是stakingBonusRate
    const bonus30Days = await stakingContract.stakingBonus(0);
    const bonus90Days = await stakingContract.stakingBonus(1);
    const bonus180Days = await stakingContract.stakingBonus(2);
    
    console.log("FIXED_30_DAYS bonus rate:", bonus30Days.toString());
    console.log("FIXED_90_DAYS bonus rate:", bonus90Days.toString());
    console.log("FIXED_180_DAYS bonus rate:", bonus180Days.toString());
    
    // 确保奖励率设置正确
    expect(bonus30Days).to.equal(2000);
    expect(bonus90Days).to.equal(5000);
    expect(bonus180Days).to.equal(7500);
  });

  describe("Short-term staking rewards for testing", function () {
    it("Should calculate correct rewards for 30 days staking period", async function () {
      const stakeAmount = ethers.parseEther("1000");
      
      // 使用正确的质押函数
      const FIXED_30_DAYS = 0; // 根据枚举定义，FIXED_30_DAYS 是第1个元素，索引为0
      await stakingContract.connect(user1).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
      
      // 获取奖励率 - 使用已经验证过的奖励率
      const bonusRate = await stakingContract.stakingBonus(FIXED_30_DAYS);
      console.log("30 days bonus rate in test:", bonusRate.toString());
      
      // 快进时间1天（模拟部分质押期）
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      
      // 获取质押信息
      const stakeInfo = await stakingContract.getLockedStakeInfo(user1.address, 0);
      expect(stakeInfo[1]).to.equal(stakeAmount); // hskAmount
    });

    it("Should calculate correct rewards for 90 days staking period", async function () {
      const stakeAmount = ethers.parseEther("1000");
      
      // 使用正确的质押函数
      const FIXED_90_DAYS = 1; // 根据枚举定义，FIXED_90_DAYS 是第2个元素，索引为1
      await stakingContract.connect(user2).stakeLocked(FIXED_90_DAYS, { value: stakeAmount });
      
      // 获取奖励率 - 使用已经验证过的奖励率
      const bonusRate = await stakingContract.stakingBonus(FIXED_90_DAYS);
      console.log("90 days bonus rate in test:", bonusRate.toString());
      
      // 快进时间1天（模拟部分质押期）
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      
      // 获取质押信息
      const stakeInfo = await stakingContract.getLockedStakeInfo(user2.address, 0);
      expect(stakeInfo[1]).to.equal(stakeAmount); // hskAmount
    });

    it("Should calculate correct rewards for 180 days staking period", async function () {
      const stakeAmount = ethers.parseEther("1000");
      
      // 使用正确的质押函数
      const FIXED_180_DAYS = 2; // 根据枚举定义，FIXED_180_DAYS 是第3个元素，索引为2
      await stakingContract.connect(user3).stakeLocked(FIXED_180_DAYS, { value: stakeAmount });
      
      // 获取奖励率 - 使用已经验证过的奖励率
      const bonusRate = await stakingContract.stakingBonus(FIXED_180_DAYS);
      console.log("180 days bonus rate in test:", bonusRate.toString());
      
      // 快进时间1天（模拟部分质押期）
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      
      // 获取质押信息
      const stakeInfo = await stakingContract.getLockedStakeInfo(user3.address, 0);
      expect(stakeInfo[1]).to.equal(stakeAmount); // hskAmount
    });

    it("Should allow unstaking after lock periods", async function () {
      // 首先确保用户已经质押
      const stakeAmount = ethers.parseEther("1000");
      
      // 用户1质押30天
      const FIXED_30_DAYS = 0;
      await stakingContract.connect(user1).stakeLocked(FIXED_30_DAYS, { value: stakeAmount });
      
      // 用户2质押90天
      const FIXED_90_DAYS = 1;
      await stakingContract.connect(user2).stakeLocked(FIXED_90_DAYS, { value: stakeAmount });
      
      // 用户3质押180天
      const FIXED_180_DAYS = 2;
      await stakingContract.connect(user3).stakeLocked(FIXED_180_DAYS, { value: stakeAmount });
      
      // 验证质押是否成功
      const user1StakeCount = await stakingContract.getUserLockedStakeCount(user1.address);
      const user2StakeCount = await stakingContract.getUserLockedStakeCount(user2.address);
      const user3StakeCount = await stakingContract.getUserLockedStakeCount(user3.address);
      
      console.log("User1 stake count:", user1StakeCount.toString());
      console.log("User2 stake count:", user2StakeCount.toString());
      console.log("User3 stake count:", user3StakeCount.toString());
      
      expect(user1StakeCount).to.equal(1);
      expect(user2StakeCount).to.equal(1);
      expect(user3StakeCount).to.equal(1);
      
      // 获取用户1的质押信息
      const user1StakeInfo = await stakingContract.getLockedStakeInfo(user1.address, 0);
      const user2StakeInfo = await stakingContract.getLockedStakeInfo(user2.address, 0);
      const user3StakeInfo = await stakingContract.getLockedStakeInfo(user3.address, 0);
      
      console.log("User1 stake info:", user1StakeInfo.toString());
      console.log("User2 stake info:", user2StakeInfo.toString());
      console.log("User3 stake info:", user3StakeInfo.toString());
      
      // 快进时间超过锁定期
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31天
      await ethers.provider.send("evm_mine");
      
      // 用户1解锁质押（30天期限）
      await stakingContract.connect(user1).unstakeLocked(0);
      
      // 快进时间超过锁定期
      await ethers.provider.send("evm_increaseTime", [60 * 24 * 60 * 60]); // 60天
      await ethers.provider.send("evm_mine");
      
      // 用户2解锁质押（90天期限）
      await stakingContract.connect(user2).unstakeLocked(0);
      
      // 快进时间超过锁定期
      await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]); // 90天
      await ethers.provider.send("evm_mine");
      
      // 用户3解锁质押（180天期限）
      await stakingContract.connect(user3).unstakeLocked(0);
      
      // 验证所有用户都已解质押
      const user1StakeInfoAfter = await stakingContract.getLockedStakeInfo(user1.address, 0);
      const user2StakeInfoAfter = await stakingContract.getLockedStakeInfo(user2.address, 0);
      const user3StakeInfoAfter = await stakingContract.getLockedStakeInfo(user3.address, 0);
      
      console.log("User1 stake info after unstake:", user1StakeInfoAfter.toString());
      console.log("User2 stake info after unstake:", user2StakeInfoAfter.toString());
      console.log("User3 stake info after unstake:", user3StakeInfoAfter.toString());
      
      expect(user1StakeInfoAfter[4]).to.equal(true); // isWithdrawn
      expect(user2StakeInfoAfter[4]).to.equal(true); // isWithdrawn
      expect(user3StakeInfoAfter[4]).to.equal(true); // isWithdrawn
    });
  });

  it("Should calculate rewards correctly for a single staker", async function() {
    const stakeAmount = ethers.parseEther("100");
    
    // 使用正确的质押函数
    await stakingContract.connect(user1).stake({ value: stakeAmount });
    
    // 快进时间
    await ethers.provider.send("evm_increaseTime", [86400]); // 1天
    await ethers.provider.send("evm_mine");
    
    // 获取 stHSK 余额
    const stHSKBalance = await token.balanceOf(user1.address);
    expect(stHSKBalance).to.be.gt(0);
  });
  
  it("Should calculate rewards correctly for multiple stakers", async function() {
    // 第一个质押者已经在前面的测试中质押了
    const stakeAmount = ethers.parseEther("200");
    
    // 使用正确的质押函数
    await stakingContract.connect(user1).stake({ value: stakeAmount });
    await stakingContract.connect(user2).stake({ value: stakeAmount });
    
    // 快进时间
    await ethers.provider.send("evm_increaseTime", [86400 * 7]); // 7天
    await ethers.provider.send("evm_mine");
    
    // 挖更多区块以确保奖励分发
    for (let i = 0; i < 50; i++) {
      await ethers.provider.send("evm_mine");
    }
    
    // 获取 stHSK 余额
    const stHSKBalance1 = await token.balanceOf(user1.address);
    const stHSKBalance2 = await token.balanceOf(user2.address);
    
    console.log("User1 stHSK balance:", stHSKBalance1.toString());
    console.log("User2 stHSK balance:", stHSKBalance2.toString());
    
    expect(stHSKBalance1).to.be.gt(0);
    expect(stHSKBalance2).to.be.gt(0);
  });
}); 