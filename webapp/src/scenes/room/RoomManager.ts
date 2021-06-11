import { AudioManager } from "../../AudioManager";
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

    public static startRound(): void {

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
                console.log(msg);

                console.log(msg.message);

                if (msg.includes("verificationReceived") || msg.includes("triggerVerification")) {
                    RoomManager.showVerificationLayer(msg);
                }
            },
            (msg) => {
                RoomManager.updateVerification(msg);
            }
        );

        const bob = new Game(
            BOB, alice_funds, bob_funds, metadata, bob_tx,
            () => {
                RoomManager.onAutomaticBet(BOB);
            },
            () => {
                // 
            },
            (msg) => {
                // console.log(msg);
            }
        );

        alice_tx.connect(bob_tx);

        RoomManager.games = [];
        RoomManager.games.push(alice);
        RoomManager.games.push(bob);

        // simulate initial delay
        RoomScene.currentInstance.showWaitingFirstCards();

        setTimeout(() => {

            alice.start();
            bob.start();

            RoomScene.currentInstance.hideWaitingFirstCards();

            setTimeout(() => {
                RoomScene.currentInstance.distributeFirstCards();
                RoomScene.currentInstance.updateBoard();
            }, 1000);

        }, 10000);
    }

    public static getPlayerFunds(): number {

        return RoomManager.games[ALICE].getPlayerFunds();
    }

    public static showVerificationLayer(msg: string): void {

        RoomScene.currentInstance.showVerificationLayer(msg);
    }

    public static updateVerification(value: number): void {

        RoomScene.currentInstance.updateVerificationLayer(value);
    }

    public static getOpponentFunds(): number {

        return RoomManager.games[ALICE].getOpponentFunds();
    }

    public static getPlayerCards(): {value: number, suit: number}[] {

        let cards: string[] = RoomManager.games[ALICE].getPlayerCards();

        return cards.map(RoomManager.getCardSuitValue);
    }

    public static switchPlayerCards(card1: number, card2: number): void {

        RoomManager.games[ALICE].cheat.switchCards(card1, card2);

        RoomScene.currentInstance.updateBoard();
    }

    public static toogleCardCooperation(): void {

        RoomManager.games[ALICE].cheat.toggleCardCooperation();
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

        return Math.min(RoomManager.getPlayerFunds(), RoomManager.getOpponentFunds()) - RoomManager.getOpponentBets();
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

        AudioManager.playSound("btn_click");
    } 

    public static getCardSuitValue(card: string): {value: number, suit: number} {

        if (card === "?") {
            return null;
        }

        return {value: parseInt(card) % 13, suit: Math.floor(parseInt(card) / 13)};
    }

    public static onClickNext(): void {

        RoomScene.currentInstance.resetTable();

        setTimeout(() => {
            RoomManager.startRound();
        }, 500);
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
}
