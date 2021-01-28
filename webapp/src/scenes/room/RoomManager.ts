import { GameConstants } from "./../../GameConstants";
import { GameVars } from "./../../GameVars";
import { RoomScene } from "./RoomScene";

export class RoomManager {

    public static games: any[];

    public static init(): void {

        GameVars.playerFunds = 100;
        GameVars.opponentFunds = 100;
        GameVars.raiseValue = 1;
    }

    public static startRound(reset?: boolean): void {

        if (reset) {
            GameVars.playerFunds = 100;
            GameVars.opponentFunds = 100;
            GameVars.raiseValue = 1;
        }

        if (GameVars.playerFunds < 2) {
            console.log("GAME OVER, OPPONENT WON");  
            return;
        } else if (GameVars.opponentFunds < 2) {
            console.log("GAME OVER, PLAYER WON");  
            return;
        }

        const alice_tx = new Transport();
        const bob_tx = new Transport();  
        const alice_funds = GameVars.playerFunds;
        const bob_funds = GameVars.opponentFunds;
        const metadata = "";  

        const alice = new Game(
            ALICE, alice_funds, bob_funds, metadata, alice_tx,
            () => {
                RoomManager.onBetRequested();
            },
            () => {
                RoomManager.onEnd();
            },
            (msg) => {
                // console.log(msg);
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

        RoomScene.currentInstance.distributeFirstCards();
        RoomScene.currentInstance.updateBoard();
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

    public static getMaxRaise(): number {

        return RoomManager.getPlayerFunds() - RoomManager.getOpponentBets();
    }

    public static getState(): number {

        return RoomManager.games[ALICE].getState();
    }

    public static getPlayerBets(): number {

        return  RoomManager.games[ALICE].getPlayerBets();
    }

    public static getOpponentBets(): number {

        return  RoomManager.games[ALICE].getOpponentBets();
    }

    public static playerCall(): void {

        RoomManager.games[ALICE].call();

        RoomManager.showBet(GameConstants.ACTION_CALL, ALICE);

        RoomManager.updateBoard();
        RoomManager.removeBetButtons();
    }

    public static playerCheck(): void {

        RoomManager.games[ALICE].check();

        RoomManager.showBet(GameConstants.ACTION_CHECK, ALICE);

        RoomManager.updateBoard();
        RoomManager.removeBetButtons();
    }

    public static playerFold(): void {

        RoomManager.games[ALICE].fold();

        RoomManager.showBet(GameConstants.ACTION_FOLD, ALICE);

        RoomManager.updateBoard();
        RoomManager.removeBetButtons();
    }

    public static playerRaise(value): void {

        RoomManager.games[ALICE].raise(value);

        RoomManager.showBet(GameConstants.ACTION_RAISE, ALICE);

        RoomManager.updateBoard();
        RoomManager.removeBetButtons();
    }

    public static updateBoard(): void {

        setTimeout(() => {
            RoomScene.currentInstance.updateBoard();
        }, 1000);
    }

    public static removeBetButtons(): void {

        RoomScene.currentInstance.removeBetButtons();
    }

    public static showBetButtons(): void {

        RoomScene.currentInstance.showBetButtons();
    }

    public static showBet(value: string, player: number): void {

        RoomScene.currentInstance.showBet(value, player);
    }

    public static showSettingsMenu(): void {

        RoomScene.currentInstance.showSettingsMenu();
    } 

    private static onBetRequested(): void {
        
        RoomManager.showBetButtons();
    }

    private static onEnd(): void {

        let endData = RoomManager.games[ALICE].getResult();

        setTimeout(() => {
            RoomScene.currentInstance.onEnd(endData);

            GameVars.playerFunds = endData.fundsShare[ALICE];
            GameVars.opponentFunds = endData.fundsShare[BOB];
        }, 2000);
        
        setTimeout(() => {
            RoomManager.startRound();
        }, 8000);
    }

    private static onAutomaticBet(player): void {

        setTimeout(() => {
            RoomScene.currentInstance.startOpponentTurn();
        }, 2000);

        setTimeout(() => {
            if (RoomManager.games[player]) {
                let choices = [0, 1, 2, 3];
                while (true) {
                    let i = Math.floor(Math.random() * choices.length);
                    let choice = choices[i];
                    try {
                        if (choice === 0) {
                            RoomManager.games[player].call();
                            RoomManager.showBet(GameConstants.ACTION_CALL, player);
                        } else if (choice === 1) {
                            RoomManager.games[player].check();
                            RoomManager.showBet(GameConstants.ACTION_CHECK, player);
                        } else if (choice === 2) {
                            RoomManager.games[player].fold();
                            RoomManager.showBet(GameConstants.ACTION_FOLD, player);
                        } else if (choice === 3) {
                            let amount = Math.floor(Math.random() * 5);
                            RoomManager.games[player].raise(amount);
                            RoomManager.showBet(GameConstants.ACTION_RAISE, player);
                        }
                        RoomScene.currentInstance.endOpponentTurn();
                        break;
                    } catch (e) {
                        // bet choice not allowed, remove that possibility and try again
                        choices.splice(i, 1);
                    }
                }
            }

            RoomManager.updateBoard();
        }, 6000);
    }

    private static getCardSuitValue(card: string): {value: number, suit: number} {

        if (card === "?") {
            return null;
        }

        return {value: parseInt(card) % 13, suit: Math.floor(parseInt(card) / 13)};
    }
}
