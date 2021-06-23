import { Card } from "../Card";
import { Engine } from "../Engine";
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
        throw new Error("Method not implemented.");
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
}
