import { RaiseSlider } from "./RaiseSlider";
import { RoomManager } from "./../RoomManager";
import { GameVars } from "../../../GameVars";
import { AudioManager } from "../../../AudioManager";

export class RaiseButton extends Phaser.GameObjects.Container {

    private raiseValue: Phaser.GameObjects.Text;
    private raiseSlider: RaiseSlider;

    constructor(scene: Phaser.Scene, x: number, scaleX: number) {

        super(scene);
        this.init(x, scaleX);
    }

    private async init(x: number, scaleX: number): Promise<void> {
        this.setPosition(x, 0);

        let bckImage = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "btn_raise");
        bckImage.setOrigin(.5, 1);
        bckImage.scaleX = scaleX;
        bckImage.setInteractive();
        bckImage.on("pointerdown", this.onDown, this);
        this.add(bckImage);

        let text = new Phaser.GameObjects.Text(this.scene, - (bckImage.width * bckImage.scaleX) / 2 + 2, -42, " RAISE ", {fontFamily: "Oswald-Medium", fontSize: "35px", color: "#FFFFFF"});
        text.setOrigin(.0, .5);
        text.setShadow(1, 1, "#000000", 5);
        this.add(text);

        let icon = new Phaser.GameObjects.Image(this.scene, text.x + text.width, -42, "texture_atlas_1", "icon_raise");
        icon.setOrigin(0, .5);
        this.add(icon);

        this.raiseValue = new Phaser.GameObjects.Text(this.scene, icon.x + icon.width + 30, -42, " " + (await RoomManager.getOpponentBets() + GameVars.raiseValue  - await RoomManager.getPlayerBets()).toString() + " ", {fontFamily: "Oswald-Medium", fontSize: "35px", color: "#FFFFFF"});
        this.raiseValue.setOrigin(.5);
        this.raiseValue.setShadow(1, 1, "#000000", 5);
        this.add(this.raiseValue);

        this.raiseSlider = new RaiseSlider(this.scene, this, this.raiseValue.x + 30, bckImage.width * bckImage.scaleX);
        this.add(this.raiseSlider);
    }

    public async onMinusDown(): Promise<void> {

        AudioManager.playSound("btn_click");

        GameVars.raiseValue --;

        if (GameVars.raiseValue < 1) {
            GameVars.raiseValue = 1;
        }

        this.raiseValue.text = " " + (await RoomManager.getOpponentBets() + GameVars.raiseValue - await RoomManager.getPlayerBets()).toString() + " ";
        this.raiseSlider.updateMarker();
    }

    public async onPlusDown(): Promise<void> {

        AudioManager.playSound("btn_click");

        GameVars.raiseValue ++;

        if (GameVars.raiseValue > await RoomManager.getMaxRaise()) {
            GameVars.raiseValue = 1;
        }

        this.raiseValue.text = " " + (await RoomManager.getOpponentBets() + GameVars.raiseValue - await RoomManager.getPlayerBets()).toString() + " ";
        this.raiseSlider.updateMarker();
    }

    public async updateRaiseValue(value: number): Promise<void> {

        GameVars.raiseValue = value;
        this.raiseValue.text = " " + (await RoomManager.getOpponentBets() + GameVars.raiseValue  - await RoomManager.getPlayerBets()).toString() + " ";
    }

    private onDown(): void {

        AudioManager.playSound("btn_click");

        RoomManager.playerRaise(GameVars.raiseValue);
    }
}
