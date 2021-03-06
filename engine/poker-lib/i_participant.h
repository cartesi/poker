#ifndef PARTICIPANT_H
#define PARTICIPANT_H

#include "blob.h"
#include "common.h"

namespace poker {

/*
* A participant of the game that contributes to stack shufling and card revealing
*/
class i_participant {
   public:
    virtual ~i_participant() {}

    virtual void init(int id, int num_participants, bool predictable) = 0;

    virtual int id() = 0;
    virtual int num_participants() = 0;
    virtual bool predictable() = 0;

    // initial group generation
    virtual game_error create_group(blob& group) = 0;
    virtual game_error load_group(blob& group) = 0;

    // Key generation protocol
    virtual game_error generate_key(blob& key) = 0;
    virtual game_error load_their_key(blob& key) = 0;
    virtual game_error finalize_key_generation() = 0;

    // VSSHE - Verifiable Secret Shuffle of Homomorphic Encryptions.
    virtual game_error create_vsshe_group(blob& group) = 0;
    virtual game_error load_vsshe_group(blob& group) = 0;

    // Stack
    virtual game_error create_stack() = 0;
    virtual game_error shuffle_stack(blob& mixed_stack, blob& stack_proof) = 0;
    virtual game_error load_stack(blob& mixed_stack, blob& mixed_stack_proof) = 0;

    // Cards
    virtual game_error take_cards_from_stack(int count) = 0;
    virtual game_error prove_card_secret(int card_index, blob& my_proof) = 0;
    virtual game_error self_card_secret(int card_index) = 0;
    virtual game_error verify_card_secret(int card_index, blob& their_proof) = 0;
    virtual game_error open_card(int card_index) = 0;
    virtual size_t get_open_card(int card_index) = 0;
};

}  // namespace poker

#endif