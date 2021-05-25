//
// poker-lib JavaScript wrapper
//

function make_int_array(src) {
  const b = new ArrayBuffer(src.length * 4)
  const v32 = new Int32Array(b)
  const v8 = new Uint8Array(b)
  v32.set(src)
  return [v8, v32]
}

class Solver {
  constructor(rawlib) {
    this.rawlib = rawlib;
    this.p = this.rawlib._poker_new_solver();
    this.solver_get_hand_name = this.rawlib.cwrap('solver_get_hand_name', 'string', ['number', 'array', 'number']);
    this.solver_compare_hands = this.rawlib.cwrap('solver_compare_hands', 'number', ['number','array', 'array', 'number'])
  }

  get_hand_name(hand, hand_size) {
    const [ha8] = make_int_array(hand);

    return this.solver_get_hand_name(this._p, ha8, hand_size);
  }

  compare_hands(hand1, hand2, hand_size) {
    const [h1a8] = make_int_array(hand1);
    const [h2a8] = make_int_array(hand2);

    return this.solver_compare_hands(this._p, h1a8, h2a8, hand_size);
  }
}

class Blob {
  constructor(rawlib) {
    this.rawlib = rawlib;
    this.p = this.rawlib._poker_new_blob();
    this.blob_get_data = this.rawlib.cwrap('blob_get_data', 'string', ['number'])
    this.blob_set_data = this.rawlib.cwrap('blob_set_data', null, ['number','string'])
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

class Participant {
  constructor(rawlib, participant_id, num_participants, predictable) {
    this.rawlib = rawlib;
    this.p = this.rawlib._poker_new_participant(participant_id, num_participants, predictable)
  }

  create_group(blob) {
    return this.rawlib._participant_create_group(this.p,  blob.p)
  }

  load_group(blob) {
    return this.rawlib._participant_load_group(this.p, blob.p)
  }

  generate_key(key) {
    return this.rawlib._participant_generate_key(this.p, key.p)
  }

  load_their_key(key) {
    return this.rawlib._participant_load_their_key(this.p, key.p)
  }

  finalize_key_generation() {
    return this.rawlib._participant_finalize_key_generation(this.p);
  }

  create_vsshe_group(group) {
    return this.rawlib._participant_create_vsshe_group(this.p, group.p);
  }

  load_vsshe_group(group) {
    return this.rawlib._participant_load_vsshe_group(this.p, group.p);
  }

  create_stack() {
    return this.rawlib._participant_create_stack(this.p);
  }

  shuffle_stack(mixed_stack, mixed_stack_proof) {
    return this.rawlib._participant_shuffle_stack(this.p, mixed_stack.p, mixed_stack_proof.p);
  }

  load_stack(mixed_stack, mixed_stack_proof) {
    return this.rawlib._participant_load_stack(this.p, mixed_stack.p, mixed_stack_proof.p);
  }

  take_cards_from_stack(count) {
    return this.rawlib._participant_take_cards_from_stack(this.p, count);
  }
  prove_card_secret(card_index, my_proof) {
    return this.rawlib._participant_prove_card_secret(this.p, card_index, my_proof.p);
  }
  self_card_secret(card_index) {
    return this.rawlib._participant_self_card_secret(this.p, card_index);
  }
  verify_card_secret(card_index, their_proof) {
    return this.rawlib._participant_verify_card_secret(this.p, card_index, their_proof.p);
  }
  open_card(card_index) {
    return this.rawlib._participant_open_card(this.p, card_index);
  }
  get_open_card(card_index) {
    return this.rawlib._participant_get_open_card(this.p, card_index);
  }

}

class PokerLib {
  constructor(rawlib) {
    this.rawlib = rawlib;
  }

  init() {
    this.rawlib._poker_init();
  }

  new_player(id) {
    return new Player(this.rawlib, id);
  }

  delete_player(player) {
    this.rawlib._poker_delete_player(player.p)
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

  new_participant(leader) {
    return new Participant(this.rawlib, leader);
  }

  delete_participant(participant) {
    this.rawlib._poker_delete_participant(participant.p)
  }
}

class Player {
  constructor(rawlib, id) {
    this.rawlib = rawlib;
    this.p = this.rawlib._poker_new_player(id);
  }

  init_game(alice_money, bob_money) {
    return this.rawlib._player_init_game(this.p,  alice_money, bob_money);
  }

  create_vtmf(vtmf) {
    return this.rawlib._player_create_vtmf(this.p,  vtmf.p);
  }

  load_vtmf(vtmf) {
    return this.rawlib._player_load_vtmf(this.p, vtmf.p);
  }

  generate_key(key) {
    return this.rawlib._player_generate_key(this.p, key.p);
  }

  load_opponent_key(key) {
    return this.rawlib._player_load_opponent_key(this.p, key.p);
  }

  create_vsshe(vsshe) {
    return this.rawlib._player_create_vsshe(this.p, vsshe.p);
  }

  load_vsshe(vsshe) {
    return this.rawlib._player_load_vsshe(this.p, vsshe.p);
  }

  shuffle_stack(mix, proof) {
    return this.rawlib._player_shuffle_stack(this.p, mix.p, proof.p);
  }

  load_stack(mix, proof) {
    return this.rawlib._player_load_stack(this.p, mix.p, proof.p);
  }

  deal_cards() {
    return this.rawlib._player_deal_cards(this.p);
  }

  prove_opponent_cards(proofs) {
    return this.rawlib._player_prove_opponent_cards(this.p, proofs.p);
  }

  open_private_cards(their_proofs) {
    return this.rawlib._player_open_private_cards(this.p,  their_proofs.p);
  }

  prove_public_cards(proofs) {
    return this.rawlib._player_prove_public_cards(this.p, proofs.p);
  }

  open_public_cards(their_proofs) {
    return this.rawlib._player_open_public_cards(this.p, their_proofs.p);
  }

  prove_my_cards(proofs) {
    return this.rawlib._player_prove_my_cards(this.p, proofs.p);
  }

  open_opponent_cards(their_proofs) {
    return this.rawlib._player_open_opponent_cards(this.p, their_proofs.p);
  }

  game_over() {
    return this.rawlib._player_game_over(this.p);
  }

  error() {
    return this.rawlib._player_error(this.p);
  }

  private_card(index) {
    return this.rawlib._player_private_card(this.p, index);
  }

  public_card(index)  {
    return this.rawlib._player_public_card(this.p, index);
  }

  opponent_card(index) {
    return this.rawlib._player_opponent_card(this.p, index);
  }

  winner() {
    return this.rawlib._player_winner(this.p);
  }


}

module.exports = PokerLib;
