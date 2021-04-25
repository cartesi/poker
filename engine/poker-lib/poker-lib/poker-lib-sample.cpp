#include "poker-lib.h"
#include <iostream>

using namespace poker;

int main(int argc, char** argv) {
    std::cout << "initializing libTMCG" << std::endl;
    
    if (init_poker_lib()) {
        std::cerr << "Error initializing libTMCG" << std::endl;
        return -1;
    }

    // All library methods return 0 on success
    // For clarity, there is no more error handling from now on

    int num_players = 3;
    player alice(0, num_players);
    player bob(1, num_players);
    player eve(2, num_players);

    blob group;
    alice.create_group(group);
    bob.load_group(group);
    eve.load_group(group);

    blob alice_key, bob_key, eve_key;
    alice.generate_key(alice_key);
    bob.generate_key(bob_key);
    eve.generate_key(eve_key);
    
    alice.load_their_key(bob_key);
    alice.load_their_key(eve_key);
    alice.finalize_key_generation();

    bob.load_their_key(alice_key);
    bob.load_their_key(eve_key);
    bob.finalize_key_generation();

    eve.load_their_key(alice_key);
    eve.load_their_key(bob_key);
    eve.finalize_key_generation();

    blob vsshe;
    alice.create_vsshe_group(vsshe);
    bob.load_vsshe_group(vsshe);
    eve.load_vsshe_group(vsshe);

    alice.create_stack();
    bob.create_stack();
    eve.create_stack();
    
    blob alice_mix, alice_mix_proof;
    blob bob_mix, bob_mix_proof;
    blob eve_mix, eve_mix_proof;
    
    alice.shuffle_stack(alice_mix, alice_mix_proof);
    bob.load_stack(alice_mix, alice_mix_proof);
    eve.load_stack(alice_mix, alice_mix_proof);
 
    bob.shuffle_stack(bob_mix, bob_mix_proof);
    alice.load_stack(bob_mix, bob_mix_proof);
    eve.load_stack(bob_mix, bob_mix_proof);

    eve.shuffle_stack(eve_mix, eve_mix_proof);
    alice.load_stack(eve_mix, eve_mix_proof);
    bob.load_stack(eve_mix, eve_mix_proof);

    alice.take_cards_from_stack(2);
    bob.take_cards_from_stack(2);
    eve.take_cards_from_stack(2);

    blob bob_proof_0, eve_proof_0;
    alice.self_card_seret(0);
    bob.prove_card_secret(0, bob_proof_0);
    eve.prove_card_secret(0, eve_proof_0);
    alice.verify_card_seret(0, bob_proof_0);
    alice.verify_card_seret(0, eve_proof_0);
    alice.open_card(0);
    auto alice_card_0 = alice.get_open_card(0);

    blob alice_proof_0;
    bob.self_card_seret(0);
    alice.prove_card_secret(0, alice_proof_0);
    bob.verify_card_seret(0, alice_proof_0);
    bob.verify_card_seret(0, eve_proof_0);
    bob.open_card(0);
    auto bob_card_0 = bob.get_open_card(0);

    eve.self_card_seret(0);
    eve.verify_card_seret(0, alice_proof_0);
    eve.verify_card_seret(0, bob_proof_0);
    eve.open_card(0);
    auto eve_card_0 = eve.get_open_card(0);

    std::cout << "OK" << std::endl;    
    return 0;
}