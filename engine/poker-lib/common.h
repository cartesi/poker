#ifndef COMMON_H
#define COMMON_H

#include "cards.h"
#include <iostream>

namespace poker {

extern std::ostream& logger;

const int ALICE = 0;
const int BOB = 1;
const int EVE = 3;
const int VERIFIER = 4;
const int NUM_PLAYERS = 2;
const int NUM_PUBLIC_CARDS = 5;
const int NUM_FLOP_CARDS = 3;
const int NUM_PRIVATE_CARDS = 2;
const int NUM_CARDS = NUM_PUBLIC_CARDS + (NUM_PLAYERS * NUM_PRIVATE_CARDS);
const int HAND_SIZE = NUM_PUBLIC_CARDS + NUM_PRIVATE_CARDS;

enum bet_type {
    BET_NONE = 0,
    BET_FOLD = 1,
    BET_CALL = 2,
    BET_RAISE = 3,
    BET_CHECK = 4
};

enum game_step {
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
    OPEN_OPONENT_CARDS = 16,
    GAME_OVER = 17,
};

enum game_error {
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
    ERR_BET_PHASE_MISMATCH,

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
    GRR_INVALID_BET,

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
    
    // Big number
    BIG_UNPARSEABLE =800
};

constexpr int private_card_index(int player, int card) {
    return card + (player * NUM_PRIVATE_CARDS);
}

constexpr int public_card_index(int card) {
    return card + (NUM_PLAYERS * NUM_PRIVATE_CARDS);
}

constexpr int flop_card_index(int card) {
    return public_card_index(card);
}

constexpr int turn_card_index() {
    return public_card_index(NUM_FLOP_CARDS + 0);
}

constexpr int river_card_index() {
    return public_card_index(NUM_FLOP_CARDS + 1);
}

constexpr int opponent_id(int player) {
    return player == ALICE ? BOB : ALICE;
}

game_error public_cards_range(game_step step, int& first_card_index, int& card_count);

}

#endif