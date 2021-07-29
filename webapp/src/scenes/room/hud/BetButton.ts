import { AudioManager } from './../../../AudioManager';
import { RoomManager } from "../RoomManager";
import { GameConstants } from "./../../../GameConstants";
import { BetType } from "../../../services/Game";

export class BetButton extends Phaser.GameObjects.Container {

    private betType: string;

    constructor(scene: Phaser.Scene, betType: string, x: number, scaleX: number) {

        super(scene);
        this.init(betType, x, scaleX);
    }

    private async init(betType: string, x: number, scaleX: number): Promise<void> {

        this.setPosition(x, 0);
        this.betType = betType;

        let bckImage = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "btn_" + betType.toLowerCase());
        bckImage.setOrigin(.5, 1);
        bckImage.setInteractive();
        bckImage.scaleX = scaleX;
        bckImage.on("pointerdown", this.onDown, this);
        this.add(bckImage);

        let text = new Phaser.GameObjects.Text(this.scene, -25, -42, " " + betType + " ", {fontFamily: "Oswald-Medium", fontSize: "35px", color: "#FFFFFF"});
        text.setOrigin(.5);
        text.setShadow(1, 1, "#000000", 5);
        this.add(text);

        let icon = new Phaser.GameObjects.Image(this.scene, text.x + text.width / 2, -40, "texture_atlas_1", "icon_" + betType.toLowerCase());
        icon.setOrigin(0, .5);
        this.add(icon);

        switch (betType) {
            case BetType.CALL:

                text.x = -60;
                icon.x = text.x + text.width / 2;
                let betValue = (await RoomManager.getOpponentBets()).sub(await RoomManager.getPlayerBets());
                let textValue = new Phaser.GameObjects.Text(this.scene, icon.x + icon.width / 2 + 55, -42, " " + betValue + " ", {fontFamily: "Oswald-Medium", fontSize: "35px", color: "#FFFFFF"});
                textValue.setOrigin(.5);
                textValue.setShadow(1, 1, "#000000", 5);
                this.add(textValue);
                break;
            case BetType.CHECK:
                text.x = -40;
                break;
            case BetType.FOLD:
                icon.y = -36;
                break;
            default:
                break;
        }
    }

    private onDown(): void {

        AudioManager.playSound("btn_click");

        switch (this.betType) {
            case BetType.CALL:
                RoomManager.playerCall();
                break;
            case BetType.CHECK:
                RoomManager.playerCheck();
                break;
            case BetType.FOLD:
                RoomManager.playerFold();
                break;
            default:
                break;
        }
    }
}
