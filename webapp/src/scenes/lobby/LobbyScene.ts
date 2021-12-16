import { AudioManager } from "../../AudioManager";
import { GameConstants } from "../../GameConstants";
import { GameManager } from "../../GameManager";
import { GameVars } from "../../GameVars";
import { ErrorHandler } from "../../services/ErrorHandler";
import { Lobby } from "../../services/Lobby";
import { MatchingLayer } from "./MatchingLayer";

export class LobbyScene extends Phaser.Scene {

    public static currentInstance: LobbyScene;

    private background: Phaser.GameObjects.Image;
    private backContainer: Phaser.GameObjects.Container;
    private backButton: Phaser.GameObjects.Image;
    private loading: Phaser.GameObjects.Image;
    private topContainer: Phaser.GameObjects.Container;
    private matchingLayer: MatchingLayer;

    constructor() {

        super("LobbyScene");

        LobbyScene.currentInstance = this;
    }

    public create(): void {

        GameManager.setCurrentScene(this);

        this.background = new Phaser.GameObjects.Image(this, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2, "bg");
        this.background.setScale(1);
        this.add.existing(this.background);

        this.backContainer = new Phaser.GameObjects.Container(this);
        this.add.existing(this.backContainer);

        this.topContainer = new Phaser.GameObjects.Container(this);
        this.topContainer.setPosition(GameConstants.GAME_WIDTH / 2, 0);
        this.add.existing(this.topContainer);

        this.backButton = new Phaser.GameObjects.Image(this, 50, 50, "texture_atlas_1", "btn_back");
        this.backButton.setInteractive();
        this.backButton.on("pointerover", () => {
            this.backButton.setScale(1.05);
        }, this);
        this.backButton.on("pointerout", () => {
            this.backButton.setScale(1);
        }, this);
        this.backButton.on("pointerup", () => {
            AudioManager.playSound("btn_click");
            this.onBack();
        }, this);
        this.backContainer.add(this.backButton);

        this.loading = new Phaser.GameObjects.Image(this, 50, 50, "texture_atlas_1", "loading");
        this.loading.setScale(.5);
        this.loading.visible = false;
        this.tweens.add({
            targets: this.loading,
            angle: 360,
            ease: Phaser.Math.Easing.Linear,
            duration: 1000,
            repeat: -1
        });
        this.backContainer.add(this.loading);

        let title = new Phaser.GameObjects.Image(this, 0, 10, "texture_atlas_1", "logo_main");
        title.setOrigin(.5, 0);
        title.setScale(.75);
        this.topContainer.add(title);

        let powered = new Phaser.GameObjects.Text(this, 0, 230, " powered by Cartesi ", { fontFamily: "Oswald-Medium", fontSize: "20px", color: "#FFFFFF" });
        powered.setOrigin(.5, 0);
        powered.setShadow(1, 1, "#000000", 5);
        this.topContainer.add(powered);

        let errorText = new Phaser.GameObjects.Text(this, 200, 230, "", { fontFamily: "Oswald-Medium", fontSize: "20px", color: "#FFFFFF" });
        errorText.setOrigin(.5, 0);
        errorText.setShadow(1, 1, "#000000", 5);
        this.topContainer.add(errorText);
        ErrorHandler.setOnError((index: number, title: string, error: any) => {
            if (errorText.active) {
                errorText.setText(`Error executing ${title}`);
                setTimeout(() => { if (errorText.active) { errorText.setText("") } }, ErrorHandler.getAttemptInterval());
            }
        });

        this.matchingLayer = new MatchingLayer(this);
        this.add.existing(this.matchingLayer);

        this.onOrientationChange();
    }

    public onOpponentJoined(): void {

        this.matchingLayer.onStopScrolling();
    }

    public onOrientationChange(): void {

        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.topContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                this.backContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.topContainer.setScale(GameVars.scaleX, 1);
                this.backContainer.setScale(GameVars.scaleX, 1);
            }
        } else {
            this.topContainer.setScale(1.2, GameVars.scaleY * 1.2);
            this.backContainer.setScale(1.2, GameVars.scaleY * 1.2);
        }

        this.matchingLayer.setScalesAndPositions();
    }

    public hideBack(): void {
        this.backButton.disableInteractive();
        this.backButton.setAlpha(0);
    }

    protected async onBack(): Promise<void> {
        this.backButton.setScale(1);
        this.backButton.disableInteractive();
        this.backButton.setAlpha(0.5);
        this.loading.visible = true;
        AudioManager.stopMatching();
        await Lobby.leaveQueue();
        GameManager.enterSplashScene();
    }
}
