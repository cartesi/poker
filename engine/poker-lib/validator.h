#ifndef VALIDATOR_H
#define VALIDATOR_H

#include "common.h"
#include "game-state.h"

namespace poker {

/*
* Betting rules and winner election
*/
    
game_error place_bet(game_state& g, bet_type type, money_t amt = 0);
game_error decide_winner(game_state& g);

}  // namespace poker

#endif  // VALIDATOR_H