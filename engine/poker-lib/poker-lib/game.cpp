#include "game.h"

#include <iostream>

namespace poker {

void game_state::dump() {
    std::cout << ">>> Winner: " << winner << " ";
    std::cout << "Public cards: ";
    for (auto i = 0; i < NUM_PUBLIC_CARDS; i++)
        std::cout << public_cards[i] << " ";
    std::cout << "Alice's cards: ";
    for (auto i = 0; i < NUM_PRIVATE_CARDS; i++)
        std::cout << players[ALICE].cards[i] << " ";
    std::cout << "Bob's cards: ";
    for (auto i = 0; i < NUM_PRIVATE_CARDS; i++)
        std::cout << players[BOB].cards[i] << " ";
    std::cout << std::endl;
}

}  // namespace poker