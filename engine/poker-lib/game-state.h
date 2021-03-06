#ifndef GAME_STATE_H
#define GAME_STATE_H

#include <cstdint>
#include "common.h"
#include "solver.h"
#include "bignumber.h"

namespace poker {

enum bet_phase {
    PHS_PREFLOP,
    PHS_FLOP,
    PHS_TURN,
    PHS_RIVER,
    PHS_SHOWDOWN,
    PHS_GAME_OVER,
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
public:
    game_state()
        : error(SUCCESS),winner(-1), current_player(ALICE),
          last_aggressor(BOB), next_msg_author(NONE), phase(PHS_PREFLOP), muck(false),
          players{player_state(ALICE), player_state(BOB)},
          public_cards{cards::uk, cards::uk, cards::uk, cards::uk, cards::uk}
        { }

    int current_player;
    game_error error;
    bet_phase phase;
    int winner;
    int last_aggressor;
    int next_msg_author;
    player_state players[NUM_PLAYERS];
    card_t public_cards[NUM_PUBLIC_CARDS];
    money_t big_blind;
    money_t funds_share[NUM_PLAYERS];
    bool muck;

    std::string to_json(char* extra_fields=NULL);
    game_error get_player_hand(int player, card_t* hand);
};

}

#endif
