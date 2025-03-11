import { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const proxyAddress = '0x378Efa045CF8B1BB1e861F83c102961Ad25Ca8C1'
    const HashKeyChainStaking = await ethers.getContractFactory('HashKeyChainStaking')
    const staking2 = await upgrades.forceImport(proxyAddress, HashKeyChainStaking, { kind: "transparent" });
    await staking2.waitForDeployment()

    console.log('getAddress:', await staking2.getAddress())
    console.log('staking2.target:', staking2.target)
    const staking = await ethers.getContractAt("HashKeyChainStaking", proxyAddress);

    await staking.setVersion(6)
    console.log('staking2.version:', await staking.version())
    console.log('staking.version:', await staking.version())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });