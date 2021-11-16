import { Card } from "./Card";
import { Engine, EngineBetType, EnginePlayer, EngineResult, EngineState, EngineStep, StatusCode } from "./engine/Engine";
import { BetType, EventType, Game, GameResult, GameState, VerificationState } from "./Game";
import { PokerSolver } from "./PokerSolver";
import { TurnBasedGame, TurnInfo } from "./TurnBasedGame";
import { BigNumber } from "ethers";
import { ServiceConfig } from "./ServiceConfig";

export class GameImpl implements Game {
    // FIXME: if using a mock TurnBasedGame, stores a reference to the opponent's Game instance (with automatic responses)
    gameOpponent: Game;
    private gameOverResult: GameResult;
    
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
                    ServiceConfig.isEncryptionEnabled()
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
        await this.turnBasedGame.challengeGame(msg);
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
        });
    }

    getVerificationState(): Promise<VerificationState> {
        throw new Error("getVerificationState is not implemented.");
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

    private async _submitTurn(data: Uint8Array): Promise<TurnInfo> {
        return this.turnBasedGame.submitTurn({
            data,
            nextPlayer: await this.getCurrentPlayerId(),
            playerStake: await this.getPlayerBets(),
        });
    }

    private async _createHandshake(): Promise<TurnInfo> {
        console.log(`### [Player ${this.playerId}] Create Handshake ###`);
        let result = await this.engine.create_handshake();
        console.log(`### [Player ${this.playerId}] Submit turn ###`);
        return this._submitTurn(result.message_out);
    }

    private async _processHandshake(): Promise<void> {
        console.log(`### [Player ${this.playerId}] Process Handshake ###`);
        let p2: EngineResult;
        do {
            const turnInfo = await this.turnBasedGame.receiveTurnOver();
            const message_in = turnInfo.data;
            console.log(`### [Player ${this.playerId}] On turn received ###`);
            p2 = await this.engine.process_handshake(message_in);

            // after processing opponent's turnInfo message, checks if it is consistent
            await this._checkOpponentTurnInfo(turnInfo);

            if (p2.message_out.length > 0) {
                console.log(`### [Player ${this.playerId}] Submit turn ###`);
                await this._submitTurn(p2.message_out);
            }
        } while (p2.status == StatusCode.CONTINUED);

        return Promise.resolve();
    }

    private async _createBet(type: EngineBetType, amount: BigNumber = BigNumber.from(0)): Promise<EngineResult> {
        console.log(`### [Player ${this.playerId}] Created bet ###`);
        let bet = await this.engine.create_bet(type, amount);
        console.log(`### [Player ${this.playerId}] Submit turn ###`);
        await this._submitTurn(bet.message_out);

        console.log(`### [Player ${this.playerId}] Bet Resolved ###`);
        return bet;
    }

    private async _processBet(): Promise<Bet> {
        console.log(`### [Player ${this.playerId}] Process bet ###`);
        let receivedResult: EngineResult;
        let receivedBetType: BetType;
        do {
            const turnInfo = await this.turnBasedGame.receiveTurnOver();
            const message_in = turnInfo.data;
            console.log(`### [Player ${this.playerId}] On turn received ###`);

            receivedResult = await this.engine.process_bet(message_in);

            // after processing opponent's turnInfo message, checks if it is consistent
            await this._checkOpponentTurnInfo(turnInfo);

            // reaction to received result
            const betType = this._convertBetType(receivedResult.betType);
            if (betType && betType != BetType.NONE && betType != receivedBetType) {
                // it's a new bet: notify that it has just been received
                receivedBetType = betType;
                this.onBetsReceived(receivedBetType, receivedResult.amount);
            } else {
                // not a new bet: just notify that game state may have been updated
                this.onEvent(await this.getState(), EventType.UPDATE_STATE);
            }

            if (receivedResult.message_out.length > 0) {
                console.log(`### [Player ${this.playerId}] Submit turn ###`);
                await this._submitTurn(receivedResult.message_out);
            }
        } while (receivedResult.status == StatusCode.CONTINUED);

        return {
            type: receivedBetType,
            amount: receivedResult.amount,
        };
    }

    private async _checkOpponentTurnInfo(turnInfo: TurnInfo): Promise<void> {
        // checks if opponent turnInfo's declared nextPlayer is correct
        const expectedNextPlayer = await this.getCurrentPlayerId();
        if (turnInfo.nextPlayer != expectedNextPlayer) {
            // FIXME: not enforcing nextPlayer check for now, since "getCurrentPlayerId" refers to "the next player to bet", which is not
            // necessarily the same as "the next player that needs to submit information" (such as revealing cards).
            // To fix this we need the engine to expose this "next expected message author" information.
            console.error(
                `Inconsistent declared nextPlayer: expected '${expectedNextPlayer}' but opponent declared '${turnInfo.nextPlayer}'`
            );
            // return Promise.reject(
            //     `Inconsistent declared nextPlayer: expected '${expectedNextPlayer}' but opponent declared '${turnInfo.nextPlayer}'`
            // );
        }

        // checks if opponent turnInfo's declared playerStake is correct
        const expectedOpponentBets = await this.getOpponentBets();
        if (!turnInfo.playerStake.eq(expectedOpponentBets)) {
            return Promise.reject(
                `Inconsistent declared playerStake: expected ${expectedOpponentBets.toString()} but opponent declared ${turnInfo.playerStake.toString()}`
            );
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
            //TODO: trigger verification
            console.log(`### [Player ${this.playerId}] Challenge Game ###`);
            //this.turnBasedGame.challengeGame();
        } else {
            console.log(`### [Player ${this.playerId}] Confirm result ###`);
            await this.turnBasedGame.confirmResult();
        }
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
