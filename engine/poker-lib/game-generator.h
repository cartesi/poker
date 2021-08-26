#ifndef GAME_GENERATOR_H
#define GAME_GENERATOR_H

#include <array>
#include <tuple>
#include <sstream>
#include "player.h"

namespace poker {

class game_generator {
public:
    // game input arguments
    money_t alice_money;
    money_t bob_money;
    money_t big_blind;
    bignumber alice_addr;
    bignumber bob_addr;
    bignumber claimer_addr;
    bignumber challenger_addr;

    // game output
    game_state game;
    std::string raw_player_info;
    std::string raw_turn_metadata;
    std::string raw_verification_info;
    std::string raw_turn_data;

    game_generator() : alice_money(200), bob_money(100), big_blind(10) {
        alice_addr.parse_string("8000000000000000000000000000000000000000000000000000000000000001", 16);
        bob_addr.parse_string("9000000000000000000000000000000000000000000000000000000000000002", 16);
        challenger_addr = alice_addr;
        claimer_addr = 0;
    }

    game_error generate();
};

}

#endif