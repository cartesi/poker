#include "poker-lib.h"

public_data DATA(2); // Game public data for 2 players

int main (int argc, char **argv) {
    Poker::init_libraries();

    Poker alice(0, 2, &DATA);
    Poker bob(1, 2, &DATA);
    
    alice.init();
    bob.init();

    alice.publishKey();
    bob.publishKey();

    alice.readKeys();
    bob.readKeys();

    alice.begin_shuffle();
    bob.begin_shuffle();

    alice.end_shuffle();
    bob.end_shuffle();

    alice.send_flop_proofs();
    bob.send_flop_proofs();
    
    alice.receive_flop_proofs();
    bob.receive_flop_proofs();

    // Allice allows Bob to see his 1st card
    alice.send_proof(bob.player, 0);
    bob.open_card(bob.player, 0);

    // Bob allows Alice to see his 1st card
    bob.send_proof(alice.player, 0);
    alice.open_card(alice.player, 0);

    // Allice allows Bob to see his 2nd card
    alice.send_proof(bob.player, 1);
    // ***  replace with the proof of the other card (1st)
    // DATA.privProofs[alice.player][1][bob.player] =  DATA.privProofs[alice.player][0][bob.player];
    bob.open_card(bob.player, 1);

    std::cout << "DONE" << std::endl;
    return 0;
}




