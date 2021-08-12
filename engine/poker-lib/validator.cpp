#include <iostream>
#include "validator.h"
#include "solver.h"

#define IS_DEALER(pid) pid == ALICE ? true : false

namespace poker {

static void end_phase(game_state& g);
static game_error bet(game_state& g, money_t amount);
static game_error get_player_hand(game_state& g, int player, card_t* hand);
static game_error call(game_state& g);
static game_error raise(game_state& g, money_t amount);
static game_error check(game_state& g);
static game_error fold(game_state& g);

game_error place_bet(game_state& g, bet_type type, money_t amt) {
    switch (type) {
        case BET_CALL:
            return call(g);
            break;
        case BET_RAISE:
            return raise(g, amt);
            break;
        case BET_CHECK:
            return check(g);
            break;
        case BET_FOLD:
            return fold(g);
            break;
        case BET_NONE:
            return GRR_INVALID_BET;
    }
    return SUCCESS;
}

static game_error call(game_state& g) {
    player_state& player = g.players[g.current_player];
    player_state& opponent = g.players[opponent_id(player.id)];
    money_t difference = opponent.bets - player.bets;
    if (difference <= (money_t)0)
        return (g.error = GRR_OPPONENT_BET_NOT_HIGHER);
    if ((g.error = bet(g, difference)) != SUCCESS)
        return g.error;
    if (g.phase == PHS_PREFLOP) {
        if (IS_DEALER(player.id)) {
            g.current_player = opponent.id;
            if (player.bets > g.big_blind)
                end_phase(g);
        } else {
            end_phase(g);
        }
    } else {
        if (IS_DEALER(player.id))
            g.current_player = opponent.id;
        end_phase(g);
    }
    return SUCCESS;
}

static game_error raise(game_state& g, money_t amount) {
    player_state& player = g.players[g.current_player];
    player_state& opponent = g.players[opponent_id(player.id)];
    money_t last_raise = opponent.bets - player.bets;

    if (player.bets > opponent.bets)
        return (g.error = GRR_BET_ALREADY_HIGHER);

    // TODO: restore this code when the UI code is able to deal with this logic
    // if (amount < g.big_blind)
    //     return (g.error = GRR_BET_BELOW_MINIMUM);

    if ((opponent.bets + amount) > opponent.total_funds)
        return (g.error = GRR_BET_ABOVE_MAXIMUM);  // max bet is to force all in

    if ((g.error = bet(g, amount + last_raise)) != SUCCESS)
        return g.error;

    g.current_player = opponent.id;
    return SUCCESS;
}

static game_error check(game_state& g) {
    player_state& player = g.players[g.current_player];
    player_state& opponent = g.players[opponent_id(player.id)];

    if (player.bets != opponent.bets)
        return (g.error = GRR_BETS_NOT_EQUAL);

    if (g.phase == PHS_PREFLOP)
        end_phase(g);
    else {
        g.current_player = opponent.id;

        if (IS_DEALER(player.id))
            end_phase(g);
    }
    return SUCCESS;
}

static game_error fold(game_state& g) {
    g.winner = opponent_id(g.current_player);
    g.phase = PHS_SHOWDOWN;
    g.current_player = g.winner;
    return SUCCESS;
}

game_error decide_winner(game_state& g) {
    int alice_hand[HAND_SIZE], bob_hand[HAND_SIZE];
    solver poker_solver;
    int result = -1;

    if ((g.error = get_player_hand(g, ALICE, alice_hand)))
        return g.error;
    if ((g.error = get_player_hand(g, BOB, bob_hand)))
        return g.error;
    if ((g.error = poker_solver.compare_hands(alice_hand, bob_hand,
                                                  HAND_SIZE, &result)))
        return g.error;

    if (result == 0)
        g.winner = 2;  // Tie
    else
        g.winner = result == 1 ? ALICE : BOB;

    return SUCCESS;
}

static void end_phase(game_state& g) {
    if (g.phase != PHS_SHOWDOWN) {
        int aux = g.phase;
        g.phase = (bet_phase)++aux;
    }
}

static game_error bet(game_state& g, money_t amount) {
    player_state& player = g.players[g.current_player];
    player_state& opponent = g.players[opponent_id(player.id)];

    if (player.bets + amount > player.total_funds)
        return (g.error = GRR_INSUFFICIENT_FUNDS);

    g.players[player.id].bets += amount;
    return SUCCESS;
}

static game_error get_player_hand(game_state& g, int player, card_t* hand) {
    card_t* aux = hand;

    if (player != ALICE && player != BOB)
        return GRR_INVALID_PLAYER;

    for (auto i = 0; i < NUM_PRIVATE_CARDS; i++) {
        card_t card = g.players[player].cards[i];
        *aux++ = card;
    }

    for (auto i = 0; i < NUM_PUBLIC_CARDS; i++) {
        card_t card = g.public_cards[i];
        *aux++ = card;
    }

    return SUCCESS;
}

}  // namespace poker