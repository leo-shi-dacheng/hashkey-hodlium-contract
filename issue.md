代码 https://github.com/SpectreMercury/hashkey-hodlium-contract
问题（可以用本地node复现，不一定在HSK testnet）： 
1. 部署：npx hardhat run scripts/deploy.ts --network hashkeyTestnet 部署（Openzepplin V5.2.0, ProxyAdmin ERC1967)
2. 执行合约升级报错（权限不对，revert，目前没有定位原因）

期望：能升级合约，修改错误的逻辑，并保留已经质押的资产。

===== 分析代理管理员链 =====
网络: hashkeyTestnet
起始代理合约: 0x251c94ca0dE861b68D9131CE3B54F735F9E53927
当前签名者: 0x6ca0Df2886B55A3099bC70994b9aA8f29B455d50

开始跟踪管理员链...

[层级 1] 地址: 0x251c94ca0dE861b68D9131CE3B54F735F9E53927
✓ 这是一个合约
通过存储槽找到管理员: 0xb585d0dcb0566f9533982989be16e30816d3bf07

[层级 2] 地址: 0xb585d0dcb0566f9533982989be16e30816d3bf07
✓ 这是一个合约
该合约没有在ERC1967管理员存储槽设置管理员
通过owner()找到所有者: 0xdEb9d83cDaFF767Dfecb4Dfc52D1D242417B01B5

[层级 3] 地址: 0xdEb9d83cDaFF767Dfecb4Dfc52D1D242417B01B5
✓ 这是一个合约
该合约没有在ERC1967管理员存储槽设置管理员
通过owner()找到所有者: 0x6ca0Df2886B55A3099bC70994b9aA8f29B455d50

[层级 4] 地址: 0x6ca0Df2886B55A3099bC70994b9aA8f29B455d50
✓ 这是一个外部拥有账户(EOA)
✓ 管理员链的终点

===== 管理员链汇总 =====
[层级 1] 0x251c94ca0dE861b68D9131CE3B54F735F9E53927 (ERC1967Proxy)
  └─ 管理员: 0xb585d0dcb0566f9533982989be16e30816d3bf07
[层级 2] 0xb585d0dcb0566f9533982989be16e30816d3bf07 (Ownable)
  └─ 管理员: 0xdEb9d83cDaFF767Dfecb4Dfc52D1D242417B01B5
[层级 3] 0xdEb9d83cDaFF767Dfecb4Dfc52D1D242417B01B5 (Ownable)
  └─ 管理员: 0x6ca0Df2886B55A3099bC70994b9aA8f29B455d50
[层级 4] 0x6ca0Df2886B55A3099bC70994b9aA8f29B455d50 (EOA)



## Proxy
- 0x251c94ca0dE861b68D9131CE3B54F735F9E53927
## ProxyAdmin
- 0xb585D0dcB0566F9533982989be16E30816D3BF07
## HashKeyChainStakingProxyAdmin
0xdEb9d83cDaFF767Dfecb4Dfc52D1D242417B01B5
## Implementation
0x0f5aEe386C40C04382818C1ea24a04C67513e0E3
## 

0xdEb9d83cDaFF767Dfecb4Dfc52D1D242417B01B5