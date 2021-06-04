#include "referee.h"

namespace poker {

referee::referee()
  : _eve(participant(1+NUM_PLAYERS, NUM_PLAYERS, true /* predictable */))
{
}

referee::~referee() {
}

game_error referee::step_init_game(money_t alice_money, money_t bob_money, money_t big_blind) {
    if (_g.error)
        return ERR_GAME_OVER;
    if (_g.step != game_step::BEGIN)
        return (_g.error = ERR_INVALID_MOVE);

    _g.players[ALICE].total_funds = alice_money - big_blind/2;
    _g.players[ALICE].bets = big_blind/2;
    _g.players[BOB].total_funds = bob_money - big_blind;
    _g.players[BOB].bets = big_blind;
    _g.big_blind = big_blind;
    // etc etc....

    _g.step = game_step::INIT_GAME;
    return SUCCESS;

}

game_error referee::step_vtmf_group(blob& g) {
    if (_g.error)
        return ERR_GAME_OVER;
    if (_g.step != game_step::INIT_GAME)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.load_group(g))
        return (_g.error = ERR_VTMF_LOAD_FAILED);

    _g.step = game_step::VTMF_GROUP;
    return SUCCESS;
}

game_error referee::step_load_keys(blob& bob_key, blob& alice_key, /* out */ blob& eve_key) {
    if (_g.error)
        return ERR_GAME_OVER;
    if (_g.step != game_step::VTMF_GROUP)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.generate_key(eve_key))
        return (_g.error = ERR_GENERATE_EVE_KEY);
    if (_eve.load_their_key(alice_key))
        return (_g.error = ERR_LOAD_ALICE_KEY);
    if (_eve.load_their_key(bob_key))
        return (_g.error = ERR_LOAD_BOB_KEY);
    if (_eve.finalize_key_generation())
        return (_g.error = ERR_FINALIZE_KEY_GENERATION);

    _g.step = game_step::LOAD_KEYS;
    return SUCCESS;
}

game_error referee::step_vsshe_group(blob& vsshe) {
    if (_g.error)
        return ERR_GAME_OVER;
    if (_g.step != game_step::LOAD_KEYS)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.load_vsshe_group(vsshe))
        return (_g.error = ERR_VSSHE_GROUP);
    if (_eve.create_stack())
        return (_g.error = ERR_CREATE_STACK);

    _g.step = game_step::VSSHE_GROUP;
    return SUCCESS;
}

game_error referee::step_alice_mix(blob& mix, blob& proof) {
    if (_g.error)
        return ERR_GAME_OVER;
    if (_g.step != game_step::VSSHE_GROUP)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.load_stack(mix, proof))
        return (_g.error = ERR_ALICE_MIX);

    _g.step = game_step::ALICE_MIX;
    return SUCCESS;
}

game_error referee::step_bob_mix(blob& mix, blob& proof) {
    if (_g.error)
        return ERR_GAME_OVER;
    if (_g.step != game_step::ALICE_MIX)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.load_stack(mix, proof))
        return (_g.error = ERR_BOB_MIX);

    _g.step = game_step::BOB_MIX;
    return SUCCESS;
}

game_error referee::step_final_mix(blob& mix, blob& proof) {
    if (_g.error)
        return ERR_GAME_OVER;
    if (_g.step != game_step::BOB_MIX)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.shuffle_stack(mix, proof))
        return (_g.error = ERR_FINAL_MIX);

    _g.step = game_step::FINAL_MIX;

    return SUCCESS;
}

game_error referee::step_take_cards_from_stack() {
    if (_g.error)
        return ERR_GAME_OVER;
    if (_g.step != game_step::FINAL_MIX)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.take_cards_from_stack(NUM_CARDS))
        return (_g.error = ERR_TAKE_CARDS_FROM_STACK);

    _g.step = game_step::TAKE_CARDS_FROM_STACK;
    return SUCCESS;
}

game_error referee::step_open_private_cards(int player_id, blob& alice_proofs, blob& bob_proofs) {
    game_error res;
    if (_g.error)
        return ERR_GAME_OVER;
    if (_g.step != game_step::TAKE_CARDS_FROM_STACK)
        return (_g.error = ERR_INVALID_MOVE);

    if ((res=open_private_cards_impl(player_id, alice_proofs, bob_proofs)))
        return res;
    
    _g.step = game_step::OPEN_PRIVATE_CARDS;

    return SUCCESS;
}

game_error referee::open_private_cards_impl(int player_id, blob& alice_proofs, blob& bob_proofs) {
    alice_proofs.set_auto_rewind(false);
    bob_proofs.set_auto_rewind(false);    
    alice_proofs.rewind();
    bob_proofs.rewind();
    auto& player = _g.players[player_id];
    for(auto i=0; i<NUM_PRIVATE_CARDS; i++) {
        auto card_index = private_card_index(player_id, i);
        if (_eve.self_card_secret(card_index))
            return (_g.error = ERR_OPEN_PRIVATE_SELF_SECRET);
        if (_eve.verify_card_secret(card_index, alice_proofs))
            return ERR_OPEN_PRIVATE_VERIFY_ALICE_SECRET;
        if (_eve.verify_card_secret(card_index, bob_proofs))
            return ERR_OPEN_PRIVATE_VERIFY_BOB_SECRET;
        if (_eve.open_card(card_index))
            return ERR_OPEN_PRIVATE_OPEN_CARD;
        player.cards[i] = _eve.get_open_card(card_index);
    }
    return SUCCESS;
}

game_error referee::step_open_public_cards(blob& alice_proofs, blob& bob_proofs) {
    if (_g.error)
        return ERR_GAME_OVER;
    if (_g.step != game_step::OPEN_PRIVATE_CARDS)
        return (_g.error = ERR_INVALID_MOVE);

    alice_proofs.set_auto_rewind(false);
    bob_proofs.set_auto_rewind(false);    
    alice_proofs.rewind();
    bob_proofs.rewind();

    for(auto i=0; i<NUM_PUBLIC_CARDS; i++) {
        auto card_index = public_card_index(i);
        if (_eve.self_card_secret(card_index))
            return (_g.error = ERR_OPEN_PUBLIC_SELF_SECRET);
        if (_eve.verify_card_secret(card_index, alice_proofs))
            return ERR_OPEN_PUBLIC_VERIFY_ALICE_SECRET;
        if (_eve.verify_card_secret(card_index, bob_proofs))
            return ERR_OPEN_PUBLIC_VERIFY_BOB_SECRET;
        if (_eve.open_card(card_index))
            return ERR_OPEN_PUBLIC_OPEN_CARD;
        _g.public_cards[i] = _eve.get_open_card(card_index);
    }
    
    _g.step = game_step::OPEN_PUBLIC_CARDS;

    return SUCCESS;
}

game_error referee::step_open_opponent_cards(int player_id, blob& alice_proofs, blob& bob_proofs) {
    game_error res;
    if (_g.error)
        return ERR_GAME_OVER;
    if (_g.step != game_step::OPEN_PUBLIC_CARDS)
        return (_g.error = ERR_INVALID_MOVE);

    if ((res=open_private_cards_impl(player_id, alice_proofs, bob_proofs)))
        return res;

    if ((res=decide_winner()))
        return res;
    
    _g.step = game_step::GAME_OVER;
    
    _g.dump();

    return SUCCESS;
}

game_error referee::decide_winner() {
    return _g.decide_winner();
}


} // namespace poker