#include "verifier.h"

namespace poker {

verifier::verifier() {
}

verifier:: ~verifier() {
}

game_error verifier::verify(std::istream& logfile) {
    game_error res;
    logger << "*** verifying game...\n";
    message* msg = NULL;
    while(SUCCESS == (res=message::decode(logfile, &msg))) {
        logger << "*** " << msg->to_string() << std::endl;
        switch(msg->msgtype) {
            case MSG_VTMF:
                res = handle_vtmf((msg_vtmf*)msg);
                break;
            case MSG_VTMF_RESPONSE:
                res = handle_vtmf_response((msg_vtmf_response*)msg);
                break;
            case MSG_VSSHE:
                res = handle_vsshe((msg_vsshe*)msg);
                break;
            case MSG_VSSHE_RESPONSE:
                res = handle_vsshe_response((msg_vsshe_response*)msg);
                break;
            case MSG_BOB_PRIVATE_CARDS:
                res = handle_bob_private_cards((msg_bob_private_cards*)msg);
                break;
            case MSG_BET_REQUEST:
                res = handle_bet_request((msg_bet_request*)msg);
                break;
            case MSG_CARD_PROOF:
                res = handle_card_proof((msg_card_proof*)msg);
                break;
            default:
                res = VRF_UNKNOWN_MSG_TYPE;
        }
        delete msg;
        msg = NULL;
        if (res || _r.step() == game_step::GAME_OVER)
            break;
    }
    logger << "*** verification finished. code: " << res << std::endl;
    return SUCCESS;
}

game_error verifier::handle_vtmf(msg_vtmf* msg) {
    game_error res;

    if ((res=_r.step_init_game(msg->alice_money, msg->bob_money, msg->big_blind)))
        return res;

    if ((res=_r.step_vtmf_group(msg->vtmf)))
        return res;

    _alice_key = msg->alice_key;
    return SUCCESS;
}

game_error verifier::handle_vtmf_response(msg_vtmf_response* msg) {
    game_error res;

    blob notused_eve_key;
    if ((res=_r.step_load_keys(_alice_key, msg->bob_key, notused_eve_key)))
        return res;

    return SUCCESS;
}

game_error verifier::handle_vsshe(msg_vsshe* msg) {
    game_error res;

    if ((res=_r.step_vsshe_group(msg->vsshe)))
        return res;

    if ((res=_r.step_alice_mix(msg->stack, msg->stack_proof)))
        return res;

    return SUCCESS;
}

game_error verifier::handle_vsshe_response(msg_vsshe_response* msg) {
    game_error res;

    if ((res=_r.step_bob_mix(msg->stack, msg->stack_proof)))
        return res;

    blob notused1, notused2;
    if ((res=_r.step_final_mix(notused1, notused2)))
        return res;

    if ((res=_r.step_take_cards_from_stack()))
        return res;

    _alice_private_cards_proof = msg->cards_proof;

    return SUCCESS;
}

game_error verifier::handle_bob_private_cards(msg_bob_private_cards* msg) {
    game_error res;

    _bob_private_cards_proof = msg->cards_proof;

    blob notused;
    if ((res=_r.step_open_private_cards(VERIFIER, notused, notused)))
        return res;

    return SUCCESS;
}

game_error verifier::handle_bet_request(msg_bet_request* msg) {
    game_error res;

    if (msg->player_id != _r.game().current_player)
        return VRF_CURRENT_PLAYER_MISMATCH;

    _bet_card_proof.clear();
    auto step = _r.step();
    if ((res=_r.bet(msg->player_id, msg->type, msg->amt))) {
        logger << "BET ERROR " << res << std::endl;
        return res;
    }
    auto step_changed = _r.step() != step;
    if (step_changed) {
        logger << "step_changed! " << _r.step() << std::endl; 
        _bet_card_proof = msg->cards_proof;
    }
    return SUCCESS;
}

game_error verifier::handle_card_proof(msg_card_proof* msg) {
    game_error res;
    int first_card, count;

    if (_r.step() == game_step::OPEN_OPONENT_CARDS) {
        logger << "game_step::OPEN_OPONENT_CARDS)" << std::endl; 
        blob& alice_proof = msg->player_id == ALICE ? msg->cards_proof : _bet_card_proof;
        blob& bob_proof   = msg->player_id == BOB   ? msg->cards_proof : _bet_card_proof;

        if ((res=_r.open_private_cards(BOB, alice_proof, _bob_private_cards_proof)))
            return VRF_OPEN_BOB_PRIVATE_CARDS;

        if ((res=_r.step_open_opponent_cards(ALICE, _alice_private_cards_proof, bob_proof)))
            return res;
    } 
    else {
        int first_card, count;
        if ((res=public_cards_range(_r.step(), first_card, count)))
            return res;
        blob& alice_proof = msg->player_id == ALICE ? msg->cards_proof : _bet_card_proof;
        blob& bob_proof   = msg->player_id == BOB   ? msg->cards_proof : _bet_card_proof;
        if ((res=_r.open_public_cards(_r.step(), alice_proof, bob_proof)))
            return res;
    }
    return SUCCESS;
}

}
