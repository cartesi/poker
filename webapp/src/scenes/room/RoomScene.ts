import { TableContainer } from "./table-container/TableContainer";
import { RoomManager } from "./RoomManager";
import { Background } from "./Background";
import { GUI } from "./GUI";
import { HUD } from "./HUD";

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

        RoomManager.init();

        const background = new Background(this);
        this.add.existing(background);

        this.tableContainer = new TableContainer(this);
        this.add.existing(this.tableContainer);

        this.gui = new GUI(this);
        this.add.existing(this.gui);

        this.hud = new HUD(this);
        this.add.existing(this.hud);
    }

    public startRound(): void {

        this.tableContainer.startRound();
        this.gui.setStateText();
    }
}
