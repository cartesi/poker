import { Hand, Card } from "pokersolver";

export class PokerSolverJs {
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
        const handsStr = hands.map(PokerSolverJs.getCardsAsStrings);
        const handsSolved: Array<Hand> = handsStr.map(Hand.solve);
        const winningHands: Array<Hand> = Hand.winners(handsSolved);
        const bestHands: Array<Array<Card>> = handsSolved.map((h) => h.cards);
        const bestHandsDescriptions: Array<string> = handsSolved.map((h) => h.descr);

        const result = {
            bestHands: bestHands.map(PokerSolverJs.getCardsAsTuples),
            bestHandsDescriptions: bestHandsDescriptions,
            winners: handsSolved.map((h) => winningHands.includes(h)),
        };

        return result;
    }

    /**
     * Converts an array of cards as `<value, suit>` tuples into an array of cards using a string representation
     * suitable for use in the "pokersolver" javascript library.
     * @param cards an array of <value, suit>` tuples as numbers, such <0,3> for the ace of spades.
     * @returns an array of string representations of cards, such as "As" for the ace of spades.
     */
    public static getCardsAsStrings(cards: Array<{ value: number; suit: number }>): Array<string> {
        return cards.filter((c) => (c ? true : false)).map(PokerSolverJs.getCardAsString);
    }

    /**
     * Converts an array of cards as string representations into an array of cards as `<value, suit>` tuples.
     * @param cards an array of pokersolver Card objects.
     * @returns an array of <value, suit>` tuples as numbers, such <0,3> for the ace of spades.
     */
    public static getCardsAsTuples(cards: Array<Card>): Array<{ value: number; suit: number }> {
        return cards.filter((c) => (c ? true : false)).map(PokerSolverJs.getCardAsTuple);
    }

    /**
     * Converts a card `<value, suit>` tuple into a string representation suitable for use in the
     * `pokersolver` javascript library.
     * @param card a `<value, suit>` tuple as numbers, such <0,3> for the ace of spades.
     * @returns a string representation such as "As" for the ace of spades.
     */
    private static getCardAsString(card: { value: number; suit: number }) {
        if (!card) return;

        let str = "";

        switch (card.value) {
            case 0:
                str += "A";
                break;
            case 9:
                str += "T";
                break;
            case 10:
                str += "J";
                break;
            case 11:
                str += "Q";
                break;
            case 12:
                str += "K";
                break;
            default:
                str += card.value + 1;
                break;
        }

        switch (card.suit) {
            case 0:
                str += "c";
                break;
            case 1:
                str += "d";
                break;
            case 2:
                str += "h";
                break;
            case 3:
                str += "s";
                break;
            default:
                break;
        }

        return str;
    }

    /**
     * Converts a `pokersolver` Card into a `<value, suit>` tuple
     * @param card a `pokersolver` Card.
     * @returns a `<value, suit>` tuple as numbers, such <0,3> for the ace of spades.
     */
    public static getCardAsTuple(card: Card): { value: number; suit: number } {
        if (!card) return;

        const tuple = { value: 0, suit: 0 };

        switch (card.value) {
            case "A":
                tuple.value = 0;
                break;
            case "T":
                tuple.value = 9;
                break;
            case "J":
                tuple.value = 10;
                break;
            case "Q":
                tuple.value = 11;
                break;
            case "K":
                tuple.value = 12;
                break;
            default:
                if (!isNaN(card.value)) tuple.value = card.value - 1;
                break;
        }

        switch (card.suit) {
            case "c":
                tuple.suit = 0;
                break;
            case "d":
                tuple.suit = 1;
                break;
            case "h":
                tuple.suit = 2;
                break;
            case "s":
                tuple.suit = 3;
                break;
            default:
                break;
        }

        return tuple;
    }
}
