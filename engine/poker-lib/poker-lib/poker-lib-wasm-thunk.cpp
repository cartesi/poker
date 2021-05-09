#include "solver.h"
#include "poker-lib.h"
#include <iostream>
#include <stdio.h>

#include "emscripten.h"

#define API EMSCRIPTEN_KEEPALIVE
typedef uint32_t POINTER;
typedef int32_t INT;
#define ASPOINTER(p) reinterpret_cast<POINTER>(p)
#define ASBLOB(p) reinterpret_cast<poker::blob*>(p)
#define ASSOLVER(p) reinterpret_cast<poker::solver*>(p)
#define ASPLAYER(p) reinterpret_cast<poker::player*>(p)

// This code is the glue connecting the JavaScript and C++ code

extern "C" {

INT API poker_init() {
    poker::init_poker_lib();
    return 0;
}

POINTER API  poker_new_solver() {
    return reinterpret_cast<POINTER>(new poker::solver());
}

void API  poker_delete_solver(POINTER b) {
    delete ASSOLVER(b);
}

int API solver_card_type_from_str(POINTER p, POINTER* str) {
    const char* s = (const char*)str;
    return ASSOLVER(p)->card_type_from_str(s);
}

const char*  API solver_card_str_from_type(POINTER p, int card_type) {
    return ASSOLVER(p)->card_str_from_type(card_type);
}

int  API solver_compare_hands(POINTER p, POINTER hand1, POINTER  hand2, int hand_size) {
    int* h1 = (int *)hand1;
    int* h2 = (int *)hand2;
    return ASSOLVER(p)->compare_hands(h1, h2, hand_size);
}

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

POINTER API  poker_new_player(int player_id, int num_players, bool predictable) {
    auto player = new poker::player(player_id, num_players, predictable);
    return reinterpret_cast<POINTER>(player);
}

void API  poker_delete_player(POINTER p) {
    delete ASPLAYER(p);
}

INT API player_create_group(POINTER p, POINTER g) {
    return ASPLAYER(p)->create_group(*ASBLOB(g));
}
 
INT API player_load_group(POINTER p, POINTER g) {
    return ASPLAYER(p)->load_group(*ASBLOB(g));
}   

INT API player_generate_key(POINTER p, POINTER k) {
    return ASPLAYER(p)->generate_key(*ASBLOB(k));
}

INT API player_load_their_key(POINTER p, POINTER k) {
    return ASPLAYER(p)->load_their_key(*ASBLOB(k));
}

INT API player_finalize_key_generation(POINTER p) {
    return ASPLAYER(p)->finalize_key_generation();
}

INT API player_create_vsshe_group(POINTER p, POINTER k) {
    return ASPLAYER(p)->create_vsshe_group(*ASBLOB(k));
}

INT API player_load_vsshe_group(POINTER p, POINTER k) {
    return ASPLAYER(p)->load_vsshe_group(*ASBLOB(k));
}

INT API player_create_stack(POINTER p) {
    return ASPLAYER(p)->create_stack();
}

INT API player_shuffle_stack(POINTER p, POINTER s, POINTER prf) {
    return ASPLAYER(p)->shuffle_stack(*ASBLOB(s), *ASBLOB(prf));
}

INT API player_load_stack(POINTER p, POINTER s, POINTER prf) {
    return ASPLAYER(p)->load_stack(*ASBLOB(s), *ASBLOB(prf));
}

INT API player_take_cards_from_stack(POINTER p, int c) {
    return ASPLAYER(p)->take_cards_from_stack(c);
}

INT API player_prove_card_secret(POINTER p, int c, POINTER s) {
    return ASPLAYER(p)->prove_card_secret(c, *ASBLOB(s));
}

INT API player_self_card_secret(POINTER p, int c) {
    return ASPLAYER(p)->self_card_secret(c);
}

INT API player_verify_card_secret(POINTER p, int c, POINTER s) {
    return ASPLAYER(p)->verify_card_secret(c, *ASBLOB(s));
}

INT API player_open_card(POINTER p, int c) {
    return ASPLAYER(p)->open_card(c);
}

INT API player_get_open_card(POINTER p, int c) {
    return ASPLAYER(p)->get_open_card(c);
}


} // extern "C"

