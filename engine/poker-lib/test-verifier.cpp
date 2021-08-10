#include <iostream>
#include <iostream>
#include <fstream>
#include "test-util.h"
#include "verifier.h"

using namespace poker;

void the_happy_path() {
    std::ifstream is;
    is.open ("test-verifier-fixture.bin", std::ifstream::binary);
    poker::verifier v;
    auto res = v.verify(is);
    auto& g = v.game();
    is.close();
    
    // >> Winner: 1 Public cards: 16 4 46 25 50 Alice's cards: 34 1 Bob's cards: 6 10 
    assert_eql(BOB, g.winner);
    assert_eql(16, g.public_cards[0]);
    assert_eql(4, g.public_cards[1]);
    assert_eql(46, g.public_cards[2]);
    assert_eql(25, g.public_cards[3]);
    assert_eql(50, g.public_cards[4]);
    assert_eql(34, g.players[ALICE].cards[0]);
    assert_eql(1, g.players[ALICE].cards[1]);
    assert_eql(6, g.players[BOB].cards[0]);
    assert_eql(10, g.players[BOB].cards[1]);
}

int main(int argc, char** argv) {
    the_happy_path();
    std::cout << "SUCCESS" << std::endl;
    return 0;
}
