import { AudioManager } from './../../AudioManager';
import { GameVars } from "./../../GameVars";
import { GameConstants } from "./../../GameConstants";

export class SettingsLayer extends Phaser.GameObjects.Container {
    
    private midContainer: Phaser.GameObjects.Container;

    private soundText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.visible = false;

        let background = new Phaser.GameObjects.Graphics(this.scene);
        background.fillStyle(0x000000, .8);
        background.fillRect(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
        background.setInteractive(new Phaser.Geom.Rectangle(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);
        background.on("pointerdown", () => {
            this.hide();
        }, this);
        this.add(background);

        this.midContainer = new Phaser.GameObjects.Container(this.scene);
        this.midContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
        this.add(this.midContainer);

        let title = new Phaser.GameObjects.Text(this.scene, 0, -220, "SETTINGS", {fontFamily: "Oswald-Medium", fontSize: "70px", color: "#ffffff"});
        title.setOrigin(.5);
        this.midContainer.add(title);

        // SOUND 

        let soundButton = new Phaser.GameObjects.Image(this.scene, 0, -100, "texture_atlas_1", "btn_yellow");
        soundButton.setOrigin(.5);
        soundButton.setInteractive();
        soundButton.on("pointerdown", () => {
            AudioManager.toggleAudioState(); 
            this.soundText.text = GameVars.gameData.muted ? " SOUND \n OFF " : " SOUND \n ON ";
        }, this);
        this.midContainer.add(soundButton);

        let text = GameVars.gameData.muted ? " SOUND \n OFF " : " SOUND \n ON ";

        this.soundText = new Phaser.GameObjects.Text(this.scene, 0, -100, text, {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF", align: "center"});
        this.soundText.setOrigin(.5);
        this.soundText.setShadow(1, 1, "#000000", 5);
        this.midContainer.add(this.soundText);

        // HELP

        let helpButton = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "btn_yellow");
        helpButton.setOrigin(.5);
        helpButton.setInteractive();
        helpButton.on("pointerdown", () => {
            // 
        }, this);
        this.midContainer.add(helpButton);

        let helpText = new Phaser.GameObjects.Text(this.scene, 0, 0, " HELP ", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF", align: "center"});
        helpText.setOrigin(.5);
        helpText.setShadow(1, 1, "#000000", 5);
        this.midContainer.add(helpText);

        // RESET

        let resetButton = new Phaser.GameObjects.Image(this.scene, 0, 100, "texture_atlas_1", "btn_yellow");
        resetButton.setOrigin(.5);
        resetButton.setInteractive();
        resetButton.on("pointerdown", () => {
            // 
        }, this);
        this.midContainer.add(resetButton);

        let resetText = new Phaser.GameObjects.Text(this.scene, 0, 100, " RESET ", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF", align: "center"});
        resetText.setOrigin(.5);
        resetText.setShadow(1, 1, "#000000", 5);
        this.midContainer.add(resetText);

        // EXIT

        let exitButton = new Phaser.GameObjects.Image(this.scene, 0, 200, "texture_atlas_1", "btn_red");
        exitButton.setOrigin(.5);
        exitButton.setInteractive();
        exitButton.on("pointerdown", () => {
            // 
        }, this);
        this.midContainer.add(exitButton);

        let exitText = new Phaser.GameObjects.Text(this.scene, 0, 200, " EXIT ", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF", align: "center"});
        exitText.setOrigin(.5);
        exitText.setShadow(1, 1, "#000000", 5);
        this.midContainer.add(exitText);

        this.setScalesAndPositions();
    }

    public setScalesAndPositions(): void {
        
        if (GameVars.landscape) {
            this.midContainer.setScale(GameVars.scaleX, 1);
        } else {
            this.midContainer.setScale(1.3 + (0.55 - GameVars.scaleY) * 3, (1.3 + (0.55 - GameVars.scaleY) * 3) * GameVars.scaleY);
        }
    }

    public show(): void {

        this.visible = true;
    }

    public hide(): void {

        this.visible = false;
    }
}
