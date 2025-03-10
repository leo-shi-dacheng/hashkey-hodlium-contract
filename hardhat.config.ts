import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-network-helpers";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hashkeyTestnet: {
      url: "https://hashkeychain-testnet.alt.technology",
      accounts: [process.env.TEST_STAKE!!],
      chainId: 133,
      gasPrice: "auto",
      timeout: 1000000,
    },
    hashkeyMainnet: {
      url: "https://mainnet.hsk.xyz",
      accounts: [process.env.TEST_STAKE!!],
      chainId: 177,
      gasPrice: "auto",
    },
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
  },
  etherscan: {
    apiKey: {
      hashkeyTestnet: "123",
    },
    customChains: [
      {
        network: "hashkeyTestnet",
        chainId: 133,
        urls: {
          apiURL: "https://hashkeychain-testnet-explorer.alt.technology/api",
          browserURL: "https://hashkeychain-testnet-explorer.alt.technology/"
        }
      },
      {
        network: "hashkeyMainnet",
        chainId: 177,
        urls: {
          apiURL: "https://explorer.hsk.xyz/api",
          browserURL: "https://explorer.hsk.xyz"
        }
      }
    ]
  },
  mocha: {
    timeout: 100000
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v6'
  }
};

export default config;