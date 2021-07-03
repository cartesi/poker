import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { PokerSolverJs } from "./mock/PokerSolverJs";
import { Card } from "./Card";
// import { PokerSolverWasm } from "./wasm/PokerSolverWasm";

export class PokerSolver {
    /**
     * Returns information about the best Poker hand available for each player, as well as the final winner(s).
     *
     * @param hands an array of player hands, where each hand corresponds to an array of card indices.
     * @returns an object `{ bestHands, bestHandsDescriptions, winners }` representing the best hands available
     * for each player, their corresponding descriptions, and whether each player has a winning hand.
     */
    public static solve(
        hands: Array<Array<Card>>
    ): {
        bestHands: Array<Array<Card>>;
        bestHandsDescriptions: Array<string>;
        winners: Array<boolean>;
    } {
        const impl = ServiceConfig.get(ServiceType.Engine);
        if (impl === ServiceImpl.Mock) {
            // mock solver
            return PokerSolverJs.solve(hands);
        } else if (impl == ServiceImpl.Wasm) {
            // wasm solver
            // FIXME: use WASM version when it's ready
            return PokerSolverJs.solve(hands);
            // return PokerSolverWasm.solve(cards);
        } else {
            // unknown implementation configured
            throw `Unknown engine configuration '${impl}'!`;
        }
    }
}
