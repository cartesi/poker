#ifndef MOCK_PARTICIPANT_H
#define MOCK_PARTICIPANT_H

#include <vector>

#include "participant.h"

namespace poker {

class mock_participant : public participant {
    std::vector<int> stack;
    std::vector<int> cards;

   public:
    mock_participant(int participant_id, int num_participants, bool predictable);
    ~mock_participant();

    game_error create_group(blob& group);
    game_error load_group(blob& group);

    // Key generation protocol
    game_error generate_key(blob& key);
    game_error load_their_key(blob& key);
    game_error finalize_key_generation();

    // VSSHE - Verifiable Secret Shuffle of Homomorphic Encryptions
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

}  // namespace poker
#endif