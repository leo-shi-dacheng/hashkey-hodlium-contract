import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0x31De30BDBB58E890a10CB1C579B16592F7b5c041";
const IMPLEMENTATION_ADDRESS = "0xA3bAFec9eC09f6BBcA3ae13d7e384f548D262E40";
const PROXY_ADMIN = "0x436f6EC3C0BE2821dd07de72160283A871Ce28a4";

async function main() {
  const provider = ethers.provider;
  
  // 检查合约代码
  console.log("\nChecking contract code:");
  const proxyCode = await provider.getCode(PROXY_ADDRESS);
  console.log("Proxy has code:", proxyCode !== "0x");
  
  const implCode = await provider.getCode(IMPLEMENTATION_ADDRESS);
  console.log("Implementation has code:", implCode !== "0x");

  // 检查代理合约的存储
  const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
  const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  
  const adminFromSlot = await provider.getStorage(PROXY_ADDRESS, ADMIN_SLOT);
  const implFromSlot = await provider.getStorage(PROXY_ADDRESS, IMPLEMENTATION_SLOT);
  
  console.log("\nProxy Storage:");
  console.log("Admin from slot:", adminFromSlot);
  console.log("Implementation from slot:", implFromSlot);

  // 连接到合约
  const stakingContract = await ethers.getContractAt("HashKeyChainStaking", PROXY_ADDRESS);
  
  // 检查基本状态
  const owner = await stakingContract.owner();
  const version = await stakingContract.version();
  const hskPerBlock = await stakingContract.hskPerBlock();
  
  console.log("\nContract State:");
  console.log("Owner:", owner);
  console.log("Version:", version.toString());
  console.log("HSK per block:", ethers.formatEther(hskPerBlock));
  
  // 检查签名者
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  console.log("\nSigner Info:");
  console.log("Current signer:", signer.address);
  const balance = await provider.getBalance(signer.address);
  console.log("Balance:", ethers.formatEther(balance));
}

main().catch((error) => {
  console.error("Error:", error);
  if (error.data) {
    console.error("Error data:", error.data);
  }
}); 