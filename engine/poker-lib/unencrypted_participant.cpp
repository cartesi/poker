#include "unencrypted_participant.h"

#include <algorithm>
#include <random>
#include <chrono>

namespace poker {

void unencrypted_participant::init(int id, int num_participants, bool predictable) {
    _id = id;
    _num_participants = num_participants;
    _predictable = predictable;

    char temp[10];
    sprintf(temp, "[%d] ", _id);
    _pfx = temp;
}

int unencrypted_participant::id() { return _id; }

int unencrypted_participant::num_participants() { return _num_participants; }

bool unencrypted_participant::predictable() { return _predictable; }

game_error unencrypted_participant::unencrypted_participant::create_group(blob& group) {
    logger << _pfx << "[MOCK] BarnettSmartVTMF_dlog done " << std::endl;
    return SUCCESS;
}

game_error unencrypted_participant::load_group(blob& group) {
    return SUCCESS;
}

game_error unencrypted_participant::generate_key(blob& key) {
    logger << _pfx << "[MOCK] publishKey " << std::endl;
    return SUCCESS;
}

game_error unencrypted_participant::load_their_key(blob& key) {
    logger << _pfx << "[MOCK] load_their_key " << std::endl;
    return SUCCESS;
}

game_error unencrypted_participant::finalize_key_generation() {
    logger << _pfx << "[MOCK] finalize_key_generation " << std::endl;
    return SUCCESS;
}

game_error unencrypted_participant::create_vsshe_group(blob& group) {
    logger << _pfx << "[MOCK] create_vsshe_group" << std::endl;
    return SUCCESS;
}
game_error unencrypted_participant::load_vsshe_group(blob& group) {
    logger << _pfx << "[MOCK] load_vsshe_group" << std::endl;
    return SUCCESS;
}

game_error unencrypted_participant::create_stack() {
    for (auto i = 0; i < DECK_SIZE; i++)
        stack.push_back(i);

    return SUCCESS;
}

game_error unencrypted_participant::shuffle_stack(blob& mixed_stack, blob& stack_proof) {
    logger << _pfx << "shuffle_stack" << std::endl;

    if (!_predictable) {
        unsigned seed = std::chrono::system_clock::now().time_since_epoch().count();
        std::shuffle(stack.begin(), stack.end(), std::default_random_engine(seed));

        for (auto i = 0; i < stack.size(); i++)
            mixed_stack.out() << "^" << stack[i];
    }
    return SUCCESS;
}

game_error unencrypted_participant::load_stack(blob& mixed_stack, blob& mixed_stack_proof) {
    logger << _pfx << "load_stack " << std::endl;

    char separator;
    for (auto i = 0; i < DECK_SIZE; i++) {
        mixed_stack.in() >> separator;
        mixed_stack.in() >> stack[i];
    }
    return SUCCESS;
}

game_error unencrypted_participant::take_cards_from_stack(int count) {
    logger << _pfx << "take_cards_from_stack(" << count << ")" << std::endl;

    for (size_t i = 0; i < count; i++) {
        int card = stack.back();
        stack.pop_back();
        cards.push_back(card);
    }
    return SUCCESS;
}

game_error unencrypted_participant::prove_card_secret(int card_index, blob& my_proof) {
    logger << _pfx << "[MOCK] prove_card_secret(" << card_index << ")" << std::endl;
    return SUCCESS;
}

game_error unencrypted_participant::self_card_secret(int card_index) {
    logger << _pfx << "[MOCK] self_card_secret(" << card_index << ")" << std::endl;
    return SUCCESS;
}

game_error unencrypted_participant::verify_card_secret(int card_index, blob& their_proof) {
    logger << _pfx << "[MOCK] verify_card_secret(" << card_index << ")" << std::endl;
    return SUCCESS;
}

game_error unencrypted_participant::open_card(int card_index) {
    logger << _pfx << "open_card(" << card_index << ")" << std::endl;
    return SUCCESS;
}

size_t unencrypted_participant::get_open_card(int card_index) {
    logger << _pfx << "get_open_card(" << card_index << ")" << std::endl;
    auto card_type = cards[card_index];
    logger << _pfx << "get_open_card(" << card_index << ") = " << card_type << std::endl;
    return card_type;
}

}  // namespace poker