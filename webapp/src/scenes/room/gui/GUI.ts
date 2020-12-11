import { GameVars } from "../../../GameVars";
import { GameConstants } from "../../../GameConstants";
import { RoomManager } from "../RoomManager";

export class GUI extends Phaser.GameObjects.Container {

    private stateText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.stateText = new Phaser.GameObjects.Text(this.scene, GameConstants.GAME_WIDTH / 2, 80, "", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        this.stateText.setOrigin(.5);
        this.stateText.setStroke("#000000", 4);
        this.add(this.stateText);

        if (GameVars.landscape) {
            this.stateText.scaleX = GameVars.scaleX;
        }
    }

    public setStateText(): void {

        this.stateText.text = GameConstants.STATES[RoomManager.getState()];
    }
}
