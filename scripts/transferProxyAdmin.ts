import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xCd13DE9f9AFfE73Ed19A2afaF28749b5fc837A85";
const CURRENT_PROXY_ADMIN = "0x67bdb9310072a0fdeec8999a582a38beb3821bc6";

async function main() {
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  console.log("Using address:", signer.address);

  // 连接到当前的代理管理员合约
  const proxyAdmin = await ethers.getContractAt(
    "HashKeyChainStakingProxyAdmin",
    CURRENT_PROXY_ADMIN,
    signer
  );

  // 转移所有权给当前的合约所有者
  console.log("Transferring proxy admin ownership...");
  const tx = await proxyAdmin.transferOwnership(signer.address);
  await tx.wait();

  console.log("Proxy admin ownership transferred to:", signer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 