const raw_lib = require('./poker-lib-wasm-thunk');
const Poker = require('./poker-lib.js');

function run_tests(lib) {
  try {
    lib.init();
    const ALICE = 0;
    const BOB = 1;
    const alice =lib.new_player(ALICE);
    const bob =lib.new_player(BOB);  

    const ASSERT = function(v) {
      if (v!=0)
        throw Error(`*** Assertion error. Expected: 0, got:${v}`);
      return v;
    }

    var vtmf = lib.new_blob();
    ASSERT(alice.init_game(100,100));
    ASSERT(bob.init_game(100,100));
    ASSERT(alice.create_vtmf(vtmf));
    ASSERT(bob.load_vtmf(vtmf));

    var alice_key=lib.new_blob(), bob_key=lib.new_blob();;
    ASSERT(alice.generate_key(alice_key));
    ASSERT(bob.generate_key(bob_key));
    ASSERT(bob.load_opponent_key(alice_key));
    ASSERT(alice.load_opponent_key(bob_key));

    var vsshe=lib.new_blob();
    ASSERT(alice.create_vsshe(vsshe));
    ASSERT(bob.load_vsshe(vsshe));

    var alice_mix=lib.new_blob(), alice_proof=lib.new_blob(), bob_mix=lib.new_blob(), bob_proof=lib.new_blob();
    ASSERT(alice.shuffle_stack(alice_mix, alice_proof));
    ASSERT(bob.load_stack(alice_mix, alice_proof));
    ASSERT(bob.shuffle_stack(bob_mix, bob_proof));   
    ASSERT(alice.load_stack(bob_mix, bob_proof));

    ASSERT(alice.deal_cards());
    ASSERT(bob.deal_cards());

    var alice_private_proofs=lib.new_blob(), bob_private_proofs=lib.new_blob();
    ASSERT(bob.prove_opponent_cards(alice_private_proofs));
    ASSERT(alice.open_private_cards(alice_private_proofs));    
    console.log("### ALICE PRIVATE CARD[0]=" , alice.private_card(0));
    console.log("### ALICE PRIVATE CARD[1]=" , alice.private_card(1));
    
    ASSERT(alice.prove_opponent_cards(bob_private_proofs));
    ASSERT(bob.open_private_cards(bob_private_proofs));
    console.log("### BOB PRIVATE CARD[0]=" , bob.private_card(0));
    console.log("### BOB PRIVATE CARD[1]=" , bob.private_card(1));

    var bob_public_proofs=lib.new_blob(), alice_public_proofs=lib.new_blob();
    ASSERT(bob.prove_public_cards(bob_public_proofs));
    ASSERT(alice.open_public_cards(bob_public_proofs));
    for(var i=0; i<5; i++)
      console.log("### ALICE PUBLIC CARD[" , i , "]=" , alice.public_card(i));

    ASSERT(alice.prove_public_cards(alice_public_proofs));
    ASSERT(bob.open_public_cards(alice_public_proofs));
    for(var i=0; i<5; i++)
      console.log("### BOB PUBLIC CARD[" , i , "]=" , bob.public_card(i));

    var alice_private_proofs2=lib.new_blob(), bob_public_proofs2=lib.new_blob();
    ASSERT(bob.prove_my_cards(bob_public_proofs2));
    ASSERT(alice.open_opponent_cards(bob_public_proofs2));
    ASSERT(alice.prove_my_cards(alice_private_proofs2));
    ASSERT(bob.open_opponent_cards(alice_private_proofs2));

    console.log('OK');
  } catch(e) {
    console.error(e)
  }
}

raw_lib.onRuntimeInitialized = function() {
  console.log('onRuntimeInitialized')
  const game = new Poker(raw_lib);
  run_tests(game);
}
