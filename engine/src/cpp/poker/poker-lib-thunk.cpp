#include "poker-lib.h"
#include "emscripten.h"

#define API EMSCRIPTEN_KEEPALIVE
typedef uint32_t POINTER;
typedef int32_t INT;

typedef void (*CALLBACK)(INT res);

#define UNWRAP(g) reinterpret_cast<Poker*>(g)

extern "C" {

INT API poker_init_libraries(int players) {
    Poker::init_libraries();
    return 0;
}

POINTER API poker_make_public_data(int players) {    
    return reinterpret_cast<POINTER>(new public_data(players));
}

POINTER API  poker_make_game(int player, POINTER data) {
    auto pdata = reinterpret_cast<public_data*>(data);
    auto game = new Poker(player, pdata->players, pdata);
    return reinterpret_cast<POINTER>(game);
}

#define CALL0(fn) \
    auto res = UNWRAP(g)->fn(); \
    if (cb) cb(res); \
    return res;

#define CALL1(fn, a) \
    auto res = UNWRAP(g)->fn(a); \
    if (cb) cb(res); \
    return res;

#define CALL2(fn, a, b) \
    auto res = UNWRAP(g)->fn(a, b); \
    if (cb) cb(res); \
    return res;

#define CALL3(fn, a, b, c) \
    auto res = UNWRAP(g)->fn(a, b, c); \
    if (cb) cb(res); \
    return res;

INT API poker_init(POINTER g, CALLBACK cb) { CALL0(init); }
INT API poker_publishKey(POINTER g, CALLBACK cb) { CALL0(publishKey); }
INT API poker_readKeys(POINTER g, CALLBACK cb) { CALL0(readKeys); }
INT API poker_begin_shuffle(POINTER g, CALLBACK cb) { CALL0(begin_shuffle); }
INT API poker_end_shuffle(POINTER g, CALLBACK cb) { CALL0(end_shuffle); }
INT API poker_send_flop_proofs(POINTER g, CALLBACK cb) { CALL0(send_flop_proofs); }
INT API poker_receive_flop_proofs(POINTER g, CALLBACK cb) { CALL0(receive_flop_proofs); }
INT API poker_send_proof(POINTER g, INT card_owner, INT card, CALLBACK cb) { CALL2(send_proof, card_owner, card); }
INT poker_receive_proof(POINTER g, INT card_owner, INT card, INT prover, CALLBACK cb) { CALL3(receive_proof, card_owner,  card, prover); }
INT API poker_open_card(POINTER g, INT card_owner, INT card, CALLBACK cb) { CALL2(open_card, card_owner, card); }

INT API poker_get_flop_size(POINTER g) { return UNWRAP(g)->get_flop_size(); }
INT API poker_get_hand_size(POINTER g) { return UNWRAP(g)->get_hand_size(); }
INT API poker_get_hand(POINTER g, INT index, INT card_owner) { return UNWRAP(g)->get_hand(index, card_owner); }
INT API poker_get_flop_card(POINTER g, INT index) { return UNWRAP(g)->get_flop_card(index); }

}