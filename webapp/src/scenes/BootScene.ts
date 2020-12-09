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

        BootScene.currentInstance = this;
        GameManager.setCurrentScene(this);

        this.scene.setVisible(false);

        GameManager.init();
    }
}
