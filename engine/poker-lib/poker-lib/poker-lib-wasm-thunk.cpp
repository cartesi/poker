#include <iostream>
#include <stdio.h>
#include "emscripten.h"

#include "poker-lib.h"
#include "solver.h"
#include "participant.h"
#include "player.h"

#define API EMSCRIPTEN_KEEPALIVE
typedef uint32_t POINTER;
typedef int32_t INT;
#define ASPOINTER(p) reinterpret_cast<POINTER>(p)
#define ASBLOB(p) reinterpret_cast<poker::blob*>(p)
#define ASSOLVER(p) reinterpret_cast<poker::solver*>(p)
#define ASPARTICIPANT(p) reinterpret_cast<poker::participant*>(p)
#define ASPLAYER(p) reinterpret_cast<poker::player*>(p)

// This code is the glue connecting the JavaScript and C++ code

extern "C" {

INT API poker_init() {
    poker::init_poker_lib();
    return 0;
}

// solver ---------------------------------------

POINTER API  poker_new_solver() {
    return reinterpret_cast<POINTER>(new poker::solver());
}

void API  poker_delete_solver(POINTER b) {
    delete ASSOLVER(b);
}

const char* API solver_get_hand_name(POINTER p, POINTER hand, int hand_size) {
    int* h = (int*)hand;
    return ASSOLVER(p)->get_hand_name(h, hand_size);
}

int API solver_compare_hands(POINTER p, POINTER hand1, POINTER hand2, int hand_size) {
    int* h1 = (int *)hand1;
    int* h2 = (int *)hand2;
    return ASSOLVER(p)->compare_hands(h1, h2, hand_size);
}

// blob ---------------------------------------

POINTER API  poker_new_blob() {
    return reinterpret_cast<POINTER>(new poker::blob());
}

void API  poker_delete_blob(POINTER b) {
    delete ASBLOB(b);
}

void API blob_clear(POINTER p) {
    ASBLOB(p)->clear();
}

const char* API blob_get_data(POINTER p) {
    return reinterpret_cast<const char*>(ASBLOB(p)->get_data());
}

void API blob_set_data(POINTER p, POINTER str) {
    const char* s = (const char*)str;
    ASBLOB(p)->set_data(s);
}

// participant ---------------------------------------

POINTER API  poker_new_participant(int participant_id, int num_participants, bool predictable) {
    auto participant = new poker::participant(participant_id, num_participants, predictable);
    return reinterpret_cast<POINTER>(participant);
}

void API  poker_delete_participant(POINTER p) {
    delete ASPARTICIPANT(p);
}

INT API participant_create_group(POINTER p, POINTER g) {
    return ASPARTICIPANT(p)->create_group(*ASBLOB(g));
}
 
INT API participant_load_group(POINTER p, POINTER g) {
    return ASPARTICIPANT(p)->load_group(*ASBLOB(g));
}   

INT API participant_generate_key(POINTER p, POINTER k) {
    return ASPARTICIPANT(p)->generate_key(*ASBLOB(k));
}

INT API participant_load_their_key(POINTER p, POINTER k) {
    return ASPARTICIPANT(p)->load_their_key(*ASBLOB(k));
}

INT API participant_finalize_key_generation(POINTER p) {
    return ASPARTICIPANT(p)->finalize_key_generation();
}

INT API participant_create_vsshe_group(POINTER p, POINTER k) {
    return ASPARTICIPANT(p)->create_vsshe_group(*ASBLOB(k));
}

INT API participant_load_vsshe_group(POINTER p, POINTER k) {
    return ASPARTICIPANT(p)->load_vsshe_group(*ASBLOB(k));
}

INT API participant_create_stack(POINTER p) {
    return ASPARTICIPANT(p)->create_stack();
}

INT API participant_shuffle_stack(POINTER p, POINTER s, POINTER prf) {
    return ASPARTICIPANT(p)->shuffle_stack(*ASBLOB(s), *ASBLOB(prf));
}

INT API participant_load_stack(POINTER p, POINTER s, POINTER prf) {
    return ASPARTICIPANT(p)->load_stack(*ASBLOB(s), *ASBLOB(prf));
}

INT API participant_take_cards_from_stack(POINTER p, int c) {
    return ASPARTICIPANT(p)->take_cards_from_stack(c);
}

INT API participant_prove_card_secret(POINTER p, int c, POINTER s) {
    return ASPARTICIPANT(p)->prove_card_secret(c, *ASBLOB(s));
}

INT API participant_self_card_secret(POINTER p, int c) {
    return ASPARTICIPANT(p)->self_card_secret(c);
}

INT API participant_verify_card_secret(POINTER p, int c, POINTER s) {
    return ASPARTICIPANT(p)->verify_card_secret(c, *ASBLOB(s));
}

INT API participant_open_card(POINTER p, int c) {
    return ASPARTICIPANT(p)->open_card(c);
}

INT API participant_get_open_card(POINTER p, int c) {
    return ASPARTICIPANT(p)->get_open_card(c);
}

// player ---------------------------------------

POINTER API  poker_new_player(INT player_id) {
    return reinterpret_cast<POINTER>(new poker::player(player_id));
}

void API  poker_delete_player(POINTER p) {
    delete ASPLAYER(p);
}

INT API player_init_game(POINTER p, INT alice_money, INT bob_money) {
    return ASPLAYER(p)->init_game(alice_money, bob_money);
}

INT API player_create_vtmf(POINTER p, POINTER vtmf) {
    return ASPLAYER(p)->create_vtmf(*ASBLOB(vtmf));
}

INT API player_load_vtmf(POINTER p, POINTER vtmf) {
    return ASPLAYER(p)->load_vtmf(*ASBLOB(vtmf));
}

INT API player_generate_key(POINTER p, POINTER key) {
    return ASPLAYER(p)->generate_key(*ASBLOB(key));
}

INT API player_load_opponent_key(POINTER p, POINTER key) {
    return ASPLAYER(p)->load_opponent_key(*ASBLOB(key));
}

INT API player_create_vsshe(POINTER p, POINTER vsshe) {
    return ASPLAYER(p)->create_vsshe(*ASBLOB(vsshe));
}

INT API player_load_vsshe(POINTER p, POINTER vsshe) {
    return ASPLAYER(p)->load_vsshe(*ASBLOB(vsshe));
}

INT API player_shuffle_stack(POINTER p, POINTER mix, POINTER proof) {
    return ASPLAYER(p)->shuffle_stack(*ASBLOB(mix), *ASBLOB(proof));
}

INT API player_load_stack(POINTER p, POINTER mix, POINTER proof) {
    return ASPLAYER(p)->load_stack(*ASBLOB(mix), *ASBLOB(proof));
}

INT API player_deal_cards(POINTER p) {
    return ASPLAYER(p)->deal_cards();
}

INT API player_prove_opponent_cards(POINTER p, POINTER proofs) {
    return ASPLAYER(p)->prove_opponent_cards(*ASBLOB(proofs));
}

INT API player_open_private_cards(POINTER p, POINTER their_proofs) {
    return ASPLAYER(p)->open_private_cards(*ASBLOB(their_proofs));
}

INT API player_prove_public_cards(POINTER p, POINTER proofs) {
    return ASPLAYER(p)->prove_public_cards(*ASBLOB(proofs));
}

INT API player_open_public_cards(POINTER p, POINTER their_proofs) {
    return ASPLAYER(p)->open_public_cards(*ASBLOB(their_proofs));
}

INT API player_prove_my_cards(POINTER p, POINTER proofs) {
    return ASPLAYER(p)->prove_my_cards(*ASBLOB(proofs));
}

INT API player_open_opponent_cards(POINTER p, POINTER their_proofs) {
    return ASPLAYER(p)->open_opponent_cards(*ASBLOB(their_proofs));
}

INT API player_game_over(POINTER p) {
    return ASPLAYER(p)->game_over();
}

INT API player_error(POINTER p) {
    return ASPLAYER(p)->error();
}

INT API player_private_card(POINTER p, int index) {
    return ASPLAYER(p)->private_card(index);
}

INT API player_public_card(POINTER p, int index)  {
    return ASPLAYER(p)->public_card(index);
}

INT API player_opponent_card(POINTER p, int index) {
    return ASPLAYER(p)->opponent_card(index);
}

INT API player_winner(POINTER p) {
    return ASPLAYER(p)->winner();
}


} // extern "C"

