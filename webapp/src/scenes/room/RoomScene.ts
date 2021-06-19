import { VerificationLayer } from './VerificationLayer';
import { CheatLayer } from './CheatLayer';
import { AudioManager } from './../../AudioManager';
import { TableContainer } from "./table-container/TableContainer";
import { RoomManager } from "./RoomManager";
import { GUI } from "./gui/GUI";
import { HUD } from "./hud/HUD";
import { GameManager } from "../../GameManager";
import { WinnerLayer } from "./gui/WinnerLayer";
import { SettingsLayer } from "./SettingsLayer";
import { SuffleCardsLayer } from "./SuffleCardsLayer";

export class RoomScene extends Phaser.Scene {

    public static currentInstance: RoomScene;

    public gui: GUI;
    public hud: HUD;
    public tableContainer: TableContainer;
    public settingsLayer: SettingsLayer;
    public cheatLayer: CheatLayer;
    public verificationLayer: VerificationLayer;
    public shuffleCardsLayer: SuffleCardsLayer;

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

        this.shuffleCardsLayer = new SuffleCardsLayer(this);
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

        AudioManager.playMusic("soundtrack", 0.1);
    }

    public showSettingsMenu(): void {

        this.settingsLayer.show();
    }

    public showVerificationLayer(msg: string): void {

        this.verificationLayer.show(msg);
    }

    public updateVerificationLayer(state: string): void {

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

        this.shuffleCardsLayer.show();
    }

    public hideWaitingFirstCards(): void {

        this.shuffleCardsLayer.hide();
    }

    public updateBoard(): void {

        this.tableContainer.updateBoard();
        this.gui.updateBoard();
    }

    public removeBetButtons(): void {

        this.hud.removeBetButtons();
    }

    public showBetButtons(): void {

        setTimeout(() => {
            this.hud.showBetButtons();
        }, 2000);
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
