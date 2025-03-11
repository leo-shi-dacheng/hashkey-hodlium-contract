import { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const proxyAddress = '0x0BE68eCC304bda55C10baA30EF9c20b23AC7B633'
    const HashKeyChainStaking = await ethers.getContractFactory('HashKeyChainStaking')

    // 获取当前实现合约地址
    const currentImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log('Current implementation address before upgrade:', currentImplementation);

    const staking2 = await upgrades.forceImport(proxyAddress, HashKeyChainStaking, { kind: "transparent" });
    await staking2.waitForDeployment()

    console.log('getAddress:', await staking2.getAddress())
    console.log('staking2.target:', staking2.target)

    // 获取升级后的实现合约地址
    const newImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log('New implementation address after upgrade:', newImplementation);

    const staking = await ethers.getContractAt("HashKeyChainStaking", proxyAddress);

    // await staking.setVersion(6)
    console.log('staking2.version:', await staking.version())
    console.log('staking.version:', await staking.version())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 