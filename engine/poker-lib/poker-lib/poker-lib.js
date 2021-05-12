//
// poker-lib JavaScript wrapper
//

class Solver {
  constructor(rawlib) { 
    this.rawlib = rawlib;
    this.p = this.rawlib._poker_new_solver();
    this.solver_compare_hands = this.rawlib.cwrap('solver_compare_hands', 'int', ['int','int*', 'int*', 'int'])
  }

  compare_hands(hand1, hand2, hand_size) {
    return this.solver_compare_hands(this._p, hand1, hand2, hand_size);
  }
}

class Blob {
  constructor(rawlib) { 
    this.rawlib = rawlib;
    this.p = this.rawlib._poker_new_blob();
    this.blob_get_data = this.rawlib.cwrap('blob_get_data', 'string', ['int'])
    this.blob_set_data = this.rawlib.cwrap('blob_set_data', null, ['int','string'])
  }

  clear() {
    this.rawlib._blob_clear(this.p)
  }

  get_data() {
    return this.blob_get_data(this.p);
  }

  set_data(str) {
    this.blob_set_data(this.p, str);
  }
}

class Player {
  constructor(rawlib, player_id, num_players, predictable) {
    this.rawlib = rawlib;
    this.p = this.rawlib._poker_new_player(player_id, num_players, predictable)
  }

  create_group(blob) {
    return this.rawlib._player_create_group(this.p,  blob.p)
  }
  
  load_group(blob) {
    return this.rawlib._player_load_group(this.p, blob.p)
  }

  generate_key(key) {
    return this.rawlib._player_generate_key(this.p, key.p)
  }
  
  load_their_key(key) {
    return this.rawlib._player_load_their_key(this.p, key.p)
  }
  
  finalize_key_generation() {
    return this.rawlib._player_finalize_key_generation(this.p);
  }

  create_vsshe_group(group) {
    return this.rawlib._player_create_vsshe_group(this.p, group.p);
  }    
  
  load_vsshe_group(group) {
    return this.rawlib._player_load_vsshe_group(this.p, group.p);
  }

  create_stack() {
    return this.rawlib._player_create_stack(this.p);
  }

  shuffle_stack(mixed_stack, mixed_stack_proof) {
    return this.rawlib._player_shuffle_stack(this.p, mixed_stack.p, mixed_stack_proof.p);
  }

  load_stack(mixed_stack, mixed_stack_proof) {
    return this.rawlib._player_load_stack(this.p, mixed_stack.p, mixed_stack_proof.p);
  }

  take_cards_from_stack(count) {
    return this.rawlib._player_take_cards_from_stack(this.p, count);
  }
  prove_card_secret(card_index, my_proof) {
    return this.rawlib._player_prove_card_secret(this.p, card_index, my_proof.p);
  }
  self_card_secret(card_index) {
    return this.rawlib._player_self_card_secret(this.p, card_index);
  }
  verify_card_secret(card_index, their_proof) {
    return this.rawlib._player_verify_card_secret(this.p, card_index, their_proof.p);
  }
  open_card(card_index) {
    return this.rawlib._player_open_card(this.p, card_index);
  }
  get_open_card(card_index) {
    return this.rawlib._player_get_open_card(this.p, card_index);
  }
  
}

class PokerLib {
  constructor(rawlib) {
    this.rawlib = rawlib;
  }

  init() {
    this.rawlib._poker_init();
  }

  new_solver() {
    return new Solver(this.rawlib);    
  }

  delete_solver(solver) {
    this.rawlib._poker_delete_solver(solver.p)
  }

  new_blob() {
    return new Blob(this.rawlib);
  }

  delete_blob(blob) {
    this.rawlib._poker_delete_blob(blob.p)
  }

  new_player(leader) {
    return new Player(this.rawlib, leader);
  }

  delete_player(player) {
    this.rawlib._poker_delete_player(player.p)
  }
}

module.exports = PokerLib;
