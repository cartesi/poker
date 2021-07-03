import { AudioManager } from "../../AudioManager";
import { Card } from "../../services/Card";
import { BetType, Game, GameFactory, VerificationState } from "../../services/Game";
import { GameVars } from "./../../GameVars";
import { RoomScene } from "./RoomScene";

export class RoomManager {

    public static game: Game;

    public static init(): void {

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
            GameVars.gameIndex,
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
                RoomManager.updateVerification(state, msg);
            }
        );

        // show waiting UI while game is starting
        RoomScene.currentInstance.showWaitingFirstCards();

        this.game.start().then(() => {
            RoomScene.currentInstance.hideWaitingFirstCards();

            setTimeout(() => {
                RoomScene.currentInstance.distributeFirstCards();
                RoomScene.currentInstance.updateBoard();
            }, 1000);
        });

    }

    public static async getPlayerFunds(): Promise<number> {

        return RoomManager.game.getPlayerFunds();
    }

    public static showVerificationLayer(msg: string): void {

        RoomScene.currentInstance.showVerificationLayer(msg);
    }

    public static updateVerification(state: VerificationState, msg: string): void {

        if (state == VerificationState.STARTED) {
            RoomManager.showVerificationLayer(msg);
        }
        RoomScene.currentInstance.updateVerificationLayer(state);
    }

    public static async getOpponentFunds(): Promise<number> {

        return RoomManager.game.getOpponentFunds();
    }

    public static async getPlayerCards(): Promise<Array<Card>> {

        return RoomManager.game.getPlayerCards();
    }

    public static switchPlayerCards(card1: Card, card2: Card): void {

        RoomManager.game.cheat.switchCards(card1, card2);

        RoomScene.currentInstance.updateBoard();
    }

    public static toogleCardCooperation(): void {

        RoomManager.game.cheat.toggleCardCooperation();
    }

    public static async getOpponentCards(): Promise<Array<Card>> {

        return RoomManager.game.getOpponentCards();
    }

    public static async getCommunityCards(): Promise<Array<Card>> {

        return RoomManager.game.getCommunityCards();
    }

    public static async getMaxRaise(): Promise<number> {

        return Math.min(await RoomManager.getPlayerFunds(), await RoomManager.getOpponentFunds()) - (await RoomManager.getOpponentBets());
    }

    public static async getState(): Promise<string> {

        return RoomManager.game.getState();
    }

    public static async getPlayerBets(): Promise<number> {

        return  RoomManager.game.getPlayerBets();
    }

    public static async getOpponentBets(): Promise<number> {

        return  RoomManager.game.getOpponentBets();
    }

    public static playerCall(): void {

        RoomManager.game.call().then(() => {
            RoomManager.showBet(BetType.CALL, GameVars.playerIndex);

            RoomManager.updateBoard();
            RoomManager.removeBetButtons();
            RoomManager.startOpponentTurn();
        });

    }

    public static playerCheck(): void {

        RoomManager.game.check().then(() => {
            RoomManager.showBet(BetType.CHECK, GameVars.playerIndex);

            RoomManager.updateBoard();
            RoomManager.removeBetButtons();
            RoomManager.startOpponentTurn();
        });

    }

    public static playerFold(): void {

        RoomManager.game.fold().then(() => {
            RoomManager.showBet(BetType.FOLD, GameVars.playerIndex);

            RoomManager.updateBoard();
            RoomManager.removeBetButtons();
            RoomManager.startOpponentTurn();
        });

    }

    public static playerRaise(value): void {

        RoomManager.game.raise(value).then(() => {
            RoomManager.showBet(BetType.RAISE, GameVars.playerIndex);

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

    public static onClickNext(): void {

        RoomScene.currentInstance.resetTable();

        setTimeout(() => {
            RoomManager.startRound();
        }, 500);
    }

    private static onBetRequested(): void {
        
        RoomManager.showBetButtons();
    }

    private static onBetsReceived(betType: BetType, amount: number): void {
        
        console.log(`Bets received: type=${betType} ; amount=${amount}`);
        RoomManager.showBet(betType, GameVars.opponentIndex);
        RoomScene.currentInstance.endOpponentTurn();
        RoomManager.updateBoard();
    }

    private static async onEnd(): Promise<void> {

        let endData = await RoomManager.game.getResult();

        setTimeout(() => {
            RoomScene.currentInstance.onEnd(endData);

            GameVars.playerFunds = endData.fundsShare[GameVars.playerIndex];
            GameVars.opponentFunds = endData.fundsShare[GameVars.opponentIndex];
        }, 2000);
    }
}
