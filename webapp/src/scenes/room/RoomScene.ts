import { VerificationLayer } from './VerificationLayer';
import { CheatLayer } from './CheatLayer';
import { AudioManager } from './../../AudioManager';
import { TableContainer } from "./table-container/TableContainer";
import { RoomManager } from "./RoomManager";
import { GUI } from "./gui/GUI";
import { HUD } from "./hud/HUD";
import { GameManager } from "../../GameManager";
import { SettingsLayer } from "./SettingsLayer";
import { ShuffleCardsLayer } from "./ShuffleCardsLayer";
import { EventType, VerificationState } from '../../services/Game';
import { ErrorHandler } from '../../services/ErrorHandler';

export class RoomScene extends Phaser.Scene {

    public static currentInstance: RoomScene;

    public gui: GUI;
    public hud: HUD;
    public tableContainer: TableContainer;
    public settingsLayer: SettingsLayer;
    public cheatLayer: CheatLayer;
    public verificationLayer: VerificationLayer;
    public shuffleCardsLayer: ShuffleCardsLayer;

    private isShuffleCardsLayerActive = false;

    constructor() {

        super("RoomScene");

        RoomScene.currentInstance = this;
    }

    public create(): void {

        GameManager.setCurrentScene(this);

        RoomManager.init();

        this.tableContainer = new TableContainer(this);
        this.add.existing(this.tableContainer);

        this.gui = new GUI(this);
        this.add.existing(this.gui);

        this.hud = new HUD(this);
        this.add.existing(this.hud);

        this.shuffleCardsLayer = new ShuffleCardsLayer(this);
        this.add.existing(this.shuffleCardsLayer);

        this.settingsLayer = new SettingsLayer(this);
        this.add.existing(this.settingsLayer);

        this.cheatLayer = new CheatLayer(this);
        this.add.existing(this.cheatLayer);

        this.verificationLayer = new VerificationLayer(this);
        this.add.existing(this.verificationLayer);

        setTimeout(() => {
            RoomManager.startRound();
        }, 2000);

        ErrorHandler.setOnError((index: number, title: string, error: any) => {
            if (this.hud.active) {
                this.hud.updateInfo(`Error executing ${title}`);
                setTimeout(() => { if (this.hud.active) { this.hud.clearInfo() } }, ErrorHandler.getAttemptInterval());
            }
        });
        
        AudioManager.playMusic("soundtrack", 0.1);
    }

    public initTimer(value: number, isPlayer: boolean): void {

        this.tableContainer.initTimer(value, isPlayer);
    }

    public showSettingsMenu(): void {

        this.settingsLayer.show();
    }

    public showVerificationLayer(msg: string): void {

        this.verificationLayer.show(msg);
    }

    public updateVerificationLayer(state: VerificationState): void {

        this.verificationLayer.updateValue(state);
    }

    public onOrientationChange(): void {

        this.tableContainer.setScalesAndPostions();
        this.gui.setScalesAndPostions();
        this.hud.setScalesAndPostions();
        this.settingsLayer.setScalesAndPositions();
        this.shuffleCardsLayer.setScalesAndPositions();
    }


    public resetTable(): void {

        this.tableContainer.resetTable();
        this.gui.resetTable();
    }

    public distributeFirstCards(): void {

        this.tableContainer.distributeFirstCards();
    }

    public showWaitingFirstCards(): void {

        this.isShuffleCardsLayerActive = true;
        this.shuffleCardsLayer.show();
    }

    public hideWaitingFirstCards(): void {

        this.isShuffleCardsLayerActive = false;
        this.shuffleCardsLayer.hide();
    }

    public updateBoard(): void {

        this.tableContainer.updateBoard();
        this.gui.updateBoard();
    }

    public removeBetButtons(): void {

        this.hud.removeBetButtons();
        this.tableContainer.removePlayerTimer();
    }

    public showBetButtons(): void {

        this.hud.clearInfo();
        setTimeout(() => {
            this.hud.showBetButtons();
        }, 2000);
    }

    public onDataEvent(msg: string, type: EventType): void {

        if (this.isShuffleCardsLayerActive) {
            this.shuffleCardsLayer.updateHeading(msg);
        } else {
            setTimeout(() => {
                this.hud.updateInfo(msg);
            }, 500);
        }
    }

    public onEnd(endData: any): void {

        this.tableContainer.onEnd(endData);
        this.gui.showWinner(endData);

    }

    public showBet(value: string, player: number): void {

        this.tableContainer.showBet(value, player);
    }

    public startOpponentTurn(): void {

        this.tableContainer.startOpponentTurn();
    }

    public endOpponentTurn(): void {

        this.tableContainer.endOpponentTurn();
    }
}
