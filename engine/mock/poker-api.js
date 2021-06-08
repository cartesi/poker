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

// game states
const GameStates = {
  "START": 0,
  "PREFLOP": 1,
  "FLOP": 2,
  "TURN": 3,
  "RIVER": 4,
  "SHOWDOWN": 5,
  "END": 6,
  "VERIFICATION": 7
}

// verification states
const VerificationStates = {
  "NONE": 0,
  "STARTED": 1,
  "RESULT_SUBMITTED": 2,
  "RESULT_CONFIRMED": 3,
  "RESULT_CHALLENGED": 4,
  "ENDED": 5,
  "ERROR": 6
}

const VALID_CARD_PATTERN = /^s\d_\d{1,2}_\d{1,2}$|^\d{1,2}$/;

class Game {

  constructor(player, playerFunds, opponentFunds, metadata, tx, onBetRequested, onEnd, onEvent, onVerification) {
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
    this.onVerification = onVerification ? onVerification : ()=>{};

    // player leading the betting round
    // - starts with ALICE and is changed every time a player raises
    // - defines if a betting round is over once all bets are equal
    this.betLeader = ALICE;

    // game state
    this.state = GameStates.START;
    // verification state
    this.verificationState = VerificationStates.NONE;

    // Methods that maliciously alter game state on purpose
    this.cheat = {
      didSwitchCards: false,
      didDisableCardCoop: false,
      isCardCoopCheatOn: false,

      // Change the cards in the player's hand
      switchCards: (card1, card2) => {
        if(isNaN(card1) || isNaN(card2)) {
          throw("Cards should be an integer from 0 to 51, inclusive");
        }
        this.deck.push(card1, card2);
        this.cheat.didSwitchCards = true;
      },

      // When card cooperation is disabled, cards are sent to opponent 
      // still encrypted. Enabled by default.
      toggleCardCooperation: () => {
        this.cheat.didDisableCardCoop = true;
        this.cheat.isCardCoopCheatOn = !this.cheat.isCardCoopCheatOn;
      },
    }
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

  getVerificationState() {
    return this.verificationState;
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
    if (this.opponentBets == this.playerBets && this.state != GameStates.SHOWDOWN) {
      throw("Fold not allowed because player and opponent bets are equal: use check instead");
    }
    this.tx.send("FOLD");
    this.state = GameStates.END;
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
    if(this.cheat.didSwitchCards) {
      cards.push(this.deck[52], this.deck[53]);
    } else if (this.player == ALICE) {
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
    if (this._handleVerificationPayload(stuff)) {
      return;
    }
    this.onEvent(`cryptoStuffReceived ${stuff}`)
    this.cryptoStuff = stuff;
    this.mykey = "BOBKEY";
    this.tx.send(this.mykey);
    this.tx.receive(this._keyReceived.bind(this))
  }
  
  _keyReceived(key) {
    if (this._handleVerificationPayload(key)) {
      return;
    }
    this.onEvent(`keyReceived ${key}`)
    this.key = key;
    this.tx.receive(this._deckReceived.bind(this))
  }

  _deckReceived(deck) {
    if (this._handleVerificationPayload(deck)) {
      return;
    }
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

    for(var cardIndex of cardIndexes) {
      const card = this.deck[cardIndex];
      
      decryptedCards[cardIndex] = this.cheat.isCardCoopCheatOn 
        ? card 
        : this._decryptCard(card);
    }

    this.tx.send(decryptedCards);
  }

  _dealPrivateCards() {
    // sends opponent's private cards
    if (this.player == ALICE) {
      this._sendPrivateCards(BOB);
    } else {
      this._sendPrivateCards(ALICE);
    }
    // waits for the opponent to send decrypted cards
    this.tx.receive(this._decryptedCardsReceived.bind(this));
  }

  _sendPrivateCards(player) {
    if (player == ALICE) {
      // decrypts Alice's cards (indices 0,1) and sends them over
      this._sendCards(0,1);
    } else {
      // decrypts Bob's cards (indices 2,3) and sends them over
      this._sendCards(2,3);
    }

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
    if (this.player == this.betLeader) {
      // bet leader has received the call and needs to reveal his cards
      this._sendPrivateCards(this.player);
      // waits for opponent to send his cards (or fold)
      this.tx.receive(this._decryptedCardsReceived.bind(this));
    } else {
      // made the call: waits for the opponent's cards to be revealed
      this.tx.receive(this._decryptedCardsReceived.bind(this));
    }
  }

  _decryptedCardsReceived(cards) {
    if (this._handleVerificationPayload(cards)) {
      return;
    }
    this.onEvent(`decryptedCardsReceived ${JSON.stringify(cards)}`)

    if (cards == "FOLD") {
      // opponent gave up
      this.state = GameStates.END;
      this._computeResultOpponentFold();
      this.onEnd();
      return;
    }

    // updates deck
    for (const [index, card] of Object.entries(cards)) {
      if (!card.match(VALID_CARD_PATTERN)) {
        // cheat detected: triggers verification
        this._triggerVerification("Failure to reveal card");
        return;
      }
      this.deck[index] = card;
    }
    this.onEvent(`myDeck ${JSON.stringify(this.deck)}`)

    if (this.state == GameStates.SHOWDOWN) {
      this._processShowdown();
    } else {
      if (this.player == this.betLeader) {
        // bet leader needs to bet first
        this.onBetRequested();
      } else {
        // the other player needs to wait for the first bet
        this.tx.receive(this._betsReceived.bind(this));
      }
    }
  }

  _processShowdown() {
    // computes result
    this._computeResult();

    if (this.player != this.betLeader) {
      // player made the call and has now seen opponent's cards
      if (this.result.isWinner[this.player]) {
        // player won: reveals private cards to prove that he won
        this._sendPrivateCards(this.player);
        // submits computed result
        this.tx.send(this.result);
        // waits for opponent to confirm
        this.tx.receive(this._resultConfirmationReceived.bind(this));
      } else {
        // player lost: folds without revealing his cards
        this.fold();
      }
    } else {
      // full showdown: player received the call, showed his cards, and now opponent also revealed his cards
      this.tx.receive(this._resultReceived.bind(this));
    }
  }

  _resultReceived(opponentResult) {
    if (this._handleVerificationPayload(opponentResult)) {
      return;
    }
    if (JSON.stringify(this.result) !== JSON.stringify(opponentResult)) {
      // result mismatch: trigger a verification!
      this._triggerVerification("Result mismatch");
    } else {
      // everything ok: sends confirmation and advances state (to END)
      this.tx.send(true);
      this._advanceState();
    }
  }

  _resultConfirmationReceived(confirmation) {
    if (this._handleVerificationPayload(confirmation)) {
      return;
    } else {
      // everything ok: advances state (to END)
      this._advanceState();
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
    if (this._handleVerificationPayload(opponentBets)) {
      return;
    }
    this.onEvent(`betsReceived ${opponentBets}`)
    if (opponentBets == "FOLD") {
      // opponent gave up
      this.state = GameStates.END;
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
    if (this.state == GameStates.VERIFICATION) {
      // nothing to do while verification is in progress
      return;
    }
    this.state++;
    if (this.state == GameStates.PREFLOP) {
      this._dealPrivateCards();
    } else if (this.state == GameStates.FLOP) {
      this._dealFlop();
    } else if (this.state == GameStates.TURN) {
      this._dealTurn();
    } else if (this.state == GameStates.RIVER) {
      this._dealRiver();
    } else if (this.state == GameStates.SHOWDOWN) {
      this._dealShowdown();
    } else if (this.state == GameStates.END) {
      this.onEnd();
    }
  }

  _computeResult() {
    if (this.state != GameStates.SHOWDOWN && this.state != GameStates.END) {
      return;
    }
    const hands = this._computeHands();
    let playerScore = hands[this.player].reduce((total, card) => Number.parseInt(total) + Number.parseInt(card), 0);
    let opponentScore = hands[this.opponent].reduce((total, card) => Number.parseInt(total) + Number.parseInt(card), 0);

    const isWinner = Array(2);
    isWinner[this.player] = playerScore >= opponentScore;
    isWinner[this.opponent] = opponentScore >= playerScore;

    const fundsShare = Array(2);
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

    this.result = { isWinner, fundsShare, hands };
  }

  _computeResultPlayerFold() {
    const isWinner = Array(2);
    isWinner[this.player] = false;
    isWinner[this.opponent] = true;
    const fundsShare = Array(2);
    fundsShare[this.player] = this.playerFunds - this.playerBets;
    fundsShare[this.opponent] = this.opponentFunds + this.playerBets;
    const hands = this._computeHands();
    this.result = { isWinner, fundsShare, hands };
  }

  _computeResultOpponentFold() {
    const isWinner = Array(2);
    isWinner[this.player] = true;
    isWinner[this.opponent] = false;
    const fundsShare = Array(2);
    fundsShare[this.player] = this.playerFunds + this.opponentBets;
    fundsShare[this.opponent] = this.opponentFunds - this.opponentBets;
    const hands = this._computeHands();
    this.result = { isWinner, fundsShare, hands };
  }

  _computeResultVerification() {
    // cheater loses everything, half of which goes to his opponent
    const winner = this._isCheater() ? this.opponent : this.player;
    const loser = (winner == this.player) ? this.opponent : this.player;
    const winnerFunds = (winner == this.player) ? this.playerFunds + this.opponentFunds/2 : this.playerFunds/2 + this.opponentFunds;
    const isWinner = Array(2);
    isWinner[winner] = true;
    isWinner[loser] = false;
    const fundsShare = Array(2);
    fundsShare[winner] = winnerFunds;
    fundsShare[loser] = 0;
    const hands = this._computeHands();
    this.result = { isWinner, fundsShare, hands };
  }

  _computeHands() {
    const hands = Array(2);
    const communityCards = this.getCommunityCards();
    if (communityCards.includes("?")) {
      return hands;
    }
    const playerHand = this.getPlayerCards().concat(communityCards.slice(0,3));
    const opponentHand = this.getOpponentCards().concat(communityCards.slice(0,3));
    hands[this.player] = playerHand;
    if (!opponentHand.includes("?")) {
      hands[this.opponent] = opponentHand;
    }
    return hands;
  }

  _isCheater() {
    return (this.cheat.didSwitchCards || this.cheat.didDisableCardCoop);
  }

  _buildVerificationPayload(message) {
    return `VERIFICATION ${message}`;
  }

  _handleVerificationPayload(payload) {
    if (payload.startsWith && payload.startsWith("VERIFICATION")) {
      const message = payload.substr("VERIFICATION".length + 1);
      this._verificationReceived(message);
      return true;
    } else {
      return false;
    }
  }

  _triggerVerification(message) {
    this.onEvent(`triggerVerification: ${message}`);
    this.tx.send(this._buildVerificationPayload(message));
    this.state = GameStates.VERIFICATION;
    setTimeout(() => this._setVerificationState(VerificationStates.STARTED, message), 3000);
  }

  _verificationReceived(message) {
    this.onEvent(`verificationReceived: ${message}`);
    this.state = GameStates.VERIFICATION;
    setTimeout(() => this._setVerificationState(VerificationStates.STARTED, message), 3000);
  }

  _setVerificationState(newState, message) {
    // ensures valid verification state
    if (newState < VerificationStates.NONE || newState > VerificationStates.ERROR) {
      throw `Invalid verification state ${newState}`;
    }

    // sets verification state and triggers callback
    this.verificationState = newState;
    this.onVerification(this.verificationState, message);

    if (newState == VerificationStates.ENDED) {
      // verification ended, game ends with cheater losing everything
      this.state = GameStates.END;
      this._computeResultVerification();
      this.onEnd();
    } else {
      // simulates verification progress (one step every 5 sec, let's skip VerificationStates.RESULT_CHALLENGED)
      newState++;
      if (newState == VerificationStates.RESULT_CHALLENGED) {
        newState++;
      }
      setTimeout(() => this._setVerificationState(newState, message), 5000);
    }
  }
}

