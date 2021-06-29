#include <iostream>
#include <stdio.h>
#include "emscripten.h"

#include "poker-lib.h"
#include "player.h"

/*
* WebAssembly exported module
*/

#define API EMSCRIPTEN_KEEPALIVE

typedef int32_t INT;

// helper functions 

static inline INT READINT(char* p) { 
    return *reinterpret_cast<INT*>(p);
}

static inline poker::player* READPLAYER(char* p) { 
    INT* i = reinterpret_cast<INT*>(p);
    return reinterpret_cast<poker::player*>(*i);
}

static inline void worker_respond(char* data, int size, bool final) { 
    if (final)
        emscripten_worker_respond(data, size);
    else
        emscripten_worker_respond_provisionally(data, size);
}

static inline void worker_respond(poker::game_error p, bool final=true) {
    INT v = reinterpret_cast<INT>((int)p);
    char* data = reinterpret_cast<char*>(&v);
    worker_respond(data, sizeof(INT), final);
}

static inline void worker_respond(poker::player* p, bool final=true) {
    INT v = reinterpret_cast<INT>(p);
    char* data = reinterpret_cast<char*>(&v);
    worker_respond(data, sizeof(INT), final);
}

static inline void worker_respond(poker::blob& p, bool final=true) {
    worker_respond((char*)p.get_data(), p.size(), final);
}

static inline void worker_respond(char *p, bool final=true) {
    worker_respond(p, strlen(p), final);
}
 
// exported functions 
    
extern "C" {

void API poker_init() {
    poker::init_poker_lib();
    auto res = poker::game_error::SUCCESS;
    worker_respond(res);
}

void API poker_new_player(char* msg) {
    auto player_id = READINT(msg);
    auto player = new poker::player(player_id);
    worker_respond(player);
}

void API  poker_delete_player(char* msg) {
    delete READPLAYER(msg);
}

void API player_init(char* msg) {
    auto player = READPLAYER(msg);
    msg += sizeof(INT);
    auto alice_money = READINT(msg);
    msg += sizeof(INT);
    auto bob_money = READINT(msg);
    msg += sizeof(INT);
    auto big_blind = READINT(msg);
    auto res = player->init(alice_money, bob_money, big_blind);
    worker_respond(res);
}

void API player_create_handshake(char* msg) {
    auto player = READPLAYER(msg);
    poker::blob msg_out;
    auto res = player->create_handshake(msg_out);
    worker_respond(res, false);
    worker_respond(msg_out, true);
}

void API player_process_handshake(char* msg) {
    auto player = READPLAYER(msg);
    msg += sizeof(INT);
    poker::blob msg_in;
    msg_in.set_data(msg);
    poker::blob msg_out;
    auto res = player->process_handshake(msg_in, msg_out);
    worker_respond(res, false);
    worker_respond(msg_out, true);
}

void API player_create_bet(char* msg) {
    auto player = READPLAYER(msg);
    msg += sizeof(INT);
    auto type = READINT(msg);
    msg += sizeof(INT);
    auto amt = READINT(msg);
    poker::blob msg_out;
    auto res = player->create_bet((poker::bet_type)type, amt, msg_out);
    worker_respond(res, false);
    worker_respond(msg_out, true);
}

void API player_process_bet(char* msg) {
    auto player = READPLAYER(msg);
    msg += sizeof(INT);
    poker::blob msg_in;
    msg_in.set_data(msg);
    poker::blob msg_out;
    auto res = player->process_bet(msg_in, msg_out);
    worker_respond(res, false);
    worker_respond(msg_out, true);
}

void API player_game_state(char* msg) {
    auto player = READPLAYER(msg);
    char json[1024];
    auto g = player->game();
    auto& p0 = g.players[0];
    auto& p1 = g.players[1];
    snprintf(json, sizeof(json), "{"
        "\"step\": %d, "
        "\"current_player\": %d, "
        "\"error\": %d, "
        "\"winner\": %d, "
        "\"public_cards\": [%d, %d, %d, %d, %d], "
        "\"players\": ["
            "{\"id\": %d, \"total_funds\": %d, \"bets\": %d, \"cards\":[%d, %d]},"
            "{\"id\": %d, \"total_funds\": %d, \"bets\": %d, \"cards\":[%d, %d]}"
        "]}",
        (int)player->step(),
        g.current_player, (int)g.error, g.winner,
        g.public_cards[0], g.public_cards[1], g.public_cards[2], 
        g.public_cards[3], g.public_cards[4],
        p0.id, p0.total_funds, p0.bets, p0.cards[0], p0.cards[1],
        p1.id, p1.total_funds, p1.bets, p1.cards[0], p1.cards[1]);

    worker_respond(json);
}

} // extern "C"

