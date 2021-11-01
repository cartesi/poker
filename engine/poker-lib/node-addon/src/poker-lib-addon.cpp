#include <cstring>
#include <iostream>
#include <node_api.h>
#include "../../poker-lib-c-api.h"

// init(encryption, logging)
napi_value init(napi_env env, napi_callback_info info) {
  napi_status status;

  napi_value argv[2];
  size_t argc = 2;
  if (napi_ok != (status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error parsing arguments");
    return NULL;
  }

  bool encryption, logging;  
  if (napi_ok != (status = napi_get_value_bool(env, argv[0], &encryption)) ||
      napi_ok != (status = napi_get_value_bool(env, argv[1], &logging))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error getting arguments");
    return NULL;
  }

  auto res = papi_init(encryption, logging);
  if (res != PAPI_SUCCESS) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error initializing library");
    return NULL;
  }
  
  return NULL;
}

// newPlayer(player_id) -> player
napi_value newPlayer(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value argv[1];
  size_t argc = 1;
  if (napi_ok != (status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error parsing arguments");
    return NULL;
  }

  PAPI_INT player_id;
  if (napi_ok != (status = napi_get_value_int32(env, argv[0], &player_id)))
    return NULL;

  PAPI_PLAYER player = NULL;
  auto res =  papi_new_player(player_id, &player);
  if (res != PAPI_SUCCESS) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error creating player");
    return NULL;
  }

  napi_value rplayer;
  if (napi_ok != (status = napi_create_bigint_uint64(env, (uint64_t)player, &rplayer))) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error returning player");
    return NULL;
  }

  return rplayer;
}

static bool get_player(napi_env env, napi_value& src, PAPI_PLAYER& dst) {
  napi_status status;
  bool lossless;
  uint64_t tmp;
  if (napi_ok != (status = napi_get_value_bigint_uint64(env, src, &tmp, &lossless))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error getting player arg");
    return false;
  }
  dst = (PAPI_PLAYER)tmp;
  return true;
}

static bool get_string(napi_env env, napi_value& src, std::string& dst) {
  napi_status status;
  char tmp[1024];
  size_t len;
  if (napi_ok != (status = napi_get_value_string_utf8(env, src, tmp, sizeof(tmp), &len))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error getting string arg");
    return false;
  }

  dst = tmp;
  return true;
}

static void finalize_msg(napi_env env, void* msg, void* finalize_hint) {
  papi_delete_message((PAPI_MONEY)msg);
}

// deletePlayer(player)
napi_value deletePlayer(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value argv[1];
  size_t argc = 1;
  if (napi_ok != (status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error parsing arguments");
    return NULL;
  }

  PAPI_PLAYER player;
  if (!get_player(env, argv[0], player)) {
    napi_throw_type_error(env, "", "Error loading player");
    return NULL;
  }

  auto res =  papi_delete_player((PAPI_PLAYER)player);
  if (res != PAPI_SUCCESS) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error deleting player");
    return NULL;
  }

  napi_value rplayer;
  if (napi_ok != (status = napi_create_bigint_uint64(env, (uint64_t)player, &rplayer))) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error returning player");
  }

  return NULL;
}

// initPlayer(player, alice_money, bob_money, big_blind)
napi_value initPlayer(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value argv[4];
  size_t argc = 4;
  if (napi_ok != (status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error parsing arguments");
    return NULL;
  }

  PAPI_PLAYER player;
  if (!get_player(env, argv[0], player)) {
    napi_throw_type_error(env, "", "Error loading player");
    return NULL;
  }

  std::string alice_money, bob_money, big_blind;
  if (!get_string(env, argv[1], alice_money))
    return NULL;
  if (!get_string(env, argv[2], bob_money))
    return NULL;
  if (!get_string(env, argv[3], big_blind))
    return NULL;

  auto res =  papi_init_player(player, (PAPI_MONEY)alice_money.c_str(), (PAPI_MONEY)bob_money.c_str(), (PAPI_MONEY)big_blind.c_str());
  if (res != PAPI_SUCCESS) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error calling papi_init_player");
  }

  return NULL;
}

// createHandshake(player) -> arrayBuffer
napi_value createHandshake(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value argv[1];
  size_t argc = 1;
  if (napi_ok != (status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error parsing arguments");
    return NULL;
  }

  PAPI_PLAYER player;
  if (!get_player(env, argv[0], player)) {
    napi_throw_type_error(env, "", "Error loading player");
    return NULL;
  }

  PAPI_MESSAGE msg_out;
  PAPI_INT msg_out_len;
  auto res =  papi_create_handshake((PAPI_PLAYER)player, &msg_out, &msg_out_len);
  if (res != PAPI_SUCCESS && res != PAPI_CONTINUED) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error deleting handshake");
    return NULL;
  }

  napi_value buffer = NULL;
  if (msg_out_len) {
    if (napi_ok != (status = napi_create_external_buffer(env,  msg_out_len, (void*)msg_out, finalize_msg, NULL, &buffer)))
      napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error Error alloating buffer");
  }

  return buffer;
}

// processHandshake(player, msg:arrayBuffer) -> { continued: bool, response: arrayBuffer}
napi_value processHandshake(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value argv[2];
  size_t argc = 2;

  if (napi_ok != (status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error parsing arguments");
    return NULL;
  }

  PAPI_PLAYER player;
  if (!get_player(env, argv[0], player)) {
    napi_throw_type_error(env, "", "Error loading player");
    return NULL;
  }

  void* msg_in;
  size_t msg_in_len;
  if (napi_ok != (status =  napi_get_buffer_info(env, argv[1], &msg_in, &msg_in_len))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error getting msg_in_len arguments");
    return NULL;
  }

  PAPI_MESSAGE msg_out;
  PAPI_INT msg_out_len;
  auto res =  papi_process_handshake((PAPI_PLAYER)player, (PAPI_MESSAGE)msg_in, msg_in_len, &msg_out, &msg_out_len);
  if (res != PAPI_SUCCESS && res != PAPI_CONTINUED) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error processing handshake");
    return NULL;
  }

  napi_value msg_out_buffer;
  napi_get_null(env, &msg_out_buffer);
  if (msg_out_len) {
    if (napi_ok != (status = napi_create_external_buffer(env,  msg_out_len, (void*)msg_out, finalize_msg, NULL, &msg_out_buffer))) {
      napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error Error alloating msg_out buffer");
      return NULL;
    }
  }

  napi_value continued;
  napi_get_boolean(env, (res == PAPI_CONTINUED ? true : false), &continued);
  
  napi_value result;
  if (napi_ok != (status = napi_create_object(env, &result)) ||
      napi_ok != (status = napi_set_named_property(env, result, "continued", continued)) ||
      napi_ok != (status = napi_set_named_property(env, result, "response", msg_out_buffer))) {
      napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error creating result object");
      return NULL;
  }

  return result;
}

// createBet(player, betType, amount) -> { continued: bool, response: arrayBuffer}
napi_value createBet(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value argv[3];
  size_t argc = 3;
  status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  if (status != napi_ok) return NULL;

  PAPI_PLAYER player;
  if (!get_player(env, argv[0], player)) {
    napi_throw_type_error(env, "", "Error loading player");
    return NULL;
  }

  int32_t bet_type;
  napi_get_value_int32(env, argv[1], &bet_type);
  std::string amt;
  if (!get_string(env, argv[2], amt))
    return NULL;

  PAPI_MESSAGE msg_out;
  PAPI_INT msg_out_len;
  auto res =  papi_create_bet((PAPI_PLAYER)player, bet_type, (PAPI_MONEY)amt.c_str(),  &msg_out, &msg_out_len);
  if (res != PAPI_SUCCESS && res != PAPI_CONTINUED) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error deleting handshake");
    return NULL;
  }

  napi_value msg_out_buffer;
  napi_get_null(env, &msg_out_buffer);
  if (msg_out_len) {
    if (napi_ok != (status = napi_create_external_buffer(env,  msg_out_len, (void*)msg_out, finalize_msg, NULL, &msg_out_buffer))) {
      napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error Error alloating msg_out buffer");
      return NULL;
    }
  }

  napi_value continued;
  napi_get_boolean(env, (res == PAPI_CONTINUED ? true : false), &continued);
  
  napi_value result;
  if (napi_ok != (status = napi_create_object(env, &result)) ||
      napi_ok != (status = napi_set_named_property(env, result, "continued", continued)) ||
      napi_ok != (status = napi_set_named_property(env, result, "response", msg_out_buffer))) {
      napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error creating result object");
      return NULL;
  }

  return result;
}

// processBet(player, msg:arrayBuffer) -> { betType, amount, continued: bool, response: arrayBuffer}
napi_value processBet(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value argv[2];
  size_t argc = 2;

  if (napi_ok != (status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error parsing arguments");
    return NULL;
  }

  PAPI_PLAYER player;
  if (!get_player(env, argv[0], player)) {
    napi_throw_type_error(env, "", "Error loading player");
    return NULL;
  }

  void* msg_in;
  size_t msg_in_len;
  if (napi_ok != (status =  napi_get_buffer_info(env, argv[1], &msg_in, &msg_in_len))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error getting msg_in_len arguments");
    return NULL;
  }

  PAPI_MESSAGE msg_out;
  PAPI_INT msg_out_len;
  PAPI_INT bet_type;
  char amt[100] = { 0 };
  int amt_len = sizeof(amt);
  auto res =  papi_process_bet((PAPI_PLAYER)player, (PAPI_MESSAGE)msg_in, msg_in_len, &msg_out, &msg_out_len, &bet_type, (PAPI_STR)amt, amt_len);
  if (res != PAPI_SUCCESS && res != PAPI_CONTINUED) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error processing bet");
    return NULL;
  }

  napi_value msg_out_buffer;
  napi_get_null(env, &msg_out_buffer);
  if (msg_out_len) {
    if (napi_ok != (status = napi_create_external_buffer(env,  msg_out_len, (void*)msg_out, finalize_msg, NULL, &msg_out_buffer))) {
      napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error Error alloating msg_out buffer");
      return NULL;
    }
  }

  napi_value continued, vbet_type, vamt, result;
  if (napi_ok != (status = napi_get_boolean(env, (res == PAPI_CONTINUED ? true : false), &continued)) ||
      napi_ok != (status = napi_create_string_utf8(env, amt, strlen(amt), &vamt)) ||
      napi_ok != (status = napi_create_int32(env, bet_type, &vbet_type)) ||
      napi_ok != (status = napi_create_object(env, &result)) ||
      napi_ok != (status = napi_set_named_property(env, result, "continued", continued)) ||
      napi_ok != (status = napi_set_named_property(env, result, "response", msg_out_buffer)) ||
      napi_ok != (status = napi_set_named_property(env, result, "amount", vamt)) ||
      napi_ok != (status = napi_set_named_property(env, result, "betType", vbet_type)))
  {
      napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error creating result object");
      return NULL;
  }

  return result;
}

// getGameState(player) -> gameState:string
napi_value getGameState(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value argv[1];
  size_t argc = 1;

  if (napi_ok != (status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL))) {
    napi_throw_type_error(env, std::to_string((int)status).c_str(), "Error parsing arguments");
    return NULL;
  }

  PAPI_PLAYER player;
  if (!get_player(env, argv[0], player)) {
    napi_throw_type_error(env, "", "Error loading player");
    return NULL;
  }
  
  char json[1024] = { 0 };
  auto res =  papi_get_game_state((PAPI_PLAYER)player, (PAPI_STR)json, sizeof(json));
  if (res != PAPI_SUCCESS && res != PAPI_CONTINUED) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error calling papi_get_game_state");
    return NULL;
  }

  napi_value result;
  if (napi_ok != (status = napi_create_string_utf8(env, json, strlen(json), &result))) {
    napi_throw_type_error(env, std::to_string((int)res).c_str(), "Error creating result string");
    return NULL;
  }

  return result;
}

//-------------------------------------------------------
// Module registration and exports
//-------------------------------------------------------

typedef napi_value callback_fn(napi_env , napi_callback_info);

struct callback {
  const char* name;
  callback_fn* fn; 
};

#define def_callback(n) { #n, n }

static callback callbacks[] = { 
  def_callback(init),
  def_callback(newPlayer),
  def_callback(deletePlayer),
  def_callback(initPlayer),
  def_callback(createHandshake),
  def_callback(processHandshake),
  def_callback(createBet),
  def_callback(processBet),
  def_callback(getGameState),
  { NULL, NULL }
};

napi_value init_addon(napi_env env, napi_value exports) {
  napi_status status;
  napi_value fn;

  for(callback* p=callbacks; p->name; p++) {
    status = napi_create_function(env, nullptr, 0, p->fn, nullptr, &fn);
    if (status != napi_ok) return nullptr;
    status = napi_set_named_property(env, exports, p->name, fn);
    if (status != napi_ok) return nullptr;

  }

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init_addon)




