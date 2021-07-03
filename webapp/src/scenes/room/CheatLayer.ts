import { RoomManager } from './RoomManager';
import { GameConstants } from "../../GameConstants";
import { GameVars } from '../../GameVars';
import { Card } from '../../services/Card';

export class CheatLayer extends Phaser.GameObjects.Container {
    
    private midContainer: Phaser.GameObjects.Container;
    private midBackground: Phaser.GameObjects.Graphics;

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
        this.midBackground.fillRoundedRect(-200, -200, 400, 400, 15);
        this.midBackground.lineStyle(3, 0x2E7787);
        this.midBackground.strokeRoundedRect(-200, -200, 400, 400, 15);
        this.midContainer.add(this.midBackground);

        let title = new Phaser.GameObjects.Text(this.scene, 0, -140, "CHEAT MENU", {fontFamily: "Oswald-Medium", fontSize: "40px", color: "#ffffff"});
        title.setOrigin(.5);
        this.midContainer.add(title);

        // TWO ACES

        let twoAcesText = new Phaser.GameObjects.Text(this.scene, 0, 0, "FORCE TWO ACES", {fontFamily: "Oswald-Medium", fontSize: "30px", color: "#183D62"});
        twoAcesText.setOrigin(.5);

        let twoAcesBtn = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "btn_long");
        twoAcesBtn.setOrigin(.5);
        twoAcesBtn.setInteractive();
        twoAcesBtn.on("pointerdown", () => {
            twoAcesBtn.setScale(1);
            twoAcesText.setScale(1);
        }, this);
        twoAcesBtn.on("pointerup", this.onClickAces, this);
        twoAcesBtn.on("pointerover", () => {
            twoAcesBtn.setScale(1.05);
            twoAcesText.setScale(1.05);
        }, this);
        twoAcesBtn.on("pointerout", () => {
            twoAcesBtn.setScale(1);
            twoAcesText.setScale(1);
        }, this);
        this.midContainer.add(twoAcesBtn);
        this.midContainer.add(twoAcesText);

        // CARD COOPERATION

        let cardCooperationText = new Phaser.GameObjects.Text(this.scene, 0, 120, "TOGGLE CARD\nCOOPERATION", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#183D62"});
        cardCooperationText.setOrigin(.5);

        let cardCooperationBtn = new Phaser.GameObjects.Image(this.scene, 0, 120, "texture_atlas_1", "btn_long");
        cardCooperationBtn.setOrigin(.5);
        cardCooperationBtn.setInteractive();
        cardCooperationBtn.on("pointerdown", () => {
            cardCooperationBtn.setScale(1);
            cardCooperationText.setScale(1);
        }, this);
        cardCooperationBtn.on("pointerup", this.onClickToogle, this);
        cardCooperationBtn.on("pointerover", () => {
            cardCooperationBtn.setScale(1.05);
            cardCooperationText.setScale(1.05);
        }, this);
        cardCooperationBtn.on("pointerout", () => {
            cardCooperationBtn.setScale(1);
            cardCooperationText.setScale(1);
        }, this);
        this.midContainer.add(cardCooperationBtn);
        this.midContainer.add(cardCooperationText);

        // EXIT

        let exitBtn = new Phaser.GameObjects.Image(this.scene, 160, -160, "texture_atlas_1", "btn_close");
        exitBtn.setOrigin(.5);
        exitBtn.setInteractive();
        exitBtn.on("pointerdown", () => {
            exitBtn.setScale(1);
        }, this);
        exitBtn.on("pointerup", () => {
            this.visible = false;
        }, this);
        exitBtn.on("pointerover", () => {
            exitBtn.setScale(1.05);
        }, this);
        exitBtn.on("pointerout", () => {
            exitBtn.setScale(1);
        }, this);
        this.midContainer.add(exitBtn);

        let self = this;

        this.scene.input.keyboard.createCombo("CARTESICHEAT"); 

        this.scene.input.keyboard.on("keycombomatch", function (event) {
            console.log("CHEAT MODE");
            self.visible = !self.visible;
            self.scene.input.keyboard.createCombo("CARTESICHEAT");

        });

        this.midContainer.setScale(GameVars.scaleX, 1);
    }

    private onClickAces(): void {

        RoomManager.switchPlayerCards(new Card("Ah"), new Card("As"));
        this.visible = false;
    }

    private onClickToogle(): void {

        RoomManager.toogleCardCooperation();
        this.visible = false;
    }
}
