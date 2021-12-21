import { BigNumber } from "ethers";

export interface Engine {
    init(
        alice_funds: BigNumber,
        bob_funds: BigNumber,
        big_blind: BigNumber,
        encryption: boolean,
        winner: number
    ): Promise<EngineResult>;
    create_handshake(): Promise<EngineResult>;
    process_handshake(message_in: Uint8Array): Promise<EngineResult>;
    create_bet(type: bet_type, amount: BigNumber): Promise<EngineResult>;
    process_bet(message_in: Uint8Array): Promise<EngineResult>;
    game_state(): Promise<game_state>;
    on_game_over(): void;
}

interface EngineResult {
    status: game_error;
    betType?: bet_type;
    amount?: BigNumber;
    message_out?: Uint8Array;
}

interface game_state {
    step: number;
    current_player: number;
    next_msg_author: number;
    last_aggressor: number;
    muck: boolean;
    error: game_error;
    winner: number;
    public_cards: number[];
    players: player_state[];
    funds_share: BigNumber[];
}

interface player_state {
    id: number;
    total_funds: BigNumber;
    bets: BigNumber;
    cards: number[];
}

// Auto-generated enums
const enum game_error {
    SUCCESS = 0,
    CONTINUED = 1,
    END_OF_STREAM = 2,

    // Referee errors
    ERR_GAME_OVER = 100,
    ERR_INVALID_MOVE,
    ERR_VTMF_LOAD_FAILED,
    ERR_GENERATE_EVE_KEY,
    ERR_LOAD_ALICE_KEY,
    ERR_LOAD_BOB_KEY,
    ERR_FINALIZE_KEY_GENERATION,
    ERR_VSSHE_GROUP,
    ERR_ALICE_MIX,
    ERR_BOB_MIX,
    ERR_FINAL_MIX,
    ERR_CREATE_STACK,
    ERR_TAKE_CARDS_FROM_STACK,
    ERR_OPEN_PRIVATE_SELF_SECRET,
    ERR_OPEN_PRIVATE_VERIFY_ALICE_SECRET,
    ERR_OPEN_PRIVATE_VERIFY_BOB_SECRET,
    ERR_OPEN_PRIVATE_OPEN_CARD,
    ERR_OPEN_PUBLIC_SELF_SECRET,
    ERR_OPEN_PUBLIC_VERIFY_ALICE_SECRET,
    ERR_OPEN_PUBLIC_VERIFY_BOB_SECRET,
    ERR_OPEN_PUBLIC_OPEN_CARD,
    ERR_BET_NOT_ALLOWED,
    ERR_NOT_PLAYER_TURN,
    ERR_INVALID_OPEN_CARDS_STEP,
    ERR_BET_PHASE_MISMATCH,

    // player errors
    PRR_INVALID_PLAYER = 200,
    PRR_INVALID_MSG_TYPE,
    PRR_INVALID_OPPONNENT,
    PRR_CREATE_VTMF,
    PRR_GENERATE_KEY,
    PRR_LOAD_KEY,
    PRR_FINALIZE_KEY_GENERATION,
    PRR_CREATE_VSSHE,
    PRR_LOAD_EVE_KEY,
    PRR_TAKE_CARDS_FROM_STACK,
    PRR_CREATE_STACK,
    PRR_SHUFFLE_STACK,
    PRR_LOAD_STACK,
    PRR_LOAD_FINAL_STACK,
    PRR_PROVE_OPPONENT_PRIVATE,
    PRR_OPEN_MY_PRIVATE_CARDS,
    PRR_INVALID_CARDS_PROOF_STEP,
    PRR_INVALID_OPEN_CARDS_STEP,
    PRR_PROOF_NOT_FOUND,
    PRR_ALICE_MONEY_DIVERGES,
    PRR_BOB_MONEY_DIVERGES,
    PRR_BIG_BLIND_DIVERGES,

    // solver errors
    SRR_UNKNOWN_CARD = 300,
    SRR_DUPLICATE_CARD,

    // game_state errors
    GRR_INVALID_PLAYER = 400,
    GRR_INSUFFICIENT_FUNDS,
    GRR_BETS_NOT_EQUAL,
    GRR_BET_ALREADY_HIGHER,
    GRR_OPPONENT_BET_NOT_HIGHER,
    GRR_BET_BELOW_MINIMUM,
    GRR_BET_ABOVE_MAXIMUM,
    GRR_INVALID_BET,
    GRR_GAME_NOT_OVER,

    // CODEC
    COD_ERROR = 500,
    COD_INVALID_MSG_TYPE,
    COD_VERSION_MISMATCH,

    // TMCG
    TMC_CHECK_GROUP = 600,
    TMC_KEYGENERATIONPROTOCOL_UPDATEKEY,
    TMC_VSSHE_CHECKGROUP,
    TMC_VSSHE_MISMATCH_H,
    TMC_VSSHE_MISMATCH_P,
    TMC_VSSHE_MISMATCH_Q,
    TMCG_READ_STACK,
    TMC_VERIFYSTACKEQUALITY,
    TMC_VERIFYCARDSECRET,
    TMC_INVALID_CARD_INDEX,
    TMC_PROVE_CARD,
    TMC_RUNTIME_EXCEPTION,

    // Verifier
    PLB_UNKNOWN_MSG_TYPE = 700,
    PLB_DECODE_ERROR,
    VRR_READ_VTMF,
    VRR_READ_ALICE_KEY,
    VRF_MESSAGE_NOT_FOUND,
    VRF_CURRENT_PLAYER_MISMATCH,
    VRF_OPEN_ALICE_PRIVATE_CARDS,
    VRF_OPEN_BOB_PRIVATE_CARDS,
    VRF_EOF,

    // Big number
    BIG_UNPARSEABLE = 800,
    BIG_READ_ERROR,
    VRF_INVALID_PLAYER_COUNT,
    BIG_WRITE_ERROR,
    VRF_PLAYER_ADDRESS_NOT_FOUND,

    // Compression
    CPR_COMPRESS_INIT = 900,
    CPR_DECOMPRESS_INIT,
    CPR_COMPRESS,
    CPR_COMPRESS_FLUSH,
    CPR_DECOMPRESS,
    CPR_INVALID_DATA_LENGTH,
    CPR_INSUFFICIENT_DATA,
    CPR_READ_ERROR,
    CPR_DATA_TOO_BIG,
    CPR_EOF,

    // playback
    PLB_MESSAGE_NOT_FOUND = 1000,
    PLB_CURRENT_PLAYER_MISMATCH,
    PLB_OPEN_ALICE_PRIVATE_CARDS,
    PLB_OPEN_BOB_PRIVATE_CARDS,
};

const enum bet_type {
    BET_NONE = 0,
    BET_FOLD = 1,
    BET_CALL = 2,
    BET_RAISE = 3,
    BET_CHECK = 4
};

const enum game_step {
    INIT_GAME = 0,
    VTMF_GROUP = 1,
    LOAD_KEYS = 2,
    VSSHE_GROUP = 3,
    ALICE_MIX = 4,
    BOB_MIX = 5,
    FINAL_MIX = 6,
    TAKE_CARDS_FROM_STACK = 7,
    OPEN_PRIVATE_CARDS = 8,
    PREFLOP_BET = 9,
    OPEN_FLOP = 10,
    FLOP_BET = 11,
    OPEN_TURN = 12,
    TURN_BET = 13,
    OPEN_RIVER = 14,
    RIVER_BET = 15,
    SHOWDOWN = 16,
    GAME_OVER = 17,
};

export {
    EngineResult,
    game_error as StatusCode,
    bet_type as EngineBetType,
    game_state as EngineState,
    player_state as EnginePlayer,
    game_step as EngineStep,
};
