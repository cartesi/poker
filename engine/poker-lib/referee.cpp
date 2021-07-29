#include "referee.h"

#include "validator.h"

namespace poker {

referee::referee()
  : _step(game_step::INIT_GAME), _eve(participant(1+NUM_PLAYERS, NUM_PLAYERS, true /* predictable */))
{
}

referee::~referee() {
}

game_error referee::step_init_game(money_t alice_money, money_t bob_money, money_t big_blind) {
    if (_g.error)
        return ERR_GAME_OVER;
    if (_step != game_step::INIT_GAME)
        return (_g.error = ERR_INVALID_MOVE);

    _g.players[ALICE].total_funds = alice_money;
    _g.players[ALICE].bets = big_blind/((money_t)2);
    _g.players[BOB].total_funds = bob_money;
    _g.players[BOB].bets = big_blind;
    _g.big_blind = big_blind;

    _step = game_step::VTMF_GROUP;
    return SUCCESS;

}

game_error referee::step_vtmf_group(blob& g) {
    logger << "step_vtmf_group..." << std::endl;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::VTMF_GROUP)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.load_group(g))
        return (_g.error = ERR_VTMF_LOAD_FAILED);

    _step = game_step::LOAD_KEYS;
    return SUCCESS;
}

game_error referee::step_load_keys(blob& bob_key, blob& alice_key, /* out */ blob& eve_key) {
    logger << "step_load_keys..." << std::endl;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::LOAD_KEYS)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.generate_key(eve_key))
        return (_g.error = ERR_GENERATE_EVE_KEY);
    if (_eve.load_their_key(alice_key))
        return (_g.error = ERR_LOAD_ALICE_KEY);
    if (_eve.load_their_key(bob_key))
        return (_g.error = ERR_LOAD_BOB_KEY);
    if (_eve.finalize_key_generation())
        return (_g.error = ERR_FINALIZE_KEY_GENERATION);

    _step = game_step::VSSHE_GROUP;
    return SUCCESS;
}

game_error referee::step_vsshe_group(blob& vsshe) {
    logger << "step_vsshe_group..." << std::endl;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::VSSHE_GROUP)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.load_vsshe_group(vsshe))
        return (_g.error = ERR_VSSHE_GROUP);
    if (_eve.create_stack())
        return (_g.error = ERR_CREATE_STACK);

    _step = game_step::ALICE_MIX;
    return SUCCESS;
}

game_error referee::step_alice_mix(blob& mix, blob& proof) {
    logger << "step_alice_mix..." << std::endl;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::ALICE_MIX)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.load_stack(mix, proof))
        return (_g.error = ERR_ALICE_MIX);

    _step = game_step::BOB_MIX;
    return SUCCESS;
}

game_error referee::step_bob_mix(blob& mix, blob& proof) {
    logger << "step_bob_mix..." << std::endl;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::BOB_MIX)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.load_stack(mix, proof))
        return (_g.error = ERR_BOB_MIX);

    _step = game_step::FINAL_MIX;
    return SUCCESS;
}

game_error referee::step_final_mix(blob& mix, blob& proof) {
    logger << "step_final_mix..." << std::endl;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::FINAL_MIX)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.shuffle_stack(mix, proof))
        return (_g.error = ERR_FINAL_MIX);

    _step = game_step::TAKE_CARDS_FROM_STACK;
    return SUCCESS;
}

game_error referee::step_take_cards_from_stack() {
    logger << "step_take_cards_from_stack..." << std::endl;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::TAKE_CARDS_FROM_STACK)
        return (_g.error = ERR_INVALID_MOVE);

    if (_eve.take_cards_from_stack(NUM_CARDS))
        return (_g.error = ERR_TAKE_CARDS_FROM_STACK);

    _step = game_step::OPEN_PRIVATE_CARDS;
    return SUCCESS;
}

game_error referee::step_open_private_cards(int player_id, blob& alice_proofs, blob& bob_proofs) {
    logger << "step_open_private_cards..." << std::endl;
    game_error res;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::OPEN_PRIVATE_CARDS)
        return (_g.error = ERR_INVALID_MOVE);

    if (player_id != VERIFIER) {
        if ((res=open_private_cards(player_id, alice_proofs, bob_proofs)))
            return res;
    }    

    _step = game_step::PREFLOP_BET;
    return SUCCESS;
}

game_error referee::step_preflop_bet(int player_id, bet_type type, money_t amt) {
    logger << "step_preflop_bet..." << std::endl;
    game_error res;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::PREFLOP_BET)
        return (_g.error = ERR_INVALID_MOVE);
    if (player_id != _g.current_player)
        return (_g.error = ERR_NOT_PLAYER_TURN);

    if (_g.phase != PHS_PREFLOP)
        return (_g.error = ERR_BET_PHASE_MISMATCH);
    if ((res=compute_bet(type, amt, game_step::OPEN_FLOP)))
        return res;

    return SUCCESS;
}

game_error referee::step_open_flop(blob& alice_proofs, blob& bob_proofs) {
    logger << "step_open_flop..." << std::endl;
    game_error res;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::OPEN_FLOP)
        return (_g.error = ERR_INVALID_MOVE);

    if ((res=open_public_cards(alice_proofs, bob_proofs, flop_card_index(0), NUM_FLOP_CARDS)))
        return res;
    
    _step = game_step::FLOP_BET;
    return SUCCESS;
}

game_error referee::step_flop_bet(int player_id, bet_type type, money_t amt) {
    logger << "step_flop_bet..." << std::endl;
    game_error res;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::FLOP_BET)
        return (_g.error = ERR_INVALID_MOVE);
    if (player_id != _g.current_player)
        return (_g.error = ERR_NOT_PLAYER_TURN);

    if (_g.phase != PHS_FLOP)
        return (_g.error = ERR_BET_PHASE_MISMATCH);
    if ((res=compute_bet(type, amt, game_step::OPEN_TURN)))
        return res;

    return SUCCESS;
}

game_error referee::step_open_turn(blob& alice_proofs, blob& bob_proofs) {
    logger << "step_open_turn..." << std::endl;
    game_error res;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::OPEN_TURN)
        return (_g.error = ERR_INVALID_MOVE);

    if ((res=open_public_cards(alice_proofs, bob_proofs, turn_card_index(), 1)))
        return res;
    
    _step = game_step::TURN_BET;
    return SUCCESS;
}

game_error referee::step_turn_bet(int player_id, bet_type type, money_t amt) {
    logger << "step_turn_bet..." << std::endl;
    game_error res;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::TURN_BET)
        return (_g.error = ERR_INVALID_MOVE);
    if (player_id != _g.current_player)
        return (_g.error = ERR_NOT_PLAYER_TURN);

    if (_g.phase != PHS_TURN)
        return (_g.error = ERR_BET_PHASE_MISMATCH);
    if ((res=compute_bet(type, amt, game_step::OPEN_RIVER)))
        return res;

    return SUCCESS;
}

game_error referee::step_open_river(blob& alice_proofs, blob& bob_proofs) {
    logger << "step_open_river..." << std::endl;
    game_error res;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::OPEN_RIVER)
        return (_g.error = ERR_INVALID_MOVE);

    if ((res=open_public_cards(alice_proofs, bob_proofs, river_card_index(), 1)))
        return res;
    
    _step = game_step::RIVER_BET;
    return SUCCESS;
}

game_error referee::step_river_bet(int player_id, bet_type type, money_t amt) {
    logger << "step_river_bet..." << std::endl;
    game_error res;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::RIVER_BET)
        return (_g.error = ERR_INVALID_MOVE);
    if (player_id != _g.current_player)
        return (_g.error = ERR_NOT_PLAYER_TURN);


    if (_g.phase != PHS_RIVER)
        return (_g.error = ERR_BET_PHASE_MISMATCH);
    if ((res=compute_bet(type, amt, game_step::OPEN_OPONENT_CARDS)))
        return res;

    return SUCCESS;
}

game_error referee::bet(int player_id, bet_type type, money_t amt) {
    switch(_step) {
        case game_step::PREFLOP_BET:
            return step_preflop_bet(player_id, type, amt);
        case game_step::FLOP_BET:
            return step_flop_bet(player_id, type, amt);
        case game_step::TURN_BET:
            return step_turn_bet(player_id, type, amt);
        case game_step::RIVER_BET:
            return step_river_bet(player_id, type, amt);
        default:
            return ERR_BET_NOT_ALLOWED;
    }
}

// place bet, change game state and determine the next game step
game_error referee::compute_bet(bet_type type, money_t& amt, game_step next_step) {
    game_error res;
    auto phs = _g.phase;
    if ((res=place_bet(_g, type, amt)))
        return res;

    if (type == BET_FOLD && _g.phase == PHS_SHOWDOWN) {
        _step = game_step::GAME_OVER;
    } else {
        auto phs_changed = phs != _g.phase;
        if (phs_changed)
            _step = next_step;
    }
    return SUCCESS;
}

game_error referee::step_open_opponent_cards(int player_id, blob& alice_proofs, blob& bob_proofs) {
    logger << "step_open_opponent_cards..." << std::endl;
    game_error res;
    if (_g.error) return ERR_GAME_OVER;
    if (_step != game_step::OPEN_OPONENT_CARDS)
        return (_g.error = ERR_INVALID_MOVE);

    if ((res=open_private_cards(player_id, alice_proofs, bob_proofs)))
        return res;

    if ((res=decide_winner()))
        return res;
    
    _step = game_step::GAME_OVER;
    
    _g.dump();

    return SUCCESS;
}

game_error referee::open_public_cards(blob& alice_proofs, blob& bob_proofs, int first_card_index, int card_count) {
    logger << "open_public_cards(" << first_card_index << "," << card_count << ") ..." << std::endl;
    alice_proofs.set_auto_rewind(false);
    bob_proofs.set_auto_rewind(false);    
    alice_proofs.rewind();
    bob_proofs.rewind();
    auto first_pc = public_card_index(0);
    for(int i=0; i < card_count; i++) {
        auto card_index = i + first_card_index;
        if (_eve.self_card_secret(card_index))
            return (_g.error = ERR_OPEN_PUBLIC_SELF_SECRET);
        if (_eve.verify_card_secret(card_index, alice_proofs))
            return (_g.error = ERR_OPEN_PUBLIC_VERIFY_ALICE_SECRET);
        if (_eve.verify_card_secret(card_index, bob_proofs))
            return (_g.error = ERR_OPEN_PUBLIC_VERIFY_BOB_SECRET);
        if (_eve.open_card(card_index))
            return (_g.error = ERR_OPEN_PUBLIC_OPEN_CARD);
        
        _g.public_cards[card_index - first_pc] = _eve.get_open_card(card_index);
    }
    return SUCCESS;
}

game_error referee::open_public_cards(game_step step, blob& alice_proof, blob bob_proof) {
    game_error res;
    switch(step) {
        case OPEN_FLOP:
            if ((res=step_open_flop(alice_proof, bob_proof)))
                return res;
            break;
        case OPEN_TURN:
            if ((res=step_open_turn(alice_proof, bob_proof)))
                return res;
            break;
        case OPEN_RIVER:
            if ((res=step_open_river(alice_proof, bob_proof)))
                return res;
            break;
        default:
            return ERR_INVALID_OPEN_CARDS_STEP;
    }
    return SUCCESS;

}

game_error referee::open_private_cards(int player_id, blob& alice_proofs, blob& bob_proofs) {
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
            return (_g.error = ERR_OPEN_PRIVATE_VERIFY_ALICE_SECRET);
        if (_eve.verify_card_secret(card_index, bob_proofs))
            return (_g.error = ERR_OPEN_PRIVATE_VERIFY_BOB_SECRET);
        if (_eve.open_card(card_index))
            return (_g.error = ERR_OPEN_PRIVATE_OPEN_CARD);
        player.cards[i] = _eve.get_open_card(card_index);
    }
    return SUCCESS;
}

game_error referee::decide_winner() {
    return poker::decide_winner(_g);
}


} // namespace poker