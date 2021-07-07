import { BigNumber } from "ethers";
import { Card } from "../Card";
import { BetType, Game, GameState, GameStates, VerificationState, VerificationStates } from "../Game";
import { PokerSolver } from "../PokerSolver";
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

    // opponent id (inferred from player's id)
    opponent: number;

    // game bets
    playerBets: BigNumber;
    opponentBets: BigNumber;

    // allows member variables without type-checking
    [x: string]: any;

    constructor(
        private player: number,
        private playerFunds: BigNumber,
        private opponentFunds: BigNumber,
        private turnBasedGame: TurnBasedGame,
        onBetRequested?: () => any,
        onBetsReceived?: (betType: string, amount: BigNumber) => any,
        onEnd?: () => any,
        onEvent?: (msg: string) => any,
        onVerification?: (state: string, msg: string) => any
    ) {
        this.opponent = this.player == ALICE ? BOB : ALICE;
        this.playerBets = BigNumber.from(0);
        this.opponentBets = BigNumber.from(0);
        this.onEvent = onEvent ? onEvent : () => { };
        this.onEnd = onEnd ? onEnd : () => { };
        this.onBetRequested = onBetRequested ? onBetRequested : () => { };
        this.onBetsReceived = onBetsReceived ? onBetsReceived : () => { };
        this.onVerification = onVerification ? onVerification : () => { };
    }

    start(): Promise<void> {
        // sets player leading the betting round
        // - starts with ALICE and is changed every time a player raises
        // - used to define if a betting round is over once all bets are equal
        this.betLeader = ALICE;

        // game state
        this.state = GameState.START;
        // verification state
        this.verificationState = VerificationState.NONE;

        // sets up fixed internal TurnBasedGame callbacks
        this.turnBasedGame.receiveResultClaimed()
            .then((claimedResult) => { this._resultReceived(claimedResult) });
        this.turnBasedGame.receiveGameOver()
            .then((fundsShare) => this._gameOverReceived(fundsShare));
        this.turnBasedGame.receiveGameChallenged(this._verificationReceived.bind(this));
        // this.turnBasedGame.receiveVerificationUpdate(this._verificationReceived.bind(this));
        
        const promise = new Promise<void>((resolve) => {
            setTimeout(async () => {
                if (this.player == ALICE) {
                    // ALICE
                    this.playerBets = BigNumber.from(1);
                    this.opponentBets = BigNumber.from(2);

                    // defines initial info and sends it: group info (cryptoStuff) + key
                    this.cryptoStuff = "xkdkeoejf";
                    this.mykey = "ALICEKEY";
                    const initialInfo = JSON.stringify({"cryptoStuff": this.cryptoStuff, "key": this.mykey});
                    this.onEvent(`Sending initial info ${initialInfo}...`);
                    await this.turnBasedGame.submitTurn(initialInfo);

                    // TODO: try to get this into GameFactory?
                    if (this.gameOpponent) {
                        // starts opponent game if applicable
                        this.gameOpponent.start();
                    }

                    // waits for Bob to submit his key
                    this._keyReceived(await this.turnBasedGame.receiveTurnOver());

                    // shuffles deck and sends it over
                    this._shuffleDeck();
                    this.onEvent(`Sending shuffled deck...`);
                    await this.turnBasedGame.submitTurn(JSON.stringify(this.deck));

                    // awaits for Bob's reshuffled deck
                    this._deckReceived(await this.turnBasedGame.receiveTurnOver());

                } else {
                    // BOB
                    this.playerBets = BigNumber.from(2);
                    this.opponentBets = BigNumber.from(1);

                    // waits for Alice's "cryptostuff" (group info) and key
                    this._initialInfoReceived(await this.turnBasedGame.receiveTurnOver())

                    // defines key and sends it
                    this.mykey = "BOBKEY";
                    this.onEvent(`Sending key ${this.mykey}`);
                    await this.turnBasedGame.submitTurn(this.mykey);

                    // waits for Alice's shuffled deck
                    this._deckReceived(await this.turnBasedGame.receiveTurnOver());

                    // reshuffles deck and sends it back
                    this._shuffleDeck();
                    this.onEvent(`Sending reshuffled deck...`);
                    await this.turnBasedGame.submitTurn(JSON.stringify(this.deck));
                }

                // advances state to start game (will deal private cards)
                await this._advanceState();
                resolve();

            }, 5000);
        });
        return promise;
    }

    async call() {
        const amount = this.opponentBets.sub(this.playerBets);
        if (amount.lte(0)) {
            throw "Cannot call when opponent's bets are not higher";
        }
        await this._increaseBets(amount);
    }

    async check() {
        if (!this.opponentBets.eq(this.playerBets)) {
            throw "Cannot check when player and opponent's bets are not equal";
        }
        await this._increaseBets(BigNumber.from(0));
    }

    async fold() {
        if (this.opponentBets.eq(this.playerBets) && this.state != GameState.SHOWDOWN) {
            throw "Fold not allowed because player and opponent bets are equal: use check instead";
        }
        await this.turnBasedGame.submitTurn("FOLD");
        this._computeResultPlayerFold();
    }

    async raise(amount: BigNumber) {
        if (!BigNumber.isBigNumber(amount) || amount.lte(0)) {
            throw `Raise amount must be a positive big number, but was '${amount}'`;
        }
        const callAmount = this.opponentBets.sub(this.playerBets);
        if (callAmount.lt(0)) {
            throw "Cannot raise when opponent's bets are not higher";
        }
        await this._increaseBets(callAmount.add(amount));
    }

    // Methods that maliciously alter game state on purpose
    cheat = {
        didSwitchCards: false,
        didDisableCardCoop: false,
        isCardCoopCheatOn: false,

        // Change the cards in the player's hand
        switchCards: (card1: Card, card2: Card) => {
            this.deck.push(card1.toIndex(), card2.toIndex());
            this.cheat.didSwitchCards = true;
        },

        // When card cooperation is disabled, cards are sent to opponent
        // still encrypted. Enabled by default.
        toggleCardCooperation: () => {
            this.cheat.didDisableCardCoop = true;
            this.cheat.isCardCoopCheatOn = !this.cheat.isCardCoopCheatOn;
        },
    };

    async getPlayerCards() {
        return this._getPlayerCards();
    }

    async getOpponentCards() {
        return this._getOpponentCards();
    }

    async getCommunityCards() {
        return this._getCommunityCards();
    }

    async getPlayer() {
        return this.player;
    }

    async getPlayerFunds() {
        return this.playerFunds;
    }

    async getOpponentFunds() {
        return this.opponentFunds;
    }

    async getPlayerBets() {
        return this.playerBets;
    }

    async getOpponentBets() {
        return this.opponentBets;
    }

    async getState() {
        return this.state;
    }

    async getVerificationState() {
        return this.verificationState;
    }

    async getResult() {
        return this.result;
    }

    _getPlayerCards() {
        if (!this.deck) {
            return [99, 99].map(Card.fromIndex);
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
        return cards.map(Card.fromIndex);
    }

    _getOpponentCards() {
        if (!this.deck) {
            return [99, 99].map(Card.fromIndex);
        }
        let cards = [];
        if (this.opponent == ALICE) {
            cards.push(this._getCard(0));
            cards.push(this._getCard(1));
        } else {
            cards.push(this._getCard(2));
            cards.push(this._getCard(3));
        }
        return cards.map(Card.fromIndex);
    }

    _getCommunityCards() {
        if (!this.deck) {
            return [99, 99, 99, 99, 99].map(Card.fromIndex);
        }
        let cards = [];
        cards.push(this._getCard(4));
        cards.push(this._getCard(5));
        cards.push(this._getCard(6));
        cards.push(this._getCard(7));
        cards.push(this._getCard(8));
        return cards.map(Card.fromIndex);
    }

    _getCard(index) {
        let card = this._decryptCard(this.deck[index]);
        if (isNaN(card)) {
            return 99;
        } else {
            return card;
        }
    }

    _initialInfoReceived(stuff) {
        this.onEvent(`initialInfoReceived ${stuff}`);
        const stuffObj = JSON.parse(stuff);
        this.cryptoStuff = stuffObj.cryptoStuff;
        this.key = stuffObj.key;
    }

    _keyReceived(key) {
        this.onEvent(`keyReceived ${key}`);
        this.key = key;
    }

    _deckReceived(deck) {
        this.onEvent(`deckReceived ${deck}`);
        this.deck = JSON.parse(deck);
        this.onEvent(`myDeck ${JSON.stringify(this.deck)}`);
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

    async _sendCards(...cardIndexes) {
        const decryptedCards = {};

        for (var cardIndex of cardIndexes) {
            const card = this.deck[cardIndex];

            decryptedCards[cardIndex] = this.cheat.isCardCoopCheatOn ? card : this._decryptCard(card);
        }

        await this.turnBasedGame.submitTurn(JSON.stringify(decryptedCards));
    }

    async _dealPrivateCards() {
        // sends opponent's private cards
        if (this.player == ALICE) {
            // Alice first sends Bob's private cards and then waits for Bob to reveal hers
            this.onEvent(`Dealing opponent's private cards...`);
            await this._sendPrivateCards(BOB);
            this._decryptedCardsReceived(await this.turnBasedGame.receiveTurnOver());
        } else {
            // Bob first waits for Alice to reveal his cards and then sends hers
            this._decryptedCardsReceived(await this.turnBasedGame.receiveTurnOver());
            this.onEvent(`Dealing opponent's private cards...`);
            await this._sendPrivateCards(ALICE);
        }
    }

    async _sendPrivateCards(player) {
        if (player == ALICE) {
            // decrypts Alice's cards (indices 0,1) and sends them over
            await this._sendCards(0, 1);
        } else {
            // decrypts Bob's cards (indices 2,3) and sends them over
            await this._sendCards(2, 3);
        }
    }

    async _dealFlop() {
        if (this.player == this.betLeader) {
            // decrypts Flop cards and sends them over
            this.onEvent(`Dealing FLOP cards...`);
            await this._sendCards(4, 5, 6);
            // waits for the opponent to send decrypted cards
            this._decryptedCardsReceived(await this.turnBasedGame.receiveTurnOver());
        } else {
            // waits for the opponent to send decrypted cards
            this._decryptedCardsReceived(await this.turnBasedGame.receiveTurnOver());
            // decrypts Flop cards and sends them over
            this.onEvent(`Dealing FLOP cards...`);
            await this._sendCards(4, 5, 6);
        }
    }

    async _dealTurn() {
        if (this.player == this.betLeader) {
            // decrypts Turn card and sends it over
            this.onEvent(`Dealing TURN card...`);
            await this._sendCards(7);
            // waits for the opponent to send decrypted card
            this._decryptedCardsReceived(await this.turnBasedGame.receiveTurnOver());
        } else {
            // waits for the opponent to send decrypted card
            this._decryptedCardsReceived(await this.turnBasedGame.receiveTurnOver());
            // decrypts Turn card and sends it over
            this.onEvent(`Dealing TURN card...`);
            await this._sendCards(7);
        }
    }

    async _dealRiver() {
        if (this.player == this.betLeader) {
            // decrypts River card and sends it over
            this.onEvent(`Dealing RIVER card...`);
            await this._sendCards(8);
            // waits for the opponent to send decrypted card
            this._decryptedCardsReceived(await this.turnBasedGame.receiveTurnOver());
        } else {
            // waits for the opponent to send decrypted card
            this._decryptedCardsReceived(await this.turnBasedGame.receiveTurnOver());
            // decrypts River card and sends it over
            this.onEvent(`Dealing RIVER card...`);
            await this._sendCards(8);
        }
    }

    async _dealShowdown() {
        if (this.player == this.betLeader) {
            // bet leader has received the call and needs to reveal his cards
            this.onEvent(`Showing cards to opponent...`);
            await this._sendPrivateCards(this.player);
            // waits for opponent to send his cards (or fold)
            this._decryptedCardsReceived(await this.turnBasedGame.receiveTurnOver());
        } else {
            // made the call: waits for the opponent's cards to be revealed
            this._decryptedCardsReceived(await this.turnBasedGame.receiveTurnOver());
        }
    }

    async _decryptedCardsReceived(cards) {
        this.onEvent(`decryptedCardsReceived ${JSON.stringify(cards)}`);

        if (cards == "FOLD") {
            // opponent gave up
            this._computeResultOpponentFold();
            await this.turnBasedGame.claimResult(this.result.fundsShare);
            return;
        }

        // updates deck
        cards = JSON.parse(cards);
        for (const [index, card] of Object.entries(cards)) {
            if (!(card as string).match(VALID_CARD_PATTERN)) {
                // cheat detected: triggers verification
                await this._triggerVerification("Failure to reveal card");
                return;
            }
            this.deck[index] = card;
        }
        this.onEvent(`myDeck ${JSON.stringify(this.deck)}`);
    }

    async _processShowdown() {
        // computes result
        this._computeResult();

        if (this.player != this.betLeader) {
            // player made the call and has now seen opponent's cards
            if (this.result.isWinner[this.player]) {
                // player won: reveals private cards to prove that he won
                this.onEvent(`Showing cards to opponent...`);
                await this._sendPrivateCards(this.player);
                // submits computed result
                await this.turnBasedGame.claimResult(this.result.fundsShare);
            } else {
                // player lost: folds without revealing his cards
                await this.fold();
            }
        }
    }

    async _resultReceived(opponentResult: Array<BigNumber>) {
        if (JSON.stringify(this.result.fundsShare) !== JSON.stringify(opponentResult)) {
            // result mismatch: trigger a verification!
            await this._triggerVerification("Result mismatch");
        } else {
            // everything ok: sends confirmation
            await this.turnBasedGame.confirmResult();
        }
    }

    async _gameOverReceived(fundsShare: Array<BigNumber>) {
        // ends game
        this.state = GameState.END;
        this.onEnd();
    }

    async _increaseBets(amount: BigNumber) {
        if (this.playerBets.add(amount).gt(this.playerFunds)) {
            throw "Insufficient funds";
        }
        this.playerBets = this.playerBets.add(amount);

        if (this.playerBets.gt(this.opponentBets)) {
            // bet has been raised: current player becomes the bet leader
            this.betLeader = this.player;
        }

        // sends new bets over
        await this.turnBasedGame.submitTurn(this.playerBets.toString());

        if (this.player == this.betLeader) {
            // bet leader: will react when opponent's bet is received
            this.turnBasedGame.receiveTurnOver()
                .then((data) => this._betsReceived(data));
        } else if (this.playerBets.eq(this.opponentBets)) {
            // player is not leading the round and has matched opponent bets: betting round is complete
            this._advanceState();
        }
    }

    async _betsReceived(opponentBets) {
        if (opponentBets == "FOLD") {
            // opponent gave up
            this.onBetsReceived(BetType.FOLD, 0);
            this._computeResultOpponentFold();
            await this.turnBasedGame.claimResult(this.result.fundsShare);
            return;
        }

        opponentBets = BigNumber.from(opponentBets);
        if (opponentBets.gt(this.playerBets)) {
            // opponent has raised and is now the bet leader
            this.onBetsReceived(BetType.RAISE, opponentBets);
            this.betLeader = this.opponent;
        } else if (opponentBets.eq(this.opponentBets)) {
            // opponent has kept the same amount of bets: it's a check
            this.onBetsReceived(BetType.CHECK, opponentBets);
        } else if (opponentBets.eq(this.playerBets)) {
            // opponent has risen his bets, and now matches the player's bets: it's a call
            this.onBetsReceived(BetType.CALL, opponentBets);
        } else {
            // opponent's bet is invalid
            await this._triggerVerification("Invalid bet");
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

    async _advanceState() {
        if (this.state == GameState.VERIFICATION) {
            // nothing to do while verification is in progress
            return;
        }
        const nextState = this._incrementGameState(this.state);
        if (nextState == GameState.END) {
            this.state = nextState;
            this.onEnd();
        } else if (nextState == GameState.SHOWDOWN) {
            await this._dealShowdown();
            this.state = nextState;
            await this._processShowdown();
        } else {
            if (nextState == GameState.PREFLOP) {
                await this._dealPrivateCards();
            } else if (nextState == GameState.FLOP) {
                await this._dealFlop();
            } else if (nextState == GameState.TURN) {
                await this._dealTurn();
            } else if (nextState == GameState.RIVER) {
                await this._dealRiver();
            }
            this.state = nextState;
            if (this.player == this.betLeader) {
                // bet leader needs to bet first
                this.onBetRequested();
            } else {
                // the other player will react after the first bet
                this.turnBasedGame.receiveTurnOver()
                    .then((data) => this._betsReceived(data));
            }
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
        const result = this._computePokerResult();

        const fundsShare = Array(2);
        if (result.winners[this.player] && result.winners[this.opponent]) {
            fundsShare[this.player] = this.playerFunds;
            fundsShare[this.opponent] = this.opponentFunds;
        } else if (result.winners[this.player]) {
            fundsShare[this.player] = this.playerFunds.add(this.opponentBets);
            fundsShare[this.opponent] = this.opponentFunds.sub(this.opponentBets);
        } else {
            fundsShare[this.player] = this.playerFunds.sub(this.playerBets);
            fundsShare[this.opponent] = this.opponentFunds.add(this.playerBets);
        }

        this.result = { isWinner: result.winners, fundsShare, hands: result.bestHands };
    }

    _computeResultPlayerFold() {
        const isWinner = Array(2);
        isWinner[this.player] = false;
        isWinner[this.opponent] = true;
        const fundsShare = Array(2);
        fundsShare[this.player] = this.playerFunds.sub(this.playerBets);
        fundsShare[this.opponent] = this.opponentFunds.add(this.playerBets);
        const hands = this._computePokerResult().bestHands;
        this.result = { isWinner, fundsShare, hands };
    }

    _computeResultOpponentFold() {
        const isWinner = Array(2);
        isWinner[this.player] = true;
        isWinner[this.opponent] = false;
        const fundsShare = Array(2);
        fundsShare[this.player] = this.playerFunds.add(this.opponentBets);
        fundsShare[this.opponent] = this.opponentFunds.sub(this.opponentBets);
        const hands = this._computePokerResult().bestHands;
        this.result = { isWinner, fundsShare, hands };
    }

    _computeResultVerification() {
        // cheater loses everything, half of which goes to his opponent
        const winner = this._isCheater() ? this.opponent : this.player;
        const loser = winner == this.player ? this.opponent : this.player;
        const winnerFunds =
            winner == this.player
                ? this.playerFunds.add(this.opponentFunds.div(2))
                : this.playerFunds.div(2).add(this.opponentFunds);
        const isWinner = Array(2);
        isWinner[winner] = true;
        isWinner[loser] = false;
        const fundsShare = Array(2);
        fundsShare[winner] = winnerFunds;
        fundsShare[loser] = 0;
        const hands = this._computePokerResult().bestHands;
        this.result = { isWinner, fundsShare, hands };
    }

    _computePokerResult() {
        const hands = Array(2);
        const communityCards = this._getCommunityCards();
        if (!communityCards.includes(null)) {
            const playerHand = this._getPlayerCards().concat(communityCards);
            const opponentHand = this._getOpponentCards().concat(communityCards);
            hands[this.player] = playerHand;
            if (!opponentHand.includes(null)) {
                hands[this.opponent] = opponentHand;
            }
        }
        const result = PokerSolver.solve(hands);
        return result;
    }

    _isCheater() {
        return this.cheat.didSwitchCards || this.cheat.didDisableCardCoop;
    }

    async _triggerVerification(message) {
        this.onEvent(`triggerVerification: ${message}`);
        await this.turnBasedGame.challengeGame(message);
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
