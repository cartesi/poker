#ifndef REFEREE_H
#define REFEREE_H

#include "participant.h"
#include "game.h"

namespace poker {

class referee {
    game_state _g;
    participant _eve;
public:    
    referee();
    ~referee();

    game_state& game() { return _g; }

    game_error step_init_game(money_t alice_money, money_t bob_money, money_t big_blind);
    game_error step_vtmf_group(blob& g);
    game_error step_load_keys(blob& bob_key, blob& alice_key, /* out */ blob& eve_key);
    game_error step_vsshe_group(blob& vsshe);
    game_error step_alice_mix(blob& mix, blob& proof);
    game_error step_bob_mix(blob& mix, blob& proof);
    game_error step_final_mix(blob& mix, blob& proof);
    game_error step_take_cards_from_stack();
    game_error step_open_private_cards(int player_id, blob& alice_proofs, blob& bob_proofs);

    //TODO: step_call(int player_id);
    //TODO: step_raise(int player_id, money_t v);
    //TODO: step_fold(int player_id);
    
    game_error step_open_public_cards(blob& alice_proofs, blob& bob_proofs);
    game_error step_open_opponent_cards(int player_id, blob& alice_proofs, blob& bob_proofs);

private:
    game_error open_private_cards_impl(int player_id, blob& alice_proofs, blob& bob_proofs);
    game_error decide_winner();
};

} // namespace poker

#endif // REFEREE_H