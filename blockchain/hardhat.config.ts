import { HardhatUserConfig } from "hardhat/config";

import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

import "./hardhat.tasks";

// read MNEMONIC from file or from env variable
let mnemonic = process.env.MNEMONIC;

const config: HardhatUserConfig = {
    networks: {
        localhost: {
            url: "http://localhost:8545",
            gas: 95000000,
            timeout: 400000
        },
        matic_testnet: {
            url: "https://speedy-nodes-nyc.moralis.io/f7fb44b9b8ea14ccde8210c5/polygon/mumbai",
            chainId: 80001,
            gas: 9500000,
            accounts: mnemonic ? { mnemonic } : undefined,
        },
    },
    solidity: {
        version: "0.7.4",
    },
    external: {
        contracts: [
            {
                artifacts: "../node_modules/@cartesi/util/export/artifacts",
                deploy: "../node_modules/@cartesi/util/dist/deploy",
            },
            {
                artifacts: "../node_modules/@cartesi/arbitration/export/artifacts",
                deploy: "../node_modules/@cartesi/arbitration/dist/deploy",
            },
            {
                artifacts: "../node_modules/@cartesi/logger/export/artifacts",
                deploy: "../node_modules/@cartesi/logger/dist/deploy",
            },
            {
                artifacts: "../node_modules/@cartesi/machine-solidity-step/export/artifacts",
                deploy: "../node_modules/@cartesi/machine-solidity-step/dist/deploy",
            },
            {
                artifacts: "../node_modules/@cartesi/descartes-sdk/export/artifacts",
                deploy: "../node_modules/@cartesi/descartes-sdk/dist/deploy",
            },
        ],
        deployments: {
            localhost: ["./descartes-env/deployments/localhost"],
            matic_testnet: [
                "../node_modules/@cartesi/util/deployments/matic_testnet",
                "../node_modules/@cartesi/arbitration/deployments/matic_testnet",
                "../node_modules/@cartesi/logger/deployments/matic_testnet",
                "../node_modules/@cartesi/machine-solidity-step/deployments/matic_testnet",
                "../node_modules/@cartesi/descartes-sdk/deployments/matic_testnet",
            ],
        },
    },
    typechain: {
        outDir: "src/types",
        target: "ethers-v5",
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
