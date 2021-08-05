#include "mock_participant.h"

#include <algorithm>

namespace poker {

mock_participant::mock_participant(int participant_id, int num_participants, bool predictable)
    : participant(participant_id, num_participants, predictable) {}

mock_participant::~mock_participant() {}

game_error mock_participant::mock_participant::create_group(blob& group) {
    logger << _pfx << "BarnettSmartVTMF_dlog done " << std::endl;
    return SUCCESS;
}

game_error mock_participant::load_group(blob& group) {
    return SUCCESS;
}

game_error mock_participant::generate_key(blob& key) {
    logger << _pfx << "publishKey " << std::endl;
    return SUCCESS;
}

game_error mock_participant::load_their_key(blob& key) {
    logger << _pfx << "load_their_key " << std::endl;
    return SUCCESS;
}

game_error mock_participant::finalize_key_generation() {
    logger << _pfx << "finalize_key_generation " << std::endl;
    return SUCCESS;
}

game_error mock_participant::create_vsshe_group(blob& group) {
    logger << _pfx << "create_vsshe_group" << std::endl;
    return SUCCESS;
}
game_error mock_participant::load_vsshe_group(blob& group) {
    logger << _pfx << "load_vsshe_group" << std::endl;
    return SUCCESS;
}

game_error mock_participant::create_stack() {
    for (auto i = 0; i < decksize; i++)
        stack.push_back(i);

    return SUCCESS;
}

game_error mock_participant::shuffle_stack(blob& mixed_stack, blob& stack_proof) {
    logger << _pfx << "shuffle_stack" << std::endl;

    if (!_predictable) {
        std::random_shuffle(stack.begin(), stack.end());

        for (auto i = 0; i < stack.size(); i++)
            mixed_stack.out() << "^" << stack[i];
    }
    return SUCCESS;
}

game_error mock_participant::load_stack(blob& mixed_stack, blob& mixed_stack_proof) {
    logger << _pfx << "load_stack " << std::endl;

    char separator;
    for (auto i = 0; i < decksize; i++) {
        mixed_stack.in() >> separator;
        mixed_stack.in() >> stack[i];
    }
    return SUCCESS;
}

game_error mock_participant::take_cards_from_stack(int count) {
    logger << _pfx << "take_cards_from_stack(" << count << ")" << std::endl;

    for (size_t i = 0; i < count; i++) {
        int card = stack.back();
        stack.pop_back();
        cards.push_back(card);
    }
    return SUCCESS;
}

game_error mock_participant::prove_card_secret(int card_index, blob& my_proof) {
    logger << _pfx << "prove_card_secret(" << card_index << ")" << std::endl;
    return SUCCESS;
}

game_error mock_participant::self_card_secret(int card_index) {
    logger << _pfx << "self_card_secret(" << card_index << ")" << std::endl;
    return SUCCESS;
}

game_error mock_participant::verify_card_secret(int card_index, blob& their_proof) {
    logger << _pfx << "verify_card_secret(" << card_index << ")" << std::endl;
    return SUCCESS;
}

game_error mock_participant::open_card(int card_index) {
    logger << _pfx << "open_card(" << card_index << ")" << std::endl;
    return SUCCESS;
}

size_t mock_participant::get_open_card(int card_index) {
    logger << _pfx << "get_open_card(" << card_index << ")" << std::endl;
    auto card_type = cards[card_index];
    logger << _pfx << "get_open_card(" << card_index << ") = " << card_type << std::endl;
    return card_type;
}

}  // namespace poker