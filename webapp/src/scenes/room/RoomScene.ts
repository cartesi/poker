import { TableContainer } from "./table-container/TableContainer";
import { RoomManager } from "./RoomManager";
import { GUI } from "./gui/GUI";
import { HUD } from "./hud/HUD";
import { GameManager } from "../../GameManager";

export class RoomScene extends Phaser.Scene {

    public static currentInstance: RoomScene;

    public tableContainer: TableContainer;
    public gui: GUI;
    public hud: HUD;

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

        setTimeout(() => {
            RoomManager.startRound(true);
        }, 2000);
    }

    public onOrientationChange(): void {

        this.tableContainer.setScalesAndPostions();
        this.gui.setScalesAndPostions();
        this.hud.setScalesAndPostions();
    }

    public updateBoard(): void {

        this.tableContainer.updateBoard();
        this.gui.updateBoard();
    }

    public removeBetButtons(): void {

        this.hud.removeBetButtons();
    }

    public showBetButtons(): void {

        this.hud.showBetButtons();
    }

    public onEnd(endData: any): void {

        this.gui.onEnd(endData);
    }

    public showBet(value: string, player: number): void {

        this.tableContainer.showBet(value, player);
    }
}
