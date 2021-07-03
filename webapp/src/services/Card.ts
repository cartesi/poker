/**
 * Card class that knows how to translate between card indices and string representations
 * <p>
 * Card index: value between 0 and 51, with 0 being the 2 of clubs and 51 being the ace of spades.
 * Card string: represents a card with value and suit, such as "2c" for the 2 of clubs and "As" for the ace of spades.
 */
export class Card {
    static SUITS = ["h", "d", "c", "s"];
    static VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

    cardStr: string;
    cardIndex: number;

    /**
     * Constructor.
     *
     * @param str a card string representation, such as "2c" and "As".
     */
    constructor(str: string) {
        this.cardStr = str;
        this.cardIndex = Card.stringToIndex(str);
    }

    /**
     * Retrieves the card's index representation.
     *
     * @returns a number from 0 to 51, with 0 being the 2 of clubs and 51 being the ace of spades.
     */
    public toIndex(): number {
        return this.cardIndex;
    }

    /**
     * Retrieves the card's string representation.
     *
     * @returns a string containing a character for value and another for suit, such as "2c" for the 2 of clubs
     * and "As" for the ace of spades.
     */
    public toString() {
        return this.cardStr;
    }

    /**
     * Creates a Card from a card index.
     *
     * @param cardIndex a number from 0 to 51, with 0 being the 2 of clubs and 51 being the ace of spades.
     * @returns the corresponding Card instance.
     */
    public static fromIndex(cardIndex: number): Card {
        const cardStr = Card.indexToString(cardIndex);
        if (!cardStr) {
            return null;
        } else {
            return new Card(cardStr);
        }
    }

    /**
     * Creates a Card from a card string representation.
     *
     * @param cardStr a card string representation, such as "2c" and "As".
     * @returns the corresponding Card instance.
     */
    public static fromString(cardStr: string): Card {
        return new Card(cardStr);
    }

    /**
     * Converts the provided card index to a card string representation.
     *
     * @param cardIndex a number from 0 to 51, with 0 being the 2 of clubs and 51 being the ace of spades.
     * @returns the corresponding card string representation, such as "2c" and "As"; or null if card index is invalid.
     */
    public static indexToString(cardIndex: number): string {
        if (cardIndex < 0 || cardIndex > 51 || isNaN(cardIndex)) {
            return null;
        }

        const value = cardIndex % 13;
        const suit = Math.floor(cardIndex / 13);

        let str = Card.VALUES[value] + Card.SUITS[suit];
        return str;
    }

    /**
     * Converts the provided card string representation into a card index
     *
     * @param cardStr a card string representation, such as "2c" and "As".
     * @returns a number from 0 to 51, with 0 being the 2 of clubs and 51 being the ace of spades; or 99 if card string is invalid.
     */
    public static stringToIndex(cardStr: string): number {
        if (!cardStr || cardStr.length != 2) {
            return 99;
        }

        let value = Card.VALUES.indexOf(cardStr[0]);
        let suit = Card.SUITS.indexOf(cardStr[1]);

        if (value == -1 || suit == -1) {
            return 99;
        }

        const cardIndex = suit * 13 + value;
        return cardIndex;
    }
}
