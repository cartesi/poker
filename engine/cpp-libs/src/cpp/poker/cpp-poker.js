function CB(jscb) {
  if (!jscb) return 0;
  return  addFunction(function(res) {
    jscb(res);
  }, 'vi');
}

class Poker {
  constructor(playerId, numPlayers, data) {
    this.playerId = playerId;
    this.numPlayers = numPlayers;
    this.engine =  _poker_make_game(playerId, data);
  }

  static initLibraries() {
    _poker_init_libraries();
    return 0;
  }

  static makePublicData(numPlayers) {
    return _poker_make_public_data(numPlayers);
  }

  init(callback) {    
    return _poker_init(this.engine, CB(callback));
  }

  publishKey(callback) {
    return _poker_publishKey(this.engine, CB(callback));
  }

  readKeys(callback) {
    return _poker_readKeys(this.engine, CB(callback));
  }

  beginShuffle(callback) {
    return _poker_begin_shuffle(this.engine, CB(callback));
  }

  endShuffle(callback) {
    return _poker_end_shuffle(this.engine, CB(callback));
  }

  sendFlopProofs(callback) {
    return _poker_send_flop_proofs(this.engine, CB(callback));
  }

  readFlopProofs(callback) {
    return _poker_receive_flop_proofs(this.engine, CB(callback));
  }

  sendProof(cardOwner, privCardIndex, callback) {
    return _poker_send_proof(this.engine, cardOwner, privCardIndex, CB(callback));
  }

  openCard(cardOwner, privCardIndex, callback) {
    return _poker_open_card(this.engine, cardOwner, privCardIndex, CB(callback));
  }

  getFlopSize() {
    return _poker_get_flop_size(this.engine);
  }  

  getFlopCard(cardIndex) {
    return _poker_get_flop_card(this.engine, cardIndex);
  }

  getHandSize() {
    return _poker_get_hand_size(this.engine);
  }

  getHand(privCardIndex, cardOwner) {
    return _poker_get_hand(this.engine, privCardIndex, cardOwner);
  }

}

