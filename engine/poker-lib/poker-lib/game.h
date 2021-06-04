#ifndef GAME_H
#define GAME_H

#include <cstdint>
#include "cards.h"
#include "errors.h"
#include "solver.h"

namespace poker {

const int ALICE = 0;
const int BOB = 1;
const int NUM_PLAYERS = 2;
const int NUM_PUBLIC_CARDS = 5;
const int NUM_PRIVATE_CARDS = 2;
const int NUM_CARDS = NUM_PUBLIC_CARDS + (NUM_PLAYERS * NUM_PRIVATE_CARDS);
const int HAND_SIZE = NUM_PUBLIC_CARDS + NUM_PRIVATE_CARDS;

constexpr int public_card_index(int card) {
    return card;
}

constexpr int private_card_index(int player, int card) {
    return NUM_PUBLIC_CARDS + (player * NUM_PRIVATE_CARDS) + card;
}

constexpr int opponent_of(int player) {
    return player == ALICE ? BOB : ALICE;
}

typedef int32_t money_t;

enum game_step {
    BEGIN,
    INIT_GAME,
    VTMF_GROUP,
    LOAD_KEYS,
    VSSHE_GROUP,
    ALICE_MIX,
    BOB_MIX,
    FINAL_MIX,
    TAKE_CARDS_FROM_STACK,
    OPEN_PRIVATE_CARDS,
    OPEN_PUBLIC_CARDS,
    OPEN_OPONENT_CARDS,
    GAME_OVER,
};

struct player_state {
    player_state(int pid) :
        id(pid), total_funds(0), bets{0},
        cards{cards::uk, cards::uk}
        {}

    int16_t id;    
    money_t total_funds;
    money_t bets;
    card_t cards[NUM_PRIVATE_CARDS];
};

class game_state {
    solver _solver;
public:
    game_state()
        : error(SUCCESS),winner(-1), current_player(ALICE),
          step(game_step::BEGIN),
          players{player_state(ALICE), player_state(BOB)},
          public_cards{cards::uk, cards::uk, cards::uk, cards::uk, cards::uk}
        { }

    int          current_player;
    game_error   error;
    game_step    step;
    int          winner;
    player_state players[NUM_PLAYERS];
    card_t       public_cards[NUM_PUBLIC_CARDS];
    money_t      big_blind;

    game_error   call();
    game_error   raise(money_t amount);
    game_error   fold();
    game_error   decide_winner();
    void         dump();
private:
    game_error get_player_hand(int player, card_t* hand);
};

} // namespace poker

#endif