#include <iostream>
#include <iostream>
#include <fstream>
#include "test-util.h"
#include "verifier.h"

using namespace poker;

void the_happy_path() {
    std::ifstream is;
    is.open ("test-verifier-fixture.bin", std::ifstream::in);
    poker::verifier v;
    auto res = v.verify(is);
    auto& g = v.game();
    is.close();
    
    // Winner: 1 Public cards: 40 36 5 9 30 Alice's cards: 28 0 Bob's cards: 42 35 
    assert_eql(BOB, g.winner);
    assert_eql(40, g.public_cards[0]);
    assert_eql(36, g.public_cards[1]);
    assert_eql(5, g.public_cards[2]);
    assert_eql(9, g.public_cards[3]);
    assert_eql(30, g.public_cards[4]);
    assert_eql(28, g.players[ALICE].cards[0]);
    assert_eql(0, g.players[ALICE].cards[1]);
    assert_eql(42, g.players[BOB].cards[0]);
    assert_eql(35, g.players[BOB].cards[1]);
}

int main(int argc, char** argv) {
    the_happy_path();
    std::cout << "SUCCESS" << std::endl;
    return 0;
}
