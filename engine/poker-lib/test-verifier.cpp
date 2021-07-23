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
    
    // >>> Winner: 0 Public cards:    25 28 16 48 39 Alice's cards: 22 29 Bob's cards: 31 43 
    assert_eql(ALICE, g.winner);
    assert_eql(25, g.public_cards[0]);
    assert_eql(28, g.public_cards[1]);
    assert_eql(16, g.public_cards[2]);
    assert_eql(48, g.public_cards[3]);
    assert_eql(39, g.public_cards[4]);
    assert_eql(22, g.players[ALICE].cards[0]);
    assert_eql(29, g.players[ALICE].cards[1]);
    assert_eql(31, g.players[BOB].cards[0]);
    assert_eql(43, g.players[BOB].cards[1]);
}

int main(int argc, char** argv) {
    the_happy_path();
    std::cout << "SUCCESS" << std::endl;
    return 0;
}
