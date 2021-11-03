import { RoomManager } from './../RoomManager';
import { GameVars } from './../../../GameVars';
import { GameConstants } from "../../../GameConstants";
import { RaiseButton } from "./RaiseButton";
import { ethers } from 'ethers';

export class RaiseSlider extends Phaser.GameObjects.Container {

    private raiseButton: RaiseButton;
    private btnMarker: Phaser.GameObjects.Image;
    private btnMinus: Phaser.GameObjects.Image;
    private btnPlus: Phaser.GameObjects.Image;
    private isDown: boolean;

    constructor(scene: Phaser.Scene, raiseButton: RaiseButton, initialX: number, totalWidth: number) {

        super(scene);

        this.raiseButton = raiseButton;
        this.isDown = false;
        this.x = initialX + 5;

        let bckImage = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "btn_raise_slide");
        bckImage.setOrigin(0, 1);
        bckImage.scaleX = (totalWidth / 2 - this.x) / bckImage.width;
        bckImage.setInteractive();
        bckImage.on("pointerdown", () => {
            // 
        }, this);
        this.add(bckImage);

        let bar = new Phaser.GameObjects.Image(this.scene, 0, -44, "texture_atlas_1", "slide_bar");
        bar.setOrigin(0, .5);
        this.add(bar);

        this.btnMinus = new Phaser.GameObjects.Image(this.scene, 40, -44, "texture_atlas_1", "btn_minus");
        this.btnMinus.setInteractive();
        this.btnMinus.on("pointerdown", this.onMinusDown, this);
        this.btnMinus.on("pointerover", () => {
            this.btnMinus.setScale(1.05);
        }, this);
        this.btnMinus.on("pointerout", () => {
            this.btnMinus.setScale(1);
        }, this);
        this.add(this.btnMinus);

        this.btnPlus = new Phaser.GameObjects.Image(this.scene, totalWidth / 2 - this.x, -44, "texture_atlas_1", "btn_plus");
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

        bar.x = this.btnMinus.x + this.btnMinus.width / 2;
        bar.scaleX = (this.btnPlus.x - this.btnMinus.x - this.btnPlus.width / 2 - this.btnMinus.width / 2) / bar.width;

        this.btnMarker = new Phaser.GameObjects.Image(this.scene, this.btnMinus.x + (this.btnPlus.x - this.btnMinus.x) / 2, -44, "texture_atlas_1", "btn_slide_marker");
        this.btnMarker.setInteractive();
        this.btnMarker.on("pointerdown", () => {
            this.isDown = true;
        }, this);
        this.btnMarker.on("pointerup", () => {
            this.isDown = false;
        }, this);
        // this.btnMarker.on("pointerout", () => {
        //     this.isDown = false;
        // }, this);
        this.add(this.btnMarker);

        this.updateMarker();

        this.scene.sys.updateList.add(this);
    }

    public async preUpdate(time: number, delta: number): Promise<void> {

        if (this.isDown) {

            let scaleX = Math.min(GameVars.scaleX, 1.2);

            if (GameVars.landscape) {
                if (GameVars.scaleX > 1.2) {
                    scaleX = 1;
                }
            } else {
                scaleX = 1.2;
            }

            let x = (this.scene.input.activePointer.x - this.x * scaleX - this.raiseButton.x * scaleX - GameConstants.GAME_WIDTH / 2) / scaleX;

            if (x < this.btnMinus.x + this.btnMinus.width) {
                x = this.btnMinus.x + this.btnMinus.width;
            } else if (x > this.btnPlus.x - this.btnPlus.width) {
                x = this.btnPlus.x - this.btnPlus.width;
            }

            this.btnMarker.x = x;

            let min = ethers.BigNumber.from(1);
            let max = await RoomManager.getMaxRaise();

            let minBar = this.btnMinus.x + this.btnMinus.width;
            let maxBar = this.btnPlus.x - this.btnPlus.width;

            x = (x - minBar) / (maxBar - minBar);
            let raiseValue = min.add(Math.round(max.sub(min).toNumber() * x));

            this.raiseButton.updateRaiseValue(raiseValue);
        }

        if (!this.scene.input.activePointer.isDown) {
            this.isDown = false;
        }
    }

    public async updateMarker(): Promise<void> {

        let min = ethers.BigNumber.from(1);
        let max = await RoomManager.getMaxRaise();

        let minBar = this.btnMinus.x + this.btnMinus.width;
        let maxBar = this.btnPlus.x - this.btnPlus.width;

        let x = GameVars.raiseValue.sub(min).toNumber() / max.sub(min).toNumber();
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
