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

void the_happy_path() {

    game_generator gen;
    assert_eql(SUCCESS, gen.generate());
    auto &g = gen.game;

    std::istringstream turns(gen.raw_turn_data);
    std::istringstream turns_meta(gen.raw_turn_metadata);
    std::istringstream player_info(gen.raw_player_info);
    std::istringstream  verification_info(gen.raw_verification_info);
    
    std::ostringstream output;
    verifier ver(player_info, turns_meta, verification_info, turns, output);
    assert_eql(SUCCESS, ver.verify());
    assert_eql(gen.game.winner, ver.game().winner);
    assert_eql(SUCCESS, ver.game().error);

    std::istringstream is(output.str());
    assert_eql(128, output.str().size());

    bignumber filler1, filler2, funds1, funds2;
    assert_eql(SUCCESS, filler1.read_binary_be(is, 32));
    assert_eql(SUCCESS, funds1.read_binary_be(is, 32));
    assert_eql(SUCCESS, filler2.read_binary_be(is, 32));
    assert_eql(SUCCESS, funds2.read_binary_be(is, 32));
    assert_eql(0, filler1);
    assert_eql(ver.result()[0], funds1);
    assert_eql(0, filler2);
    assert_eql(ver.result()[1], funds2);

    std::cout << output.str() << std::endl;
}

int main(int argc, char** argv) {
    init_poker_lib();
    the_happy_path();
    std::cout <<  "---- SUCCESS"  << std::endl;
    return 0;
}
