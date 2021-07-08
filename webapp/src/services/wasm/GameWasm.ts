import { Card } from "../Card";
import { Engine, EnginePlayer, EngineResult, StatusCode } from "../Engine";
import { BetType, Game, GameState, VerificationState } from "../Game";
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
        private onEvent: (msg: string) => any = () => {},
        private onVerification: (state: string, msg: string) => any = () => {}
    ) {
        this.engine = new PokerEngine(playerId);
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
                if (this._isDealer()) this.onBetRequested();
            } catch (error) {
                reject(new Error(`Failed to start game. ${error}`));
            }
        });
    }

    call(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    check(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    fold(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    raise(amount: BigNumber): Promise<void> {
        throw new Error("Method not implemented.");
    }

    cheat: {
        switchCards: (card1: Card, card2: Card) => any;
        toggleCardCooperation: () => any;
    };

    getPlayerCards(): Promise<Array<Card>> {
        return new Promise(async (resolve) => {
            let player = await this._getPlayer(this.playerId);
            let cards = player.cards.map(Card.fromIndex);
            resolve(cards);
        });
    }

    getOpponentCards(): Promise<Array<Card>> {
        return new Promise(async (resolve) => {
            let opponent = await this._getPlayer(this.opponentId);
            let cards = opponent.cards.map(Card.fromIndex);
            resolve(cards);
        });
    }

    getCommunityCards(): Promise<Array<Card>> {
        return new Promise(async (resolve) => {
            let gameState = await this.engine.game_state();
            let cards = gameState.public_cards.map(Card.fromIndex);
            resolve(cards);
        });
    }

    getCurrentPlayerId(): Promise<number> {
        return new Promise(async (resolve) => {
            let gameState = await this.engine.game_state();
            resolve(gameState.current_player);
        });
    }

    getPlayerFunds(): Promise<BigNumber> {
        return new Promise(async (resolve) => {
            let player = await this._getPlayer(this.playerId);
            resolve(player.total_funds);
        });
    }

    getOpponentFunds(): Promise<BigNumber> {
        return new Promise(async (resolve) => {
            let opponent = await this._getPlayer(this.opponentId);
            resolve(opponent.total_funds);
        });
    }

    getPlayerBets(): Promise<BigNumber> {
        return new Promise(async (resolve) => {
            let player = await this._getPlayer(this.playerId);
            resolve(player.bets);
        });
    }

    getOpponentBets(): Promise<BigNumber> {
        return new Promise(async (resolve) => {
            let opponent = await this._getPlayer(this.opponentId);
            resolve(opponent.bets);
        });
    }

    getState(): Promise<GameState> {
        return new Promise(async (resolve, reject) => {
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
        });
    }

    getVerificationState(): Promise<VerificationState> {
        throw new Error("Method not implemented.");
    }

    getResult(): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async _createHandshake(): Promise<string> {
        console.log(`### [Player ${this.playerId}] Create Handshake ###`);
        let result = await this.engine.create_handshake();
        console.log(`### [Player ${this.playerId}] Submit turn ###`);
        return this.turnBasedGame.submitTurn(result.message_out);
    }

    async _processHandshake(): Promise<void> {
        console.log(`### [Player ${this.playerId}] Process Handshake ###`);
        let p2: EngineResult;
        do {
            let message_in = await this.turnBasedGame.receiveTurnOver();
            console.log(`### [Player ${this.playerId}] On turn received ###`);
            p2 = await this.engine.process_handshake(message_in);

            if (p2.message_out.length > 0) {
                console.log(`### [Player ${this.playerId}] Submit turn ###`);
                this.turnBasedGame.submitTurn(p2.message_out);
            }
        } while (p2.status == StatusCode.CONTINUED);

        return Promise.resolve();
    }

    // TODO: Maybe ask Engine who is Dealer/Small Blind/Big Blind?
    _isDealer(): Boolean {
        return this.playerId == 0;
    }

    async _getPlayer(playerId: number): Promise<EnginePlayer> {
        let state = await this.engine.game_state();
        return state.players[playerId];
    }
}
