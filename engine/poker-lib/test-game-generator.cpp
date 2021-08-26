#include <iostream>
#include <sstream>
#include <memory.h>
#include <inttypes.h>
#include "test-util.h"
#include "poker-lib.h"
#include "game-generator.h"

#define TEST_SUITE_NAME "Test game generator"

using namespace poker;

void the_happy_path() {
    std::cout <<  "---- " TEST_SUITE_NAME << " - the_happy_path" << std::endl;
    game_generator gen;
    assert_eql(SUCCESS, gen.generate());

    assert_neq(0, gen.raw_player_info.size());
    assert_neq(0, gen.raw_turn_metadata.size());
    assert_neq(0, gen.raw_verification_info.size());
    assert_neq(0, gen.raw_turn_data.size());
}

int main(int argc, char** argv) {
    init_poker_lib();
    the_happy_path();
    std::cout <<  "---- SUCCESS - " TEST_SUITE_NAME << std::endl;
    return 0;
}
