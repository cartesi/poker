import { SettingsLayer } from "./SettingsLayer";
import { TableContainer } from "./table-container/TableContainer";
import { RoomManager } from "./RoomManager";
import { GUI } from "./gui/GUI";
import { HUD } from "./hud/HUD";
import { GameManager } from "../../GameManager";
import { WinnerLayer } from "./WinnerLayer";

export class RoomScene extends Phaser.Scene {

    public static currentInstance: RoomScene;

    public tableContainer: TableContainer;
    public gui: GUI;
    public hud: HUD;
    public settingsLayer: SettingsLayer;
    public winnerLayer: WinnerLayer;

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
        
        this.winnerLayer = new WinnerLayer(this);
        this.add.existing(this.winnerLayer);

        this.hud = new HUD(this);
        this.add.existing(this.hud);

        this.settingsLayer = new SettingsLayer(this);
        this.add.existing(this.settingsLayer);

        setTimeout(() => {
            RoomManager.startRound(true);
        }, 2000);
    }

    public showSettingsMenu(): void {

        this.settingsLayer.show();
    }

    public onOrientationChange(): void {

        this.tableContainer.setScalesAndPostions();
        this.gui.setScalesAndPostions();
        this.hud.setScalesAndPostions();
        this.settingsLayer.setScalesAndPositions();
        this.winnerLayer.setScalesAndPositions();
    }

    public distributeFirstCards(): void {

        this.tableContainer.distributeFirstCards();
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
        this.winnerLayer.showWinner(endData);

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
