import { BigNumber } from "ethers";

/**
 * Possible chains
 */
export enum ChainId {
    MATIC_TESTNET = "0x13881",
    LOCALHOST_HARDHAT = "0x7a69",
    LOCALHOST = "0x539"
}

export class GameConstants {
    public static readonly VERSION = "0.0";
    public static readonly DEVELOPMENT = true;
    public static readonly VERBOSE = false;
    public static readonly GAME_WIDTH = 1280;
    public static readonly GAME_HEIGHT = 853;

    public static readonly SAVED_GAME_DATA_KEY = "poker-data";

    public static readonly DEFAULT_CHAIN = ChainId.MATIC_TESTNET;

    public static readonly CHAIN_NAMES = {
        [ChainId.MATIC_TESTNET]: "Matic Testnet",
        [ChainId.LOCALHOST_HARDHAT]: "Local Network Hardhat",
        [ChainId.LOCALHOST]: "Local Network",
    };

    public static readonly CHAIN_ENDPOINTS = {
        [ChainId.MATIC_TESTNET]: "https://matic-testnet-archive-rpc.bwarelabs.com",
        [ChainId.LOCALHOST_HARDHAT]: "http://localhost:8545",
        [ChainId.LOCALHOST]: "http://localhost:8545",
    };

    // Provider constants
    public static readonly PROVIDER_PORTIS_APPID = '15ce62b0-b226-4e6f-9f8d-abbdf8f2cda2';

    // TurnBasedGame constants
    public static readonly GAME_TEMPLATE_HASH = "0xe0a48889a480a63147341e87411fb7c8981c759eb245fd53afb317b527915c93";
    public static readonly GAME_METADATA = "0x";
    public static readonly VALIDATORS = {
        // Matic validators: known accounts used by the validator nodes
        // TODO: setup real validator node accounts
        "0x13881": ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
        // Local validators: use default Hardhat accounts
        "0x7a69": ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
        "0x539": ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
    };
    public static readonly NUM_PLAYERS = 2;
    public static readonly MIN_FUNDS = BigNumber.from(10);

    //Game constants
    public static readonly BIG_BLIND = BigNumber.from(10);
}
