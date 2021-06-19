import { AudioManager } from "../../AudioManager";
import { Game, GameFactory } from "../../services/Game";
import { GameConstants } from "./../../GameConstants";
import { GameVars } from "./../../GameVars";
import { RoomScene } from "./RoomScene";

export class RoomManager {

    public static game: Game;

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

        const metadata = "";  
        RoomManager.game = GameFactory.create(
            GameVars.playerIndex,
            GameVars.opponentIndex,
            GameVars.playerFunds,
            GameVars.opponentFunds,
            metadata,
            () => {
                // onBetRequested
                RoomManager.onBetRequested();
            },
            (betType, amount) => {
                // onBetsReceived
                RoomManager.onBetsReceived(betType, amount);
            },
            () => {
                // onEnd
                RoomManager.onEnd();
            },
            (msg) => {
                // onEvent: general event logging
                console.log(msg);
            },
            (state, msg) => {
                // onVerification
                if (state == 1) {
                    RoomManager.showVerificationLayer(msg);
                }
                RoomManager.updateVerification(state);
            }
        );

        // show waiting UI while game is starting
        RoomScene.currentInstance.showWaitingFirstCards();

        this.game.start(() => {
            RoomScene.currentInstance.hideWaitingFirstCards();

            setTimeout(() => {
                RoomScene.currentInstance.distributeFirstCards();
                RoomScene.currentInstance.updateBoard();
            }, 1000);
        });

    }

    public static getPlayerFunds(): number {

        return RoomManager.game.getPlayerFunds();
    }

    public static showVerificationLayer(msg: string): void {

        RoomScene.currentInstance.showVerificationLayer(msg);
    }

    public static updateVerification(value: number): void {

        RoomScene.currentInstance.updateVerificationLayer(value);
    }

    public static getOpponentFunds(): number {

        return RoomManager.game.getOpponentFunds();
    }

    public static getPlayerCards(): {value: number, suit: number}[] {

        let cards: string[] = RoomManager.game.getPlayerCards();

        return cards.map(RoomManager.getCardSuitValue);
    }

    public static switchPlayerCards(card1: number, card2: number): void {

        RoomManager.game.cheat.switchCards(card1, card2);

        RoomScene.currentInstance.updateBoard();
    }

    public static toogleCardCooperation(): void {

        RoomManager.game.cheat.toggleCardCooperation();
    }

    public static getOpponentCards(): {value: number, suit: number}[] {

        let cards: string[] = RoomManager.game.getOpponentCards();

        return cards.map(RoomManager.getCardSuitValue);
    }

    public static getCommunityCards(): {value: number, suit: number}[] {

        let cards: string[] = RoomManager.game.getCommunityCards();

        return cards.map(RoomManager.getCardSuitValue);
    }

    public static getMaxRaise(): number {

        return Math.min(RoomManager.getPlayerFunds(), RoomManager.getOpponentFunds()) - RoomManager.getOpponentBets();
    }

    public static getState(): number {

        return RoomManager.game.getState();
    }

    public static getPlayerBets(): number {

        return  RoomManager.game.getPlayerBets();
    }

    public static getOpponentBets(): number {

        return  RoomManager.game.getOpponentBets();
    }

    public static playerCall(): void {

        RoomManager.game.call(() => {
            RoomManager.showBet(GameConstants.ACTION_CALL, GameVars.playerIndex);

            RoomManager.updateBoard();
            RoomManager.removeBetButtons();
            RoomManager.startOpponentTurn();
        });

    }

    public static playerCheck(): void {

        RoomManager.game.check(() => {
            RoomManager.showBet(GameConstants.ACTION_CHECK, GameVars.playerIndex);

            RoomManager.updateBoard();
            RoomManager.removeBetButtons();
            RoomManager.startOpponentTurn();
        });

    }

    public static playerFold(): void {

        RoomManager.game.fold(() => {
            RoomManager.showBet(GameConstants.ACTION_FOLD, GameVars.playerIndex);

            RoomManager.updateBoard();
            RoomManager.removeBetButtons();
            RoomManager.startOpponentTurn();
        });

    }

    public static playerRaise(value): void {

        RoomManager.game.raise(value, () => {
            RoomManager.showBet(GameConstants.ACTION_RAISE, GameVars.playerIndex);

            RoomManager.updateBoard();
            RoomManager.removeBetButtons();
            RoomManager.startOpponentTurn();
        });

    }

    public static startOpponentTurn(): void {

        setTimeout(() => {
            RoomScene.currentInstance.startOpponentTurn();
        }, 2000);
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

    private static onBetsReceived(betType, amount): void {
        
        const action = GameConstants.ACTIONS[betType];
        console.log(`Bets received: action=${action} ; amount=${amount}`);
        RoomManager.showBet(GameConstants.ACTIONS[betType], GameVars.opponentIndex);
        RoomScene.currentInstance.endOpponentTurn();
        RoomManager.updateBoard();
    }

    private static onEnd(): void {

        let endData = RoomManager.game.getResult();

        setTimeout(() => {
            RoomScene.currentInstance.onEnd(endData);

            GameVars.playerFunds = endData.fundsShare[GameVars.playerIndex];
            GameVars.opponentFunds = endData.fundsShare[GameVars.opponentIndex];
        }, 2000);
    }
}
