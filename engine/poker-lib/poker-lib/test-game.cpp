#include <iostream>
#include <vector>

#include "cards.h"
#include "game.h"

using namespace std;
using namespace poker;
using namespace poker::cards;

#define TEST_SUITE_NAME "Test game_state"

#define TIE 2
#define BIG_BLIND 10

struct card_fixture {
    vector<card_t> community, alice, bob;
};

struct bet_fixture {
    vector<money_t> alice, bob;
    money_t amount;
};

struct phase_fixture {
    int player;
    bet_type type;
    bet_fixture bet;
};

struct player_fixture {
    bet_phase initial_phase;
    phase_fixture phase;
};

struct card_fixtures {
    card_fixture alice_high_ace {
        {c7, s6, c4, d3, h2}, {hA, dQ}, {hJ, h9}
    };
    card_fixture bob_high_ace {
        {c7, s6, c4, d3, h2}, {hJ, h9}, {hA, dQ}
    };
    card_fixture tie { 
        {cJ, sT, c9, d3, h3}, {s3, h2}, {s4, c3}
    };
} card_fixtures;

struct bet_fixtures {
    bet_fixture alice_higher_bet {
        {100, 20}, {100, 10}, BIG_BLIND
    };
    bet_fixture equal_bet_invalid_amount {
        {100, 10}, {100, 10}, BIG_BLIND-1
    };
    bet_fixture equal_bet {
        {100, 10}, {100, 10}, BIG_BLIND
    };
    bet_fixture bob_higher_bet_alice_no_funds {
        {10, 10}, {100, 20}, BIG_BLIND
    };
    bet_fixture bob_higher_bet {
        {100, 10}, {100, 20}, BIG_BLIND
    };
    bet_fixture alice_more_funds_invalid_amount {
        {200, 10}, {100, 10}, BIG_BLIND*10
    };
    bet_fixture alice_more_funds {
        {200, 10}, {100, 10}, BIG_BLIND*9
    };
    bet_fixture bob_more_funds {
        {100, 10}, {200, 10}, BIG_BLIND*10
    };
    bet_fixture first_action {
        {100, 5}, {100, 10}, BIG_BLIND
    };
} bet_fixtures;

struct phase_fixtures {
    phase_fixture alice_calls {
        ALICE, BET_CALL, bet_fixtures.first_action
    };
    phase_fixture alice_calls_after_raise {
        ALICE, BET_CALL, bet_fixtures.bob_higher_bet
    };
    phase_fixture bob_calls_after_raise {
        BOB, BET_CALL, bet_fixtures.alice_higher_bet
    };
    phase_fixture alice_raises {
        ALICE, BET_RAISE, bet_fixtures.first_action
    };
    phase_fixture bob_raises {
        BOB, BET_RAISE, bet_fixtures.equal_bet
    };
    phase_fixture bob_checks {
        BOB, BET_CHECK, bet_fixtures.equal_bet
    };
    phase_fixture alice_checks {
        ALICE, BET_CHECK, bet_fixtures.equal_bet
    };
    phase_fixture bob_folds {
        BOB, BET_FOLD, bet_fixtures.equal_bet
    };
    phase_fixture alice_folds {
        ALICE, BET_FOLD, bet_fixtures.first_action
    };
} phase_fixtures;

struct player_fixtures {
    player_fixture alice_calls_on_preflop {
        PHS_PREFLOP, phase_fixtures.alice_calls
    };
    player_fixture alice_calls_after_raise_on_preflop {
        PHS_PREFLOP, phase_fixtures.alice_calls_after_raise
    };
    player_fixture alice_calls_after_raise_on_flop {
        PHS_FLOP, phase_fixtures.alice_calls_after_raise
    };
    player_fixture bob_calls_after_raise_on_preflop {
        PHS_PREFLOP, phase_fixtures.bob_calls_after_raise
    };
    player_fixture alice_raises_on_preflop {
        PHS_PREFLOP, phase_fixtures.alice_raises
    };
    player_fixture bob_raises_on_preflop {
        PHS_PREFLOP, phase_fixtures.bob_raises
    };
    player_fixture alice_raises_on_flop {
        PHS_FLOP, phase_fixtures.alice_raises
    };
    player_fixture bob_raises_on_flop {
        PHS_FLOP, phase_fixtures.bob_raises
    };
    player_fixture bob_checks_on_preflop {
        PHS_PREFLOP, phase_fixtures.bob_checks
    };
    player_fixture bob_checks_on_flop {
        PHS_FLOP, phase_fixtures.bob_checks
    };
    player_fixture alice_checks_on_flop {
        PHS_FLOP, phase_fixtures.alice_checks
    };
    player_fixture alice_folds_on_preflop {
        PHS_PREFLOP, phase_fixtures.alice_folds
    };
    player_fixture alice_folds_on_flop {
        PHS_FLOP, phase_fixtures.alice_folds
    };
    player_fixture bob_folds_on_preflop {
        PHS_PREFLOP, phase_fixtures.bob_folds
    };
    player_fixture bob_folds_on_flop {
        PHS_FLOP, phase_fixtures.bob_folds
    };
} player_fixtures;

void setup_cards(card_fixture cards, game_state &state) {
    for (auto i = 0; i < NUM_PRIVATE_CARDS; i++) {
        state.players[ALICE].cards[i] = cards.alice[i];
        state.players[BOB].cards[i] = cards.bob[i];
    }

    for (auto i = 0; i < NUM_PUBLIC_CARDS; i++) {
        state.public_cards[i] = cards.community[i];
    }
}

void setup_bets(bet_fixture bets, game_state& state) {
    state.players[ALICE].total_funds = bets.alice[0];
    state.players[ALICE].bets = bets.alice[1];
    state.players[BOB].total_funds = bets.bob[0];
    state.players[BOB].bets = bets.bob[1];
    state.big_blind = BIG_BLIND;
}

void assert_winner(int expected, card_fixture cards) {
    game_state state;
    game_error err;
    setup_cards(cards, state);

    if ((err = state.decide_winner())) {
        printf("Assertion failed. Received unexpected error: %d\n", err);
        exit(65);
    }
    if (state.winner != expected) {
        printf("Assertion failed. Expected: %d, got: %d\n", expected, state.winner);
        exit(65);
    }
}

void assert_bet(bet_type bet, game_error expected, bet_fixture bets) {
    game_error err;
    game_state state;
    setup_bets(bets, state);

    if ((err = state.bet(bet, bets.amount)) != expected) {
        printf("Assertion failed. Expected: %d, got: %d\n", expected, err);
        exit(65);
    }
}

void assert_phase( bet_phase initial_phase,  bet_phase expected, phase_fixture fixture) {
    game_error err;
    game_state state;
    state.current_player = fixture.player;
    state.phase = initial_phase;
    setup_bets(fixture.bet, state);

    if (err = state.bet(fixture.type, fixture.bet.amount)) {
        printf("Assertion failed. Received unexpected error: %d\n", err);
        exit(65);
    }

    if (state.phase != expected) {
        printf("Assertion failed. Expected: %d, got: %d\n", expected, state.phase);
        exit(65);
    }
}

void assert_current_player(int expected, player_fixture fixture) {
    game_error err;
    game_state state;
    state.current_player = fixture.phase.player;
    state.phase = fixture.initial_phase;
    setup_bets(fixture.phase.bet, state);

    if (err = state.bet(fixture.phase.type, fixture.phase.bet.amount)) {
        printf("Assertion failed. Received unexpected error: %d\n", err);
        exit(65);
    }

    if (state.current_player != expected) {
        printf("Assertion failed. Expected: %d, got: %d\n", expected, state.current_player);
        exit(65);
    }
}

int main(int argc, char **argv) {
    //TEST decide_winner()
    assert_winner(ALICE, card_fixtures.alice_high_ace);
    assert_winner(BOB, card_fixtures.bob_high_ace);
    assert_winner(TIE, card_fixtures.tie);

    //TEST bet()
    //BET_CALL
    assert_bet(BET_CALL, GRR_OPPONENT_BET_NOT_HIGHER, bet_fixtures.alice_higher_bet);
    assert_bet(BET_CALL, GRR_OPPONENT_BET_NOT_HIGHER, bet_fixtures.equal_bet);
    assert_bet(BET_CALL, GRR_INSUFFICIENT_FUNDS, bet_fixtures.bob_higher_bet_alice_no_funds);
    assert_bet(BET_CALL, SUCCESS, bet_fixtures.bob_higher_bet);

    //BET_CHECK
    assert_bet(BET_CHECK, GRR_BETS_NOT_EQUAL, bet_fixtures.alice_higher_bet);
    assert_bet(BET_CHECK, GRR_BETS_NOT_EQUAL, bet_fixtures.bob_higher_bet);
    assert_bet(BET_CHECK, SUCCESS, bet_fixtures.equal_bet);

    // BET_RAISE
    assert_bet(BET_RAISE, GRR_BET_ABOVE_MAXIMUM, bet_fixtures.alice_more_funds_invalid_amount);
    assert_bet(BET_RAISE, GRR_BET_BELOW_MINIMUM, bet_fixtures.equal_bet_invalid_amount);
    assert_bet(BET_RAISE, GRR_BET_ALREADY_HIGHER, bet_fixtures.alice_higher_bet);
    assert_bet(BET_RAISE, GRR_INSUFFICIENT_FUNDS, bet_fixtures.bob_more_funds);
    assert_bet(BET_RAISE, SUCCESS, bet_fixtures.bob_higher_bet);
    assert_bet(BET_RAISE, SUCCESS, bet_fixtures.equal_bet);
    assert_bet(BET_RAISE, SUCCESS, bet_fixtures.alice_more_funds);

    //BET_FOLD
    assert_bet(BET_FOLD, SUCCESS, bet_fixtures.bob_higher_bet);
    assert_bet(BET_FOLD, SUCCESS, bet_fixtures.first_action);
    assert_bet(BET_FOLD, SUCCESS, bet_fixtures.alice_more_funds);
    assert_bet(BET_FOLD, SUCCESS, bet_fixtures.bob_more_funds);

    //phase UPDATE
    assert_phase(PHS_PREFLOP, PHS_PREFLOP, phase_fixtures.alice_calls);
    assert_phase(PHS_PREFLOP, PHS_FLOP, phase_fixtures.alice_calls_after_raise);
    assert_phase(PHS_PREFLOP, PHS_FLOP, phase_fixtures.bob_calls_after_raise);
    
    assert_phase(PHS_PREFLOP, PHS_PREFLOP, phase_fixtures.alice_raises);
    assert_phase(PHS_FLOP, PHS_FLOP, phase_fixtures.alice_raises);
    assert_phase(PHS_TURN, PHS_TURN, phase_fixtures.bob_raises);
    
    assert_phase(PHS_PREFLOP, PHS_FLOP, phase_fixtures.bob_checks);
    assert_phase(PHS_FLOP, PHS_FLOP, phase_fixtures.bob_checks);
    assert_phase(PHS_FLOP, PHS_TURN, phase_fixtures.alice_checks);

    assert_phase(PHS_PREFLOP, PHS_SHOWDOWN, phase_fixtures.alice_folds);
    assert_phase(PHS_PREFLOP, PHS_SHOWDOWN, phase_fixtures.bob_folds);
    assert_phase(PHS_FLOP, PHS_SHOWDOWN, phase_fixtures.alice_folds);
    assert_phase(PHS_FLOP, PHS_SHOWDOWN, phase_fixtures.bob_folds);

    //current_player UPDATE
    assert_current_player(BOB, player_fixtures.alice_calls_on_preflop);
    assert_current_player(BOB, player_fixtures.alice_calls_after_raise_on_preflop);
    assert_current_player(BOB, player_fixtures.alice_calls_after_raise_on_flop);
    assert_current_player(BOB, player_fixtures.bob_calls_after_raise_on_preflop);

    assert_current_player(BOB, player_fixtures.alice_raises_on_preflop);
    assert_current_player(BOB, player_fixtures.alice_raises_on_flop);
    assert_current_player(ALICE, player_fixtures.bob_raises_on_preflop);
    assert_current_player(ALICE, player_fixtures.bob_raises_on_flop);
    
    assert_current_player(BOB, player_fixtures.bob_checks_on_preflop);
    assert_current_player(ALICE, player_fixtures.bob_checks_on_flop);
    assert_current_player(BOB, player_fixtures.alice_checks_on_flop);
    
    assert_current_player(BOB, player_fixtures.alice_folds_on_preflop);
    assert_current_player(BOB, player_fixtures.alice_folds_on_flop);
    assert_current_player(ALICE, player_fixtures.bob_folds_on_preflop);
    assert_current_player(ALICE, player_fixtures.bob_folds_on_flop);

    cout << "---- SUCCESS - " TEST_SUITE_NAME << endl;
    return 0;
}
