import { RoomManager } from './../RoomManager';
import { GameVars } from './../../../GameVars';
import { GameConstants } from "../../../GameConstants";
import { RaiseButton } from "./RaiseButton";

export class RaiseSlider extends Phaser.GameObjects.Container {

    private raiseButton: RaiseButton;
    private btnMarker: Phaser.GameObjects.Image;
    private btnMinus: Phaser.GameObjects.Image;
    private btnPlus: Phaser.GameObjects.Image;
    private canMove: boolean;

    constructor(scene: Phaser.Scene, raiseButton: RaiseButton, initialX: number, totalWidth: number) {

        super(scene);

        this.raiseButton = raiseButton;
        this.canMove = false;
        this.x = initialX + 5;

        let bckImage = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "btn_raise_slide");
        bckImage.setOrigin(0, 1);
        bckImage.scaleX = (totalWidth / 2 - this.x) / bckImage.width;
        bckImage.setInteractive();
        bckImage.on("pointerdown", () => {
            // 
        }, this);
        this.add(bckImage);

        let bar = new Phaser.GameObjects.Image(this.scene, 0, -34, "texture_atlas_1", "slide_bar");
        bar.setOrigin(0, .5);
        this.add(bar);

        this.btnMinus = new Phaser.GameObjects.Image(this.scene, 30, -34, "texture_atlas_1", "btn_minus");
        this.btnMinus.setInteractive();
        this.btnMinus.on("pointerdown", this.onMinusDown, this);
        this.btnMinus.on("pointerover", () => {
            this.btnMinus.setScale(1.05);
        }, this);
        this.btnMinus.on("pointerout", () => {
            this.btnMinus.setScale(1);
        }, this);
        this.add(this.btnMinus);

        this.btnPlus = new Phaser.GameObjects.Image(this.scene, totalWidth / 2 - this.x, -34, "texture_atlas_1", "btn_plus");
        this.btnPlus.x -= this.btnPlus.width / 2 + 10;
        this.btnPlus.setInteractive();
        this.btnPlus.on("pointerdown", this.onPlusDown, this);
        this.btnPlus.on("pointerover", () => {
            this.btnPlus.setScale(1.05);
        }, this);
        this.btnPlus.on("pointerout", () => {
            this.btnPlus.setScale(1);
        }, this);
        this.add(this.btnPlus);

        bar.x = this.btnMinus.x;
        bar.scaleX = (this.btnPlus.x - this.btnMinus.x) / bar.width;

        this.btnMarker = new Phaser.GameObjects.Image(this.scene, this.btnMinus.x + (this.btnPlus.x - this.btnMinus.x) / 2, -34, "texture_atlas_1", "btn_slide_marker");
        this.btnMarker.setInteractive();
        this.btnMarker.on("pointerdown", () => {
            this.canMove = true;
        }, this);
        this.btnMarker.on("pointerup", () => {
            this.canMove = false;
        }, this);
        this.btnMarker.on("pointerout", () => {
            this.canMove = false;
        }, this);
        this.add(this.btnMarker);

        this.updateMarker();

        this.scene.sys.updateList.add(this);
    }

    public preUpdate(time: number, delta: number): void {

        if (this.canMove) {
            let x = (this.scene.input.activePointer.x - this.x * GameVars.scaleX - this.raiseButton.x * GameVars.scaleX - GameConstants.GAME_WIDTH / 2) / GameVars.scaleX;

            if (x < this.btnMinus.x + this.btnMinus.width) {
                x = this.btnMinus.x + this.btnMinus.width;
            } else if (x > this.btnPlus.x - this.btnPlus.width) {
                x = this.btnPlus.x - this.btnPlus.width;
            }

            this.btnMarker.x = x;

            let min = 1;
            let max = RoomManager.getMaxRaise();

            let minBar = this.btnMinus.x + this.btnMinus.width;
            let maxBar = this.btnPlus.x - this.btnPlus.width;

            x = (x - minBar) / (maxBar - minBar);
            x = Math.round(min + x * (max - min));

            this.raiseButton.updateRaiseValue(x);
        } 
    }

    public updateMarker(): void {

        let min = 1;
        let max = RoomManager.getMaxRaise();

        let minBar = this.btnMinus.x + this.btnMinus.width;
        let maxBar = this.btnPlus.x - this.btnPlus.width;

        let x = (GameVars.raiseValue - min) / (max - min);
        x = minBar + x * (maxBar - minBar);

        this.btnMarker.x = x;
    }

    private onMinusDown(): void {

        this.raiseButton.onMinusDown();
    }

    private onPlusDown(): void {

        this.raiseButton.onPlusDown();
    }
}
