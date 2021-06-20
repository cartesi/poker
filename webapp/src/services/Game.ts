import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { TransportFactory } from "./Transport";
import { GameMock } from "./mock/GameMock";
import { TransportMock } from "./mock/TransportMock";
// import { GameWasm } from "./web3/GameWasm";

// game states
export const GameState = {
    START: "START",
    PREFLOP: "PREFLOP",
    FLOP: "FLOP",
    TURN: "TURN",
    RIVER: "RIVER",
    SHOWDOWN: "SHOWDOWN",
    END: "END",
    VERIFICATION: "VERIFICATION",
};
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
export const VerificationState = {
    NONE: "NONE",
    STARTED: "STARTED",
    RESULT_SUBMITTED: "RESULT_SUBMITTED",
    RESULT_CONFIRMED: "RESULT_CONFIRMED",
    RESULT_CHALLENGED: "RESULT_CHALLENGED",
    ENDED: "ENDED",
    ERROR: "ERROR",
};
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
export const BetType = {
    CALL: "CALL",
    CHECK: "CHECK",
    RAISE: "RAISE",
    FOLD: "FOLD",
};

export interface Game {
    start(onComplete?: () => any);
    call(onComplete?: () => any);
    check(onComplete?: () => any);
    fold(onComplete?: () => any);
    raise(amount: integer, onComplete?: () => any);

    cheat: {
        switchCards: (card1: number, card2: number) => any;
        toggleCardCooperation: () => any;
    };

    getPlayerCards();
    getOpponentCards();
    getCommunityCards();
    getPlayer();
    getPlayerFunds();
    getOpponentFunds();
    getPlayerBets();
    getOpponentBets();
    getState();
    getVerificationState();
    getResult();
}

export class GameFactory {
    /**
     * Creates a new Texas Holdem game considering service configuration
     *
     * @param player
     * @param opponent
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
        player: integer,
        opponent: integer,
        playerFunds: integer,
        opponentFunds: integer,
        metadata: any,
        onBetRequested: () => any,
        onBetsReceived: (betType: string, amount: integer) => any,
        onEnd: () => any,
        onEvent: (msg: string) => any,
        onVerification: (state: string, msg: string) => any
    ): Game {
        // creates an appropriate Transport
        let transport = TransportFactory.create();

        // creates Game instance
        const game = this.createInstance(
            player,
            playerFunds,
            opponentFunds,
            metadata,
            transport,
            onBetRequested,
            onBetsReceived,
            onEnd,
            onEvent,
            onVerification
        );

        if (transport instanceof TransportMock) {
            // if using a mock Transport, we need an internal game instance for the opponent, with automatic responses
            // 1. creates the opponent's mock transport and connects it to the game's transport
            const transportOpponent = TransportFactory.create();
            transport.connect(transportOpponent as TransportMock);

            // 2. creates the opponent's game using the new transport and configuring automatic responses
            game.gameOpponent = this.createInstance(
                opponent,
                opponentFunds,
                playerFunds,
                metadata,
                transportOpponent,
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
     * @param metadata
     * @param transport
     * @param onBetRequested
     * @param onBetsReceived
     * @param onEnd
     * @param onEvent
     * @param onVerification
     * @returns
     */
    private static createInstance(
        player: integer,
        playerFunds: integer,
        opponentFunds: integer,
        metadata: any,
        transport: any,
        onBetRequested?: () => any,
        onBetsReceived?: (betType: string, amount: integer) => any,
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
                metadata,
                transport,
                onBetRequested,
                onBetsReceived,
                onEnd,
                onEvent,
                onVerification
            );
        } else if (impl === ServiceImpl.Wasm) {
            // real game engine in WebAssembly
            throw "WASM Game Engine not supported yet!";
            // return new GameWasm(
            //     player,
            //     playerFunds,
            //     opponentFunds,
            //     metadata,
            //     transport,
            //     onBetRequested,
            //     onBetsReceived,
            //     onEnd,
            //     onEvent,
            //     onVerification
            // );
        } else {
            // unknown implementation configured
            throw `Unknown game engine configuration '${impl}'!`;
        }
    }

    private static onOpponentAutomaticBet(game) {
        setTimeout(() => {
            if (!game.gameOpponent) {
                return;
            }
            let choices = [0, 1, 2, 3];
            while (true) {
                let i = Math.floor(Math.random() * choices.length);
                let choice = choices[i];
                try {
                    if (choice === 0) {
                        game.gameOpponent.call();
                    } else if (choice === 1) {
                        game.gameOpponent.check();
                    } else if (choice === 2) {
                        game.gameOpponent.fold();
                    } else if (choice === 3) {
                        let amount = Math.floor(Math.random() * 5);
                        game.gameOpponent.raise(amount);
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
