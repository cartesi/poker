#ifndef GAME_PLAYBACK_H
#define GAME_PLAYBACK_H

#include <istream>
#include <vector>
#include <memory>
#include <functional>
#include "common.h"
#include "codec.h"
#include "referee.h"
#include "messages.h"


namespace poker {

class game_playback {
    referee _r;
    blob _alice_key;
    blob _alice_private_cards_proof;
    blob _bob_private_cards_proof;
    blob _bet_card_proof;
    std::vector<std::unique_ptr<message>> _messages;
    int _last_player_id; // sender of the last msg replayed
public:
    game_playback();
    virtual ~game_playback();
    game_error playback(std::istream& logfile, std::function<game_error(message*)> visitor = NULL);
    game_state& game() { return _r.game(); }
    int last_player_id() { return _last_player_id; }

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