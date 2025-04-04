# 合约修改影响评估

## 主要修改内容

1. 添加了 `MINIMUM_SHARES_THRESHOLD` 常量
   - 值设置为 1e16
   - 目的是防止在低流动性情况下出现异常的汇率计算
   - 当 `totalPooledHSK` 小于此阈值时，使用 1:1 汇率
   - 解决了全部 unstakeLocked 后再 stake 时报错的问题

2. 添加了 `totalPaidRewards` 变量
   - 用于跟踪已支付给用户的奖励总量
   - 在初始化时设置为0，只记录升级后支付的奖励
   - 在 `updateRewardPool` 函数中更新此变量
   - 提供了更准确的奖励分配记录

3. 修改了 `getSharesForHSK` 函数
   - 增加了对  `totalPooledHSK` 低于 `MINIMUM_SHARES_THRESHOLD` 的检查
   - 在低于阈值时使用1:1的汇率，提高了系统稳定性

4. 修改了 `updateRewardPool` 函数
   - 增加了对 `totalPaidRewards` 的更新逻辑
   - 当分发奖励时，增加 `totalPaidRewards`

5. 修改了 `unstakeLocked` 函数
   - 增加了对奖励部分的处理逻辑
   - 从 `totalPaidRewards` 中减去已支付的奖励部分

6. 添加了 `getStakeReward` 函数
   - 用于查询特定质押的奖励信息
   - 返回原始质押金额、累积奖励、实际奖励和总价值

7. 更新了 `getRewardStatus` 函数
   - 增加了返回 `totalPaidRewards` 的功能

## 对历史数据的影响

1. **不会影响现有质押的本金**
   - 所有修改都保留了用户的原始质押金额和份额

2. **不会影响现有质押的锁定期**
   - 锁定期的计算逻辑没有变化

3. **不会影响现有质押的提取逻辑**
   - 提取逻辑的基本流程保持不变，只是增加了对奖励部分的更精确处理

4. **对汇率计算的影响**
   - `MINIMUM_SHARES_THRESHOLD` 的引入只会在极低流动性情况下影响汇率计算
   - 对于正常运行的系统，不会有显著影响

5. **对奖励计算的影响**
   - `totalPaidRewards` 变量从0开始累计，只记录升级后支付的奖励
   - 不会影响历史奖励的计算，只是提供了更好的奖励跟踪机制

## 升级安全性评估

1. **存储布局兼容性**
   - 新增的 `totalPaidRewards` 变量被添加到合约的末尾，不会与现有变量的存储槽发生冲突
   - `MINIMUM_SHARES_THRESHOLD` 是常量，不占用存储槽，不会影响存储布局
   - 不会导致现有数据的覆盖或损坏

2. **功能向后兼容性**
   - 所有现有功能保持不变，只是增加了新的功能和安全措施
   - 用户可以继续使用所有现有功能，包括质押、解锁和提取

3. **边缘情况处理**
   - 新代码增加了对低流动性情况的处理，提高了系统的稳定性
   - 对于奖励部分的处理更加精确，防止了可能的计算错误

## 升级脚本

创建了新的脚本：

`scripts/upgrade.ts` - 用于升级合约
   - 部署新的实现合约
   - 将代理合约指向新的实现合约
   - 验证升级是否成功
   - 记录升级前后的关键状态数据，确保数据一致性

## 测试

添加了新的测试用例 `测试全部unstakeLocked后再stake的情况`，验证修复是否有效：

1. 用户进行多次质押
2. 等待锁定期结束
3. 解锁所有质押
4. 再次进行质押
5. 验证新质押的误差在5%以内
6. 等待锁定期结束
7. 解锁所有新质押
8. 验证所有质押都已解锁

测试结果表明，修复有效，用户可以在全部 unstakeLocked 后再次 stake 而不会报错。

## 结论

这些修改是安全的，不会对历史质押数据产生负面影响。主要变化是增加了新的安全措施和更精确的奖励跟踪机制，这些都是对系统的改进而非破坏性变更。

升级后，系统将能够更好地处理低流动性情况，并提供更精确的奖励跟踪，同时保持对所有现有质押的完全兼容性。

建议在升级后密切监控系统运行情况，特别是与新增 `totalPaidRewards` 变量和 `getStakeReward` 方法相关的功能，确保奖励计算和分配正常进行。


   客户之前交互的合约是 0x001C45CBd475F43193d08760A33ee950a2F7aa74 ，这个地址不能修改。






npx hardhat run scripts/upgrade.ts --network hashkeyTestnet

