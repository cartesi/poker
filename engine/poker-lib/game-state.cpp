#include <iostream>
#include "game-state.h"

namespace poker {

game_error game_state::get_player_hand(int player, card_t* hand) {
    card_t* aux = hand;

    if (player != ALICE && player != BOB)
        return GRR_INVALID_PLAYER;

    for (auto i = 0; i < NUM_PRIVATE_CARDS; i++) {
        card_t card = players[player].cards[i];
        *aux++ = card;
    }

    for (auto i = 0; i < NUM_PUBLIC_CARDS; i++) {
        card_t card = public_cards[i];
        *aux++ = card;
    }
    return SUCCESS;
}

void game_state::dump() {
    logger << ">>> Winner: " << winner << " ";
    logger << "Public cards: ";
    for (auto i = 0; i < NUM_PUBLIC_CARDS; i++)
        logger << public_cards[i] << " ";
    logger << "Alice's cards: ";
    for (auto i = 0; i < NUM_PRIVATE_CARDS; i++)
        logger << players[ALICE].cards[i] << " ";
    logger << "Bob's cards: ";
    for (auto i = 0; i < NUM_PRIVATE_CARDS; i++)
        logger << players[BOB].cards[i] << " ";
    logger << std::endl;
}

}  // namespace poker