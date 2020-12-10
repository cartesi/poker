import { GameVars } from "./../../GameVars";
import { RoomManager } from "./RoomManager";

export class HUD extends Phaser.GameObjects.Container {

    private startButton: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene) {

        super(scene);

        let topContainer = new Phaser.GameObjects.Container(this.scene);
        topContainer.scaleX = GameVars.scaleX;
        this.add(topContainer);

        let startText = new Phaser.GameObjects.Text(this.scene, 80, 55, "START", {fontFamily: "Oswald-Medium", fontSize: "30px", color: "#FFFFFF"});

        this.startButton = new Phaser.GameObjects.Image(this.scene, 80, 55, "texture_atlas_1", "btn_blue");
        this.startButton.setInteractive();
        this.startButton.on("pointerdown", () => {
            RoomManager.startRound();
        }, this);
        this.startButton.on("pointerover", () => {
            this.startButton.setScale(1.05);
            startText.setScale(1.05);
        }, this);

        this.startButton.on("pointerout", () => {
            this.startButton.setScale(1);
            startText.setScale(1);
        }, this);
        this.add(this.startButton);

        startText.setOrigin(.5);
        
        this.add(startText);
    }
}
