import { StateLayer } from "./StateLayer";
import { GameVars } from "../../../GameVars";
import { GameConstants } from "../../../GameConstants";
import { RoomManager } from "../RoomManager";

export class GUI extends Phaser.GameObjects.Container {

    private topContainer: Phaser.GameObjects.Container;
    private infoBoxContainer: Phaser.GameObjects.Container;

    private midContainer: Phaser.GameObjects.Container; 
    private potText: Phaser.GameObjects.Text;
    private potImage: Phaser.GameObjects.Image;
    private stateLayer: StateLayer;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.topContainer = new Phaser.GameObjects.Container(this.scene, GameConstants.GAME_WIDTH / 2, 0);
        this.add(this.topContainer);

        this.infoBoxContainer = new Phaser.GameObjects.Container(this.scene, 0, 40);
        this.topContainer.add(this.infoBoxContainer);

        let boxBackground = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "txtbox_info_top");
        this.infoBoxContainer.add(boxBackground);

        let blindText = new Phaser.GameObjects.Image(this.scene, 35, 0, "texture_atlas_1", "txt_blinds");
        blindText.setOrigin(1, .5);
        this.infoBoxContainer.add(blindText);

        let blindValues = new Phaser.GameObjects.Text(this.scene, 50, 0, " 1/2 ", {fontFamily: "Oswald-Medium", fontSize: "30px", color: "#ffdf29"});
        blindValues.setOrigin(0, .5);
        this.infoBoxContainer.add(blindValues);

        this.midContainer = new Phaser.GameObjects.Container(this.scene, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
        this.add(this.midContainer);

        this.potText = new Phaser.GameObjects.Text(this.scene, 0, -60, "POT: 0", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#216652"});
        this.potText.setOrigin(.5);
        this.midContainer.add(this.potText);

        this.potImage = new Phaser.GameObjects.Image(this.scene, this.potText.x + this.potText.width / 2, -58, "texture_atlas_1", "chip");
        this.potImage.setOrigin(0, .5);
        this.midContainer.add(this.potImage);

        this.stateLayer = new StateLayer(this.scene);
        this.midContainer.add(this.stateLayer);

        this.setScalesAndPostions();
    }

    public setScalesAndPostions(): void {
        
        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.midContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.midContainer.setScale(GameVars.scaleX, 1);
            }
            this.midContainer.y = GameConstants.GAME_HEIGHT / 2;

            this.topContainer.setScale(GameVars.scaleX, 1);
        } else {

            this.midContainer.y = GameConstants.GAME_HEIGHT / 2 - 30;
            this.midContainer.setScale(1.3 + (0.55 - GameVars.scaleY) * 3, (1.3 + (0.55 - GameVars.scaleY) * 3) * GameVars.scaleY);

            this.topContainer.setScale(1, GameVars.scaleY);
        }
    }

    public updateBoard(): void {

        this.setStateText();
        this.setPotText();
    }

    public setStateText(): void {

        this.stateLayer.setText(GameConstants.STATES[RoomManager.getState()]);
    }

    public setPotText(): void {

        this.potText.text = "POT: " + (RoomManager.getPlayerBets() + RoomManager.getOpponentBets());
        this.potImage.x = this.potText.x + this.potText.width / 2;
    }

    public setWinnerText(endData: any): void {

        let text = "DRAW!";

        if (endData.isWinner[ALICE]) {
            text = "PLAYER WON!";
        } else if (endData.isWinner[BOB]) {
            text = "OPPONENT WON!";
        }

        this.stateLayer.setWinnerText(text);
    }

    public onEnd(endData: any): void {

        this.setWinnerText(endData);
    }
}
