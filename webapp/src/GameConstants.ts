export class GameConstants {
    public static readonly VERSION = "0.0";
    public static readonly DEVELOPMENT = true;
    public static readonly VERBOSE = false;
    public static readonly GAME_WIDTH = 1280;
    public static readonly GAME_HEIGHT = 853;

    public static readonly STATES = ["START", "PREFLOP", "FLOP", "TURN", "RIVER", "SHOWDOWN", "END", "VERIFICATION"];

    public static readonly VERIFICATION_STATES = [
        "NONE",
        "STARTED",
        "RESULT SUBMITTED",
        "RESULT CONFIRMED",
        "RESULT CHALLENGED",
        "ENDED",
        "ERROR",
    ];

    public static readonly ACTION_CALL = "CALL";
    public static readonly ACTION_CHECK = "CHECK";
    public static readonly ACTION_RAISE = "RAISE";
    public static readonly ACTION_FOLD = "FOLD";
    public static readonly ACTIONS = [
        GameConstants.ACTION_CALL,
        GameConstants.ACTION_CHECK,
        GameConstants.ACTION_RAISE,
        GameConstants.ACTION_FOLD,
    ];

    public static readonly SAVED_GAME_DATA_KEY = "poker-data";

    public static readonly CHAINS = {
        "0x13881": "Matic Testnet",
        "0x7a69": "Local Network",
        "0x539": "Local Network",
    };

    // TurnBasedGame constants
    public static readonly GAME_TEMPLATE_HASH = "0xa4c9cc22be3cefe90f6a2332ffd3b12e4fcc327112a90dcc12207ad5154e8207";
    public static readonly GAME_METADATA = "0x";
    public static readonly VALIDATORS = {
        // Matic validators: known accounts used by the validator nodes
        // TODO: setup real validator node accounts
        "0x13881": ["0xF05D57a5BeD2d1B529C56001FC5810cc9afC0335", "0xc8c07A0801f7e72321631B2A7F187356e4407304"],
        // Local validators: use default Hardhat accounts
        "0x7a69": ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
        "0x539": ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
    };
    public static readonly NUM_PLAYERS = 2;
    public static readonly MIN_FUNDS = 10;
}
