import { RaiseSlider } from "./RaiseSlider";
import { RoomManager } from "./../RoomManager";
import { GameVars } from "../../../GameVars";
import { AudioManager } from "../../../AudioManager";
import { ethers } from "ethers";

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

        const maxRaise = await RoomManager.getMaxRaise();
        if (maxRaise.eq(ethers.constants.Zero)) {
            // all-in case: raiseValue should be zero
            GameVars.raiseValue = ethers.constants.Zero;
        }
        const raiseValueDisplay = (await RoomManager.getOpponentBets()).add(GameVars.raiseValue).sub(await RoomManager.getPlayerBets());
        this.raiseValue = new Phaser.GameObjects.Text(this.scene, icon.x + icon.width + 30, -42, " " + raiseValueDisplay.toString() + " ", {fontFamily: "Oswald-Medium", fontSize: "35px", color: "#FFFFFF"});
        this.raiseValue.setOrigin(.5);
        this.raiseValue.setShadow(1, 1, "#000000", 5);
        this.add(this.raiseValue);

        this.raiseSlider = new RaiseSlider(this.scene, this, this.raiseValue.x + 30, bckImage.width * bckImage.scaleX);
        this.add(this.raiseSlider);
    }

    public async onMinusDown(): Promise<void> {

        AudioManager.playSound("btn_click");

        let newRaiseValue = GameVars.raiseValue.sub(1);

        const maxRaise = await RoomManager.getMaxRaise();
        if (maxRaise.eq(ethers.constants.Zero)) {
            // all-in case: raiseValue should be zero
            newRaiseValue = ethers.constants.Zero;
        } else if (newRaiseValue.lt(1)) {
            // normal case: raiseValue cannot be less than 1
            newRaiseValue = ethers.BigNumber.from(1);
        }

        this.updateRaiseValue(newRaiseValue);
        this.raiseSlider.updateMarker();
    }

    public async onPlusDown(): Promise<void> {

        AudioManager.playSound("btn_click");

        let newRaiseValue = GameVars.raiseValue.add(1);

        const maxRaise = await RoomManager.getMaxRaise();
        if (newRaiseValue.gt(maxRaise)) {
            newRaiseValue = maxRaise;
        }

        this.updateRaiseValue(newRaiseValue);
        this.raiseSlider.updateMarker();
    }

    public async updateRaiseValue(value: ethers.BigNumber): Promise<void> {

        GameVars.raiseValue = value;
        const raiseValueDisplay = (await RoomManager.getOpponentBets()).add(GameVars.raiseValue).sub(await RoomManager.getPlayerBets());
        this.raiseValue.text = " " + raiseValueDisplay.toString() + " ";
    }

    private onDown(): void {

        AudioManager.playSound("btn_click");
        if (!GameVars.raiseValue.eq(ethers.constants.Zero)) {
            // execute raise (if raise value is > 1)
            RoomManager.playerRaise(GameVars.raiseValue);
        }
    }
}
