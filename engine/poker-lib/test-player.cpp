#include <iostream>
#include <sstream>
#include "player.h"
#include "verifier.h"
#include "test-util.h"

using namespace poker;
using namespace poker::cards;

#define TEST_SUITE_NAME "Test player"

#define FLOP(n) (n)
#define TURN    FLOP(2)+1
#define RIVER   FLOP(2)+2

void the_happy_path() {
    player alice(ALICE);
    assert_eql(SUCCESS, alice.init(100, 300, 10));
    assert_eql(-1, alice.winner());
    assert_eql(100, alice.game().players[ALICE].total_funds);
    assert_eql(5, alice.game().players[ALICE].bets);
    assert_eql(300, alice.game().players[BOB].total_funds);
    assert_eql(10, alice.game().players[BOB].bets);
    assert_eql(uk, alice.private_card(0));
    assert_eql(uk, alice.private_card(1));
    assert_eql(uk, alice.opponent_card(0));
    assert_eql(uk, alice.opponent_card(1));
    assert_eql(uk, alice.public_card(FLOP(0)));
    assert_eql(uk, alice.public_card(FLOP(1)));
    assert_eql(uk, alice.public_card(FLOP(2)));
    assert_eql(uk, alice.public_card(TURN));
    assert_eql(uk, alice.public_card(RIVER));

    player bob(BOB);
    assert_eql(SUCCESS, bob.init(100, 300, 10));
    assert_eql(-1, bob.winner());
    assert_eql(100, bob.game().players[ALICE].total_funds);
    assert_eql(5, bob.game().players[ALICE].bets);
    assert_eql(300, bob.game().players[BOB].total_funds);
    assert_eql(10, bob.game().players[BOB].bets);
    assert_eql(uk, bob.private_card(0));
    assert_eql(uk, bob.private_card(1));
    assert_eql(uk, bob.opponent_card(0));
    assert_eql(uk, bob.opponent_card(1));
    assert_eql(uk, bob.public_card(FLOP(0)));
    assert_eql(uk, bob.public_card(FLOP(1)));
    assert_eql(uk, bob.public_card(FLOP(2)));
    assert_eql(uk, bob.public_card(TURN));
    assert_eql(uk, bob.public_card(RIVER));

    std::map<int, blob> msg; // messages exchanged during game

    // Start handshake
    assert_eql(SUCCESS, alice.create_handshake(msg[0]));
    assert_eql(CONTINUED, bob.process_handshake(msg[0], msg[1]));
    assert_eql(CONTINUED, alice.process_handshake(msg[1], msg[2]));
    assert_eql(CONTINUED, bob.process_handshake(msg[2], msg[3]));
    assert_eql(SUCCESS, alice.process_handshake(msg[3], msg[4]));
    assert_eql(SUCCESS, bob.process_handshake(msg[4], msg[5]));
    assert_eql(true, msg[5].empty());
    // Handhsake finished
    assert_neq(uk, alice.private_card(0));
    assert_neq(uk, alice.private_card(1));
    assert_neq(uk, bob.private_card(0));
    assert_neq(uk, bob.private_card(1));

    // Start betting rounds
    assert_eql(ALICE, alice.current_player());
    assert_eql(ALICE, bob.current_player());
    assert_eql(game_step::PREFLOP_BET, alice.step());
    assert_eql(game_step::PREFLOP_BET, bob.step());

    // Preflop: Alice calls
    assert_eql(SUCCESS, alice.create_bet(BET_CALL, 0, msg[5]));
    assert_eql(game_step::PREFLOP_BET, alice.step());
    assert_eql(BOB, alice.current_player());
    assert_eql(SUCCESS, bob.process_bet(msg[5], msg[6]));
    assert_eql(true, msg[6].empty());
    assert_eql(game_step::PREFLOP_BET, bob.step()); 
    assert_eql(BOB, alice.current_player());

    // Preflop: Bob checks
    assert_eql(CONTINUED, bob.create_bet(BET_CHECK, 0, msg[6]));
    assert_eql(game_step::OPEN_FLOP, bob.step());
    assert_eql(BOB, bob.current_player());
    assert_eql(SUCCESS, alice.process_bet(msg[6], msg[7]));
    assert_neq(uk, alice.public_card(FLOP(0)));
    assert_neq(uk, alice.public_card(FLOP(1)));
    assert_neq(uk, alice.public_card(FLOP(2)));

    assert_eql(SUCCESS, bob.process_bet(msg[7], msg[8]));    
    assert_eql(true, msg[8].empty());
    assert_eql(BOB, bob.current_player());
    assert_neq(uk, bob.public_card(FLOP(0)));
    assert_neq(uk, bob.public_card(FLOP(1)));
    assert_neq(uk, bob.public_card(FLOP(2)));

    bet_type type;
    money_t amt;

    // Flop: Bob checks
    assert_eql(game_step::FLOP_BET, bob.step());
    assert_eql(SUCCESS, bob.create_bet(BET_CHECK, 0, msg[8]));
    assert_eql(ALICE, bob.current_player());
    assert_eql(game_step::FLOP_BET, alice.step());
    assert_eql(SUCCESS, alice.process_bet(msg[8], msg[9]));
    assert_eql(true, msg[9].empty());
    assert_eql(ALICE, alice.current_player());

    // Flop: Alice checks
    assert_eql(game_step::FLOP_BET, alice.step());
    assert_eql(CONTINUED, alice.create_bet(BET_CHECK, 0, msg[9]));
    assert_eql(SUCCESS, bob.process_bet(msg[9], msg[10]));
    assert_eql(SUCCESS, alice.process_bet(msg[10], msg[11]));
    assert_eql(true, msg[11].empty());
    assert_eql(BOB, alice.current_player());
    assert_eql(BOB, bob.current_player());
    assert_neq(uk, bob.public_card(TURN));
    assert_neq(uk, alice.public_card(TURN));
    
    // Turn: Bob raises
    assert_eql(game_step::TURN_BET, bob.step());
    assert_eql(game_step::TURN_BET, alice.step());
    assert_eql(SUCCESS, bob.create_bet(BET_RAISE, 30, msg[11]));
    assert_eql(40, bob.game().players[BOB].bets);

    assert_eql(SUCCESS, alice.process_bet(msg[11], msg[12], &type, &amt));
    assert_eql(40, alice.game().players[BOB].bets);
    
    assert_eql(BET_RAISE, type);
    assert_eql(30, amt);
    assert_eql(true, msg[12].empty());
    assert_eql(ALICE, alice.current_player());
    assert_eql(ALICE, bob.current_player());

    // Alice calls
    assert_eql(game_step::TURN_BET, alice.step());
    assert_eql(CONTINUED, alice.create_bet(BET_CALL, 0, msg[12]));
    assert_eql(40, alice.game().players[ALICE].bets);
    assert_eql(game_step::OPEN_RIVER, alice.step());
    assert_eql(SUCCESS, bob.process_bet(msg[12], msg[13]));
    assert_eql(40, bob.game().players[ALICE].bets);
    assert_eql(SUCCESS, alice.process_bet(msg[13], msg[14]));
    assert_eql(true, msg[14].empty());   
    assert_eql(game_step::RIVER_BET, alice.step());
    assert_eql(game_step::RIVER_BET, bob.step());
    assert_eql(BOB, alice.current_player());
    assert_eql(BOB, bob.current_player());

    // Bob checks
    assert_eql(SUCCESS, bob.create_bet(BET_CHECK, 0, msg[14]));
    assert_eql(SUCCESS, alice.process_bet(msg[14], msg[15], &type, &amt));
    assert_eql(true, msg[15].empty());   

    // Alice checks
    assert_eql(CONTINUED, alice.create_bet(BET_CHECK, 0, msg[15]));
    assert_eql(SUCCESS, bob.process_bet(msg[15], msg[16], &type, &amt));
    assert_eql(SUCCESS, alice.process_bet(msg[16], msg[17], &type, &amt));
    assert_eql(true, msg[17].empty());   
    assert_neq(uk, bob.public_card(RIVER));
    assert_neq(uk, alice.public_card(RIVER));

    assert_eql(game_step::GAME_OVER, alice.step());
    assert_neq(uk, alice.opponent_card(0));
    assert_neq(uk, alice.opponent_card(1));
    assert_eql(game_step::GAME_OVER, bob.step());
    assert_neq(uk, bob.opponent_card(0));
    assert_neq(uk, bob.opponent_card(1));
    assert_neq(-1, alice.winner());
    assert_neq(-1, bob.winner());
    assert_eql(alice.winner(), bob.winner());

    std::stringstream ss;
    for(auto&& i: msg) {
        assert_eql(0, i.second.size() % padding_size);
        ss << i.second.get_data();
    }

    // save verifier fixture
    /*
    auto qs = ss.str();
    FILE *fp = fopen("test-game-data.bin","w");
    fwrite(qs.c_str(), qs.size(),1, fp);
    fclose(fp);
    */

}

int main(int argc, char** argv) {
    the_happy_path();
    std::cout << "---- SUCCESS - " TEST_SUITE_NAME << std::endl;
    return 0;
}