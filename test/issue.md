## 1. 老问题复现
这个合约目前有问题
stakeLocked 的时候导致
sharesAmount 可能计算错误

第一个客户 unstakeLocked 成功之后，
第二个客户 unstakeLocked 的时候，
sharesAmount 计算错误，导致 stakeLocked 失败

但是所有客户 stakeLocked  都是正常的

先帮我复现这个bug

以下是客户记录 
默认是 stakeLocked hskAmount 字段
50,000
500
513
5,000
298
100
198
4,913
unstakeLocked 4,913 成功
9,900
100
 unstakeLocked 失败
 unstakeLocked 失败
  unstakeLocked 失败
   unstakeLocked 失败
100


----------------
拉取客户所有数据 ！！！
脚本先模拟执行 stakeLocked 操作
模拟执行所有 unstakeLocked 操作
unstakeLocked 按照计划失败
算出每一笔所缺的钱
admin 补齐钱
unstakeLocked 按照计划成功
并且预测下一笔所缺数量的公式


// 新问题
一笔签名 提交到新合约


！！！主网数据 fork 到本地 
利息调整到很低！！！


## 本地fork 主网
可能需要几百个账户

第一笔交易在 3319649 区块
3680336