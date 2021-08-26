#include <iostream>
#include <stdio.h>
#include "emscripten.h"
#include "i_participant.h"

#include "poker-lib.h"
#include "player.h"

/*
* WebAssembly exported module
*/

#define API EMSCRIPTEN_KEEPALIVE

typedef int32_t INT;

// helper functions for reading data from webworker's payload

// Reads player reference from memory and advances pointer
static inline poker::player* read_player(char*& p) {
    INT* i = reinterpret_cast<INT*>(p);
    auto res = reinterpret_cast<poker::player*>(*i);
    p += sizeof(INT);
    return res;
}

// Reads money_t from memory and advances pointer
static inline poker::money_t read_money(char*& p) {
    poker::money_t res;
    res.parse_string(p);
    p += 1+strlen(p);
    return res;
}

// Reads INT from memory and advances pointer
static inline INT read_int(char*& p) {
    auto res =  *reinterpret_cast<INT*>(p);
    p += sizeof(INT);
    return res;
}

// helper functions for sending data back to webworker

static inline void worker_respond(char* data, int size, bool final) {
    if (final)
        emscripten_worker_respond(data, size);
    else
        emscripten_worker_respond_provisionally(data, size);
}

static inline void worker_respond(INT p, bool final=true) {
    char* data = reinterpret_cast<char*>(&p);
    worker_respond(data, sizeof(INT), final);
}

static inline void worker_respond(poker::game_error p, bool final=true) {
    worker_respond((INT)p, final);
}

static inline void worker_respond(poker::player* p, bool final=true) {
    INT v = reinterpret_cast<INT>(p);
    char* data = reinterpret_cast<char*>(&v);
    worker_respond(data, sizeof(INT), final);
}

static inline void worker_respond(const std::string& p, bool final=true) {
    worker_respond((char*)p.data(), p.size(), final);
}

///static inline void worker_respond(char *p, bool final=true) {
///    worker_respond(p, strlen(p), final);
///}

static inline void worker_respond(poker::money_t& p, bool final=true) {
    auto tmp = p.to_string();
    worker_respond((char*)tmp.c_str(), tmp.size(), final);
}

//
// WASM Module exported functions
//

extern "C" {

void API poker_init(char* msg) {
    poker::poker_lib_options options;
    options.encryption = read_int(msg);
    poker::init_poker_lib(&options);
    auto res = poker::game_error::SUCCESS;
    worker_respond(res);
}

void API poker_new_player(char* msg) {
    auto player_id = read_int(msg);
    auto player = new poker::player(player_id);
    worker_respond(player);
}

void API  poker_delete_player(char* msg) {
    delete read_player(msg);
}

void API player_init(char* msg) {
    auto player = read_player(msg);
    auto alice_money = read_money(msg);
    auto bob_money = read_money(msg);
    auto big_blind = read_money(msg);
    auto res = player->init(alice_money, bob_money, big_blind);
    worker_respond(res);
}

void API player_create_handshake(char* msg) {
    auto player = read_player(msg);
    std::string msg_out;
    auto res = player->create_handshake(msg_out);
    worker_respond(res, false);
    worker_respond(msg_out, true);
}

void API player_process_handshake(char* msg) {
    auto player = read_player(msg);
    auto msglen = read_int(msg);
    std::string msg_in(msg, msglen);
    std::string msg_out;
    auto res = player->process_handshake(msg_in, msg_out);
    worker_respond(res, false);
    worker_respond(msg_out, true);
}

void API player_create_bet(char* msg) {
    auto player = read_player(msg);
    auto type = read_int(msg);
    auto amt = read_money(msg);
    std::string msg_out;
    auto res = player->create_bet((poker::bet_type)type, amt, msg_out);
    worker_respond(res, false);
    worker_respond(msg_out, true);
}

void API player_process_bet(char* msg) {
    poker::bet_type type=poker::bet_type::BET_NONE;
    poker::money_t amt=0;
    auto player = read_player(msg);
    auto msglen = read_int(msg);
    std::string msg_in(msg, msglen);
    std::string msg_out;
    auto res = player->process_bet(msg_in, msg_out, &type, &amt);
    worker_respond(res, false);
    worker_respond((INT)type, false);
    worker_respond(amt, false);
    worker_respond(msg_out, true);
}

void API player_game_state(char* msg) {
    auto player = read_player(msg);
    auto g = player->game();
    char extra_fields[100];
    sprintf(extra_fields, "\"step\": %d", (int)player->step());
    auto json = g.to_json(extra_fields);
    worker_respond(json.c_str());
}

} // extern "C"

