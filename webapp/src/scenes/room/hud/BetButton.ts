import { RoomManager } from '../RoomManager';
import { GameConstants } from './../../../GameConstants';
import { GameVars } from "./../../../GameVars";

export class BetButton extends Phaser.GameObjects.Container {

    private betType: string;

    constructor(scene: Phaser.Scene, betType: string, x: number, scaleX: number) {

        super(scene);

        this.setPosition(x, 0);
        this.betType = betType;

        let bckImage = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "btn_" + betType.toLowerCase());
        bckImage.setOrigin(.5, 1);
        bckImage.setInteractive();
        bckImage.scaleX = scaleX;
        bckImage.on("pointerdown", this.onDown, this);
        this.add(bckImage);

        let textImage = new Phaser.GameObjects.Image(this.scene, 0, -30, "texture_atlas_1", "txt_" + betType.toLowerCase());
        this.add(textImage);

    }

    private onDown(): void {

        switch (this.betType) {
            case GameConstants.ACTION_CALL:
                RoomManager.playerCall();
                break;
            case GameConstants.ACTION_CHECK:
                RoomManager.playerCheck();
                break;
            case GameConstants.ACTION_FOLD:
                RoomManager.playerFold();
                break;
            default:
                break;
        }
    }
}
