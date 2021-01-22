import { RaiseSlider } from './RaiseSlider';
import { RoomManager } from "./../RoomManager";
import { GameVars } from '../../../GameVars';

export class RaiseButton extends Phaser.GameObjects.Container {

    private raiseValue: Phaser.GameObjects.Text;
    private raiseSlider: RaiseSlider;

    constructor(scene: Phaser.Scene, x: number, scaleX: number) {

        super(scene);

        this.setPosition(x, 0);

        let bckImage = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "btn_raise");
        bckImage.setOrigin(.5, 1);
        bckImage.scaleX = scaleX;
        bckImage.setInteractive();
        bckImage.on("pointerdown", this.onDown, this);
        this.add(bckImage);

        let text = new Phaser.GameObjects.Image(this.scene, - (bckImage.width * bckImage.scaleX) / 2 + 2, -30, "texture_atlas_1", "txt_raise");
        text.setOrigin(.0, .5);
        this.add(text);

        let icon = new Phaser.GameObjects.Image(this.scene, text.x + text.width, -32, "texture_atlas_1", "icon_raise");
        icon.setOrigin(0, .5);
        this.add(icon);

        let boxImage = new Phaser.GameObjects.Image(this.scene, icon.x + icon.width, -35, "texture_atlas_1", "txtbox_raise");
        boxImage.setOrigin(0, .5);
        this.add(boxImage);

        this.raiseValue = new Phaser.GameObjects.Text(this.scene, boxImage.x + boxImage.width / 2, -35, GameVars.raiseValue.toString(), {fontFamily: "Oswald-Medium", fontSize: "30px", color: "#000000"});
        this.raiseValue.setOrigin(.5);
        this.add(this.raiseValue);

        this.raiseSlider = new RaiseSlider(this.scene, this, boxImage.x + boxImage.width, bckImage.width * bckImage.scaleX);
        this.add(this.raiseSlider);
    }

    public onMinusDown(): void {

        GameVars.raiseValue --;

        if (GameVars.raiseValue < 1) {
            GameVars.raiseValue = 1;
        }

        this.raiseValue.text = GameVars.raiseValue.toString();
        this.raiseSlider.updateMarker();
    }

    public onPlusDown(): void {

        GameVars.raiseValue ++;

        if (GameVars.raiseValue > RoomManager.getMaxRaise()) {
            GameVars.raiseValue = 1;
        }

        this.raiseValue.text = GameVars.raiseValue.toString();
        this.raiseSlider.updateMarker();
    }

    public updateRaiseValue(value: number) {

        GameVars.raiseValue = value;
        this.raiseValue.text = GameVars.raiseValue.toString();
    }

    private onDown(): void {

        RoomManager.playerRaise(GameVars.raiseValue);
    }
}
