#ifndef PARTICIPANT_H
#define PARTICIPANT_H

#include <libTMCG.hh>
#include <string>
#include "common.h"
#include "blob.h"

namespace poker {


/*
* A participant of the game that contributes to stack shufling  and card revealing
*/
class participant {
    const int decksize = 52;
    
    int _id;
    int _num_participants;
    bool _predictable;
    std::string _pfx;
    SchindelhauerTMCG *_tmcg;
    BarnettSmartVTMF_dlog *_vtmf;
	GrothVSSHE *_vsshe;
	TMCG_Stack<VTMF_Card> _stack;
	TMCG_StackSecret<VTMF_CardSecret> _ss;
	TMCG_Stack<VTMF_Card> _cards;
    std::map<int, size_t> _open_cards;

public:
    participant(int participant_id, int num_participants, bool predictable);
    ~participant();

    int id() { return _id; }
    int num_participants() { return _num_participants; }
    bool predictable() { return _predictable; }

    // initial group generation
    game_error create_group(blob& group);
    game_error load_group(blob& group);

    // Key generation protocol
    game_error generate_key(blob& key);
    game_error load_their_key(blob& key);
    game_error finalize_key_generation();

    // VSSHE - Verifiable Secret Shuffle of Homomorphic Encryptions.}@*
    game_error create_vsshe_group(blob& group);
    game_error load_vsshe_group(blob& group);

    // Stack
    game_error create_stack();
    game_error shuffle_stack(blob& mixed_stack, blob& stack_proof);
    game_error load_stack(blob& mixed_stack, blob& mixed_stack_proof);

    // Cards
    game_error take_cards_from_stack(int count);
    game_error prove_card_secret(int card_index, blob& my_proof);
    game_error self_card_secret(int card_index);
    game_error verify_card_secret(int card_index, blob& their_proof);
    game_error open_card(int card_index);
    size_t get_open_card(int card_index);
};

} // namespace poker

#endif