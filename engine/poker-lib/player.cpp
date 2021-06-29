#include "player.h"

namespace poker {

player::player(int id)
    : _id(id),  _opponent_id(_id==ALICE ? BOB : ALICE),
      _alice_money(0), _bob_money(0), _big_blind(0),
      _p(participant(id, 3, false))
{
}

player::~player() {
}

game_error player::init(money_t alice_money, money_t bob_money, money_t big_blind) {
    game_error res;
    if (!(res=_r.step_init_game(alice_money, bob_money, big_blind)))
        return res;

    _alice_money = alice_money;
    _bob_money = bob_money;
    _big_blind = big_blind;

    return SUCCESS;
}

game_error player::create_handshake(blob& msg_out) {
    game_error res;
    if (_id != ALICE)
        return PRR_INVALID_PLAYER;

    msg_vtmf msgout;
    msgout.alice_money = _alice_money;
    msgout.bob_money = _bob_money;
    msgout.big_blind = _big_blind;

    if ((res=_p.create_group(msgout.vtmf)))
        return res;
    if ((res=_r.step_vtmf_group(msgout.vtmf)))
        return res;

    if ((res=_p.generate_key(_my_key)))
        return res;
    msgout.alice_key = _my_key;
    msgout.write(msg_out.out());
    return SUCCESS;
}

game_error player::process_handshake(blob& msg_in, blob& msg_out) {
    game_error res;
    auto& is = msg_in.in(false);
    auto& os = msg_out.out();
    message* msgin = NULL;
    if ((res=message::decode(is, &msgin)))
        return res;

    message* msgout = NULL;
    switch(msgin->msgtype) {
        case MSG_VTMF:
            res = handle_vtmf((msg_vtmf*)msgin, &msgout);
            std::cout << "******* > " << msgout << std::endl;
            break;
        case MSG_VTMF_RESPONSE:
            res = handle_vtmf_response((msg_vtmf_response*)msgin, &msgout);
            break;
        case MSG_VSSHE:
            res = handle_vsshe((msg_vsshe*)msgin, &msgout);
            break;
        case MSG_VSSHE_RESPONSE:
            res = handle_vsshe_response((msg_vsshe_response*)msgin, &msgout);
            break;
        case MSG_BOB_PRIVATE_CARDS:
            res =  handle_bob_private_cards((msg_bob_private_cards*)msgin);
            break;
        default:
            return PRR_INVALID_MSG_TYPE;
    }
    std::cout << "res = " << res << std::endl;
    if ((res==SUCCESS || res==CONTINUED) && msgout)
        msgout->write(os);
    
    delete msgin;
    delete msgout;
    return res;
}

game_error player::handle_vtmf(msg_vtmf* msgin, message** out) {
    std::cout << "handle_vtmf...\n";
    game_error res;    
    auto msgout = new msg_vtmf_response();
    *out = msgout;

    if (_id != BOB)
        return PRR_INVALID_PLAYER;

    if (_alice_money != msgin->alice_money)
        return PRR_ALICE_MONEY_DIVERGES;
    if (_bob_money != msgin->bob_money)
        return PRR_BOB_MONEY_DIVERGES;
    if (_big_blind != msgin->big_blind)
        return PRR_BIG_BLIND_DIVERGES;

    msgout->alice_money = _alice_money;
    msgout->bob_money = _bob_money;
    msgout->big_blind = _big_blind;

    if (_p.load_group(msgin->vtmf))
        return PRR_CREATE_VTMF;
    if ((res=_r.step_vtmf_group(msgin->vtmf)))
        return res;

    if ((res=_p.generate_key(_my_key)))
        return res;
    msgout->bob_key = _my_key;

    if ((res=load_opponent_key(msgin->alice_key)))
        return res;

    return CONTINUED;
}

game_error player::handle_vtmf_response(msg_vtmf_response* msgin, message** out) {
    std::cout << "handle_vtmf_response...\n";
    if (_id != ALICE)
        return PRR_INVALID_PLAYER;

    game_error res;
    auto msgout = new  msg_vsshe();
    *out = msgout;

    if ((res=load_opponent_key(msgin->bob_key)))
        return res;

    if (_alice_money != msgin->alice_money)
        return PRR_ALICE_MONEY_DIVERGES;
    if (_bob_money != msgin->bob_money)
        return PRR_BOB_MONEY_DIVERGES;
    if (_big_blind != msgin->big_blind)
        return PRR_BIG_BLIND_DIVERGES;
    
    if ((res=_p.create_vsshe_group(msgout->vsshe)))
        return res; ////PRR_CREATE_VSSHE;
    if ((res=_r.step_vsshe_group(msgout->vsshe)))
        return res;
    if (_p.create_stack())
        return PRR_CREATE_STACK;

    if (_p.shuffle_stack(msgout->stack, msgout->stack_proof))
        return PRR_SHUFFLE_STACK;
    if ((res=_r.step_alice_mix(msgout->stack, msgout->stack_proof)))
        return res;

    return CONTINUED;
}

game_error player::handle_vsshe(msg_vsshe* msgin, message** out) {
    std::cout << "handle_vsshe...\n";
    if (_id != BOB)
        return PRR_INVALID_PLAYER;

    game_error res;
    auto msgout = new msg_vsshe_response();
    *out = msgout;
    
    if ((res=_p.load_vsshe_group(msgin->vsshe)))
        return res; ////PRR_CREATE_VSSHE;
    if ((res=_r.step_vsshe_group(msgin->vsshe)))
        return res;
    if (_p.create_stack())
        return PRR_CREATE_STACK;

    if (_p.load_stack(msgin->stack, msgin->stack_proof))
        return PRR_LOAD_STACK;
    if ((res=_r.step_alice_mix(msgin->stack, msgin->stack_proof)))
        return res;

    if (_p.shuffle_stack(msgout->stack, msgout->stack_proof))
        return PRR_SHUFFLE_STACK;
    if ((res=_r.step_bob_mix(msgout->stack, msgout->stack_proof)))
        return res;

    blob mix, proof;
    if ((res=_r.step_final_mix(mix, proof)))
        return res;
    if (_p.load_stack(mix, proof))
        return PRR_LOAD_FINAL_STACK;

    if ((res=deal_cards()))
        return res;

    // Bob allowing Alice to see her private cards
    if ((res=make_card_proof(_proof_of_their_cards, private_card_index(_opponent_id, 0), NUM_PRIVATE_CARDS)))
        return res;
    msgout->cards_proof = _proof_of_their_cards;
    
    return CONTINUED;
}

game_error player::handle_vsshe_response(msg_vsshe_response* msgin, message** out) {
    std::cout << "handle_vsshe_response...\n";
    if (_id != ALICE)
        return PRR_INVALID_PLAYER;

    game_error res;
    auto msgout = new msg_bob_private_cards();
    *out = msgout;

    if (_p.load_stack(msgin->stack, msgin->stack_proof))
        return PRR_LOAD_STACK;
    if ((res=_r.step_bob_mix(msgin->stack, msgin->stack_proof)))
        return res;

    blob mix, proof;
    if ((res=_r.step_final_mix(mix, proof)))
        return res;
    if (_p.load_stack(mix, proof))
        return PRR_LOAD_FINAL_STACK;

    if ((res=deal_cards()))
        return res;

    // Alice opens her private cards
    if ((res=open_private_cards(msgin->cards_proof)))
        return res;

    if ((res=make_card_proof(_proof_of_their_cards, private_card_index(_opponent_id, 0), NUM_PRIVATE_CARDS)))
        return res;
    msgout->cards_proof = _proof_of_their_cards;

    return SUCCESS;
}

game_error player::handle_bob_private_cards(msg_bob_private_cards* msgin) {
    std::cout << "handle_bob_private_cards...\n";
    game_error res;    
    if (_id != BOB)
        return PRR_INVALID_PLAYER;
    
    if ((res=open_private_cards(msgin->cards_proof)))
        return res;

    return SUCCESS;
}

game_error player::create_bet(bet_type type, money_t amt, blob& msg_out) {
    std::cout << "create_bet...\n";
    game_error res;
    msg_bet_request msgout;

    auto step = _r.step();
    msgout.player_id = _id;
    msgout.type = type;
    msgout.amt = amt;
    if ((res=_r.bet(_id, type, amt)))
        return res;

    auto step_changed = _r.step() != step;
    if (step_changed) {
        int first_card, count;
        if (_r.step() == game_step::OPEN_OPONENT_CARDS) {
            first_card = private_card_index(_id, 0);
            count = 2;
        } else {
            if ((res=public_cards_range(_r.step(), first_card, count)))
                return res;
        }
        if ((res=make_card_proof(msgout.cards_proof, first_card, count)))
            return res;
         _public_proofs[_r.step()] = msgout.cards_proof;

    }
    msgout.write(msg_out.out());
    return step_changed ? CONTINUED : SUCCESS;
}

game_error player::process_bet(blob& msg_in, blob& out) {
    game_error res;
    auto& is = msg_in.in(false);
    auto& os = out.out();
    message* msgin = NULL;
    if ((res=message::decode(is, &msgin)))
        return res;

    message* msgout = NULL;
    switch(msgin->msgtype) {
        case MSG_BET_REQUEST:
            res = handle_bet_request((msg_bet_request*)msgin, &msgout);
            break;
        case MSG_CARD_PROOF:
            res = handle_card_proof((msg_card_proof*)msgin);
            break;
        default:
            return PRR_INVALID_MSG_TYPE;
    }
    if ((res==SUCCESS || res==CONTINUED) && msgout)
        msgout->write(os);
    delete msgin;
    delete msgout;
    return res;
}

game_error player::handle_bet_request(msg_bet_request* msgin, message** out) {
    std::cout << "...handle_bet_request" << std::endl;
    game_error res;

    auto step = _r.step();
    if ((_r.bet(opponent_id(_id), msgin->type, msgin->amt)))
        return res;

    auto step_changed = _r.step() != step;
    if (step_changed) {
        auto msgout = new msg_card_proof();
        *out = msgout;
        if (_r.step() == game_step::OPEN_OPONENT_CARDS) {
            if ((res=open_opponent_cards(msgin->cards_proof)))
                return res;
            if ((res=make_card_proof(msgout->cards_proof , private_card_index(_id, 0), NUM_PRIVATE_CARDS)))
                return res;
        } else {
            int first_card, count;
            if ((res=public_cards_range(_r.step(), first_card, count)))
                return res;
            if ((res=make_card_proof(msgout->cards_proof , first_card, count)))
                return res;
            if ((res=open_public_cards(_r.step(), msgout->cards_proof, msgin->cards_proof)))
                return res;
        }
    }
    return SUCCESS;
}

game_error player::handle_card_proof(msg_card_proof* msgin) {
    std::cout << "...handle_card_proof" << std::endl;
    game_error res;
    if (_r.step() == game_step::OPEN_OPONENT_CARDS) {
        if ((res=open_opponent_cards(msgin->cards_proof)))
            return res;
    } else {
        auto p = _public_proofs.find(_r.step());
        if (p == _public_proofs.end())
            return PRR_PROOF_NOT_FOUND;
        auto my_proof = p->second;
        if ((res=open_public_cards(_r.step(), my_proof, msgin->cards_proof)))
            return res;
    }
    return SUCCESS;
}

game_error player::make_card_proof(blob& dst, int start_card_ix, int count) {
    for(auto i=start_card_ix; i < start_card_ix+count; i++) {
        if (_p.prove_card_secret(i, dst))
            return PRR_PROVE_OPPONENT_PRIVATE;
    }
    return SUCCESS;
}

game_error player::generate_key(blob& key) {
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
    if ((res=_r.step_load_keys(alice_key, bob_key, eve_key)))
        return res;

    if (_p.load_their_key(key))
        return PRR_LOAD_KEY;
    if (_p.load_their_key(eve_key))
        return PRR_LOAD_EVE_KEY;

    if ((res=_p.finalize_key_generation()))
        return res; ////PRR_FINALIZE_KEY_GENERATION;

    _my_key.clear();
    return SUCCESS;
}

game_error player::deal_cards() {
    game_error res;
    if (_p.take_cards_from_stack(NUM_CARDS))
        return PRR_TAKE_CARDS_FROM_STACK;
    if ((res=_r.step_take_cards_from_stack()))
        return res;

    return SUCCESS;
}

game_error player::prove_opponent_cards(blob& proofs) {
    for(auto i=0; i<NUM_PRIVATE_CARDS; i++) {
        auto card_index = private_card_index(_opponent_id, i);
        if (_p.prove_card_secret(card_index, proofs))
            return PRR_PROVE_OPPONENT_PRIVATE;
    }
    return SUCCESS;
}

game_error player::open_private_cards(blob& their_proof) {
    game_error res;
    blob my_proofs;
    for(auto i=0; i<NUM_PRIVATE_CARDS; i++) {
        auto card_index = private_card_index(_id, i);
        if (_p.prove_card_secret(card_index, my_proofs))
            return PRR_OPEN_MY_PRIVATE_CARDS;
    }
    auto alice_proofs = _id == ALICE ? my_proofs : their_proof;
    auto bob_proofs = _id == BOB ? my_proofs : their_proof;
    if ((res=_r.step_open_private_cards(_id, alice_proofs, bob_proofs)))
        return res;

    return SUCCESS;
}

game_error player::open_public_cards(game_step step, blob& my_proof, blob& their_proof) {
    game_error res;
    blob& alice_proof = _id == ALICE ? my_proof : their_proof;
    blob& bob_proof   = _id == BOB   ? my_proof : their_proof;

    if ((res=_r.open_public_cards(step, alice_proof, bob_proof)))
        return res;

    return SUCCESS;
}

game_error player::open_opponent_cards(blob& their_proof) {
    game_error res;

    auto& my_proof = _proof_of_their_cards;
    auto alice_proofs = _id == ALICE ? my_proof : their_proof;
    auto bob_proofs = _id == BOB ? my_proof : their_proof;
    if ((res=_r.step_open_opponent_cards(_opponent_id, alice_proofs, bob_proofs)))
        return res;

    return SUCCESS;
}

}