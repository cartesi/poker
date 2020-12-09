import { Howl } from "howler";
import { AudioManager } from "../AudioManager";
import { GameConstants } from "../GameConstants";
import { GameManager } from "../GameManager";
import { GameVars } from "../GameVars";

export class PreloadScene extends Phaser.Scene {

    public static currentInstance: PreloadScene;

    private progressBar: Phaser.GameObjects.Graphics;

    constructor() {

        super("PreloadScene");

        PreloadScene.currentInstance = this;
    }

    public preload(): void {

        GameVars.currentScene = this;

        this.composeScene();
        this.loadAssets();
    }

    public create(): void {

        this.loadHowl();
    }

    public loadAssets(): void {

        this.load.atlas("texture_atlas_1", "assets/texture_atlas_1.png", "assets/texture_atlas_1.json");
        this.load.atlas("texture_atlas_2", "assets/texture_atlas_2.png", "assets/texture_atlas_2.json");

        this.load.on("progress", this.updateLoadedPercentage, this);
    }

    private updateLoadedPercentage(percentageLoaded: number): void {

        // los valores del porcentaje cargado disminuyen por algun bug
        if (this.progressBar.scaleX < percentageLoaded) {
            this.progressBar.scaleX = percentageLoaded;
        }
    }

    private composeScene(): void {

        this.progressBar = this.add.graphics();
        this.progressBar.fillStyle(0xFFFFFF);
        this.progressBar.fillRect(0, GameConstants.GAME_HEIGHT - 10, GameConstants.GAME_WIDTH, 10);
        this.progressBar.scaleX = 0;
    }   

    private loadHowl(): void {

        // TODO: load howl
        // let json = this.cache.json.get("audiosprite");
        // json = JSON.parse(JSON.stringify(json).replace("urls", "src"));

        // AudioManager.sound = new Howl(json);

        // AudioManager.sound.on("load", function(): void {

        //     GameManager.onGameAssetsLoaded();
        //     PreloadScene.currentInstance.scene.setVisible(false);
            
        // });

        // TODO: remove this
        GameManager.onGameAssetsLoaded();
        PreloadScene.currentInstance.scene.setVisible(false);
    }
}
