import { BetType, Game, GameState, GameStates, VerificationState, VerificationStates } from "../Game";
import { TurnBasedGame } from "../TurnBasedGame";

// involved players
const ALICE = 0;
const BOB = 1;

const VALID_CARD_PATTERN = /^s\d_\d{1,2}_\d{1,2}$|^\d{1,2}$/;

/**
 * Game mock implementation
 */
// @ts-ignore: 2339
export class GameMock implements Game {
    // if using a mock TurnBasedGame, we will store a reference to the opponent's GameMock instance (with automatic responses) here
    gameOpponent: GameMock;

    // TurnBasedGame instance that manages the game's interactions with the other players
    turnBasedGame: TurnBasedGame;

    // allows member variables without type-checking
    [x: string]: any;

    constructor(
        player: number,
        playerFunds: number,
        opponentFunds: number,
        metadata: any,
        turnBasedGame: TurnBasedGame,
        onBetRequested?: () => any,
        onBetsReceived?: (betType: string, amount: number) => any,
        onEnd?: () => any,
        onEvent?: (msg: string) => any,
        onVerification?: (state: string, msg: string) => any
    ) {
        this.player = player;
        this.opponent = player == ALICE ? BOB : ALICE;
        this.playerFunds = playerFunds;
        this.opponentFunds = opponentFunds;
        this.playerBets = 0;
        this.opponentBets = 0;
        this.metadata = metadata;
        this.turnBasedGame = turnBasedGame;
        this.onEvent = onEvent ? onEvent : () => {};
        this.onEnd = onEnd ? onEnd : () => {};
        this.onBetRequested = onBetRequested ? onBetRequested : () => {};
        this.onBetsReceived = onBetsReceived ? onBetsReceived : () => {};
        this.onVerification = onVerification ? onVerification : () => {};

        // player leading the betting round
        // - starts with ALICE and is changed every time a player raises
        // - defines if a betting round is over once all bets are equal
        this.betLeader = ALICE;

        // game state
        this.state = GameState.START;
        // verification state
        this.verificationState = VerificationState.NONE;

        // sets up fixed internal TurnBasedGame callbacks
        this.turnBasedGame.receiveResultClaimed(this._resultReceived.bind(this));
        this.turnBasedGame.receiveGameOver(this._resultConfirmationReceived.bind(this));
        this.turnBasedGame.receiveGameChallenged(this._verificationReceived.bind(this));
        // this.turnBasedGame.receiveVerificationUpdate(this._verificationReceived.bind(this));
    }

    start(onComplete?: () => any) {
        var self = this;
        setTimeout(() => {
            if (self.player == ALICE) {
                self.playerBets = 1;
                self.opponentBets = 2;
                self.cryptoStuff = "xkdkeoejf";
                self.turnBasedGame.submitTurn(self.cryptoStuff, () => {
                    self.mykey = "ALICEKEY";
                    self.turnBasedGame.submitTurn(self.mykey, () => {
                        self._shuffleDeck();
                        self.turnBasedGame.submitTurn(JSON.stringify(self.deck), () => {
                            self.turnBasedGame.receiveTurnOver(self._keyReceived.bind(self));
                        });
                    });
                });
            } else {
                self.playerBets = 2;
                self.opponentBets = 1;
                self.turnBasedGame.receiveTurnOver(self._cryptoStuffReceived.bind(self));
            }
            if (self.gameOpponent) {
                self.gameOpponent.start(onComplete);
            } else {
                if (onComplete) onComplete();
            }
        }, 5000);
    }

    call(onComplete?: () => any) {
        const amount = this.opponentBets - this.playerBets;
        if (amount <= 0) {
            throw "Cannot call when opponent's bets are not higher";
        }
        this._increaseBets(amount);
        if (onComplete) onComplete();
    }

    check(onComplete?: () => any) {
        if (this.opponentBets != this.playerBets) {
            throw "Cannot check when player and opponent's bets are not equal";
        }
        this._increaseBets(0);
        if (onComplete) onComplete();
    }

    fold(onComplete?: () => any) {
        if (this.opponentBets == this.playerBets && this.state != GameState.SHOWDOWN) {
            throw "Fold not allowed because player and opponent bets are equal: use check instead";
        }
        this.turnBasedGame.submitTurn("FOLD");
        if (onComplete) onComplete();
        this.state = GameState.END;
        this._computeResultPlayerFold();
        this.onEnd();
    }

    raise(amount: number, onComplete?: () => any) {
        if (isNaN(amount) || amount <= 0) {
            throw "Raise amount must be a positive number";
        }
        const callAmount = this.opponentBets - this.playerBets;
        if (callAmount < 0) {
            throw "Cannot raise when opponent's bets are not higher";
        }
        this._increaseBets(callAmount + amount);
        if (onComplete) onComplete();
    }

    // Methods that maliciously alter game state on purpose
    cheat = {
        didSwitchCards: false,
        didDisableCardCoop: false,
        isCardCoopCheatOn: false,

        // Change the cards in the player's hand
        switchCards: (card1, card2) => {
            if (isNaN(card1) || isNaN(card2)) {
                throw "Cards should be an number from 0 to 51, inclusive";
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
    };

    getPlayerCards() {
        if (!this.deck) {
            return ["?", "?"];
        }
        let cards = [];
        if (this.cheat.didSwitchCards) {
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

    getVerificationState() {
        return this.verificationState;
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
        this.onEvent(`cryptoStuffReceived ${stuff}`);
        this.cryptoStuff = stuff;
        this.mykey = "BOBKEY";
        this.turnBasedGame.submitTurn(this.mykey);
        this.turnBasedGame.receiveTurnOver(this._keyReceived.bind(this));
    }

    _keyReceived(key) {
        if (this._handleVerificationPayload(key)) {
            return;
        }
        this.onEvent(`keyReceived ${key}`);
        this.key = key;
        this.turnBasedGame.receiveTurnOver(this._deckReceived.bind(this));
    }

    _deckReceived(deck) {
        if (this._handleVerificationPayload(deck)) {
            return;
        }
        this.onEvent(`deckReceived ${deck}`);
        this.deck = JSON.parse(deck);
        if (this.player == BOB) {
            // Bob must reshuffle the deck and send it back
            this._shuffleDeck();
            this.turnBasedGame.submitTurn(JSON.stringify(this.deck));
        }
        this.onEvent(`myDeck ${JSON.stringify(this.deck)}`);
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
            [this.deckShufflePositions[i], this.deckShufflePositions[j]] = [
                this.deckShufflePositions[j],
                this.deckShufflePositions[i],
            ];
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

        for (var cardIndex of cardIndexes) {
            const card = this.deck[cardIndex];

            decryptedCards[cardIndex] = this.cheat.isCardCoopCheatOn ? card : this._decryptCard(card);
        }

        this.turnBasedGame.submitTurn(JSON.stringify(decryptedCards));
    }

    _dealPrivateCards() {
        // sends opponent's private cards
        if (this.player == ALICE) {
            this._sendPrivateCards(BOB);
        } else {
            this._sendPrivateCards(ALICE);
        }
        // waits for the opponent to send decrypted cards
        this.turnBasedGame.receiveTurnOver(this._decryptedCardsReceived.bind(this));
    }

    _sendPrivateCards(player) {
        if (player == ALICE) {
            // decrypts Alice's cards (indices 0,1) and sends them over
            this._sendCards(0, 1);
        } else {
            // decrypts Bob's cards (indices 2,3) and sends them over
            this._sendCards(2, 3);
        }
    }

    _dealFlop() {
        // decrypts Flop cards and sends them over
        this._sendCards(4, 5, 6);
        // waits for the opponent to send decrypted cards
        this.turnBasedGame.receiveTurnOver(this._decryptedCardsReceived.bind(this));
    }

    _dealTurn() {
        // decrypts Turn card and sends it over
        this._sendCards(7);
        // waits for the opponent to send decrypted card
        this.turnBasedGame.receiveTurnOver(this._decryptedCardsReceived.bind(this));
    }

    _dealRiver() {
        // decrypts River card and sends it over
        this._sendCards(8);
        // waits for the opponent to send decrypted card
        this.turnBasedGame.receiveTurnOver(this._decryptedCardsReceived.bind(this));
    }

    _dealShowdown() {
        if (this.player == this.betLeader) {
            // bet leader has received the call and needs to reveal his cards
            this._sendPrivateCards(this.player);
            // waits for opponent to send his cards (or fold)
            this.turnBasedGame.receiveTurnOver(this._decryptedCardsReceived.bind(this));
        } else {
            // made the call: waits for the opponent's cards to be revealed
            this.turnBasedGame.receiveTurnOver(this._decryptedCardsReceived.bind(this));
        }
    }

    _decryptedCardsReceived(cards) {
        if (this._handleVerificationPayload(cards)) {
            return;
        }
        this.onEvent(`decryptedCardsReceived ${JSON.stringify(cards)}`);

        if (cards == "FOLD") {
            // opponent gave up
            this.state = GameState.END;
            this._computeResultOpponentFold();
            this.onEnd();
            return;
        }

        // updates deck
        cards = JSON.parse(cards);
        for (const [index, card] of Object.entries(cards)) {
            if (!(card as string).match(VALID_CARD_PATTERN)) {
                // cheat detected: triggers verification
                this._triggerVerification("Failure to reveal card");
                return;
            }
            this.deck[index] = card;
        }
        this.onEvent(`myDeck ${JSON.stringify(this.deck)}`);

        if (this.state == GameState.SHOWDOWN) {
            this._processShowdown();
        } else {
            if (this.player == this.betLeader) {
                // bet leader needs to bet first
                this.onBetRequested();
            } else {
                // the other player needs to wait for the first bet
                this.turnBasedGame.receiveTurnOver(this._betsReceived.bind(this));
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
                this.turnBasedGame.claimResult(this.result);
            } else {
                // player lost: folds without revealing his cards
                this.fold();
            }
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
            this.turnBasedGame.confirmResult();
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
            throw "Insufficient funds";
        }
        this.playerBets += amount;

        if (this.playerBets > this.opponentBets) {
            // bet has been raised: current player becomes the bet leader
            this.betLeader = this.player;
        }

        // sends new bets over
        this.turnBasedGame.submitTurn(this.playerBets);

        if (this.player == this.betLeader) {
            // bet leader: we need to wait for the opponent's bet
            this.turnBasedGame.receiveTurnOver(this._betsReceived.bind(this));
        } else if (this.playerBets == this.opponentBets) {
            // player is not leading the round and has matched opponent bets: betting round is complete
            this._advanceState();
        }
    }

    _betsReceived(opponentBets) {
        if (this._handleVerificationPayload(opponentBets)) {
            return;
        }

        if (opponentBets == "FOLD") {
            // opponent gave up
            this.onBetsReceived(BetType.FOLD, 0);
            this.state = GameState.END;
            this._computeResultOpponentFold();
            this.onEnd();
            return;
        }

        if (opponentBets > this.playerBets) {
            // opponent has raised and is now the bet leader
            this.onBetsReceived(BetType.RAISE, opponentBets);
            this.betLeader = this.opponent;
        } else if (opponentBets == this.opponentBets) {
            // opponent has kept the same amount of bets: it's a check
            this.onBetsReceived(BetType.CHECK, opponentBets);
        } else if (opponentBets == this.playerBets) {
            // opponent has risen his bets, and now matches the player's bets: it's a call
            this.onBetsReceived(BetType.CALL, opponentBets);
        } else {
            // opponent's bet is invalid
            this._triggerVerification("Invalid bet");
        }

        this.opponentBets = opponentBets;

        if (this.player != this.betLeader) {
            // received bet leader's bet, now player needs to place his bet
            this.onBetRequested();
        } else {
            // opponent has matched bet leader's bet: betting round is complete
            this._advanceState();
        }
    }

    _advanceState() {
        if (this.state == GameState.VERIFICATION) {
            // nothing to do while verification is in progress
            return;
        }
        this.state = this._incrementGameState(this.state);
        if (this.state == GameState.PREFLOP) {
            this._dealPrivateCards();
        } else if (this.state == GameState.FLOP) {
            this._dealFlop();
        } else if (this.state == GameState.TURN) {
            this._dealTurn();
        } else if (this.state == GameState.RIVER) {
            this._dealRiver();
        } else if (this.state == GameState.SHOWDOWN) {
            this._dealShowdown();
        } else if (this.state == GameState.END) {
            this.onEnd();
        }
    }

    _incrementGameState(state) {
        const newState = Math.min(GameStates.indexOf(state) + 1, GameStates.length - 1);
        return GameStates[newState];
    }

    _computeResult() {
        if (this.state != GameState.SHOWDOWN && this.state != GameState.END) {
            return;
        }
        const hands = this._computeHands();
        let playerScore = hands[this.player].reduce((total, card) => Number.parseInt(total) + Number.parseInt(card), 0);
        let opponentScore = hands[this.opponent].reduce(
            (total, card) => Number.parseInt(total) + Number.parseInt(card),
            0
        );

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
        const loser = winner == this.player ? this.opponent : this.player;
        const winnerFunds =
            winner == this.player
                ? this.playerFunds + this.opponentFunds / 2
                : this.playerFunds / 2 + this.opponentFunds;
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
        const playerHand = this.getPlayerCards().concat(communityCards.slice(0, 3));
        const opponentHand = this.getOpponentCards().concat(communityCards.slice(0, 3));
        hands[this.player] = playerHand;
        if (!opponentHand.includes("?")) {
            hands[this.opponent] = opponentHand;
        }
        return hands;
    }

    _isCheater() {
        return this.cheat.didSwitchCards || this.cheat.didDisableCardCoop;
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
        this.turnBasedGame.submitTurn(this._buildVerificationPayload(message));
        this.state = GameState.VERIFICATION;
        setTimeout(() => this._setVerificationState(VerificationState.STARTED, message), 3000);
    }

    _verificationReceived(message) {
        this.onEvent(`verificationReceived: ${message}`);
        this.state = GameState.VERIFICATION;
        setTimeout(() => this._setVerificationState(VerificationState.STARTED, message), 3000);
    }

    _setVerificationState(newState, message) {
        // sets verification state and triggers callback
        this.verificationState = newState;
        this.onVerification(this.verificationState, message);

        if (newState == VerificationState.ENDED) {
            // verification ended, game ends with cheater losing everything
            this.state = GameState.END;
            this._computeResultVerification();
            this.onEnd();
        } else {
            // simulates verification progress (one step every 5 sec, let's skip VerificationStates.RESULT_CHALLENGED)
            newState = this._incrementVerificationState(newState);
            if (newState == VerificationState.RESULT_CHALLENGED) {
                newState = this._incrementVerificationState(newState);
            }
            setTimeout(() => this._setVerificationState(newState, message), 5000);
        }
    }

    _incrementVerificationState(state) {
        // verification states ordering
        const newState = Math.min(VerificationStates.indexOf(state) + 1, VerificationStates.length - 1);
        return VerificationStates[newState];
    }
}
