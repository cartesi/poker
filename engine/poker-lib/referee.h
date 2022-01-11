#ifndef REFEREE_H
#define REFEREE_H

#include "participant.h"
#include "game-state.h"

namespace poker {

/*
*  Game rules enforcing and source of truth.
*. Provides the off-line game verification capabilities.
*/
class referee {
    game_state  _g;
    i_participant* _eve;
    game_step   _step;
public:    
    referee();
    virtual ~referee();

    game_step step() { return _step; }

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
    game_error step_preflop_bet(int player_id, bet_type type, money_t amt);
    game_error step_open_flop(blob& alice_proofs, blob& bob_proofs);
    game_error step_flop_bet(int player_id, bet_type type, money_t amt);
    game_error step_open_turn(blob& alice_proofs, blob& bob_proofs);
    game_error step_turn_bet(int player_id, bet_type type, money_t amt);
    game_error step_open_river(blob& alice_proofs, blob& bob_proofs);
    game_error step_river_bet(int player_id, bet_type type, money_t amt);
    game_error step_showdown(int player_id, blob& alice_proofs, blob& bob_proofs, bool muck);

    game_error bet(int player_id, bet_type type, money_t amt);
    
    game_error open_public_cards(game_step step, blob& alice_proof, blob bob_proof);
    game_error open_private_cards(int player_id, blob& alice_proofs, blob& bob_proofs);

    static void init_game_state(game_state& g, money_t alice_money, money_t bob_money, money_t big_blind);

  private:
    game_error compute_bet(bet_type type, money_t& amt, game_step next_step);
    game_error open_public_cards(blob& alice_proofs, blob& bob_proofs, int first_card_index, int card_count);
    game_error decide_winner();
};

} // namespace poker

#endif // REFEREE_H