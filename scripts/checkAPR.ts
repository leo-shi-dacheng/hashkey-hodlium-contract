import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// 颜色输出函数
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m"
};

// 合约中的常量
const PRECISION_FACTOR = 1e18;
const BASIS_POINTS = 10000;
const MAX_APR_30_DAYS = 1000;   // 10%
const MAX_APR_90_DAYS = 1500;   // 15%
const MAX_APR_180_DAYS = 2000;  // 20%
const MAX_APR_365_DAYS = 3000;  // 30%
const BASE_BONUS_30_DAYS = 0;   // 0%
const BASE_BONUS_90_DAYS = 200; // 2%
const BASE_BONUS_180_DAYS = 500; // 5%
const BASE_BONUS_365_DAYS = 1000; // 10%

// 定义接口
interface LockPeriod {
  name: string;
  days: number;
  type: number;
  maxAPR: number;
  bonus: number;
}

interface Address {
  id: string;
  amount: number;
}

interface Stake {
  address: string;
  amount: number;
  lockType: number;
  round: number;
}

interface StakeResult {
  address: string;
  amount: number;
  lockType: number;
  lockPeriod: string;
  baseAPR: number;
  finalAPR: number;
  expectedReward: number;
  actualReward: number;
}

// 锁定期类型 (StakeType)
const lockPeriods: LockPeriod[] = [
  { name: "30天锁定", days: 30, type: 0, maxAPR: MAX_APR_30_DAYS, bonus: BASE_BONUS_30_DAYS },
  { name: "90天锁定", days: 90, type: 1, maxAPR: MAX_APR_90_DAYS, bonus: BASE_BONUS_90_DAYS },
  { name: "180天锁定", days: 180, type: 2, maxAPR: MAX_APR_180_DAYS, bonus: BASE_BONUS_180_DAYS },
  { name: "365天锁定", days: 365, type: 3, maxAPR: MAX_APR_365_DAYS, bonus: BASE_BONUS_365_DAYS }
];

/**
 * 字符串填充函数，确保表格对齐
 */
function padString(str: string, length: number): string {
  return str.padEnd(length);
}

/**
 * 计算每个质押者的APR和收益，但不显示理论APR超高值
 */
function calculateAPRAndRewards(stakes: Stake[], hskPerBlock: number, totalDays: number): StakeResult[] {
  const blocksPerYear = (365 * 24 * 3600) / 2; // 每年区块数（2秒一个块）
  const blocksPerDay = blocksPerYear / 365;
  const totalBlocks = blocksPerDay * totalDays;
  
  // 计算质押总量
  const totalStaked = stakes.reduce((sum, stake) => sum + stake.amount, 0);
  
  // 计算年度总奖励
  const yearlyRewards = hskPerBlock * blocksPerYear;
  
  // 初始化结果
  const results: StakeResult[] = [];
  
  // 计算每个质押者的奖励
  for (const stake of stakes) {
    // 计算用户份额
    const userShare = stake.amount / totalStaked;
    
    // 找到对应的锁定期
    const lockPeriod = lockPeriods.find(lp => lp.type === stake.lockType)!;
    
    // 根据锁定期直接计算最终APR（应用硬顶）
    const finalAPR = lockPeriod.maxAPR;
    
    // 计算实际天数收益
    const daysRatio = totalDays / 365;
    const expectedReward = (stake.amount * finalAPR * daysRatio) / BASIS_POINTS;
    
    // 计算实际区块收益（基于区块数）
    const actualRewardPerBlock = (stake.amount * finalAPR) / (BASIS_POINTS * blocksPerYear);
    const actualReward = actualRewardPerBlock * totalBlocks;
    
    results.push({
      address: stake.address,
      amount: stake.amount,
      lockType: stake.lockType,
      lockPeriod: lockPeriod.name,
      baseAPR: finalAPR / 100 - lockPeriod.bonus / 100, // 转为百分比
      finalAPR: finalAPR / 100, // 转为百分比
      expectedReward,
      actualReward
    });
  }
  
  return results;
}

async function main(): Promise<void> {
  console.log(`${colors.bright}HashKeyChain 质押收益稀释模拟器${colors.reset}\n`);
  
  // 模拟参数
  const totalAddresses = 50;
  const hskPerBlock = 0.475646879756468797;
  const simulationDays = 30;
  
  console.log(`${colors.yellow}模拟参数:${colors.reset}`);
  console.log(`- 每块奖励: ${hskPerBlock} HSK`);
  console.log(`- 总地址数: ${totalAddresses}`);
  console.log(`- 模拟天数: ${simulationDays}`);
  
  // 计算每年总奖励
  const blocksPerYear = (365 * 24 * 3600) / 2;
  const annualRewards = hskPerBlock * blocksPerYear;
  console.log(`- 年度奖励预算: ${annualRewards.toLocaleString()} HSK\n`);
  
  // 创建随机地址和质押金额
  const addresses: Address[] = [];
  for (let i = 0; i < totalAddresses; i++) {
    addresses.push({
      id: `地址${i+1}`,
      amount: Math.floor(Math.random() * 900) + 100 // 100-999之间的随机值
    });
  }
  
  // 初始化质押列表
  let stakes: Stake[] = [];
  let totalStaked = 0;
  
  // 模拟地址依次加入
  console.log(`${colors.bright}模拟开始:${colors.reset}`);
  
  // 格式化表头
  console.log("┌──────────┬─────────────┬────────────┬────────────┬────────────┬────────────┬──────────────┐");
  console.log("│ 地址     │ 质押金额    │ 锁定期     │ 基础APR    │ 最终APR    │ 收益率     │ 预期收益     │");
  console.log("├──────────┼─────────────┼────────────┼────────────┼────────────┼────────────┼──────────────┤");
  
  // 主要模拟循环
  for (let round = 0; round < totalAddresses; round++) {
    // 获取当前地址
    const currentAddr = addresses[round];
    
    // 随机选择锁定期类型（0-3）
    const lockType = Math.floor(Math.random() * 4);
    
    // 添加到质押列表
    stakes.push({
      address: currentAddr.id,
      amount: currentAddr.amount,
      lockType,
      round: round + 1
    });
    
    totalStaked += currentAddr.amount;
    
    // 计算当前所有质押的APR和奖励
    const results = calculateAPRAndRewards(stakes, hskPerBlock, simulationDays);
    
    // 如果是第10、25、40轮或最后一轮，打印详细信息
    const isPrintRound = round === 9 || round === 24 || round === 39 || round === totalAddresses - 1;
    
    // 如果是详细打印轮，打印所有地址
    if (isPrintRound) {
      console.log(`\n${colors.cyan}第${round + 1}轮 - ${currentAddr.id}加入后${colors.reset}`);
      console.log(`总质押量: ${totalStaked.toFixed(2)} HSK\n`);
      
      // 打印表格内容
      for (const result of results) {
        // 计算收益率 = 预期收益/质押金额
        const yieldRate = (result.expectedReward * 100 / result.amount).toFixed(2);
        
        console.log(
          `│ ${padString(result.address, 8)} │ ` +
          `${padString(result.amount.toFixed(2), 11)} │ ` +
          `${padString(result.lockPeriod, 10)} │ ` +
          `${padString(result.baseAPR.toFixed(2) + "%", 10)} │ ` +
          `${padString(result.finalAPR.toFixed(2) + "%", 10)} │ ` +
          `${padString(yieldRate + "%", 10)} │ ` +
          `${padString(result.expectedReward.toFixed(4), 12)} │`
        );
      }
      
      console.log("└──────────┴─────────────┴────────────┴────────────┴────────────┴────────────┴──────────────┘");
      
      // 计算平均APR
      const avgFinalAPR = results.reduce((sum, r) => sum + r.finalAPR, 0) / results.length;
      const highestAPR = Math.max(...results.map(r => r.finalAPR));
      const lowestAPR = Math.min(...results.map(r => r.finalAPR));
      
      console.log(`\n${colors.yellow}统计信息:${colors.reset}`);
      console.log(`- 平均APR: ${avgFinalAPR.toFixed(2)}%`);
      console.log(`- 最高APR: ${highestAPR.toFixed(2)}%`);
      console.log(`- 最低APR: ${lowestAPR.toFixed(2)}%`);
      
      // 评估收益稀释情况
      if (round > 0) {
        // 计算第一个地址的APR变化
        const firstAddrCurrentAPR = results.find(r => r.address === "地址1")!.finalAPR;
        const dilutionPercent = round > 0 ? ((MAX_APR_365_DAYS/100 - firstAddrCurrentAPR) * 100 / (MAX_APR_365_DAYS/100)).toFixed(2) : "0.00";
        
        console.log(`\n${colors.magenta}收益稀释分析:${colors.reset}`);
        console.log(`- 地址1的APR: ${firstAddrCurrentAPR.toFixed(2)}% (相比最高值稀释了${dilutionPercent}%)`);
        
        if (firstAddrCurrentAPR < MAX_APR_30_DAYS/100) {
          console.log(`- ${colors.red}警告: 最早质押者的APR已低于30天锁定期的最高APR (${MAX_APR_30_DAYS/100}%)${colors.reset}`);
        }
      }
      
      console.log("\n" + "=".repeat(80) + "\n");
    }
    // 如果不是详细打印轮，但是前10轮，每轮打印简要信息
    else if (round < 10) {
      console.log(`第${round + 1}轮 - ${currentAddr.id}加入, 质押: ${currentAddr.amount} HSK, 总质押量: ${totalStaked.toFixed(2)} HSK`);
    }
    // 否则只打印一个点表示进度
    else {
      process.stdout.write(".");
      if ((round + 1) % 10 === 0) process.stdout.write(" ");
    }
  }
  
  // 模拟完成
  console.log(`\n\n${colors.green}模拟完成!${colors.reset}`);
  console.log(`最终总质押量: ${totalStaked.toFixed(2)} HSK`);
  
  // 计算理论上的基础APR（未应用上限）
  const yearlyRewards = hskPerBlock * blocksPerYear;
  // 显示为百分比，但限制为合理值
  console.log(`\n${colors.yellow}收益分析:${colors.reset}`);
  console.log(`- 年度奖励预算: ${yearlyRewards.toLocaleString()} HSK`);
  console.log(`- 当前总质押量: ${totalStaked.toFixed(2)} HSK`);
  
  const requiredStake = (yearlyRewards * 100) / (MAX_APR_30_DAYS/100);
  console.log(`- 要使基础APR自然降至${MAX_APR_30_DAYS/100}%而不受硬顶限制，总质押量需达到约${requiredStake.toLocaleString()} HSK`);
  
  // 添加特定的质押时间线分析
  console.log(`\n${colors.cyan}质押时间线分析:${colors.reset}`);
  console.log("以下是模拟一年内质押者可能的收益情况：");
  
  // 计算不同时期的收益
  const timePoints = [30, 90, 180, 365];
  for (const timePoint of timePoints) {
    const finalResults = calculateAPRAndRewards(stakes, hskPerBlock, timePoint);
    
    // 计算总收益和平均收益
    const totalRewards = finalResults.reduce((sum, r) => sum + r.expectedReward, 0);
    const avgRewardPercent = (totalRewards * 100 / totalStaked).toFixed(2);
    
    console.log(`\n${timePoint}天后:`);
    console.log(`- 总发放奖励: ${totalRewards.toFixed(2)} HSK`);
    console.log(`- 平均收益率: ${avgRewardPercent}%`);
    
    // 计算不同锁定期类型的平均APR
    for (const lockPeriod of lockPeriods) {
      const typeResults = finalResults.filter(r => r.lockType === lockPeriod.type);
      if (typeResults.length > 0) {
        const avgTypeAPR = typeResults.reduce((sum, r) => sum + r.finalAPR, 0) / typeResults.length;
        console.log(`- ${lockPeriod.name} 平均APR: ${avgTypeAPR.toFixed(2)}%`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});