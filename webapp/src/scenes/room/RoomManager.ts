import { AudioManager } from "../../AudioManager";
import { GameConstants } from "../../GameConstants";
import { Card } from "../../services/Card";
import { BetType, EventType, Game, GameFactory, GameState, VerificationState } from "../../services/Game";
import { GameVars } from "./../../GameVars";
import { RoomScene } from "./RoomScene";
import { ethers } from "ethers";
import { GameManager } from "../../GameManager";

export class RoomManager {

    public static game: Game;

    public static init(): void {

        GameVars.raiseValue = ethers.BigNumber.from(1);
    }

    public static quit(): void {

        if (this.game) {
            console.log("Interrupting RoomManager game...");
            this.game.interrupt();
            this.game = undefined;
        }
    }

    public static startRound(): void {

        if (GameVars.playerFunds.lt(2)) {
            console.log("GAME OVER, OPPONENT WON");  
            return;
        } else if (GameVars.opponentFunds.lt(2)) {
            console.log("GAME OVER, PLAYER WON");  
            return;
        }

        const metadata = "";  
        RoomManager.game = GameFactory.create(
            GameVars.gameData.gameIndex,
            GameVars.playerIndex,
            GameVars.opponentIndex,
            GameVars.playerFunds,
            GameVars.opponentFunds,
            metadata,
            RoomManager.onBetRequested,
            RoomManager.onBetsReceived,
            RoomManager.onEnd,
            RoomManager.onEvent,
            RoomManager.updateVerification
        );

        // show waiting UI while game is starting
        RoomScene.currentInstance.showWaitingFirstCards();

        this.game.start().then(() => {
            RoomScene.currentInstance.hideWaitingFirstCards();

            setTimeout(() => {
                RoomScene.currentInstance.distributeFirstCards();
                RoomScene.currentInstance.updateBoard();
            }, 1000);
        }).catch(error => {
            console.error(`${error} - ${JSON.stringify(error)}`);
            RoomScene.currentInstance.hideWaitingFirstCards();
        });

    }

    public static async getPlayerFunds(): Promise<ethers.BigNumber> {

        if (!RoomManager.game) {
            return ethers.BigNumber.from(0);
        } 
        return RoomManager.game.getPlayerFunds();
    }

    public static showVerificationLayer(msg: string): void {

        if (!RoomManager.game) {
            return;
        }
    RoomScene.currentInstance.showVerificationLayer(msg);
    }

    public static updateVerification(state: VerificationState, msg: string): void {

        if (!RoomManager.game) {
            return;
        }
        RoomManager.removeBetButtons();
        RoomManager.updateOpponentState();
        if (state == VerificationState.STARTED) {
            RoomManager.showVerificationLayer(msg);
        }
        RoomScene.currentInstance.updateVerificationLayer(state);
    }

    public static onEvent(msg: string, type: EventType): void {

        if (!RoomManager.game) {
            return;
        }
        if (type === EventType.UPDATE_STATE) {
            // state update
            console.log(`${type}: ${msg}`);
            RoomManager.updateBoard();
        } else if (type === EventType.DATA_SEND) {
            // sending data
            console.log(`${type}: ${msg}`);
            RoomScene.currentInstance.onDataEvent(msg, type);
        } else if (type === EventType.DATA_WAIT) {
            // waiting for opponent to send data
            console.log(`${type}: ${msg}`);
            RoomScene.currentInstance.onDataEvent(msg, type);
            RoomManager.updateOpponentState();
            // inits timeout timer for opponent
            // - timer is given an added safety margin to account for the time between a turn submission and it being perceived
            RoomManager.initTimer(GameConstants.TIMEOUT_SECONDS + GameConstants.TIMEOUT_SAFETY_MARGIN_SECONDS, false);
        } else if (type === EventType.DATA_RECEIVED) {
            // received data from opponent
            console.log(`${type}: ${msg}`);
            RoomManager.updateOpponentState();
            // removes timeout timer for opponent
            RoomScene.currentInstance.removeTimer(false);
        } else {
            // general event logging
            console.log(`${EventType.LOG}: ${msg}`);
        }
    }


    public static async getOpponentFunds(): Promise<ethers.BigNumber> {

        if (!RoomManager.game) {
            return ethers.BigNumber.from(0);
        }
        return RoomManager.game.getOpponentFunds();
    }

    public static async getPlayerCards(): Promise<Array<Card>> {

        if (!RoomManager.game) {
            return [];
        }
        return RoomManager.game.getPlayerCards();
    }

    public static switchPlayerCards(card1: Card, card2: Card): void {

        if (!RoomManager.game) {
            return;
        }
        RoomManager.game.cheat.switchCards(card1, card2);
        RoomScene.currentInstance.updateBoard();
    }

    public static toogleCardCooperation(): void {

        if (!RoomManager.game) {
            return;
        }
        RoomManager.game.cheat.toggleCardCooperation();
    }

    public static async getOpponentCards(): Promise<Array<Card>> {

        if (!RoomManager.game) {
            return [];
        }
        return RoomManager.game.getOpponentCards();
    }

    public static async getCommunityCards(): Promise<Array<Card>> {

        if (!RoomManager.game) {
            return [];
        }
        return RoomManager.game.getCommunityCards();
    }

    public static async getMaxRaise(): Promise<ethers.BigNumber> {
        const playerFunds = await RoomManager.getPlayerFunds();
        const opponentFunds = await RoomManager.getOpponentFunds();
        const minFunds = playerFunds.lt(opponentFunds) ? playerFunds : opponentFunds;
        return minFunds.sub(await RoomManager.getOpponentBets());
    }

    public static async getState(): Promise<string> {

        if (!RoomManager.game) {
            return GameState.END;
        }
        return RoomManager.game.getState();
    }

    public static async getPlayerBets(): Promise<ethers.BigNumber> {

        if (!RoomManager.game) {
            return ethers.BigNumber.from(0);
        }
        return  RoomManager.game.getPlayerBets();
    }

    public static async getOpponentBets(): Promise<ethers.BigNumber> {

        if (!RoomManager.game) {
            return ethers.BigNumber.from(0);
        }
        return  RoomManager.game.getOpponentBets();
    }

    public static async playerCall(): Promise<void> {

        if (!RoomManager.game) {
            return;
        }
        RoomManager.removeBetButtons();
        try {
            await RoomManager.game.call();
            RoomManager.showBet(BetType.CALL, GameVars.playerIndex);
            RoomManager.updateBoard();
        } catch (error) {
            console.error(`${error} - ${JSON.stringify(error)}`);
            RoomManager.showBetButtons();
        }
    }

    public static async playerCheck(): Promise<void> {

        if (!RoomManager.game) {
            return;
        }
        RoomManager.removeBetButtons();
        try {
            await RoomManager.game.check();
            RoomManager.showBet(BetType.CHECK, GameVars.playerIndex);
            RoomManager.updateBoard();
        } catch (error) {
            console.error(`${error} - ${JSON.stringify(error)}`);
            RoomManager.showBetButtons();
        }
    }

    public static async playerFold(): Promise<void> {

        if (!RoomManager.game) {
            return;
        }
        RoomManager.removeBetButtons();
        try {
            await RoomManager.game.fold();
            RoomManager.showBet(BetType.FOLD, GameVars.playerIndex);
            RoomManager.updateBoard();
        } catch (error) {
            console.error(`${error} - ${JSON.stringify(error)}`);
            RoomManager.showBetButtons();
        }
    }

    public static async playerRaise(value: ethers.BigNumber): Promise<void> {

        if (!RoomManager.game) {
            return;
        }
        RoomManager.removeBetButtons();
        try {
            await RoomManager.game.raise(value);
            RoomManager.showBet(BetType.RAISE, GameVars.playerIndex);
            RoomManager.updateBoard();
        } catch (error) {
            console.error(`${error} - ${JSON.stringify(error)}`);
            RoomManager.showBetButtons();
        }
    }

    private static updateOpponentStateTimeout;
    public static async updateOpponentState(): Promise<void> {
        if (!RoomManager.game) {
            return;
        }
        if (this.updateOpponentStateTimeout) {
            clearTimeout(this.updateOpponentStateTimeout);
        }
        const state = await RoomManager.game.getState();
        const currentPlayerId = await RoomManager.game.getCurrentPlayerId();
        const playerIds = [GameVars.playerIndex, GameVars.opponentIndex];
        const noCurrentPlayer = (state === GameState.SHOWDOWN || state === GameState.VERIFICATION || state === GameState.END || !playerIds.includes(currentPlayerId));
        if (currentPlayerId === GameVars.playerIndex || noCurrentPlayer) {
            RoomScene.currentInstance.endOpponentTurn();
        } else {
            this.updateOpponentStateTimeout = setTimeout(async () => {
                RoomScene.currentInstance.startOpponentTurn();
            }, 2000);
        }
    }

    public static updateBoard(): void {

        if (!RoomManager.game) {
            return;
        }
        setTimeout(() => {
            RoomScene.currentInstance.updateBoard();
        }, 1000);
    }

    public static removeBetButtons(): void {

        if (!RoomManager.game) {
            return;
        }
        RoomScene.currentInstance.removeBetButtons();
    }

    public static showBetButtons(): void {

        if (!RoomManager.game) {
            return;
        }
        RoomScene.currentInstance.showBetButtons();
    }

    public static showBet(value: string, player: number): void {

        if (!RoomManager.game) {
            return;
        }
        RoomScene.currentInstance.showBet(value, player);
    }

    public static showSettingsMenu(): void {

        RoomScene.currentInstance.showSettingsMenu();
        AudioManager.playSound("btn_click");
    } 

    public static onClickNext(): void {

        // TODO: disabling for now the feature of playing several hands with the same opponent
        // - requires Lobby to support joining a game with a specific player
        // - requires more sophisticated logic to handle case when one of the players does not rejoin, locking his tokens again

        // RoomScene.currentInstance.resetTable();

        // setTimeout(() => {
        //     RoomManager.startRound();
        // }, 500);

        // reverts player back to the Lobby to join a new game
        GameManager.enterLobbyScene();
    }

    public static async onTimeOut(isPlayer: boolean): Promise<void> {

        if (!RoomManager.game) {
            return;
        }
        if (isPlayer) {
            console.log("PLAYER TIMEOUT! Folding on his behalf...");
            // TODO: should we attempt to check if possible?
            await RoomManager.playerFold();
        } else {
            console.log("OPPONENT TIMEOUT! Claiming timeout...");
            RoomManager.game.claimTimeout();
        }
    }

    private static onBetRequested(): void {

        if (!RoomManager.game) {
            return;
        }
        RoomManager.updateBoard();
        RoomManager.showBetButtons();
        RoomManager.initTimer(GameConstants.TIMEOUT_SECONDS, true);
    }

    private static initTimer(value: number, isPlayer: boolean): void {

        if (!RoomManager.game) {
            return;
        }
        RoomScene.currentInstance.initTimer(value, isPlayer);
    }

    private static onBetsReceived(betType: BetType, amount: ethers.BigNumber): void {

        if (!RoomManager.game) {
            return;
        }
        console.log(`Bets received: type=${betType} ; amount=${amount}`);
        RoomManager.showBet(betType, GameVars.opponentIndex);
        RoomManager.updateBoard();
    }

    private static async onEnd(): Promise<void> {

        if (!RoomManager.game) {
            return;
        }
        RoomScene.currentInstance.hideWaitingFirstCards();
        RoomScene.currentInstance.removeTimer(false);
        RoomManager.removeBetButtons();
        RoomManager.updateOpponentState();
        let endData = await RoomManager.game.getResult();

        setTimeout(() => {
            RoomScene.currentInstance.onEnd(endData);

            GameVars.playerFunds = endData.fundsShare[GameVars.playerIndex];
            GameVars.opponentFunds = endData.fundsShare[GameVars.opponentIndex];

            RoomManager.game = undefined;        
        }, 2000);
    }
}
