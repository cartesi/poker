import { HardhatUserConfig, task, types } from "hardhat/config";

import "hardhat-deploy";
import "hardhat-deploy-ethers";

const config: HardhatUserConfig = {
    networks: {
        localhost: {
            url: "http://localhost:8545",
        },
    },
    solidity: {
        version: "0.7.4",
    },
    external: {
        contracts: [
            {
                artifacts:
                    "node_modules/@cartesi/descartes-sdk/export/artifacts",
                deploy: "node_modules/@cartesi/descartes-sdk/dist/deploy",
            },
        ],
        deployments: {
            localhost: ["./descartes-env/deployments/localhost"],
        },
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
