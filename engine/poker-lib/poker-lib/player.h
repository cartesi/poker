#ifndef PLAYER_H
#define PLAYER_H

#include "referee.h"

namespace poker {

class player {
    int _id, _opponent_id;
    participant _p;
    referee _e;
    blob _my_key;
    blob _my_public_card_proofs;
public:
    player(int id);
    ~player();

    game_error init_game(money_t alice_money, money_t bob_money);
    game_error create_vtmf(blob &vtmf);
    game_error load_vtmf(blob &vtmf);
    game_error generate_key(blob &key);
    game_error load_opponent_key(blob &key);
    game_error create_vsshe(blob &vsshe);
    game_error load_vsshe(blob &vsshe);
    game_error shuffle_stack(blob& mix, blob& proof);
    game_error load_stack(blob& mix, blob& proof);
    game_error deal_cards();
    game_error prove_opponent_cards(blob& proofs);
    game_error open_private_cards(blob& their_proofs);
    game_error prove_public_cards(blob& proofs);
    game_error open_public_cards(blob& their_proofs);
    game_error prove_my_cards(blob& proofs);
    game_error open_opponent_cards(blob& their_proofs);

    bool game_over() { return _e.game().error || _e.game().step == GAME_OVER; }
    game_error error() { return _e.game().error; }
    card_t private_card(int index) { return _e.game().players[_id].cards[index]; }
    card_t public_card(int index)  { return _e.game().public_cards[index]; }
    card_t opponent_card(int index) { return _e.game().players[_opponent_id].cards[index]; }
    int winner() { return _e.game().winner; }
};


} // namespace poker

#endif // REFEREE_H
