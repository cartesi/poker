const raw_lib = require('./poker-lib-wasm-thunk');
const Poker = require('./poker-lib.js');

function poker_lib_demo(lib) {
  lib.init();
  const num_players = 2;
  var alice = lib.new_player(0, num_players, /* predictable */ false);
  var bob = lib.new_player(1, num_players,   /* predictable */ false);

  var group = lib.new_blob();
  alice.create_group(group);
  bob.load_group(group);

  var alice_key = lib.new_blob();;
  var bob_key = lib.new_blob();;
  alice.generate_key(alice_key);
  bob.generate_key(bob_key);

  alice.load_their_key(bob_key);
  alice.finalize_key_generation();

  bob.load_their_key(alice_key);
  bob.finalize_key_generation();

  var vsshe = lib.new_blob();;
  alice.create_vsshe_group(vsshe);
  bob.load_vsshe_group(vsshe);

  alice.create_stack();
  bob.create_stack();
  
  var alice_mix = lib.new_blob();
  var alice_mix_proof = lib.new_blob();
  alice.shuffle_stack(alice_mix, alice_mix_proof);
  bob.load_stack(alice_mix, alice_mix_proof);
  
  var bob_mix = lib.new_blob();
  var bob_mix_proof = lib.new_blob();
  bob.shuffle_stack(bob_mix, bob_mix_proof);
  alice.load_stack(bob_mix, bob_mix_proof);

  alice.take_cards_from_stack(2);
  bob.take_cards_from_stack(2);

  var  bob_proof_0 = lib.new_blob();
  alice.self_card_secret(0);
  bob.prove_card_secret(0, bob_proof_0);
  alice.verify_card_secret(0, bob_proof_0);
  alice.open_card(0);
  alice_card_0 = alice.get_open_card(0);
  console.log('alice_card_0=', alice_card_0)

  var alice_proof_0 = lib.new_blob();
  bob.self_card_secret(0);
  alice.prove_card_secret(0, alice_proof_0);
  bob.verify_card_secret(0, alice_proof_0);
  bob.open_card(0);
  bob_card_0 = bob.get_open_card(0);
  console.log('bob_card_0=', bob_card_0)
}

raw_lib.onRuntimeInitialized = function() {
  console.log('onRuntimeInitialized')
  const game = new Poker(raw_lib);
  poker_lib_demo(game);
}
