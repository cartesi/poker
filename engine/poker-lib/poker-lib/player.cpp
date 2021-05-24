#include "player.h"

namespace poker {

player::player(int id) : _id(id), _opponent_id(_id==ALICE ? BOB : ALICE), _p(participant(id, 3, false)) {
}

player::~player() {
}

game_error player::init_game(money_t alice_money, money_t bob_money) {
    game_error res;
    if (!(res=_e.step_init_game(alice_money, bob_money)))
        return res;
    return SUCCESS;
}

game_error player::create_vtmf(blob &vtmf) {
    game_error res;
    if (_id != ALICE)
        return PRR_INVALID_FOR_PLAYER;
    if (_p.create_group(vtmf))
        return PRR_CREATE_VTMF;
    if ((res=_e.step_vtmf_group(vtmf)))
        return res;
    return SUCCESS;
}

game_error player::load_vtmf(blob &vtmf) {
    game_error res;
    if (_id != BOB)
        return PRR_INVALID_FOR_PLAYER;
    if (_p.load_group(vtmf))
        return PRR_CREATE_VTMF;
    if ((res=_e.step_vtmf_group(vtmf)))
        return res;
    return SUCCESS;
}

game_error player::generate_key(blob &key) {
    game_error res;
    if (_p.generate_key(_my_key))
        return PRR_GENERATE_KEY;
    key.set_data(_my_key.get_data());
    return SUCCESS;
}

game_error player::load_opponent_key(blob &key) {
    game_error res;
 
    blob alice_key = _id == ALICE ? _my_key : key;
    blob bob_key = _id == BOB ? _my_key : key;
    blob eve_key;
    if ((res=_e.step_load_keys(alice_key, bob_key, eve_key)))
        return res;

    if (_p.load_their_key(key))
        return PRR_LOAD_KEY;
    if (_p.load_their_key(eve_key))
        return PRR_LOAD_EVE_KEY;
            
    if (_p.finalize_key_generation())
        return PRR_FINALIZE_KEY_GENERATION;

    _my_key.clear();
    return SUCCESS;
}

game_error player::create_vsshe(blob &vsshe) {
    game_error res;
    if (_id != ALICE)
        return PRR_INVALID_FOR_PLAYER;
    if (_p.create_vsshe_group(vsshe))
        return PRR_CREATE_VSSHE;
    if ((res=_e.step_vsshe_group(vsshe)))
        return res;
    if (_p.create_stack())
        return PRR_CREATE_STACK;
    
    return SUCCESS;
}

game_error player::load_vsshe(blob &vsshe) {
    game_error res;
    if (_id != BOB)
        return PRR_INVALID_FOR_PLAYER;
    if (_p.load_vsshe_group(vsshe))
        return PRR_CREATE_VSSHE;
    if ((res=_e.step_vsshe_group(vsshe)))
        return res;
    if (_p.create_stack())
        return PRR_CREATE_STACK;

    return SUCCESS;
}

game_error player::shuffle_stack(blob& mix, blob& proof) {
    game_error res;
    if (_p.shuffle_stack(mix, proof))
        return PRR_SHUFFLE_STACK;
    if (_id == ALICE) {
        if ((res=_e.step_alice_mix(mix, proof)))
            return res;
    }  else {
        if ((res=_e.step_bob_mix(mix, proof)))
            return res;
        blob final_mix, final_proof;
        if ((res=_e.step_final_mix(final_mix, final_proof)))
            return res;
        if (_p.load_stack(final_mix, final_proof))
            return PRR_LOAD_FINAL_STACK;
    }
    return SUCCESS;
}

game_error player::load_stack(blob& mix, blob& proof) {
    game_error res;
    if (_p.load_stack(mix, proof))
        return PRR_LOAD_STACK;
    if (_id == ALICE) {
        if ((res=_e.step_bob_mix(mix, proof)))
            return res;
        blob final_mix, final_proof;
        if ((res=_e.step_final_mix(final_mix, final_proof)))
            return res;
        if (_p.load_stack(final_mix, final_proof))
            return PRR_LOAD_FINAL_STACK;
    } else {
        if ((res=_e.step_alice_mix(mix, proof)))
            return res;
    }
    return SUCCESS;
}

game_error player::deal_cards() {
    game_error res;
    if (_p.take_cards_from_stack(NUM_CARDS))
        return PRR_TAKE_CARDS_FROM_STACK;
    if ((res=_e.step_take_cards_from_stack()))
        return res;

    for(auto i=0; i<NUM_PUBLIC_CARDS; i++) {
        auto card_index = public_card_index(i);
        if (_p.prove_card_secret(card_index, _my_public_card_proofs))
            return PRR_PROOVE_MY_PUBLIC_CARDS;
    }
    return SUCCESS;
}

game_error player::proove_opponent_cards(blob& proofs) {
    for(auto i=0; i<NUM_PRIVATE_CARDS; i++) {
        auto card_index = private_card_index(_opponent_id, i);
        if (_p.prove_card_secret(card_index, proofs))
            return PRR_PROVE_OPPONENT_PRIVATE; 
    }
    return SUCCESS;
}

game_error player::open_private_cards(blob& their_proofs) {
    game_error res;
    blob my_proofs;
    for(auto i=0; i<NUM_PRIVATE_CARDS; i++) {
        auto card_index = private_card_index(_id, i);
        if (_p.prove_card_secret(card_index, my_proofs))
            return PRR_OPEN_MY_PRIVATE_CARDS; 
    }
    auto alice_proofs = _id == ALICE ? my_proofs : their_proofs;
    auto bob_proofs = _id == BOB ? my_proofs : their_proofs;
    if ((res=_e.step_open_private_cards(_id, alice_proofs, bob_proofs)))
        return res;

    return SUCCESS;
}

game_error player::proove_public_cards(blob& proofs) {
    for(auto i=0; i<NUM_PUBLIC_CARDS; i++) {
        auto card_index = public_card_index(i);
        if (_p.prove_card_secret(card_index, proofs))
            return PRR_PROOVE_PUBLIC_CARDS;
    }
    _my_public_card_proofs.set_data(proofs.get_data());
    return SUCCESS;
}

game_error player::open_public_cards(blob& their_proofs) {
    game_error res;
    auto alice_proofs = _id == ALICE ? _my_public_card_proofs : their_proofs;
    auto bob_proofs   = _id == BOB ? _my_public_card_proofs : their_proofs;
    if ((res=_e.step_open_public_cards(alice_proofs, bob_proofs)))
        return res;
    
    return SUCCESS;
}

game_error player::proove_my_cards(blob& proofs) {
    for(auto i=0; i<NUM_PRIVATE_CARDS; i++) {
        auto card_index = private_card_index(_id, i);
        if (_p.prove_card_secret(card_index, proofs))
            return PRR_PROVE_OPPONENT_PRIVATE; 
    }
    return SUCCESS;
}

game_error player::open_opponent_cards(blob& their_proofs) {
    game_error res;
    blob my_proofs;
    for(auto i=0; i<NUM_PRIVATE_CARDS; i++) {
        auto card_index = private_card_index(_opponent_id, i);
        if (_p.prove_card_secret(card_index, my_proofs))
            return PRR_OPEN_MY_PRIVATE_CARDS; 
    }
    auto alice_proofs = _id == ALICE ? my_proofs : their_proofs;
    auto bob_proofs = _id == BOB ? my_proofs : their_proofs;
    if ((res=_e.step_open_opponent_cards(_opponent_id, alice_proofs, bob_proofs)))
        return res;

    return SUCCESS;
}

}