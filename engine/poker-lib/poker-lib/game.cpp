#include <iostream>
#include "game.h"

namespace poker {

game_error game_state::call() {
    // TODO
    current_player = opponent_of(current_player);
    return SUCCESS;
}

game_error game_state::raise(money_t amount)  {
    // TODO
    current_player = opponent_of(current_player);
    return SUCCESS;
}

game_error game_state::fold() {
    // TODO
    current_player = opponent_of(current_player);
    return SUCCESS;
}

void game_state::dump() {
    std::cout << ">>> Winner: " << winner << " ";
    std::cout << "Public cards: ";
    for(auto i=0; i<NUM_PUBLIC_CARDS; i++)
        std::cout << public_cards[i] << " ";
    std::cout << "Alice's cards: ";
    for(auto i=0; i<NUM_PRIVATE_CARDS; i++)
        std::cout << players[ALICE].cards[i] << " ";
    std::cout << "Bob's cards: ";
    for(auto i=0; i<NUM_PRIVATE_CARDS; i++)
        std::cout << players[BOB].cards[i] << " ";
    std::cout << std::endl;
}

}