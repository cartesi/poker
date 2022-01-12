import { BigNumber } from "ethers";

/**
 * Possible chains
 */
export enum ChainId {
    MATIC_TESTNET = "0x13881",
    LOCALHOST_HARDHAT = "0x7a69",
    LOCALHOST = "0x539",
}

export class GameConstants {
    public static readonly VERSION = "0.0";
    public static readonly DEVELOPMENT = true;
    public static readonly VERBOSE = false;
    public static readonly GAME_WIDTH = 1280;
    public static readonly GAME_HEIGHT = 853;

    public static readonly SAVED_GAME_DATA_KEY = "cartesi-texas-hodlem";

    public static readonly CHAIN_NAMES = {
        [ChainId.MATIC_TESTNET]: "Polygon Mumbai",
        [ChainId.LOCALHOST_HARDHAT]: "Local Network Hardhat",
        [ChainId.LOCALHOST]: "Local Network",
    };

    public static readonly CHAIN_CURRENCIES = {
        [ChainId.MATIC_TESTNET]: "MATIC",
        [ChainId.LOCALHOST_HARDHAT]: "ETH",
        [ChainId.LOCALHOST]: "ETH",
    };

    public static readonly CHAIN_CURRENCIES_LOW_VALUE = {
        [ChainId.MATIC_TESTNET]: 0.001,
        [ChainId.LOCALHOST_HARDHAT]: 0.001,
        [ChainId.LOCALHOST]: 0.001,
    };

    public static readonly CHAIN_ENDPOINTS = {
        [ChainId.MATIC_TESTNET]: [
            "https://speedy-nodes-nyc.moralis.io/f7fb44b9b8ea14ccde8210c5/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/0655b0318e637f5543432f7c/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/4f43ff2235b61a28dfda3467/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/20df0a8c78dcfe2dd42cc4b0/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/50b8fce9b817a4f78dc220bf/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/ad6bb7d8ccbd1bc0d2a397d3/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/8047a407cd7cd5d4aafd1daf/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/5055d07f73ba1efe9ea3d881/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/649351e554492db10abda42c/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/741137280a82549fa99c9bc1/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/a4a0536b3ec0a9593727bc9c/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/681228d9b50e1d01a4b18c6f/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/f0ca5179089cecb65506b7b6/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/e1c00dd68a9379ec2bc36938/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/873f145885f34f9265b34bbe/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/528854bde540b00502975811/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/8792b6327c97907e2436a7f3/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/eba59d0bf8ebcefcbc64be99/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/aa5ee0f2192df23e59ac103f/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/946ae6513eeca328228ea157/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/f8a058cc99fbac1d57ec73a1/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/0ae284bd438d20dbae9539c1/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/b9440dffa161020e66c20f07/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/b2b8a67de982384b30de6ad0/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/f0079125e581a4466c389eae/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/66fdf7609ff77cc9a523a929/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/6bc1d5b71da7457f4f4e61da/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/2547247e99545b21607f9ec3/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/6a9e240a212ee94c12458037/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/cdc018ea7391e03b50098336/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/06a9b4675d19742ee3da4702/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/7026c20fdc9a98888773ab35/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/0b5678e4e5e0ebc9c29a656e/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/eec19128472b1bbe52f00e0f/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/17987c9b8805a9ca258f04aa/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/531ac0fb7337b0617f10ec3d/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/af67007d1fefb8838d68674d/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/ae656caa1d5f8ee56a698470/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/8df4ad99d38794f830a8e8b5/polygon/mumbai",
            "https://speedy-nodes-nyc.moralis.io/4cf06969f06c99a6a122a574/polygon/mumbai",
        ],
        [ChainId.LOCALHOST_HARDHAT]: ["http://localhost:8545"],
        [ChainId.LOCALHOST]: ["http://localhost:8545"],
    };

    // Provider constants
    public static readonly PROVIDER_PORTIS_APPID = "15ce62b0-b226-4e6f-9f8d-abbdf8f2cda2";

    // TurnBasedGame constants
    public static readonly GAME_TEMPLATE_HASH = "0x160bab456d22ffa5964e25064a928861816cfc724f5c30b583a0993917b1ddeb";
    public static readonly GAME_METADATA = "0x";
    public static readonly VALIDATORS = {
        // Matic validators: known accounts used by the validator nodes
        "0x13881": ["0x3a1eda296950Fa2bd18A9af5FeAdD50D993e5137", "0x882940b5B72c907eC7822eE59C8a11F40d30Cf08"],
        // Local validators: use default Hardhat accounts
        "0x7a69": ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
        "0x539": ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
    };
    public static readonly NUM_PLAYERS = 2;
    public static readonly MIN_FUNDS = BigNumber.from(10);

    // Game constants
    public static readonly BIG_BLIND = BigNumber.from(10);
    public static readonly TIMEOUT_SECONDS = 240;
    public static readonly TIMEOUT_SAFETY_MARGIN_SECONDS = 60;
}
