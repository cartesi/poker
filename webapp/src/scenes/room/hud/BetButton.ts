import { GameVars } from './../../../GameVars';
import { RoomManager } from "../RoomManager";
import { GameConstants } from "./../../../GameConstants";

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

        // TODO: añadir texto con valor de call
        // if (betType === GameConstants.ACTION_CALL) {

        //     let betValue = (RoomManager.getOpponentBets() - RoomManager.getPlayerBets());

        //     let textValue = new Phaser.GameObjects.Text(this.scene, 33, -32, " " + betValue + "000 ", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        //     textValue.setOrigin(0, .5);
        //     textValue.setShadow(2, 2, "#000000", 5);
        //     this.add(textValue);

        //     textImage.x = 30;
        //     textImage.setOrigin(1, .5);

        //     console.log(textValue.text.length);

        //     switch (textValue.text.length) {
        //         case 3:
        //             textImage.x = 42 * GameVars.scaleX;
        //             textValue.x = 42 * GameVars.scaleX;
        //             break;
        //         case 4:
        //             textImage.x = 37 * GameVars.scaleX;
        //             textValue.x = 47 * GameVars.scaleX; 
        //             break;
        //         case 5:
        //             textImage.x = 30 * GameVars.scaleX;
        //             textValue.x = 30 * GameVars.scaleX;
        //             break;
        //         case 6: 
        //             textImage.x = 28 * GameVars.scaleX;
        //             textValue.x = 28 * GameVars.scaleX;
        //             break;
        //         default:
        //             break;
        //     }
        // }

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
