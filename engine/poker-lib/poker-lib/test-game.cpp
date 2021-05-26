#include <iostream>
#include <vector>
#include "game.h"
#include "cards.h"

using namespace poker;
using namespace poker::cards;

#define TEST_SUITE_NAME "Test game_state"

#define ALICE_WINS 0
#define BOB_WINS 1
#define TIE 2

void setup_cards(std::vector<card_t> community,
                 std::vector<card_t> alice,
                 std::vector<card_t> bob,
                 game_state &state)
{
    for (auto i = 0; i < NUM_PRIVATE_CARDS; i++) {
        state.players[ALICE].cards[i] = alice[i];
        state.players[BOB].cards[i] = bob[i];
    }

    for (auto i = 0; i < NUM_PUBLIC_CARDS; i++) {
        state.public_cards[i] = community[i];
    }
}

void assert_winner(
    std::vector<card_t> community,
    std::vector<card_t> alice,
    std::vector<card_t> bob,
    int expected)
{
    game_state state;
    setup_cards(community, alice, bob, state);
    game_error err;

    if ((err = state.decide_winner())) {
        std::cerr << "Assertion failed. Expected: 0, got: " << err << std::endl;
        exit(65);
    }
    if (state.winner != expected) {
        std::cerr << "Assertion failed. Expected: " << expected << ", got: " << state.winner << std::endl;
        exit(65);
    }
}

int main(int argc, char **argv) {
    assert_winner({c7, s6, c4, d3, h2}, {hA, dQ}, {hJ, h9}, ALICE_WINS);
    assert_winner({c7, s6, c4, d3, h2}, {hJ, h9}, {hA, dQ}, BOB_WINS);
    assert_winner({cJ, sT, c9, d3, h3}, {s3, h2}, {s4, c3}, TIE);

    std::cout << "---- SUCCESS - " TEST_SUITE_NAME << std::endl;
    return 0;
}
