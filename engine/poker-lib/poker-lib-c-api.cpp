#include <iostream>
#include <stdio.h>
#include "i_participant.h"
#include "poker-lib-c-api.h"
#include "poker-lib.h"
#include "player.h"


extern "C" PAPI_ERR papi_init(PAPI_BOOL encryption, PAPI_BOOL logging, PAPI_INT winner) {
  poker::poker_lib_options options;
  options.encryption = encryption;
  options.logging = logging;
  options.winner = winner;
  poker::init_poker_lib(&options);
  return PAPI_SUCCESS;
}

extern "C" PAPI_ERR papi_new_player(PAPI_INT player_id, PAPI_PLAYER* player) {
  *player  = new poker::player(player_id);
  return PAPI_SUCCESS;
}

extern "C" PAPI_ERR papi_delete_player(PAPI_PLAYER player) {
  delete ((poker::player*)player);
  return PAPI_SUCCESS;
}

extern "C" PAPI_ERR papi_init_player(PAPI_PLAYER player, PAPI_MONEY alice_money, PAPI_MONEY bob_money, PAPI_MONEY big_blind) {
  poker::player* p = (poker::player*)player;
  poker::money_t am, bm, bb;
  am.parse_string(alice_money);
  bm.parse_string(bob_money);
  bb.parse_string(big_blind);
  auto res = p->init(am, bm, bb);
  return (PAPI_ERR)res;
}

extern "C" PAPI_ERR papi_create_handshake(PAPI_PLAYER player, PAPI_MESSAGE* msg_out, PAPI_INT* msg_out_len) {
  poker::player* p = (poker::player*)player;
  *msg_out = NULL;
  *msg_out_len = 0;
  
  std::string tmp;
  auto res = p->create_handshake(tmp);
  if (res && res != poker::CONTINUED)
    return (PAPI_ERR)res;
  
  *msg_out_len =tmp.size();
  *msg_out = new char[tmp.size()];
  memcpy(*msg_out, tmp.data(), tmp.size());

  return (PAPI_ERR)res;
}

extern "C" PAPI_ERR papi_delete_message(PAPI_MESSAGE msg) {
  char *tmp = (char*)msg;
  delete [] tmp;
  return PAPI_SUCCESS;
}

extern "C" PAPI_ERR papi_process_handshake(PAPI_PLAYER player, PAPI_MESSAGE msg_in, PAPI_INT msg_in_len, PAPI_MESSAGE* msg_out, PAPI_INT* msg_out_len) {
  std::string tmp;
  *msg_out_len = 0;
  *msg_out = NULL;

  poker::player* p = (poker::player*)player;
  std::string mi = std::string(msg_in, msg_in_len);
  auto res = p->process_handshake(mi, tmp);
  if (res && res != poker::CONTINUED)
    return (PAPI_ERR)res;

  *msg_out_len = (PAPI_INT)tmp.size();
  if (tmp.size()) {
    *msg_out = new char[tmp.size()];
    memcpy(*msg_out, tmp.data(), tmp.size());
  }
  
  return (PAPI_ERR)res;
}

extern "C" PAPI_ERR papi_create_bet(PAPI_PLAYER player, PAPI_INT bet_type, PAPI_MONEY amt, PAPI_MESSAGE* msg_out, PAPI_INT* msg_out_len) {
  poker::player* p = (poker::player*)player;
  poker::money_t a;
  a.parse_string(amt);

  std::string tmp;
  *msg_out_len = 0;
  *msg_out = NULL;
  auto res = p->create_bet((poker::bet_type)bet_type, a, tmp);
  if (res && res != poker::CONTINUED)
    return (PAPI_ERR)res;

  *msg_out_len = tmp.size();
  if (tmp.size()) {
    *msg_out = new char[tmp.size()];
    memcpy(*msg_out, tmp.data(), tmp.size());
  }

  return (PAPI_ERR)res;
}

extern "C" PAPI_ERR papi_process_bet(PAPI_PLAYER player, PAPI_MESSAGE msg_in, PAPI_INT msg_in_len, PAPI_MESSAGE* msg_out, PAPI_INT* msg_out_len, PAPI_INT* type, PAPI_STR amt, int amt_len) {
  poker::money_t am;
  poker::bet_type tp;
  std::string tmp;
  *msg_out_len = 0;
  *msg_out = NULL;
  poker::player* p = (poker::player*)player;
  std::string mi = std::string(msg_in, msg_in_len);
  auto res = p->process_bet(mi, tmp, &tp, &am);
  if (res && res != poker::CONTINUED)
    return (PAPI_ERR)res;

  *msg_out_len = tmp.size();
  if (tmp.size()) {
    *msg_out = new char[tmp.size()];
    memcpy(*msg_out, tmp.data(), tmp.size());
  }

  if (type)
    *type = (PAPI_INT)tp;

  if (amt && amt_len) {
    auto tmp2 = am.to_string();
    strncpy(amt, tmp2.c_str(), amt_len);
  }

  return (PAPI_ERR)res;
}

extern "C" PAPI_ERR papi_get_game_state(PAPI_PLAYER player, PAPI_STR json, PAPI_INT json_len) {
  poker::player* p = (poker::player*)player;
  auto g = p->game();
  char extra_fields[100];
  sprintf(extra_fields, "\"step\": %d", (int)p->step());
  auto tmp = g.to_json(extra_fields);
  strncpy(json, tmp.c_str(), json_len);
  return PAPI_SUCCESS;
}

