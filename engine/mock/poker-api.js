class Transport {
  constructor() {
    this.queue = [];
    this.callbacks = [];
  }
  connect(other) {
    this.other = other;
    other.other = this;
  }
  send(data) {
    this.other.queue.push(data);
    this.other.dispatch();
  }
  receive(callback) {
    this.callbacks.push(callback)
    this.dispatch();
  }
  dispatch() {
    const data = this.queue.shift();
    if (!data) return;
    const callback = this.callbacks.shift();
    if (!callback) {
      this.queue.unshift(data);
      return;
    }
    callback(data);
    this.dispatch();
  }
}


// players
const ALICE = 0;
const BOB = 1;

// states
const START = 0;
const PREFLOP = 1;
const FLOP = 2;
const TURN = 3;
const RIVER = 4;
const SHOWDOWN = 5;
const END = 6;

class Game {

  constructor(player, playerFunds, opponentFunds, metadata, tx, onBetRequested, onEnd, onEvent) {
    this.player = player;
    this.opponent = (player == ALICE) ? BOB : ALICE;
    this.playerFunds = playerFunds;
    this.opponentFunds = opponentFunds;
    this.playerBets = 0;
    this.opponentBets = 0;
    this.metadata = metadata;
    this.tx = tx;
    this.onEvent = onEvent ? onEvent : ()=>{};
    this.onEnd = onEnd ? onEnd : ()=>{};
    this.onBetRequested = onBetRequested ? onBetRequested : ()=>{};

    // player leading the betting round
    // - starts with ALICE and is changed every time a player raises
    // - defines if a betting round is over once all bets are equal
    this.betLeader = ALICE;

    // game state
    this.state = START;
  }
  
  start() {
    if (this.player == ALICE) {
      this.playerBets = 1;
      this.opponentBets = 2;
      this.cryptoStuff = "xkdkeoejf";
      this.tx.send(this.cryptoStuff)
      this.mykey = "ALICEKEY";
      this.tx.send(this.mykey);
      this._shuffleDeck();
      this.tx.send(this.deck);
      this.tx.receive(this._keyReceived.bind(this))
    } else {
      this.playerBets = 2;
      this.opponentBets = 1;
      this.tx.receive(this._cryptoStuffReceived.bind(this))
    }
  }

  call() {
    const amount = this.opponentBets - this.playerBets;
    if (amount <= 0) {
      throw("Cannot call when opponent's bets are not higher");
    }
    this._increaseBets(amount);
  }

  check() {
    if (this.opponentBets != this.playerBets) {
      throw("Cannot check when player and opponent's bets are not equal");
    }
    this._increaseBets(0);
  }

  fold() {
    if (this.opponentBets == this.playerBets) {
      throw("Fold not allowed because player and opponent bets are equal: use check instead");
    }
    this.tx.send("FOLD");
    this.state = END;
    this._computeResultPlayerFold();
    this.onEnd();
  }

  raise(amount) {
    if (isNaN(amount) || amount <= 0) {
      throw("Raise amount must be a positive number");
    }
    const callAmount = this.opponentBets - this.playerBets;
    if (callAmount < 0) {
      throw("Cannot raise when opponent's bets are not higher");
    }
    this._increaseBets(callAmount + Number.parseFloat(amount));
  }

  getPlayerCards() {
    if (!this.deck) {
      return ["?", "?"];
    }
    let cards = [];
    if (this.player == ALICE) {
      cards.push(this._getCard(0));
      cards.push(this._getCard(1));
    } else {
      cards.push(this._getCard(2));
      cards.push(this._getCard(3));
    }
    return cards;
  }

  getOpponentCards() {
    if (!this.deck) {
      return ["?", "?"];
    }
    let cards = [];
    if (this.opponent == ALICE) {
      cards.push(this._getCard(0));
      cards.push(this._getCard(1));
    } else {
      cards.push(this._getCard(2));
      cards.push(this._getCard(3));
    }
    return cards;
  }

  getCommunityCards() {
    if (!this.deck) {
      return ["?", "?", "?", "?", "?"];
    }
    let cards = [];
    cards.push(this._getCard(4));
    cards.push(this._getCard(5));
    cards.push(this._getCard(6));
    cards.push(this._getCard(7));
    cards.push(this._getCard(8));
    return cards;
  }

  getPlayer() {
    return this.player;
  }

  getPlayerFunds() {
    return this.playerFunds;
  }

  getOpponentFunds() {
    return this.opponentFunds;
  }

  getPlayerBets() {
    return this.playerBets;
  }

  getOpponentBets() {
    return this.opponentBets;
  }
  
  getState() {
    return this.state;
  }

  getResult() {
    return this.result;
  }


  _getCard(index) {
    let card = this._decryptCard(this.deck[index]);
    if (isNaN(card)) {
      return "?";
    } else {
      return card;
    }
  }

  _cryptoStuffReceived(stuff) {
    this.onEvent(`cryptoStuffReceived ${stuff}`)
    this.cryptoStuff = stuff;
    this.mykey = "BOBKEY";
    this.tx.send(this.mykey);
    this.tx.receive(this._keyReceived.bind(this))
  }
  
  _keyReceived(key) {
    this.onEvent(`keyReceived ${key}`)
    this.key = key;
    this.tx.receive(this._deckReceived.bind(this))
  }

  _deckReceived(deck) {
    this.onEvent(`deckReceived ${JSON.stringify(deck)}`)
    this.deck = [...deck];
    if (this.player == BOB) {
      // Bob must reshuffle the deck and send it back
      this._shuffleDeck();
      this.tx.send(this.deck);
    }
    this.onEvent(`myDeck ${JSON.stringify(this.deck)}`)
    this._advanceState();
  }

  _shuffleDeck() {
    if (!this.deck) {
      // creates deck if it doesn't exist yet
      this.deck = [];
      for (let i = 0; i < 52; i++) {
        this.deck.push(i);
      }
    }
    // creates deck secrets
    this.deckSecrets = [];
    for (let i = 0; i < 52; i++) {
      this.deckSecrets.push(`s${this.player}_${i}_`);
    }
    // encrypts deck
    for (let i = 0; i < 52; i++) {
      this.deck[i] = this._encryptCard(this.deck[i], this.deckSecrets[i]);
    }
    // shuffles deck
    this.deckShufflePositions = [];
    for (let i = 0; i < 52; i++) {
      this.deckShufflePositions.push(i);
    }
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
      [this.deckSecrets[i], this.deckSecrets[j]] = [this.deckSecrets[j], this.deckSecrets[i]];
      [this.deckShufflePositions[i], this.deckShufflePositions[j]] = [this.deckShufflePositions[j], this.deckShufflePositions[i]];
    }    
  }

  _encryptCard(card, secret) {
    // "encrypts" by prepending with card secret
    return secret + card;
  }

  _decryptCard(card) {
    // "decrypts" by removing prepended card secret (brute force, tries all secrets until it finds the right one)
    for (let i = 0; i < this.deckSecrets.length; i++) {
      if (card.includes(this.deckSecrets[i])) {
        return card.replace(this.deckSecrets[i], "");
      }
    }
    // no decryption possible
    return card;
  }

  _sendCards(...cardIndexes) {
    const decryptedCards = {};

    for(var index in cardIndexes) {
      const cardIndex = cardIndexes[index]; 
      decryptedCards[cardIndex] = this._decryptCard(this.deck[cardIndex]);
    }

    this.tx.send(decryptedCards);
  }

  _dealPrivateCards() {
    if (this.player == ALICE) {
      // decrypts Bob's cards (indices 2,3) and sends them over
      this._sendCards(2,3);
    } else {
      // decrypts Alice's cards (indices 0,1) and sends them over
      this._sendCards(0,1);
    }
    // waits for the opponent to send decrypted cards
    this.tx.receive(this._decryptedCardsReceived.bind(this));
  }

  _dealFlop() {
    // decrypts Flop cards and sends them over
    this._sendCards(4,5,6);
    // waits for the opponent to send decrypted cards
    this.tx.receive(this._decryptedCardsReceived.bind(this));
  }

  _dealTurn() {
    // decrypts Turn card and sends it over
    this._sendCards(7);
    // waits for the opponent to send decrypted card
    this.tx.receive(this._decryptedCardsReceived.bind(this));
  }

  _dealRiver() {
    // decrypts River card and sends it over
    this._sendCards(8);
    // waits for the opponent to send decrypted card
    this.tx.receive(this._decryptedCardsReceived.bind(this));
  }

  _dealShowdown() {
    if (this.player == ALICE) {
      // decrypts Alice's own cards (indices 0,1) so that all can see
      this._sendCards(0,1);
    } else {
      // decrypts Bob's own cards (indices 2,3) so that all can see
      this._sendCards(2,3);
    }
    // waits for the opponent to send decrypted cards
    this.tx.receive(this._decryptedCardsReceived.bind(this));
  }

  _decryptedCardsReceived(cards) {
    this.onEvent(`decryptedCardsReceived ${JSON.stringify(cards)}`)
    for (const [index, card] of Object.entries(cards)) {
      this.deck[index] = card;
    }
    this.onEvent(`myDeck ${JSON.stringify(this.deck)}`)

    if (this.state == SHOWDOWN) {
      this._advanceState();
    } else {
      if (this.player == this.betLeader) {
        // bet leader (ALICE) needs to bet first
        this.onBetRequested();
      } else {
        // the other player (BOB) needs to wait for the first bet
        this.tx.receive(this._betsReceived.bind(this));
      }
    }
  }

  _increaseBets(amount) {
    if (this.playerBets + amount > this.playerFunds) {
      throw("Insufficient funds");
    }
    this.playerBets += amount;

    if (this.playerBets > this.opponentBets) {
      // bet has been raised: current player becomes the bet leader
      this.betLeader = this.player;
    }

    // sends new bets over
    this.tx.send(this.playerBets);

    if (this.player == this.betLeader) {
      // bet leader: we need to wait for the opponent's bet
      this.tx.receive(this._betsReceived.bind(this));
    } else if (this.playerBets == this.opponentBets) {
      // player is not leading the round and has matched opponent bets: betting round is complete
      this._advanceState();
    }
  }

  _betsReceived(opponentBets) {
    this.onEvent(`betsReceived ${opponentBets}`)
    if (opponentBets == "FOLD") {
      // opponent gave up
      this.state = END;
      this._computeResultOpponentFold();
      this.onEnd();
      return;
    }

    this.opponentBets = opponentBets;

    if (this.opponentBets > this.playerBets) {
      // opponent has raised and is now the bet leader
      this.betLeader = this.opponent;
    }
    if (this.player != this.betLeader) {
      // received bet leader's bet, now player needs to place his bet
      this.onBetRequested();
    } else {
      // opponent has matched bet leader's bet: betting round is complete
      this._advanceState();
    }
  }

  _advanceState() {
    this.state++;
    if (this.state == PREFLOP) {
      this._dealPrivateCards();
    } else if (this.state == FLOP) {
      this._dealFlop();
    } else if (this.state == TURN) {
      this._dealTurn();
    } else if (this.state == RIVER) {
      this._dealRiver();
    } else if (this.state == SHOWDOWN) {
      this._dealShowdown();
    } else if (this.state == END) {
      this._computeResult();
      this.onEnd();
    }
  }

  _computeResult() {
    if (this.state != END) {
      return;
    }
    let communityCards = this.getCommunityCards();
    let playerHand = this.getPlayerCards().concat(communityCards.slice(0,3));
    let opponentHand = this.getOpponentCards().concat(communityCards.slice(0,3));
    let playerScore = playerHand.reduce((total, card) => Number.parseInt(total) + Number.parseInt(card), 0);
    let opponentScore = opponentHand.reduce((total, card) => Number.parseInt(total) + Number.parseInt(card), 0);

    let isWinner = Array(2);
    isWinner[this.player] = playerScore >= opponentScore;
    isWinner[this.opponent] = opponentScore >= playerScore;

    let fundsShare = Array(2);
    if (playerScore == opponentScore) {
      fundsShare[this.player] = this.playerFunds;
      fundsShare[this.opponent] = this.opponentFunds;
    } else if (playerScore > opponentScore) {
      fundsShare[this.player] = this.playerFunds + this.opponentBets;
      fundsShare[this.opponent] = this.opponentFunds - this.opponentBets;
    } else {
      fundsShare[this.player] = this.playerFunds - this.playerBets;
      fundsShare[this.opponent] = this.opponentFunds + this.playerBets;
    }
    let hands = Array(2);
    hands[this.player] = playerHand;
    hands[this.opponent] = opponentHand;

    this.result = { isWinner, fundsShare, hands };
  }

  _computeResultPlayerFold() {
    let isWinner = Array(2);
    isWinner[this.player] = false;
    isWinner[this.opponent] = true;
    let fundsShare = Array(2);
    fundsShare[this.player] = this.playerFunds - this.playerBets;
    fundsShare[this.opponent] = this.opponentFunds + this.playerBets;
    this.result = { isWinner, fundsShare };
  }

  _computeResultOpponentFold() {
    let isWinner = Array(2);
    isWinner[this.player] = true;
    isWinner[this.opponent] = false;
    let fundsShare = Array(2);
    fundsShare[this.player] = this.playerFunds + this.opponentBets;
    fundsShare[this.opponent] = this.opponentFunds - this.opponentBets;
    this.result = { isWinner, fundsShare };
  }
}

