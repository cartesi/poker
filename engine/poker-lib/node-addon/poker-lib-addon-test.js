var assert = require('assert');

const BET_NONE = 0
const BET_FOLD = 1
const BET_CALL = 2
const BET_RAISE = 3
const BET_CHECK = 4

describe('Poker Node.js add-on', function() {
  describe('The happy path', function() {
    it('should play a game to the end,  without errors', function() {
      const lib = require('./build/Release/pokerlib');
      lib.init(true, false);

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
      r = lib.processHandshake(alice, r.response);
      r = lib.processHandshake(bob, r.response);

      // Preflop: Alice calls
      r = lib.createBet(alice, BET_CALL, "0");
      assert.equal(r.continued, false);
      assert.notEqual(r.response, undefined);
      r = lib.processBet(bob, r.response);
      assert.equal(r.continued, false);
      assert.equal(r.response, undefined);

      // Preflop: Bob checks
      r = lib.createBet(bob, BET_CHECK, "0")
      r = lib.processBet(alice, r.response);
      r = lib.processBet(bob, r.response);
      assert.equal(r.continued, false);
      assert.equal(r.response, undefined);

      // Flop: Bob checks
      r = lib.createBet(bob, BET_CHECK, "0")
      r = lib.processBet(alice, r.response);
      assert.equal(r.betType, BET_CHECK);
      assert.equal(r.amount, "0");
      
      assert.equal(r.continued, false);
      assert.equal(r.response, undefined);

      // Flop: Alice checks
      r = lib.createBet(alice, BET_CHECK, "0")
      assert.equal(r.continued, true);
      r = lib.processBet(bob, r.response);
      assert.equal(r.continued, false);
      assert.notEqual(r.response, undefined);
      r = lib.processBet(alice, r.response);
      assert.equal(r.continued, false);
      assert.equal(r.response, undefined);

      // Turn: Bob raises
      r = lib.createBet(bob, BET_RAISE, "30")
      r = lib.processBet(alice, r.response);
      assert.equal(r.betType, BET_RAISE);
      assert.equal(r.amount, "30");
      assert.equal(r.continued, false);
      assert.equal(r.response, undefined);

      // Alice calls
      r = lib.createBet(alice, BET_CALL, "0")
      r = lib.processBet(bob, r.response);
      r = lib.processBet(alice, r.response);
      assert.equal(r.continued, false);
      assert.equal(r.response, undefined);

      // River bet: Bob checks
      r = lib.createBet(bob, BET_CHECK, "0")
      assert.equal(r.continued, false);
      r = lib.processBet(alice, r.response);
      assert.equal(r.continued, false);
      assert.equal(r.response, undefined);
 
      // River bet: alice checks
      r = lib.createBet(alice, BET_CHECK, "0")
      r = lib.processBet(bob, r.response);
      r = lib.processBet(alice, r.response);      
      assert.equal(r.continued, false);
      r = lib.processBet(bob, r.response);      
      assert.equal(r.continued, false);
      assert.equal(r.response, undefined);

      const aliceState = JSON.parse(lib.getGameState(alice));
      assert.notEqual(aliceState.winner, -1);
      console.log(aliceState);

      const bobState = JSON.parse(lib.getGameState(bob));
      assert.notEqual(bobState.winner, -1);
      console.log(bobState);

      lib.deletePlayer(alice);
      lib.deletePlayer(bob);

    });
  });
});
