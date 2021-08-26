#include <iostream>
#include <iostream>
#include <fstream>
#include "poker-lib.h"
#include "test-util.h"
#include "game-playback.h"
#include "game-generator.h"

using namespace poker;

void the_happy_path() {

    game_generator gen;
    assert_eql(SUCCESS, gen.generate());
    auto &g = gen.game;
    
    
    std::istringstream is(gen.raw_turn_data);
    std::cout << "  -> size = " << gen.raw_turn_data.size() << "\n";
    game_playback vcr;
    assert_eql(SUCCESS, vcr.playback(is));
    auto& vg = vcr.game();

    assert_eql(g.winner, vg.winner);
    assert_eql(g.public_cards[0], vg.public_cards[0]);
    assert_eql(g.public_cards[1], vg.public_cards[1]);
    assert_eql(g.public_cards[2], vg.public_cards[2]);
    assert_eql(g.public_cards[3], vg.public_cards[3]);
    assert_eql(g.public_cards[4], vg.public_cards[4]);

    assert_eql(g.players[ALICE].cards[0], vg.players[ALICE].cards[0]);
    assert_eql(g.players[ALICE].cards[1], vg.players[ALICE].cards[1]);

    assert_eql(g.players[BOB].cards[0], vg.players[BOB].cards[0]);
    assert_eql(g.players[BOB].cards[1], vg.players[BOB].cards[1]);

    assert_eql(g.result[ALICE], vg.result[ALICE]);
    assert_eql(g.result[BOB], vg.result[BOB]);

}

int main(int argc, char** argv) {
    init_poker_lib();
    the_happy_path();
    std::cout << "SUCCESS" << std::endl;
    return 0;
}
