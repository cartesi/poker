import { HardhatUserConfig } from "hardhat/config";

import "hardhat-deploy";
import "hardhat-deploy-ethers";

// read MNEMONIC from file or from env variable
let mnemonic = process.env.MNEMONIC;

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      accounts: mnemonic ? { mnemonic } : undefined,
      blockGasLimit: 100000000,
    },
    localhost: {
      url: "http://localhost:8545",
      accounts: mnemonic ? { mnemonic } : undefined,
      gas: 95000000
    },
  },
  solidity: {
    version: "0.7.4",
  },
  external: {
    contracts: [
      {
        artifacts: "node_modules/@cartesi/util/export/artifacts",
        deploy: "node_modules/@cartesi/util/dist/deploy",
      },
      {
        artifacts: "node_modules/@cartesi/arbitration/export/artifacts",
        deploy: "node_modules/@cartesi/arbitration/dist/deploy",
      },
      {
        artifacts: "node_modules/@cartesi/logger/export/artifacts",
        deploy: "node_modules/@cartesi/logger/dist/deploy",
      },
      {
        deploy: "node_modules/@cartesi/machine-solidity-step/dist/deploy",
        artifacts:
          "node_modules/@cartesi/machine-solidity-step/export/artifacts",
      },
      {
        deploy: "node_modules/@cartesi/descartes-sdk/dist/deploy",
        artifacts: "node_modules/@cartesi/descartes-sdk/export/artifacts",
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    alice: {
      default: 0,
    },
    bob: {
      default: 1,
    },
  },
};

export default config;
