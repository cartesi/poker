#ifndef VERIFIER_H
#define VERIFIER_H

#include <istream>
#include "common.h"
#include "codec.h"
#include "referee.h"
#include <memory>

namespace poker {

/*
* Off-line game verifier
*/
class verifier {
    referee _r;
    blob _alice_key;
    blob _alice_private_cards_proof;
    blob _bob_private_cards_proof;
    blob _bet_card_proof;
    std::vector<std::unique_ptr<message>> _messages;
public:
    verifier();
    virtual ~verifier();
    game_error verify(std::istream& logfile);
    game_state& game() { return _r.game(); }
private:
    game_error handle_vtmf(msg_vtmf* msg); 
    game_error handle_vtmf_response(msg_vtmf_response* msg);
    game_error handle_vsshe(msg_vsshe* msg);
    game_error handle_vsshe_response(msg_vsshe_response* msg);
    game_error handle_bob_private_cards(msg_bob_private_cards* msg);
    game_error handle_bet_request(msg_bet_request* msg);
    game_error handle_card_proof(msg_card_proof* msg);
};

}

#endif