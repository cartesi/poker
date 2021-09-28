#include <iostream>
#include <sstream>
#include <fstream>
#include <memory.h>
#include <inttypes.h>
#include "poker-lib.h"
#include "common.h"
#include "test-util.h"
#include "game-generator.h"
#include "verifier.h"

using namespace poker;

void test_the_happy_path() {

    game_generator gen;
    assert_eql(SUCCESS, gen.generate());
    auto &g = gen.alice_game;

    std::istringstream turns(gen.raw_turn_data);
    std::istringstream turns_meta(gen.raw_turn_metadata);
    std::istringstream player_info(gen.raw_player_info);
    std::istringstream  verification_info(gen.raw_verification_info);
    
    std::ostringstream output;
    verifier ver(player_info, turns_meta, verification_info, turns, output);
    assert_eql(SUCCESS, ver.verify());
    assert_eql(gen.alice_game.winner, ver.game().winner);
    assert_eql(SUCCESS, ver.game().error);

    std::istringstream is(output.str());
    assert_eql(128, output.str().size());

    bignumber filler, funds1, funds2;
    assert_eql(SUCCESS, funds1.read_binary_be(is, 32));
    assert_eql(SUCCESS, funds2.read_binary_be(is, 32));
    assert_eql(SUCCESS, filler.read_binary_be(is, 64));

    assert_eql(0, filler);
    assert_eql(ver.results()[0], funds1);
    assert_eql(ver.results()[1], funds2);

    std::cout << output.str() << std::endl;
}

void test_punish() {
    verification_results_t funds{ 100, 200 };
    verifier::punish(ALICE, funds);
    assert_eql(0,   (int)funds[ALICE]);
    assert_eql(300, (int)funds[BOB]);

    funds = { 100, 200 };
    verifier::punish(BOB, funds);
    assert_eql(300,   (int)funds[ALICE]);
    assert_eql(0,   (int)funds[BOB]);

}

game_state make_game(game_error e, int winner, money_t alice_share, money_t bob_share) {
    game_state g;
    g.error = e;
    g.winner = winner;
    g.funds_share[ALICE] =  alice_share;
    g.funds_share[BOB] =  bob_share;
    return g;
}

void test_compute_result() {
    bignumber alice_addr(123123);
    bignumber bob_addr(987987);
    
    game_state g{};
    auto playback_result = SUCCESS;
    auto last_player_id = ALICE;
    verification_results_t out_results;
    verification_rule applied_rule;

    // 1 -- game over, Alice wins, Alice challenges, no claimer  => punish challenger
    out_results = {0, 0};
    applied_rule = RULE_UNKNOWN;
    assert_eql(SUCCESS, verifier::compute_result(
        out_results,
        applied_rule,
        make_game(SUCCESS, ALICE, /* results: */ 110, 190),
        SUCCESS, // playback_result,
        ALICE, // last_player_id,
        verification_info_t{
            alice_addr, ALICE, // challenger
            0, 0,              // claimer
            claimed_funds_t{ 110, 190 }
        },
        player_infos_t{player_info_t{ alice_addr, 100}, 
                       player_info_t{ bob_addr,   200} }
    ));
    assert_eql(RULE_NO_CLAIMER, applied_rule);
    assert_eql(bignumber(0), out_results[ALICE]);
    assert_eql(bignumber(300), out_results[BOB]);    

    // 2 -- game over, Alice wins, Bob challenges, no claimer  => punish challenger
    out_results = {0, 0};
    applied_rule = RULE_UNKNOWN;
    assert_eql(SUCCESS, verifier::compute_result(
        out_results,
        applied_rule,
        make_game(SUCCESS, ALICE, /* results: */ 110, 190),
        SUCCESS, // playback_result,
        ALICE, // last_player_id,
        verification_info_t{
            bob_addr, BOB, // challenger
            0, 0,              // claimer
            claimed_funds_t{ 110, 190 }
        },
        player_infos_t{player_info_t{ alice_addr, 100}, 
                       player_info_t{ bob_addr,   200} }
    ));
    assert_eql(RULE_NO_CLAIMER, applied_rule);
    assert_eql(bignumber(300), out_results[ALICE]);
    assert_eql(bignumber(0), out_results[BOB]);    

    // 3 -- game over, Alice wins, Bob challenges, Alice claims claimed results match => punish challenger
    out_results = {0, 0};
    applied_rule = RULE_UNKNOWN;
    assert_eql(SUCCESS, verifier::compute_result(
        out_results,
        applied_rule,
        make_game(SUCCESS, ALICE, /* results: */ 110, 190),
        SUCCESS, // playback_result,
        ALICE, // last_player_id,
        verification_info_t{
            bob_addr, BOB,      // challenger
            alice_addr, ALICE,  // claimer
            claimed_funds_t{ 110, 190 }
        },
        player_infos_t{player_info_t{ alice_addr, 100}, 
                       player_info_t{ bob_addr,   200} }
    ));
    assert_eql(RULE_CLAIM_IS_TRUE, applied_rule);
    assert_eql(bignumber(300), out_results[ALICE]);
    assert_eql(bignumber(0), out_results[BOB]);    

    // 4 -- game over, Alice wins, Bob challenges, Alice claims claimed results don't match => punish claimer
    out_results = {0, 0};
    applied_rule = RULE_UNKNOWN;
    assert_eql(SUCCESS, verifier::compute_result(
        out_results,
        applied_rule,
        make_game(SUCCESS, ALICE, /* results: */ 110, 190),
        SUCCESS, // playback_result,
        ALICE, // last_player_id,
        verification_info_t{
            bob_addr, BOB,      // challenger
            alice_addr, ALICE,  // claimer
            claimed_funds_t{ 22, 111 }
        },
        player_infos_t{player_info_t{ alice_addr, 100}, 
                       player_info_t{ bob_addr,   200} }
    ));
    assert_eql(RULE_CLAIM_IS_FALSE, applied_rule);
    assert_eql(bignumber(0), out_results[ALICE]);
    assert_eql(bignumber(300), out_results[BOB]);    

    // 5 -- game is not over, no error, Alice challenges => punish Alice
    out_results = {0, 0};
    applied_rule = RULE_UNKNOWN;
    assert_eql(SUCCESS, verifier::compute_result(
        out_results,
        applied_rule,
        make_game(SUCCESS, /* no winner (not game over) */ -1, 0, 0),
        SUCCESS, // playback_result,
        BOB, // last_player_id,
        verification_info_t{
            alice_addr, ALICE, // challenger
            0, 0,              // claimer
            claimed_funds_t{ 0, 0 }
        },
        player_infos_t{player_info_t{ alice_addr, 100}, 
                       player_info_t{ bob_addr,   200} }
    ));
    assert_eql(RULE_GAME_IS_NOT_OVER, applied_rule);
    assert_eql(bignumber(0), out_results[ALICE]);
    assert_eql(bignumber(300), out_results[BOB]);    

    // 6 -- playback failed, Bob is owner of last msg => punish Bob
    out_results = {0, 0};
    applied_rule = RULE_UNKNOWN;
    assert_eql(SUCCESS, verifier::compute_result(
        out_results,
        applied_rule,
        make_game(SUCCESS, /* no winner (not game over) */ -1, 0, 0),
        GRR_BET_ALREADY_HIGHER, // playback_result - some error
        BOB, // last_player_id,
        verification_info_t{
            alice_addr, ALICE, // challenger
            0, 0,              // claimer
            claimed_funds_t{ 0, 0 }
        },
        player_infos_t{player_info_t{ alice_addr, 100}, 
                       player_info_t{ bob_addr,   200} }
    ));
    assert_eql(RULE_PLAYBACK_FAILED, applied_rule);
    assert_eql(bignumber(300), out_results[ALICE]);
    assert_eql(bignumber(0), out_results[BOB]);    


}

int main(int argc, char** argv) {
    init_poker_lib();

    test_the_happy_path();
    test_punish();
    test_compute_result();

    
    std::cout <<  "---- SUCCESS"  << std::endl;
    return 0;
}
