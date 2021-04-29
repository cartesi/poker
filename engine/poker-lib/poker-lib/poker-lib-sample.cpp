#include "poker-lib.h"
#include <iostream>

using namespace poker;

struct game_state {
    blob vtmf_group;
    blob alice_key;
    blob bob_key;
    blob vsshe_group;
    blob alice_mix, alice_mix_proof;
    blob bob_mix, bob_mix_proof;
    
    blob bob_proof_0;
    blob alice_proof_0;
};

game_state g;

int run_and_open_card(int card_index) {
    std::cout << "initializing libTMCG" << std::endl;
    
    if (init_poker_lib()) {
        std::cerr << "Error initializing libTMCG" << std::endl;
        return -1;
    }

    // All library methods return 0 on success
    // For clarity, there is no more error handling from now on

    int num_players = 3;
    player alice(0, num_players, /* predictable */ false);
    player bob(1, num_players,   /* predictable */ false);
    player eve(2, num_players,   /* predictable */ true);

    alice.create_group(g.vtmf_group);
    bob.load_group(g.vtmf_group);
    eve.load_group(g.vtmf_group);

    alice.generate_key(g.alice_key);
    bob.generate_key(g.bob_key);
    blob eve_key;
    eve.generate_key(eve_key);
    
    alice.load_their_key(g.bob_key);
    alice.load_their_key(eve_key);
    alice.finalize_key_generation();

    bob.load_their_key(g.alice_key);
    bob.load_their_key(eve_key);
    bob.finalize_key_generation();

    eve.load_their_key(g.alice_key);
    eve.load_their_key(g.bob_key);
    eve.finalize_key_generation();

    alice.create_vsshe_group(g.vsshe_group);
    bob.load_vsshe_group(g.vsshe_group);
    eve.load_vsshe_group(g.vsshe_group);

    alice.create_stack();
    bob.create_stack();
    eve.create_stack();
    
    blob eve_mix, eve_mix_proof;
    
    alice.shuffle_stack(g.alice_mix, g.alice_mix_proof);
    bob.load_stack(g.alice_mix, g.alice_mix_proof);
    eve.load_stack(g.alice_mix, g.alice_mix_proof);
 
    bob.shuffle_stack(g.bob_mix, g.bob_mix_proof);
    alice.load_stack(g.bob_mix, g.bob_mix_proof);
    eve.load_stack(g.bob_mix, g.bob_mix_proof);

    eve.shuffle_stack(eve_mix, eve_mix_proof);
    alice.load_stack(eve_mix, eve_mix_proof);
    bob.load_stack(eve_mix, eve_mix_proof);

    alice.take_cards_from_stack(2);
    bob.take_cards_from_stack(2);
    eve.take_cards_from_stack(2);

    blob eve_proof_0;
    alice.self_card_secret(card_index);
    bob.prove_card_secret(card_index, g.bob_proof_0);
    eve.prove_card_secret(card_index, eve_proof_0);
    alice.verify_card_secret(card_index, g.bob_proof_0);
    alice.verify_card_secret(card_index, eve_proof_0);
    alice.open_card(card_index);
    auto alice_card_0 = alice.get_open_card(card_index);

    bob.self_card_secret(card_index);
    alice.prove_card_secret(card_index, g.alice_proof_0);
    bob.verify_card_secret(card_index, g.alice_proof_0);
    bob.verify_card_secret(card_index, eve_proof_0);
    bob.open_card(card_index);
    auto bob_card_0 = bob.get_open_card(card_index);

    eve.self_card_secret(card_index);
    eve.verify_card_secret(card_index, g.alice_proof_0);
    eve.verify_card_secret(card_index, g.bob_proof_0);
    eve.open_card(card_index);
    auto eve_card_0 = eve.get_open_card(card_index);

    std::cout << "OK" << std::endl;    
    return eve_card_0;
}

void verify_open_card(int card_index, int expected_card_type) {
    std::cout << "Starting verification of card " << card_index << std::endl;
    int num_players = 3;
    player eve(2, num_players,   /* predictable */ true);
    eve.load_group(g.vtmf_group);

    blob eve_key;
    eve.generate_key(eve_key);
    eve.load_their_key(g.alice_key);
    eve.load_their_key(g.bob_key);
    eve.finalize_key_generation();

    eve.load_vsshe_group(g.vsshe_group);
    eve.create_stack();
    blob eve_mix, eve_mix_proof;
    eve.load_stack(g.alice_mix, g.alice_mix_proof);
    eve.load_stack(g.bob_mix, g.bob_mix_proof);
    eve.shuffle_stack(eve_mix, eve_mix_proof);

    eve.take_cards_from_stack(2);
    blob eve_proof_0;
    eve.self_card_secret(card_index);
    eve.verify_card_secret(card_index, g.alice_proof_0);
    eve.verify_card_secret(card_index, g.bob_proof_0);
    eve.open_card(card_index);
    auto eve_card_0 = eve.get_open_card(card_index);

    auto success = eve_card_0 == expected_card_type;

    std::cout << "Verification " <<  success << 
        " - expected: " << expected_card_type  <<
        " actual:" << eve_card_0 <<
        std::endl;    

}

int main(int argc, char** argv) {
    auto card_type = run_and_open_card(0);
    std::cout << "Verifying card" << std::endl;
    verify_open_card(0, card_type);
}

