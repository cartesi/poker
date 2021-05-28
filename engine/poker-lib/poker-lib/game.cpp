#include "game.h"

#include <iostream>

namespace poker {

#define IS_DEALER(pid) pid == ALICE ? true : false

game_error game_state::bet(bet_type type, money_t amt) {
    switch (type) {
        case BET_FOLD:
            return fold();
            break;
        case BET_CALL:
            return call();
            break;
        case BET_RAISE:
            return raise(amt);
            break;
        case BET_CHECK:
            return check();
            break;
    }
    return SUCCESS;
}

void game_state::end_phase() {
    if (phase != PHS_SHOWDOWN){
        int aux = phase;
        phase = (bet_phase)++aux;
    }
}

game_error game_state::fold() {
    winner = opponent_of(current_player);
    phase = PHS_SHOWDOWN;
    current_player = opponent_of(current_player);
    return SUCCESS;
}

game_error game_state::bet(money_t amount) {
    player_state& player = players[current_player];
    player_state& opponent = players[opponent_of(current_player)];

    if (player.bets + amount > player.total_funds)
        return (error = GRR_INSUFFICIENT_FUNDS);

    players[current_player].bets += amount;
    return SUCCESS;
}

game_error game_state::call() {
    player_state& player = players[current_player];
    player_state& opponent = players[opponent_of(current_player)];
    money_t difference = opponent.bets - player.bets;

    if (difference <= 0)
        return (error = GRR_OPPONENT_BET_NOT_HIGHER);

    if ((error = bet(difference)) != SUCCESS)
        return error;

    if (IS_DEALER(current_player)) {
        current_player = opponent_of(current_player);

        if (phase != PHS_PREFLOP || player.bets > big_blind)
            end_phase();
    } else
        end_phase();

    return SUCCESS;
}

// TODO: ALL IN GOES STRAIGHT TO SHOWDOWN
game_error game_state::raise(money_t amount) {
    player_state& player = players[current_player];
    player_state& opponent = players[opponent_of(current_player)];
    money_t last_raise = opponent.bets - player.bets;

    if (player.bets > opponent.bets)
        return (error = GRR_BET_ALREADY_HIGHER);

    if (amount < big_blind)
        return (error = GRR_BET_BELOW_MINIMUM);

    if ((opponent.bets + amount) > opponent.total_funds)
        return (error = GRR_BET_ABOVE_MAXIMUM);  // max bet is to force all in

    if ((error = bet(amount + last_raise)) != SUCCESS)
        return error;

    current_player = opponent_of(current_player);
    return SUCCESS;
}

game_error game_state::check() {
    player_state& player = players[current_player];
    player_state& opponent = players[opponent_of(current_player)];

    if (player.bets != opponent.bets)
        return (error = GRR_BETS_NOT_EQUAL);

    if (phase == PHS_PREFLOP)
        end_phase();
    else {
        if (IS_DEALER(current_player))
            end_phase();

        current_player = opponent_of(current_player);
    }
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
        winner = 2;  // Tie
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