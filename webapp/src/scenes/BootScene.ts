import { GameManager } from "../GameManager";

export class BootScene extends Phaser.Scene {

    public static currentInstance: BootScene;

    public static onOrientationChange(): void {

        // TODO: on orientation change
    }
    
    constructor() {

        super("BootScene");
    }

    public preload(): void {
        //
    }

    public create(): void {

        this.add.text(-200, -200, "ABCDEFG", {fontFamily: "Oswald-Medium", fontSize: "14px", color: "#FFFFFF"});
        this.add.text(-200, -200, "ABCDEFG", {fontFamily: "WhoopAss", fontSize: "14px", color: "#FFFFFF"});

        BootScene.currentInstance = this;
        GameManager.setCurrentScene(this);

        this.scene.setVisible(false);

        GameManager.init();
    }
}
