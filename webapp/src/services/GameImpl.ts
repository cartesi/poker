import { Card } from "./Card";
import {
    Engine,
    EngineBetType,
    EnginePlayer,
    EngineResult,
    EngineState,
    EngineStep,
    StatusCode,
} from "./engine/Engine";
import { BetType, EventType, Game, GameResult, GameState, VerificationState } from "./Game";
import { PokerSolver } from "./PokerSolver";
import { TurnBasedGame, TurnInfo } from "./TurnBasedGame";
import { BigNumber } from "ethers";
import { ServiceConfig } from "./ServiceConfig";

export class GameImpl implements Game {
    // FIXME: if using a mock TurnBasedGame, stores a reference to the opponent's Game instance (with automatic responses)
    gameOpponent: Game;
    private gameOverResult: GameResult;
    private verificationState = VerificationState.NONE;

    constructor(
        private playerId: number,
        private playerFunds: BigNumber,
        private opponentId: number,
        private opponentFunds: BigNumber,
        private bigBlind: BigNumber,
        private turnBasedGame: TurnBasedGame,
        private engine: Engine,
        private onBetRequested: () => any = () => {},
        private onBetsReceived: (betType: string, amount: BigNumber) => any = () => {},
        private onEnd: () => any = () => {},
        private onEvent: (msg: string, type: EventType) => any = () => {},
        private onVerification: (state: string, msg: string) => any = () => {}
    ) {
        this.turnBasedGame.receiveResultClaimed().then(this._onResultClaimed.bind(this));
        this.turnBasedGame.receiveGameOver().then((fundsShare) => {
            this._gameOverReceived(fundsShare);
        });
        this.turnBasedGame.receiveGameChallenged().then((reason: string) => {
            this._gameChallengeReceived(reason);
        });
        this.turnBasedGame.receiveVerificationUpdate().then((update) => {
            this._verificationUpdateReceived(update[0], update[1]);
        });
    }

    start(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                // FIXME: figure out how to use GameWasm with TurnBasedGameMock properly
                if (this.gameOpponent) this.gameOpponent.start();

                console.log(`### [Player ${this.playerId}] Init engine ###`);

                await this.engine.init(
                    this._isDealer() ? this.playerFunds : this.opponentFunds,
                    this._isDealer() ? this.opponentFunds : this.playerFunds,
                    this.bigBlind,
                    ServiceConfig.isEncryptionEnabled(),
                    ServiceConfig.getPredefinedWinnerId()
                );
                console.log(`### [Player ${this.playerId}] Engine started ###`);

                if (this._isDealer()) await this._createHandshake();
                await this._processHandshake();

                resolve();

                await this._checkNextAction();
            } catch (err) {
                reject(err);
            }
        });
    }

    call(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            console.log(`### [Player ${this.playerId}] CALL ###`);
            try {
                const result = await this._createBet(EngineBetType.BET_CALL);
                resolve();
                this._onBet(result);
            } catch (err) {
                reject(err);
            }
        });
    }

    check(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            console.log(`### [Player ${this.playerId}] CHECK ###`);
            try {
                const result = await this._createBet(EngineBetType.BET_CHECK);
                resolve();
                this._onBet(result);
            } catch (err) {
                reject(err);
            }
        });
    }

    fold(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            console.log(`### [Player ${this.playerId}] FOLD ###`);
            try {
                await this._createBet(EngineBetType.BET_FOLD);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    raise(amount: BigNumber): Promise<void> {
        return new Promise(async (resolve, reject) => {
            console.log(`### [Player ${this.playerId}] RAISE ###`);
            try {
                const result = await this._createBet(EngineBetType.BET_RAISE, amount);
                resolve();
                this._onBet(result);
            } catch (err) {
                reject(err);
            }
        });
    }

    async claimTimeout() {
        await this.turnBasedGame.claimTimeout();
    }

    async challengeGame(msg: string) {
        this.onEvent(`triggerVerification: ${msg}`, EventType.UPDATE_STATE);
        await this.turnBasedGame.challengeGame(msg);
        this.verificationState = VerificationState.STARTED;
    }

    cheat: {
        switchCards: (card1: Card, card2: Card) => any;
        toggleCardCooperation: () => any;
    };

    getPlayerCards(): Promise<Array<Card>> {
        return new Promise(async (resolve, reject) => {
            let player = await this._getPlayer(this.playerId);
            let cards = player.cards.map(Card.fromIndex);
            resolve(cards);
        });
    }

    getOpponentCards(): Promise<Array<Card>> {
        return new Promise(async (resolve, reject) => {
            let opponent = await this._getPlayer(this.opponentId);
            let cards = opponent.cards.map(Card.fromIndex);
            resolve(cards);
        });
    }

    getCommunityCards(): Promise<Array<Card>> {
        return new Promise(async (resolve, reject) => {
            try {
                let gameState = await this.engine.game_state();
                let cards = gameState.public_cards.map(Card.fromIndex);
                resolve(cards);
            } catch (err) {
                reject(err);
            }
        });
    }

    getCurrentPlayerId(): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                let gameState = await this.engine.game_state();
                resolve(gameState.current_player);
            } catch (err) {
                reject(err);
            }
        });
    }

    async getNextMessageAuthor(): Promise<number> {
        return (await this.engine.game_state()).next_msg_author;
    }

    getPlayerFunds(): Promise<BigNumber> {
        return new Promise(async (resolve, reject) => {
            try {
                let player = await this._getPlayer(this.playerId);
                resolve(player.total_funds);
            } catch (err) {
                reject(err);
            }
        });
    }

    getOpponentFunds(): Promise<BigNumber> {
        return new Promise(async (resolve, reject) => {
            try {
                let opponent = await this._getPlayer(this.opponentId);
                resolve(opponent.total_funds);
            } catch (err) {
                reject(err);
            }
        });
    }

    getPlayerBets(): Promise<BigNumber> {
        return new Promise(async (resolve, reject) => {
            try {
                let player = await this._getPlayer(this.playerId);
                resolve(player.bets);
            } catch (err) {
                reject(err);
            }
        });
    }

    getOpponentBets(): Promise<BigNumber> {
        return new Promise(async (resolve, reject) => {
            try {
                let opponent = await this._getPlayer(this.opponentId);
                resolve(opponent.bets);
            } catch (err) {
                reject(err);
            }
        });
    }

    getState(): Promise<GameState> {
        return new Promise(async (resolve, reject) => {
            if (this.verificationState != VerificationState.NONE) {
                if (this.verificationState == VerificationState.ENDED) resolve(GameState.END);
                else resolve(GameState.VERIFICATION);
            } else {
                try {
                    let state = await this.engine.game_state();
                    if (state.step >= 0 && state.step < 9) {
                        resolve(GameState.START);
                    } else if (state.step == 9) {
                        resolve(GameState.PREFLOP);
                    } else if (state.step == 10) {
                        resolve(GameState.WAITING_FLOP);
                    } else if (state.step == 11) {
                        resolve(GameState.FLOP);
                    } else if (state.step == 12) {
                        resolve(GameState.WAITING_TURN);
                    } else if (state.step == 13) {
                        resolve(GameState.TURN);
                    } else if (state.step == 14) {
                        resolve(GameState.WAITING_RIVER);
                    } else if (state.step == 15) {
                        resolve(GameState.RIVER);
                    } else if (state.step == 16) {
                        resolve(GameState.SHOWDOWN);
                    } else if (state.step == 17) {
                        resolve(GameState.END);
                    } else {
                        reject(new Error("Unknown engine state"));
                    }
                } catch (err) {
                    reject(err);
                }
            }
        });
    }

    getResult(): Promise<GameResult> {
        return new Promise(async (resolve, reject) => {
            try {
                let state = await this.engine.game_state();
                if (state.step == EngineStep.GAME_OVER) {
                    let result = this._computeResult(state);
                    resolve(result);
                } else if (this.gameOverResult) {
                    resolve(this.gameOverResult);
                } else {
                    reject(new Error("Game is not over yet"));
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    private _computeResult(state: EngineState): GameResult {
        const winners = Array(2);
        winners[this.playerId] = this.playerId === state.winner;
        winners[this.opponentId] = this.opponentId === state.winner;

        const hands = Array(2);
        const publicCards = state.public_cards.map(Card.fromIndex);
        const playerCards = state.players[this.playerId].cards.map(Card.fromIndex).concat(publicCards);
        const opponentCards = state.players[this.opponentId].cards.map(Card.fromIndex).concat(publicCards);
        if (!playerCards.includes(null)) {
            hands[this.playerId] = playerCards;
        }
        if (!opponentCards.includes(null)) {
            hands[this.opponentId] = opponentCards;
        }
        const bestHands = PokerSolver.solve(hands).bestHands;

        return {
            isWinner: winners,
            fundsShare: state.funds_share,
            hands: bestHands,
        };
    }

    private async _submitTurn(data: Uint8Array, eventMsg: string): Promise<TurnInfo> {
        // defines nextPlayer to act, who will be held accountable in case of a timeout
        let nextPlayer;
        if ((await this.getState()) == GameState.END) {
            // if this turn submission ends the game, the opponent should be the next one to act to claim the result
            nextPlayer = this.opponentId;
        } else {
            // otherwise, use the engine's indicated next message author (next player to act)
            nextPlayer = await this.getNextMessageAuthor();
        }
        this.onEvent(eventMsg, EventType.DATA_SEND);
        return this.turnBasedGame.submitTurn({
            data,
            nextPlayer: nextPlayer,
            playerStake: await this.getPlayerBets(),
        });
    }

    private async _receiveTurnOver(eventMsg: string): Promise<TurnInfo> {
        this.onEvent(eventMsg, EventType.DATA_WAIT);
        return await this.turnBasedGame.receiveTurnOver();
    }

    private async _createHandshake(): Promise<TurnInfo> {
        console.log(`### [Player ${this.playerId}] Create Handshake ###`);
        let result = await this.engine.create_handshake();
        console.log(`### [Player ${this.playerId}] Submit turn ###`);
        const eventMsg = await this._computeHandshakeProgress(EventType.DATA_SEND);
        return this._submitTurn(result.message_out, eventMsg);
    }

    private async _processHandshake(): Promise<void> {
        console.log(`### [Player ${this.playerId}] Process Handshake ###`);
        let result: EngineResult;
        do {
            const eventMsg = await this._computeHandshakeProgress(EventType.DATA_WAIT);
            const turnInfo = await this._receiveTurnOver(eventMsg);
            console.log(`### [Player ${this.playerId}] On turn received ###`);

            const message_in = turnInfo.data;
            result = await this.engine.process_handshake(message_in);

            let hasMessageOut = (result.message_out) && result.message_out.length > 0;
            // after processing opponent's turnInfo message, checks if it is consistent
            await this._checkOpponentTurnInfo(turnInfo, hasMessageOut);
            // after processing turn, checks if engine produced an error
            await this._checkEngineResult(result);

            if (hasMessageOut) {
                console.log(`### [Player ${this.playerId}] Submit turn ###`);
                const eventMsg = await this._computeHandshakeProgress(EventType.DATA_SEND);
                await this._submitTurn(result.message_out, eventMsg);
            }
        } while (result.status == StatusCode.CONTINUED);

        return Promise.resolve();
    }

    private async _computeHandshakeProgress(eventType: EventType): Promise<string> {
        const state = (await this.engine.game_state()).step;
        let percentage = (state/9)*100;
        if (eventType === EventType.DATA_SEND) {
            percentage -= 5;
        }
        return `${percentage.toFixed(0)}%`;
    }

    private async _createBet(type: EngineBetType, amount: BigNumber = BigNumber.from(0)): Promise<EngineResult> {
        console.log(`### [Player ${this.playerId}] Created bet ###`);
        let bet = await this.engine.create_bet(type, amount);
        console.log(`### [Player ${this.playerId}] Submit turn ###`);
        await this._submitTurn(bet.message_out, "Sending bet...");

        console.log(`### [Player ${this.playerId}] Bet Resolved ###`);
        return bet;
    }

    private async _processBet(): Promise<Bet> {
        console.log(`### [Player ${this.playerId}] Process bet ###`);
        let result: EngineResult;
        let receivedBetType: BetType;
        do {
            const turnInfo = await this._receiveTurnOver("Waiting for opponent...");
            console.log(`### [Player ${this.playerId}] On turn received ###`);

            const message_in = turnInfo.data;
            result = await this.engine.process_bet(message_in);

            let hasMessageOut = (result.message_out) && result.message_out.length > 0;
            // after processing opponent's turnInfo message, checks if it is consistent
            await this._checkOpponentTurnInfo(turnInfo, hasMessageOut);
            // after processing turn, checks if engine produced an error
            await this._checkEngineResult(result);

            // reaction to received result
            const betType = this._convertBetType(result.betType);
            if (betType && betType != BetType.NONE && betType != receivedBetType) {
                // it's a new bet: notify that it has just been received
                receivedBetType = betType;
                this.onBetsReceived(receivedBetType, result.amount);
            } else {
                // not a new bet: just notify that game state may have been updated
                this.onEvent(await this.getState(), EventType.UPDATE_STATE);
            }

            if (hasMessageOut) {
                console.log(`### [Player ${this.playerId}] Submit turn ###`);
                await this._submitTurn(result.message_out, "Sending protocol response...");
            }
        } while (result.status == StatusCode.CONTINUED);

        return {
            type: receivedBetType,
            amount: result.amount,
        };
    }

    private async _checkOpponentTurnInfo(turnInfo: TurnInfo, hasMessageOut: boolean): Promise<void> {
        // checks if opponent turnInfo's declared nextPlayer is correct
        // - this should correspond to the next player that needs to submit information for the game to proceed
        // - the declared nextPlayer is the one held accountable in case of timeout (is considered to have given up)
        let expectedNextPlayer;
        if ((await this.getState()) == GameState.END) {
            // if game has ended, this player should claim the result and should have been declared as the nextPlayer
            expectedNextPlayer = this.playerId;
        } else if (hasMessageOut) {
            // if engine result includes a message_out response, this player needs to submit a turn and should have been declared as the nextPlayer
            expectedNextPlayer = this.playerId;
        } else {
            // otherwise, nextPlayer should be the next one to bet in the game (engine's "current player")
            expectedNextPlayer = await this.getCurrentPlayerId();
        }

        if (turnInfo.nextPlayer != expectedNextPlayer) {
            await this.challengeGame(`Inconsistent declared nextPlayer`);
            return Promise.reject(
                `Inconsistent declared nextPlayer: expected '${expectedNextPlayer}' but opponent declared '${turnInfo.nextPlayer}'`
            );
        }

        // checks if opponent turnInfo's declared playerStake is correct
        const expectedOpponentBets = await this.getOpponentBets();
        if (!turnInfo.playerStake.eq(expectedOpponentBets)) {
            await this.challengeGame(`Inconsistent declared playerStake`);
            return Promise.reject(
                `Inconsistent declared playerStake: expected ${expectedOpponentBets.toString()} but opponent declared ${turnInfo.playerStake.toString()}`
            );
        }

        return Promise.resolve();
    }

    private async _checkEngineResult(result: EngineResult): Promise<void> {
        if (result.status != StatusCode.SUCCESS && result.status != StatusCode.CONTINUED) {
            const reason = `Invalid data submission (code ${result.status})`;
            await this.challengeGame(reason);

            return Promise.reject(reason);
        }
        return Promise.resolve();
    }

    private async _checkNextAction(isFold?: boolean): Promise<boolean> {
        let state = await this.engine.game_state();
        if (state.step == EngineStep.GAME_OVER) {
            if (isFold || state.last_aggressor == this.playerId) {
                let fundsShare = state.funds_share;
                console.log(`### [Player ${this.playerId}] Claim Result ###`);
                await this.turnBasedGame.claimResult(fundsShare);
            }
            return false;
        } else {
            if (state.current_player == this.playerId) {
                // game is not over and it's the player's turn: notify UI to request a bet
                this.onBetRequested();
            } else {
                // game is not over and it's the opponent's turn: wait for his input
                this._waitOpponentBet();
            }
            return true;
        }
    }

    private async _onBet(result: EngineResult) {
        let isFold = false;
        if (result.status == StatusCode.CONTINUED) {
            // interaction is not over: keep exchanging data until it's over and check if opponent has folded
            const bet = await this._processBet();
            isFold = bet.type == BetType.FOLD;
        }
        // bet processing is complete: define what to do next
        this._checkNextAction(isFold);
    }

    private async _waitOpponentBet() {
        console.log(`### [Player ${this.playerId}] Wait opponent bet ###`);
        const bet = await this._processBet();

        // bet processing is complete: check if opponent has folded and define what to do next
        const isFold = bet.type == BetType.FOLD;
        this._checkNextAction(isFold);
    }

    private _convertBetType(engineType: EngineBetType): BetType {
        switch (engineType) {
            case EngineBetType.BET_NONE:
                return BetType.NONE;
            case EngineBetType.BET_CALL:
                return BetType.CALL;
            case EngineBetType.BET_CHECK:
                return BetType.CHECK;
            case EngineBetType.BET_RAISE:
                return BetType.RAISE;
            case EngineBetType.BET_FOLD:
                return BetType.FOLD;
            default:
                return null;
        }
    }

    private async _onResultClaimed(opponentResult: BigNumber[]) {
        console.log(`### [Player ${this.playerId}] On result claimed ###`);
        const result = await this.getResult();
        if (
            !result.fundsShare[this.playerId].eq(opponentResult[this.playerId]) ||
            !result.fundsShare[this.opponentId].eq(opponentResult[this.opponentId])
        ) {
            console.log(`### [Player ${this.playerId}] Challenge Game ###`);
            this.challengeGame("Result mismatch");
        } else {
            console.log(`### [Player ${this.playerId}] Confirm result ###`);
            await this.turnBasedGame.confirmResult();
        }
    }

    private _gameOverReceived(fundsShare: BigNumber[]) {
        console.log(`### [Player ${this.playerId}] Received Game Over ###`);
        // compute result based on fundsShare received from GameOver event
        this.gameOverResult = {
            fundsShare,
            isWinner: Array(2),
            hands: Array(2),
        };
        // - define winners: anyone who has not lost money is considered a winner
        this.gameOverResult.isWinner[this.playerId] = fundsShare[this.playerId].gte(this.playerFunds);
        this.gameOverResult.isWinner[this.opponentId] = fundsShare[this.opponentId].gte(this.opponentFunds);
        // - set hands as unknown (if there was game-specific data included in the GameOver event we could do better)
        this.gameOverResult.hands = Array(2);
        this.onEnd();
    }

    private _gameChallengeReceived(reason: string) {
        this.onEvent(`GameChallenged received: ${reason}`, EventType.UPDATE_STATE);
        this.verificationState = VerificationState.STARTED;
		this.turnBasedGame.receiveGameChallenged().then((reason: string) => this._gameChallengeReceived(reason));
    }

    private _verificationUpdateReceived(state: VerificationState, message: string) {
        this.onEvent(`verificationReceived: ${message} (${state})`, EventType.UPDATE_STATE);

        this.turnBasedGame.receiveVerificationUpdate().then((update) => {
            this._verificationUpdateReceived(update[0], update[1]);
        });

        this.verificationState = state;
        this.onVerification(state, message);
    }

    // TODO: Maybe ask Engine who is Dealer/Small Blind/Big Blind?
    private _isDealer(): Boolean {
        return this.playerId == 0;
    }

    private async _getPlayer(playerId: number): Promise<EnginePlayer> {
        let state = await this.engine.game_state();
        return state.players[playerId];
    }
}

interface Bet {
    type: BetType;
    amount: BigNumber;
}
