#ifndef PLAYER_H
#define PLAYER_H

#include <map>
#include "referee.h"
#include "codec.h"

namespace poker {

/*
* A player of the game
*/
class player {
protected:
    int _id;
    int _opponent_id;
    participant _p;
    referee _r;

    // saved initialization arguments
    money_t _alice_money, _bob_money, _big_blind;

    /// Saved card proofs to be used when opening cards
    /// This ensures that this player, opponent and referee always use the same proofs
    blob _my_key;
    blob _proof_of_their_cards;
    std::map<game_step, blob> _public_proofs;

public:
    player(int id);
    virtual ~player();

    game_state& game() { return _r.game(); }

    /// Game initialization.
    /// alice is assumed to be the small blind
    game_error init(money_t alice_money, money_t bob_money, money_t big_blind);

    /// Creates a handshake request.
    /// Only Alice is allowed to start a handshake
    /// msg_out must be sent to Bob
    game_error create_handshake(blob& msg_out);

    /// Processes a handshake message (msg_in) from the opponent player.
    /// Returns:
    ///  SUCCESS     - Handshake is complete
    ///  CONTINIUED  - Another message from the opponent is needed
    ///                and this method must be called again
    ///  Any other non-zero value is considered an error
    ///
    /// Upon successful return, checl msg_out.empty() to determine
    /// if it must be sent to the opponent
    game_error process_handshake(blob& msg_in, blob& msg_out);

    /// Creates a bet request message (msg_out)
    /// Returns:
    ///   SUCCESS     - Bet is complete
    ///   CONTINIUED  - Bet is partially complete: msg_out needs to be sent to
    ///                to the opponent and their response processed by process_bet()
    ///   Other non-zero codes indicate an error condition
    ///
    /// Upon successful result,current_player() indicates the next player to place a bet
    game_error create_bet(bet_type type, money_t amt, blob& msg_out);

    /// Processes a bet message from the opponent player.
    /// Returns
    ///   SUCCESS - the bet is complete
    ///   non-zero codes indicate error
    ///
    /// Upon successful return, checl msg_out.empty() to determine
    /// if it must be sent to the opponent.
    game_error process_bet(blob& msg_in, blob& msg_out);

    /// Property accessors
    game_step  step() { return _r.step(); }
    bool       game_over() { return _r.game().error || _r.step() == GAME_OVER; }
    game_error error() { return _r.game().error; }
    card_t     private_card(int index) { return _r.game().players[_id].cards[index]; }
    card_t     public_card(int index)  { return _r.game().public_cards[index]; }
    card_t     opponent_card(int index) { return _r.game().players[_opponent_id].cards[index]; }
    int        winner() { return _r.game().winner; }
    int        current_player() { return _r.game().current_player; }

private:
    /// message handlers
    game_error handle_vtmf(msg_vtmf* msgin, message** out);
    game_error handle_vtmf_response(msg_vtmf_response* msgin, message** out);
    game_error handle_vsshe(msg_vsshe* msgin, message** out);
    game_error handle_vsshe_response(msg_vsshe_response* msgin, message** out);
    game_error handle_bob_private_cards(msg_bob_private_cards* msgin);
    game_error handle_bet_request(msg_bet_request* msgin, message** out);
    game_error handle_card_proof(msg_card_proof* msgin);

    game_error write_cards_proof(game_step step, blob& proof);
    game_error generate_key(blob& key);
    game_error load_opponent_key(blob &key);
    game_error make_card_proof(blob& proof, int start_card_ix, int count);
    game_error open_opponent_cards(blob& their_proof);
    game_error deal_cards();
    game_error prove_opponent_cards(blob& proofs);
    game_error open_public_cards(game_step step, blob& my_proof, blob& their_proof);
    game_error open_private_cards(blob& their_proof);

};

} // namespace poker
#endif // PLAYER_H
