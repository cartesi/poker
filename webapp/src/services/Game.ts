import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { TurnBasedGame, TurnBasedGameFactory } from "./TurnBasedGame";
import { GameMock } from "./mock/GameMock";
import { TurnBasedGameMock } from "./mock/TurnBasedGameMock";
import { Card } from "./Card";
import { GameWasm } from "./wasm/GameWasm";
import { GameConstants } from "../GameConstants";
import { BigNumber } from "ethers";

// game states
export enum GameState {
    START = "START",
    PREFLOP = "PREFLOP",
    FLOP = "FLOP",
    TURN = "TURN",
    RIVER = "RIVER",
    SHOWDOWN = "SHOWDOWN",
    END = "END",
    VERIFICATION = "VERIFICATION",
}
export const GameStates = [
    GameState.START,
    GameState.PREFLOP,
    GameState.FLOP,
    GameState.TURN,
    GameState.RIVER,
    GameState.SHOWDOWN,
    GameState.END,
    GameState.VERIFICATION,
];

// verification states
export enum VerificationState {
    NONE = "NONE",
    STARTED = "STARTED",
    RESULT_SUBMITTED = "RESULT SUBMITTED",
    RESULT_CONFIRMED = "RESULT CONFIRMED",
    RESULT_CHALLENGED = "RESULT CHALLENGED",
    ENDED = "ENDED",
    ERROR = "ERROR",
}
export const VerificationStates = [
    VerificationState.NONE,
    VerificationState.STARTED,
    VerificationState.RESULT_SUBMITTED,
    VerificationState.RESULT_CONFIRMED,
    VerificationState.RESULT_CHALLENGED,
    VerificationState.ENDED,
    VerificationState.ERROR,
];

// bet types
export enum BetType {
    CALL = "CALL",
    CHECK = "CHECK",
    RAISE = "RAISE",
    FOLD = "FOLD",
}

export interface Game {
    start(): Promise<void>;
    call(): Promise<void>;
    check(): Promise<void>;
    fold(): Promise<void>;
    raise(amount: BigNumber): Promise<void>;

    cheat: {
        switchCards: (card1: Card, card2: Card) => any;
        toggleCardCooperation: () => any;
    };

    getPlayerCards(): Promise<Array<Card>>;
    getOpponentCards(): Promise<Array<Card>>;
    getCommunityCards(): Promise<Array<Card>>;
    getCurrentPlayerId(): Promise<number>;
    getPlayerFunds(): Promise<BigNumber>;
    getOpponentFunds(): Promise<BigNumber>;
    getPlayerBets(): Promise<BigNumber>;
    getOpponentBets(): Promise<BigNumber>;
    getState(): Promise<GameState>;
    getVerificationState(): Promise<VerificationState>;
    getResult(): Promise<any>;
}

export class GameFactory {
    /**
     * Creates a new Texas Holdem game considering service configuration
     *
     * @param gameIndex
     * @param playerIndex
     * @param opponentIndex
     * @param playerFunds
     * @param opponentFunds
     * @param metadata
     * @param onBetRequested
     * @param onBetsReceived
     * @param onEnd
     * @param onEvent
     * @param onVerification
     * @returns
     */
    public static create(
        gameIndex: number,
        playerIndex: number,
        opponentIndex: number,
        playerFunds: BigNumber,
        opponentFunds: BigNumber,
        metadata: any,
        onBetRequested: () => any,
        onBetsReceived: (betType: BetType, amount: BigNumber) => any,
        onEnd: () => any,
        onEvent: (msg: string) => any,
        onVerification: (state: VerificationState, msg: string) => any
    ): Game {
        // creates an appropriate TurnBasedGame
        let turnBasedGame = TurnBasedGameFactory.create(gameIndex);

        // creates Game instance
        const game = this.createInstance(
            playerIndex,
            playerFunds,
            opponentIndex,
            opponentFunds,
            turnBasedGame,
            onBetRequested,
            onBetsReceived,
            onEnd,
            onEvent,
            onVerification
        );

        if (turnBasedGame instanceof TurnBasedGameMock) {
            // if using a mock Transport, we need an internal game instance for the opponent, with automatic responses
            // 1. creates the opponent's TurnBasedGameMock and connects it to the game's instance
            const turnBasedGameOpponent = TurnBasedGameFactory.create(gameIndex);
            turnBasedGame.connect(turnBasedGameOpponent as TurnBasedGameMock);

            // 2. creates the opponent's game using his own TurnBasedGameMock and configuring automatic responses
            game.gameOpponent = this.createInstance(
                opponentIndex,
                opponentFunds,
                playerIndex,
                playerFunds,
                turnBasedGameOpponent,
                () => this.onOpponentAutomaticBet(game)
            );
        }

        return game;
    }

    /**
     * Internal method to create a single Game instance, receiving a Transport as argument
     *
     * @param player
     * @param playerFunds
     * @param opponentFunds
     * @param turnBasedGame
     * @param onBetRequested
     * @param onBetsReceived
     * @param onEnd
     * @param onEvent
     * @param onVerification
     * @returns
     */
    private static createInstance(
        player: number,
        playerFunds: BigNumber,
        opponent: number,
        opponentFunds: BigNumber,
        turnBasedGame: TurnBasedGame,
        onBetRequested?: () => any,
        onBetsReceived?: (betType: string, amount: BigNumber) => any,
        onEnd?: () => any,
        onEvent?: (msg: string) => any,
        onVerification?: (state: string, msg: string) => any
    ) {
        const impl = ServiceConfig.get(ServiceType.Engine);
        if (impl === ServiceImpl.Mock) {
            // mock game engine
            return new GameMock(
                player,
                playerFunds,
                opponentFunds,
                turnBasedGame,
                onBetRequested,
                onBetsReceived,
                onEnd,
                onEvent,
                onVerification
            );
        } else if (impl === ServiceImpl.Wasm) {
            // real game engine in WebAssembly
            return new GameWasm(
                player,
                playerFunds,
                opponent,
                opponentFunds,
                GameConstants.BIG_BLIND,
                turnBasedGame,
                onBetRequested,
                onBetsReceived,
                onEnd,
                onEvent,
                onVerification
            );
        } else {
            // unknown implementation configured
            throw `Unknown game engine configuration '${impl}'!`;
        }
    }

    private static onOpponentAutomaticBet(game) {
        setTimeout(async () => {
            if (!game.gameOpponent) {
                return;
            }
            let choices = [0, 1, 2, 3];
            while (true) {
                let i = Math.floor(Math.random() * choices.length);
                let choice = choices[i];
                try {
                    if (choice === 0) {
                        await game.gameOpponent.call();
                    } else if (choice === 1) {
                        await game.gameOpponent.check();
                    } else if (choice === 2) {
                        await game.gameOpponent.fold();
                    } else if (choice === 3) {
                        let amount = Math.floor(Math.random() * 5);
                        await game.gameOpponent.raise(BigNumber.from(amount));
                    }
                    break;
                } catch (e) {
                    // bet choice not allowed, remove that possibility and try again
                    choices.splice(i, 1);
                }
            }
        }, 6000);
    }
}
