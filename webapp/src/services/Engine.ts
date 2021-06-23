import { BigNumber } from "ethers";

export interface Engine {
    init(alice_funds: BigNumber, bob_funds: BigNumber, big_blind: BigNumber): Promise<EngineResult>;
    create_handshake(): Promise<EngineResult>;
    process_handshake(message_in: string): Promise<EngineResult>;
    create_bet(type: bet_type, amount: BigNumber): Promise<EngineResult>;
    process_bet(message_in: string): Promise<EngineResult>;
    game_state(): Promise<game_state>;
}

interface EngineResult {
    status: game_error;
    betType?: bet_type;
    amount?: BigNumber;
    message_out?: string;
}

const enum game_error {
    SUCCESS = 0,
    CONTINUED = 1,

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

    // player errors
    PRR_INVALID_PLAYER = 200,
    PRR_INVALID_MSG_TYPE,
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

    // CODEC
    COD_ERROR = 500,
    COD_INVALID_MSG_TYPE,

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

    // Verifier
    VRF_UNKNOWN_MSG_TYPE = 700,
    VRF_DECODE_ERROR,
    VRR_READ_VTMF,
    VRR_READ_ALICE_KEY,
    VRF_MESSAGE_NOT_FOUND,
    VRF_CURRENT_PLAYER_MISMATCH,
    VRF_OPEN_ALICE_PRIVATE_CARDS,
    VRF_OPEN_BOB_PRIVATE_CARDS,
}

const enum bet_type {
    BET_NONE,
    BET_FOLD,
    BET_CALL,
    BET_RAISE,
    BET_CHECK,
}

interface game_state {
    step: number;
    current_player: number;
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

const enum game_step {
    INIT_GAME = 0,
    VTMF_GROUP,
    LOAD_KEYS,
    VSSHE_GROUP,
    ALICE_MIX,
    BOB_MIX,
    FINAL_MIX,
    TAKE_CARDS_FROM_STACK,
    OPEN_PRIVATE_CARDS,
    PREFLOP_BET,
    OPEN_FLOP,
    FLOP_BET,
    OPEN_TURN,
    TURN_BET,
    OPEN_RIVER,
    RIVER_BET,
    OPEN_OPONENT_CARDS,
    GAME_OVER,
}

export {
    EngineResult,
    game_error as StatusCode,
    bet_type as EngineBetType,
    game_state as EngineState,
    player_state as EnginePlayer,
    game_step as EngineStep,
};
