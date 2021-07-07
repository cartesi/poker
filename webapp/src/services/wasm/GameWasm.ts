import { Card } from "../Card";
import { Engine, EngineResult, StatusCode } from "../Engine";
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
        throw new Error("Method not implemented.");
    }

    getOpponentCards(): Promise<Array<Card>> {
        throw new Error("Method not implemented.");
    }

    getCommunityCards(): Promise<Array<Card>> {
        throw new Error("Method not implemented.");
    }

    getPlayer(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    getPlayerFunds(): Promise<BigNumber> {
        throw new Error("Method not implemented.");
    }

    getOpponentFunds(): Promise<BigNumber> {
        throw new Error("Method not implemented.");
    }

    getPlayerBets(): Promise<BigNumber> {
        throw new Error("Method not implemented.");
    }

    getOpponentBets(): Promise<BigNumber> {
        throw new Error("Method not implemented.");
    }

    getState(): Promise<GameState> {
        throw new Error("Method not implemented.");
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
}
