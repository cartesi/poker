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

game_error game_state::decide_winner() {
    int alice_hand[HAND_SIZE], bob_hand[HAND_SIZE];
    game_error err;
    int result = -1;

    if ((err = get_player_hand(ALICE, alice_hand)))
        return (error = err);
    if ((err = get_player_hand(BOB, bob_hand)))
        return (error = err);
    if ((err = _solver.compare_hands(alice_hand, bob_hand, HAND_SIZE, &result)))
        return (error = err);

    if (result == 0)
        winner = 2; //Tie
    else
        winner = result == 1 ? ALICE : BOB;

    return SUCCESS;
}

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