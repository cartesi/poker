import { GameManager } from './../../GameManager';
import { AudioManager } from './../../AudioManager';
import { GameVars } from "./../../GameVars";
import { GameConstants } from "./../../GameConstants";

export class SettingsLayer extends Phaser.GameObjects.Container {

    private midContainer: Phaser.GameObjects.Container;

    private title: Phaser.GameObjects.Text;
    private exitBtn: Phaser.GameObjects.Image;
    private midBackground: Phaser.GameObjects.Graphics;
    private buttonsContainer: Phaser.GameObjects.Container;
    private handRankings: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.visible = false;

        let background = new Phaser.GameObjects.Graphics(this.scene);
        background.fillStyle(0x000000, .25);
        background.fillRect(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
        background.setInteractive(new Phaser.Geom.Rectangle(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);
        background.on("pointerdown", () => {
            // 
        }, this);
        this.add(background);

        this.midContainer = new Phaser.GameObjects.Container(this.scene);
        this.midContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
        this.add(this.midContainer);

        this.midBackground = new Phaser.GameObjects.Graphics(this.scene);
        this.midBackground.fillStyle(0x09070B, .8);
        this.midBackground.fillRoundedRect(-200, -300, 400, 600, 15);
        this.midBackground.lineStyle(3, 0x2E7787);
        this.midBackground.strokeRoundedRect(-200, -300, 400, 600, 15);
        this.midContainer.add(this.midBackground);

        this.title = new Phaser.GameObjects.Text(this.scene, 0, -250, "SETTINGS", { fontFamily: "Oswald-Medium", fontSize: "40px", color: "#ffffff" });
        this.title.setOrigin(.5);
        this.midContainer.add(this.title);

        // CLOSE 

        this.exitBtn = new Phaser.GameObjects.Image(this.scene, 160, -260, "texture_atlas_1", "btn_close");
        this.exitBtn.setOrigin(.5);
        this.exitBtn.setInteractive();
        this.exitBtn.on("pointerdown", () => {
            this.exitBtn.setScale(1);
        }, this);
        this.exitBtn.on("pointerup", this.hide, this);
        this.exitBtn.on("pointerover", () => {
            this.exitBtn.setScale(1.05);
        }, this);
        this.exitBtn.on("pointerout", () => {
            this.exitBtn.setScale(1);
        }, this);
        this.midContainer.add(this.exitBtn);

        this.buttonsContainer = new Phaser.GameObjects.Container(this.scene);
        this.midContainer.add(this.buttonsContainer);

        // RESET

        let resetBtn = new Phaser.GameObjects.Image(this.scene, -50, -100, "texture_atlas_1", "btn_reset");
        resetBtn.setOrigin(.5);
        resetBtn.setInteractive();
        resetBtn.on("pointerdown", () => {
            resetBtn.setScale(1);
        }, this);
        resetBtn.on("pointerup", this.onClickReset, this);
        resetBtn.on("pointerover", () => {
            resetBtn.setScale(1.05);
        }, this);
        resetBtn.on("pointerout", () => {
            resetBtn.setScale(1);
        }, this);
        this.buttonsContainer.add(resetBtn);

        // SOUND 

        let soundBtn = new Phaser.GameObjects.Image(this.scene, 50, -100, "texture_atlas_1", GameVars.gameData.muted ? "btn_sound_off" : "btn_sound_on");
        soundBtn.setOrigin(.5);
        soundBtn.setInteractive();
        soundBtn.on("pointerdown", () => {
            soundBtn.setScale(1);
        }, this);
        soundBtn.on("pointerup", () => {
            AudioManager.toggleAudioState();
            soundBtn.setFrame(GameVars.gameData.muted ? "btn_sound_off" : "btn_sound_on");
        }, this);
        soundBtn.on("pointerover", () => {
            soundBtn.setScale(1.05);
        }, this);
        soundBtn.on("pointerout", () => {
            soundBtn.setScale(1);
        }, this);
        this.buttonsContainer.add(soundBtn);

        // HOW TO PLAY

        let howText = new Phaser.GameObjects.Text(this.scene, 0, 20, "HOW TO PLAY", { fontFamily: "Oswald-Medium", fontSize: "30px", color: "#ffffff" });
        howText.setOrigin(.5);

        let howBtn = new Phaser.GameObjects.Image(this.scene, 0, 20, "texture_atlas_1", "btn_long");
        howBtn.setOrigin(.5);
        howBtn.setInteractive();
        howBtn.on("pointerdown", () => {
            howBtn.setScale(1);
            howText.setScale(1);
        }, this);
        howBtn.on("pointerup", this.onClickHow, this);
        howBtn.on("pointerover", () => {
            howBtn.setScale(1.05);
            howText.setScale(1.05);
        }, this);
        howBtn.on("pointerout", () => {
            howBtn.setScale(1);
            howText.setScale(1);
        }, this);
        this.buttonsContainer.add(howBtn);
        this.buttonsContainer.add(howText);

        // RANKING 

        let rankingText = new Phaser.GameObjects.Text(this.scene, 0, 120, "POKER HAND RANKING", { fontFamily: "Oswald-Medium", fontSize: "25px", color: "#ffffff" });
        rankingText.setOrigin(.5);

        let rankingBtn = new Phaser.GameObjects.Image(this.scene, 0, 120, "texture_atlas_1", "btn_long");
        rankingBtn.setOrigin(.5);
        rankingBtn.setInteractive();
        rankingBtn.on("pointerdown", () => {
            rankingBtn.setScale(1);
            rankingText.setScale(1);
        }, this);
        rankingBtn.on("pointerup", this.onClickRanking, this);
        rankingBtn.on("pointerover", () => {
            rankingBtn.setScale(1.05);
            rankingText.setScale(1.05);
        }, this);
        rankingBtn.on("pointerout", () => {
            rankingBtn.setScale(1);
            rankingText.setScale(1);
        }, this);
        this.buttonsContainer.add(rankingBtn);
        this.buttonsContainer.add(rankingText);

        // EXIT 

        let exitText = new Phaser.GameObjects.Text(this.scene, 0, 220, "EXIT", { fontFamily: "Oswald-Medium", fontSize: "30px", color: "#ffffff" });
        exitText.setOrigin(.5);

        let exitBtn = new Phaser.GameObjects.Image(this.scene, 0, 220, "texture_atlas_1", "btn_long");
        exitBtn.setOrigin(.5);
        exitBtn.setInteractive();
        exitBtn.on("pointerdown", () => {
            exitBtn.setScale(1);
            exitText.setScale(1);
        }, this);
        exitBtn.on("pointerup", this.onClickExit, this);
        exitBtn.on("pointerover", () => {
            exitBtn.setScale(1.05);
            exitText.setScale(1.05);
        }, this);
        exitBtn.on("pointerout", () => {
            exitBtn.setScale(1);
            exitText.setScale(1);
        }, this);
        this.buttonsContainer.add(exitBtn);
        this.buttonsContainer.add(exitText);

        this.handRankings = new Phaser.GameObjects.Image(this.scene, 0, 50, "texture_atlas_1", "hand_rank");
        this.handRankings.setScale(.8);
        this.handRankings.visible = false;
        this.midContainer.add(this.handRankings);

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

        if (this.handRankings.visible) {
            this.hideHands();
        } else {
            this.visible = false;
        }

        AudioManager.playSound("btn_click");
    }

    public onClickReset(): void {

        GameManager.enterLobbyScene();

        AudioManager.playSound("btn_click");
    }

    public onClickHow(): void {

        window.open("https://en.wikipedia.org/wiki/Texas_hold_%27em");

        AudioManager.playSound("btn_click");
    }

    public onClickRanking(): void {

        this.scene.tweens.add({
            targets: this.buttonsContainer,
            alpha: 0,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500
        });

        this.scene.tweens.add({
            targets: this.title,
            y: -345,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500
        });

        this.title.setText("HANDS RANKING");

        this.scene.tweens.add({
            targets: this.exitBtn,
            x: 180,
            y: -350,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500
        });

        this.scene.tweens.add({
            targets: this.midBackground,
            scaleX: 1.1,
            scaleY: 1.3,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500
        });

        this.handRankings.visible = true;
        this.handRankings.alpha = 0;
        this.scene.tweens.add({
            targets: this.handRankings,
            alpha: 1,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500,
            delay: 150
        });

        AudioManager.playSound("btn_click");
    }

    public onClickExit(): void {

        GameManager.enterSplashScene();
    }

    public hideHands(): void {

        this.scene.tweens.add({
            targets: this.buttonsContainer,
            alpha: 1,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500,
            delay: 150
        });

        this.scene.tweens.add({
            targets: this.title,
            y: -250,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500
        });

        this.title.setText("SETTINGS");

        this.scene.tweens.add({
            targets: this.exitBtn,
            x: 160,
            y: -260,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500
        });

        this.scene.tweens.add({
            targets: this.midBackground,
            scaleX: 1,
            scaleY: 1,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500
        });

        this.scene.tweens.add({
            targets: this.handRankings,
            alpha: 0,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500,
            onComplete: () => {
                this.handRankings.visible = false;
            },
            onCompleteScope: this
        });
    }
}
