import { RoomManager } from "./RoomManager";
import { Table } from "./Table";

export class RoomScene extends Phaser.Scene {

    public static currentInstance: RoomScene;

    constructor() {

        super("RoomScene");

        RoomScene.currentInstance = this;
    }

    public create(): void {

        RoomManager.init();

        const table = new Table(this);
        this.add.existing(table);
    }
}