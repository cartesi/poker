#include <iostream>
#include "player.h"

using namespace poker;

#define TEST_SUITE_NAME "Test player"

#define ASSERT(cmd) { \
    std::cerr <<  "..." #cmd << std::endl; \
    auto r = cmd; \
    if (r) { \
        std::cerr << "Assertion failed. Expected:0, got:" << r << " on " #cmd << std::endl; \
        exit(65); \
    }}

void the_happy_path() {
    std::cout << "---- " TEST_SUITE_NAME << " - the_happy_path" << std::endl;
    player alice(ALICE);
    player bob(BOB);
    ASSERT(alice.init_game(100,100));
    ASSERT(bob.init_game(100,100));
    blob vtmf;
    ASSERT(alice.create_vtmf(vtmf));
    ASSERT(bob.load_vtmf(vtmf));
    
    blob alice_key, bob_key;
    ASSERT(alice.generate_key(alice_key));
    ASSERT(bob.generate_key(bob_key));
    ASSERT(bob.load_opponent_key(alice_key));
    ASSERT(alice.load_opponent_key(bob_key));

    blob vsshe;
    ASSERT(alice.create_vsshe(vsshe));
    ASSERT(bob.load_vsshe(vsshe));

    blob alice_mix, alice_proof, bob_mix, bob_proof;
    ASSERT(alice.shuffle_stack(alice_mix, alice_proof));
    ASSERT(bob.load_stack(alice_mix, alice_proof));
    ASSERT(bob.shuffle_stack(bob_mix, bob_proof));   
    ASSERT(alice.load_stack(bob_mix, bob_proof));

    ASSERT(alice.deal_cards());
    ASSERT(bob.deal_cards());

    blob alice_private_proofs, bob_private_proofs;
    ASSERT(bob.prove_opponent_cards(alice_private_proofs));
    ASSERT(alice.open_private_cards(alice_private_proofs));
    std::cout << "### ALICE PRIVATE CARD[0]=" << alice.private_card(0) << std::endl;
    std::cout << "### ALICE PRIVATE CARD[1]=" << alice.private_card(1) << std::endl;
    
    ASSERT(alice.prove_opponent_cards(bob_private_proofs));
    ASSERT(bob.open_private_cards(bob_private_proofs));
    std::cout << "### BOB PRIVATE CARD[0]=" << bob.private_card(0) << std::endl;
    std::cout << "### BOB PRIVATE CARD[1]=" << bob.private_card(1) << std::endl;

    blob bob_public_proofs, alice_public_proofs;
    ASSERT(bob.prove_public_cards(bob_public_proofs));
    ASSERT(alice.open_public_cards(bob_public_proofs));
    for(auto i=0; i<NUM_PUBLIC_CARDS; i++)
        std::cout << "### ALICE PUBLIC CARD[" << i << "]=" << alice.public_card(i) << std::endl;

    ASSERT(alice.prove_public_cards(alice_public_proofs));
    ASSERT(bob.open_public_cards(alice_public_proofs));
    for(auto i=0; i<NUM_PUBLIC_CARDS; i++)
        std::cout << "### BOB PUBLIC CARD[" << i << "]=" << bob.public_card(i) << std::endl;

    blob alice_private_proofs2, bob_public_proofs2;
    ASSERT(bob.prove_my_cards(bob_public_proofs2));
    ASSERT(alice.open_opponent_cards(bob_public_proofs2));
    ASSERT(alice.prove_my_cards(alice_private_proofs2));
    ASSERT(bob.open_opponent_cards(alice_private_proofs2));

}


int main(int argc, char** argv) {
    the_happy_path();
    std::cout << "---- SUCCESS - " TEST_SUITE_NAME << std::endl;
    return 0;
}