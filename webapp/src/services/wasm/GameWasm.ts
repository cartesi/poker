import { Card } from "../Card";
import { Engine, EngineBetType, EnginePlayer, EngineResult, EngineState, EngineStep, StatusCode } from "../Engine";
import { BetType, EventType, Game, GameResult, GameState, VerificationState } from "../Game";
import { PokerSolver } from "../PokerSolver";
import { TurnBasedGame } from "../TurnBasedGame";
import { PokerEngine } from "./PokerEngine";
import { BigNumber } from "ethers";

export class GameWasm implements Game {
    // FIXME: if using a mock TurnBasedGame, stores a reference to the opponent's Game instance (with automatic responses)
    gameOpponent: Game;
    private engine: Engine;

    constructor(
        private playerId: number,
        private playerFunds: BigNumber,
        private opponentId: number,
        private opponentFunds: BigNumber,
        private bigBlind: BigNumber,
        private turnBasedGame: TurnBasedGame,
        private onBetRequested: () => any = () => {},
        private onBetsReceived: (betType: string, amount: BigNumber) => any = () => {},
        private onEnd: () => any = () => {},
        private onEvent: (msg: string, type: EventType) => any = () => {},
        private onVerification: (state: string, msg: string) => any = () => {}
    ) {
        this.engine = new PokerEngine(playerId);

        this.turnBasedGame.receiveResultClaimed().then(this._onResultClaimed.bind(this));
        this.turnBasedGame.receiveGameOver().then((fundsShare) => {
            console.log(`### [Player ${this.playerId}] Received Game Over ###`);
            this.onEnd();
        });
    }

    start(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                // FIXME: figure out how to use GameWasm with TurnBasedGameMock properly
                if (this.gameOpponent) this.gameOpponent.start();

                console.log(`### [Player ${this.playerId}] Init engine ###`);
                await this.engine.init(this.playerFunds, this.opponentFunds, this.bigBlind);
                console.log(`### [Player ${this.playerId}] Engine started ###`);

                if (this._isDealer()) await this._createHandshake();
                await this._processHandshake();

                resolve();
                this._onBet();
            } catch (err) {
                reject(err);
            }
        });
    }

    call(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            console.log(`### [Player ${this.playerId}] CALL ###`);
            try {
                await this._createBet(EngineBetType.BET_CALL);
                resolve();
                this._onBet();
            } catch (err) {
                reject(err);
            }
        });
    }

    check(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            console.log(`### [Player ${this.playerId}] CHECK ###`);
            try {
                await this._createBet(EngineBetType.BET_CHECK);
                resolve();
                this._onBet();
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
                await this._createBet(EngineBetType.BET_RAISE, amount);
                resolve();
                this._onBet();
            } catch (err) {
                reject(err);
            }
        });
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
                } else if (state.step < 12) {
                    resolve(GameState.FLOP);
                } else if (state.step < 14) {
                    resolve(GameState.TURN);
                } else if (state.step < 16) {
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
                } else {
                    reject(new Error("Game is not over yet"));
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    private _computeResult(state: EngineState): GameResult {
        let publicCards = state.public_cards.map(Card.fromIndex);
        let playerCards = state.players[this.playerId].cards.map(Card.fromIndex).concat(publicCards);
        let opponentCards = state.players[this.opponentId].cards.map(Card.fromIndex).concat(publicCards);

        const winners = [this.playerId == state.winner, this.opponentId == state.winner];
        const hands = PokerSolver.solve([playerCards, opponentCards]).bestHands;

        return {
            isWinner: winners,
            fundsShare: state.funds_share,
            hands: hands,
        };
    }

    private async _createHandshake(): Promise<string> {
        console.log(`### [Player ${this.playerId}] Create Handshake ###`);
        let result = await this.engine.create_handshake();
        console.log(`### [Player ${this.playerId}] Submit turn ###`);
        return this.turnBasedGame.submitTurn(result.message_out);
    }

    private async _processHandshake(): Promise<void> {
        console.log(`### [Player ${this.playerId}] Process Handshake ###`);
        let p2: EngineResult;
        do {
            let message_in = await this.turnBasedGame.receiveTurnOver();
            console.log(`### [Player ${this.playerId}] On turn received ###`);
            p2 = await this.engine.process_handshake(message_in);

            if (p2.message_out.length > 0) {
                console.log(`### [Player ${this.playerId}] Submit turn ###`);
                await this.turnBasedGame.submitTurn(p2.message_out);
            }
        } while (p2.status == StatusCode.CONTINUED);

        return Promise.resolve();
    }

    private async _createBet(type: EngineBetType, amount: BigNumber = BigNumber.from(0)): Promise<any> {
        console.log(`### [Player ${this.playerId}] Created bet ###`);
        let bet = await this.engine.create_bet(type, amount);
        console.log(`### [Player ${this.playerId}] Submit turn ###`);
        await this.turnBasedGame.submitTurn(bet.message_out);

        if (bet.status == StatusCode.CONTINUED) {
            await this._processBet();
        }

        console.log(`### [Player ${this.playerId}] Bet Resolved ###`);
        Promise.resolve();
    }

    private async _processBet(): Promise<Bet> {
        console.log(`### [Player ${this.playerId}] Process bet ###`);
        let receivedBet: EngineResult;
        do {
            let message_in = await this.turnBasedGame.receiveTurnOver();
            console.log(`### [Player ${this.playerId}] On turn received ###`);
            receivedBet = await this.engine.process_bet(message_in);

            if (receivedBet.message_out.length > 0) {
                console.log(`### [Player ${this.playerId}] Submit turn ###`);
                await this.turnBasedGame.submitTurn(receivedBet.message_out);
            }
        } while (receivedBet.status == StatusCode.CONTINUED);

        return Promise.resolve({
            type: receivedBet.betType,
            amount: receivedBet.amount,
        });
    }

    private async _onBet() {
        let state = await this.engine.game_state();

        if (state.step != EngineStep.GAME_OVER) {
            if (state.current_player == this.playerId) this.onBetRequested();
            else this._waitOpponentBet();
        } else if (this._isDealer()) {
            let fundsShare = state.funds_share;
            console.log(`### [Player ${this.playerId}] Claim Result ###`);
            await this.turnBasedGame.claimResult(fundsShare);
        }
    }

    private _waitOpponentBet() {
        this._processBet().then(async (bet) => {
            let type = this._convertBetType(bet.type);
            this.onBetsReceived(type, bet.amount);

            let state = await this.engine.game_state();
            if (state.step == EngineStep.GAME_OVER) {
                if (type == BetType.FOLD || this._isDealer()) {
                    let fundsShare = state.funds_share;
                    console.log(`### [Player ${this.playerId}] Claim Result ###`);
                    await this.turnBasedGame.claimResult(fundsShare);
                }
            } else if (state.current_player == this.playerId) {
                this.onBetRequested();
            } else {
                this._waitOpponentBet();
            }
        });
    }

    private _convertBetType(engineType: EngineBetType): BetType {
        switch (engineType) {
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
    type: EngineBetType;
    amount: BigNumber;
}
