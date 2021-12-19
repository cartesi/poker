/*
* Poker C-API
*/

#ifndef POKER_LIB_C_API
#define POKER_LIB_C_API

typedef int32_t PAPI_ERR;
#define PAPI_SUCCESS 0
#define PAPI_CONTINUED 1

typedef bool PAPI_BOOL;
typedef int32_t PAPI_INT;
typedef int32_t PAPI_PAPI_ERR;
typedef void* PAPI_PLAYER;
typedef char* PAPI_MESSAGE;
typedef char* PAPI_STR;
typedef char* PAPI_MONEY;

#ifndef PAPI
  #define PAPI
#endif

extern "C" {
  
PAPI_ERR PAPI papi_init(PAPI_BOOL encryption, PAPI_BOOL logging, PAPI_INT winner);
PAPI_ERR PAPI papi_new_player(PAPI_INT player_id, PAPI_PLAYER* player);
PAPI_ERR PAPI papi_delete_player(PAPI_PLAYER player);
PAPI_ERR PAPI papi_init_player(PAPI_PLAYER player, PAPI_MONEY alice_money, PAPI_MONEY bob_money, PAPI_MONEY big_blind);
PAPI_ERR PAPI papi_create_handshake(PAPI_PLAYER player, PAPI_MESSAGE* msg_out, PAPI_INT* msg_out_len);
PAPI_ERR PAPI papi_delete_message(PAPI_MESSAGE msg);
PAPI_ERR PAPI papi_process_handshake(PAPI_PLAYER player, PAPI_MESSAGE msg_in, PAPI_INT msg_in_len, PAPI_MESSAGE* msg_out, PAPI_INT* msg_out_len);
PAPI_ERR PAPI papi_create_bet(PAPI_PLAYER player, PAPI_INT bet_type, PAPI_MONEY amt, PAPI_MESSAGE* msg_out, PAPI_INT* msg_out_len);
PAPI_ERR PAPI papi_process_bet(PAPI_PLAYER player, PAPI_MESSAGE msg_in, PAPI_INT msg_in_len, PAPI_MESSAGE* msg_out, PAPI_INT* msg_out_len, PAPI_INT* type, PAPI_STR amt, int amt_len);
PAPI_ERR PAPI papi_get_game_state(PAPI_PLAYER player, PAPI_STR json, PAPI_INT json_len);

} // extern "C"


#endif

