import { RoomScene } from "./RoomScene";

export class RoomManager {

    public static games: any[];

    public static init(): void {

        // 
    }

    public static startRound(): void {

        const alice_tx = new Transport();
        const bob_tx = new Transport();  
        const alice_funds = 100;
        const bob_funds = 100;
        const metadata = "";  

        const alice = new Game(
            ALICE, alice_funds, bob_funds, metadata, alice_tx,
            () => {
                RoomManager.onBetRequested();
            },
            () => RoomManager.onEnd,
            (msg) => {
                console.log(msg);
            }
        );

        const bob = new Game(
            BOB, alice_funds, bob_funds, metadata, bob_tx,
            () => {
                RoomManager.onAutomaticBet(BOB);
            }
        );

        alice_tx.connect(bob_tx);

        RoomManager.games = [];
        RoomManager.games.push(alice);
        RoomManager.games.push(bob);

        alice.start();
        bob.start();

        RoomScene.currentInstance.startRound();
    }

    public static getPlayerFunds(): number {

        return RoomManager.games[ALICE].getPlayerFunds();
    }

    public static getOpponentFunds(): number {

        return RoomManager.games[ALICE].getOpponentFunds();
    }

    public static getPlayerCards(): {value: number, suit: number}[] {

        let cards: string[] = RoomManager.games[ALICE].getPlayerCards();

        return cards.map(RoomManager.getCardSuitValue);
    }

    public static getOpponentCards(): {value: number, suit: number}[] {

        let cards: string[] = RoomManager.games[ALICE].getOpponentCards();

        return cards.map(RoomManager.getCardSuitValue);
    }

    public static getCommunityCards(): {value: number, suit: number}[] {

        let cards: string[] = RoomManager.games[ALICE].getCommunityCards();

        return cards.map(RoomManager.getCardSuitValue);
    }

    public static getState(): number {

        return RoomManager.games[ALICE].getState();
    }

    private static onBetRequested(): void {
        
        console.log("BET REQUESTED");
    }

    private static onEnd(): void {
        
        // 
    }

    private static onAutomaticBet(player): void {

        setTimeout(() => {
            if (RoomManager.games[player]) {
                let choices = [0, 1, 2, 3];
                while (true) {
                    let i = Math.floor(Math.random() * choices.length);
                    let choice = choices[i];
                    try {
                        if (choice === 0) {
                            RoomManager.games[player].call();
                        } else if (choice === 1) {
                            RoomManager.games[player].check();
                        } else if (choice === 2) {
                            RoomManager.games[player].fold();
                        } else if (choice === 3) {
                            let amount = Math.floor(Math.random() * 5);
                            RoomManager.games[player].raise(amount);
                        }
                        break;
                    } catch (e) {
                        // bet choice not allowed, remove that possibility and try again
                        choices.splice(i, 1);
                    }
                }
            }
        }, 1000);
    }

    private static getCardSuitValue(card: string): {value: number, suit: number} {

        if (card === "?") {
            return null;
        }

        return {value: parseInt(card) % 13, suit: Math.floor(parseInt(card) / 13)};
    }
}
