#include <fstream>
#include <iostream>

#include "game-generator.h"
#include "game-playback.h"
#include "poker-lib.h"
#include "test-util.h"

using namespace poker;

static std::string base_dir;

void test_the_happy_path() {
    game_generator gen;
    assert_eql(SUCCESS, gen.generate());
    auto& g = gen.alice_game;
    if (gen.bob_game.muck)
        g = gen.bob_game;

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

    if (g.winner == TIE || g.winner == ALICE && g.last_aggressor == BOB || g.winner == BOB && g.last_aggressor == ALICE) {
        assert_eql(g.players[ALICE].cards[0], vg.players[ALICE].cards[0]);
        assert_eql(g.players[ALICE].cards[1], vg.players[ALICE].cards[1]);
        assert_eql(g.players[BOB].cards[0], vg.players[BOB].cards[0]);
        assert_eql(g.players[BOB].cards[1], vg.players[BOB].cards[1]);
    } else if (g.winner == ALICE && g.last_aggressor == ALICE) {
        assert_eql(g.players[ALICE].cards[0], vg.players[ALICE].cards[0]);
        assert_eql(g.players[ALICE].cards[1], vg.players[ALICE].cards[1]);
    } else if (g.winner == BOB && g.last_aggressor == BOB) {
        assert_eql(g.players[BOB].cards[0], vg.players[BOB].cards[0]);
        assert_eql(g.players[BOB].cards[1], vg.players[BOB].cards[1]);
    }

    assert_eql(g.funds_share[ALICE], vg.funds_share[ALICE]);
    assert_eql(g.funds_share[BOB], vg.funds_share[BOB]);
}

game_state playback_fixture(const std::string game) {
    std::cout << "Replaying game: " << game << std::endl;
    std::string path = base_dir + "/" + game + "/turn-data.raw";
    std::ifstream ifs(path, std::ifstream::in);

    if (!ifs.good()) {
        std::cerr << "Error opening " << path << std::endl;
        exit(-1);
    }

    game_playback vcr;
    assert_eql(SUCCESS, vcr.playback(ifs));
    ifs.close();

    return vcr.game();
}

void test_alice_mucks() {
    auto g = playback_fixture("alice-mucks");
    assert_eql(BOB, g.winner);
    assert_eql(BOB, g.last_aggressor);
    assert_eql(true, g.muck);
    assert_eql(cards::uk, g.players[ALICE].cards[0]);
    assert_eql(cards::uk, g.players[ALICE].cards[1]);
}

void test_tie() {
    auto g = playback_fixture("tie");
    assert_eql(TIE, g.winner);
}

void test_alice_last_aggressor() {
    auto g = playback_fixture("alice-last-aggressor");
    assert_neq(-1, g.winner);
    assert_eql(ALICE, g.last_aggressor);
}

void test_bob_last_aggressor() {
    auto g = playback_fixture("bob-last-aggressor");
    assert_neq(-1, g.winner);
    assert_eql(BOB, g.last_aggressor);
}

std::string fixture_path(const char* cmd) {
    std::cout << "Initial cmd" << cmd << std::endl;
    std::string cmd_str(cmd);
    std::string path = cmd_str.substr(0, cmd_str.find_last_of("/"));
    path.append("/fixtures");
    std::cout << "Base dir" << path << std::endl;
    return path;
}

int main(int argc, char** argv) {
    base_dir = fixture_path(argv[0]);
    init_poker_lib();

    test_the_happy_path();
    test_tie();
    test_alice_last_aggressor();
    test_bob_last_aggressor();
    test_alice_mucks();

    std::cout << "SUCCESS" << std::endl;
    return 0;
}
