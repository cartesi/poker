import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { PokerSolverJs } from "./mock/PokerSolverJs";
// import { PokerSolverWasm } from "./wasm/PokerSolverWasm";

export class PokerSolver {
    /**
     * Returns information about the best Poker hand available for each player, as well as the final winner(s).
     *
     * @param hands an array of player hands, where each hand corresponds to an array of cards represented
     * by a tuple `<value, suit>`.
     * @returns an object `{ bestHands, bestHandsDescriptions, winners }` representing the best hands available
     * for each player, their corresponding descriptions, and whether each player has a winning hand.
     */
    public static solve(
        hands: Array<Array<{ value: number; suit: number }>>
    ): {
        bestHands: Array<Array<{ value: number; suit: number }>>;
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

    /**
     * Returns a card representation as a tuple <value, suit>
     * @param card an index from 0 to 51, or `?` for an unknown card
     * @returns a `<value, suit>` tuple as numbers, such <0,3> for the ace of spades.
     */
    public static getCardSuitValue(card: string): {value: number, suit: number} {

        if (card === "?") {
            return null;
        }

        return {value: parseInt(card) % 13, suit: Math.floor(parseInt(card) / 13)};
    }
}
