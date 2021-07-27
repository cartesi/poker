import { Hand, Card as PokerSolverCard } from "pokersolver";
import { Card } from "../Card";

export class PokerSolverJs {
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
        const handsPS = hands.map(PokerSolverJs.toPokerSolverCards);
        const handsSolved: Array<Hand> = handsPS.map(PokerSolverJs.solveHand);
        const winningHands: Array<Hand> = Hand.winners(handsSolved.filter(Boolean));
        const bestHands: Array<Array<PokerSolverCard>> = handsSolved.map((h) => (h ? h.cards : []));
        const bestHandsDescriptions: Array<string> = handsSolved.map((h) => (h ? h.descr : ""));

        const result = {
            bestHands: bestHands.map(this.fromPokerSolverCards),
            bestHandsDescriptions: bestHandsDescriptions,
            winners: handsSolved.map((h) => winningHands.includes(h)),
        };

        return result;
    }

    /**
     * Solves a single hand using the "pokersolver" javascript library.
     *
     * @param cards an array of string representations of cards, such as "As" for the ace of spades.
     * @returns a "pokersolver" solved Hand instance, or `undefined` if no cards were given as input.
     */
    public static solveHand(cards: Array<PokerSolverCard>): Hand {
        if (cards && cards.length) {
            return Hand.solve(cards);
        } else {
            return undefined;
        }
    }

    /**
     * Converts an array of Cards into an array of "pokersolver" Cards
     *
     * @param cards an array of Card instances.
     * @returns an array of corresponding "pokersolver" Card instances.
     */
    public static toPokerSolverCards(cards: Array<Card>): Array<PokerSolverCard> {
        return cards.filter(Boolean).map((c) => new PokerSolverCard(c.toString()));
    }

    /**
     * Converts an array of "pokersolver" Cards into an array of Card instances.
     *
     * @param cards an array of pokersolver Card objects.
     * @returns an array of corresponding Card instances.
     */
    public static fromPokerSolverCards(cards: Array<PokerSolverCard>): Array<Card> {
        return cards.filter(Boolean).map((c) => new Card((c.value == "1" ? "A" : c.value) + c.suit));
    }
}
