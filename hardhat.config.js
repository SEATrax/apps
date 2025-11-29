require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
const path = require("path");
require("dotenv").config();
// Also load .env.local if present (used by this project)
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      initialBaseFeePerGas: 0,
    },
    "lisk-sepolia": {
      url: process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts: (() => {
        const pk = process.env.DEPLOYER_PRIVATE_KEY;
        if (!pk) return [];
        return [pk.startsWith("0x") ? pk : `0x${pk}`];
      })(),
      gas: "auto",
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      "lisk-sepolia": process.env.BLOCKSCOUT_API_KEY || "abc",
    },
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
