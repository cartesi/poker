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
    
    // >> Winner: 0 Public cards: 6 4 7 50 26 Alice's cards: 1 2 Bob's cards: 48 34
    assert_eql(ALICE, g.winner);
    assert_eql(6, g.public_cards[0]);
    assert_eql(4, g.public_cards[1]);
    assert_eql(7, g.public_cards[2]);
    assert_eql(50, g.public_cards[3]);
    assert_eql(26, g.public_cards[4]);
    assert_eql(1, g.players[ALICE].cards[0]);
    assert_eql(2, g.players[ALICE].cards[1]);
    assert_eql(48, g.players[BOB].cards[0]);
    assert_eql(34, g.players[BOB].cards[1]);
}

int main(int argc, char** argv) {
    the_happy_path();
    std::cout << "SUCCESS" << std::endl;
    return 0;
}
