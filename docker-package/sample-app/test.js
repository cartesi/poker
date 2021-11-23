const BET_NONE = 0
const BET_FOLD = 1
const BET_CALL = 2
const BET_RAISE = 3
const BET_CHECK = 4

test()

function test() {
      const lib = require('../lib/pokerlib.node')
      lib.init(true, true);

      const alice = lib.newPlayer(0);
      console.log(alice);
      const bob = lib.newPlayer(1);
      console.log(bob);

      lib.initPlayer(alice, "100", "200", "10")
      lib.initPlayer(bob, "100", "200", "10")
      let msg, r;
      msg = lib.createHandshake(alice);
      r = lib.processHandshake(bob, msg);
      r = lib.processHandshake(alice, r.response);
      r = lib.processHandshake(bob, r.response);
      console.log('1231231')
      r = lib.processHandshake(alice, r.response);
      r = lib.processHandshake(bob, r.response);

      // Preflop: Alice calls
      r = lib.createBet(alice, BET_CALL, "0");
      r = lib.processBet(bob, r.response);

      // Preflop: Bob checks
      r = lib.createBet(bob, BET_CHECK, "0")
      r = lib.processBet(alice, r.response);
      r = lib.processBet(bob, r.response);

      // Flop: Bob checks
      r = lib.createBet(bob, BET_CHECK, "0")
      r = lib.processBet(alice, r.response);

      // Flop: Alice checks
      r = lib.createBet(alice, BET_CHECK, "0")
      r = lib.processBet(bob, r.response);
      r = lib.processBet(alice, r.response);

      // Turn: Bob raises
      r = lib.createBet(bob, BET_RAISE, "30")
      r = lib.processBet(alice, r.response);

      // Alice calls
      r = lib.createBet(alice, BET_CALL, "0")
      r = lib.processBet(bob, r.response);
      r = lib.processBet(alice, r.response);

      // River bet: Bob checks
      r = lib.createBet(bob, BET_CHECK, "0")
      r = lib.processBet(alice, r.response);
 
      // River bet: alice checks
      r = lib.createBet(alice, BET_CHECK, "0")
      r = lib.processBet(bob, r.response);
      r = lib.processBet(alice, r.response);      
      r = lib.processBet(bob, r.response);      

      const aliceState = JSON.parse(lib.getGameState(alice));
      console.log(aliceState);

      const bobState = JSON.parse(lib.getGameState(bob));
      console.log(bobState);

      lib.deletePlayer(alice);
      lib.deletePlayer(bob);

}