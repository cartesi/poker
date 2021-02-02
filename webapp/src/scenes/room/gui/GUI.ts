import { StateLayer } from "./StateLayer";
import { GameVars } from "../../../GameVars";
import { GameConstants } from "../../../GameConstants";
import { RoomManager } from "../RoomManager";
import { WinnerLayer } from "./WinnerLayer";

export class GUI extends Phaser.GameObjects.Container {

    private topContainer: Phaser.GameObjects.Container;

    private midContainer: Phaser.GameObjects.Container; 
    private potText: Phaser.GameObjects.Text;
    private potImage: Phaser.GameObjects.Image;
    private stateLayer: StateLayer;

    private botContainer: Phaser.GameObjects.Container; 
    private winnerLayer: WinnerLayer;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.topContainer = new Phaser.GameObjects.Container(this.scene, GameConstants.GAME_WIDTH / 2, 0);
        this.add(this.topContainer);

        this.midContainer = new Phaser.GameObjects.Container(this.scene, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
        this.add(this.midContainer);

        this.potText = new Phaser.GameObjects.Text(this.scene, -30, -60, "POT: 0", {fontFamily: "Oswald-Medium", fontSize: "40px", color: "#216652"});
        this.potText.setOrigin(.5);
        this.midContainer.add(this.potText);

        this.potImage = new Phaser.GameObjects.Image(this.scene, this.potText.x + this.potText.width / 2 + 10, -58, "texture_atlas_1", "chip");
        this.potImage.setOrigin(0, .5);
        this.midContainer.add(this.potImage);

        this.stateLayer = new StateLayer(this.scene);
        this.midContainer.add(this.stateLayer);

        this.botContainer = new Phaser.GameObjects.Container(this.scene, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT);
        this.add(this.botContainer);

        this.winnerLayer = new WinnerLayer(this.scene);
        this.botContainer.add(this.winnerLayer);

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
            this.botContainer.setScale(GameVars.scaleX, 1);
        } else {

            this.midContainer.y = GameConstants.GAME_HEIGHT / 2 - 47;
            this.midContainer.setScale(1.3 + (0.55 - GameVars.scaleY) * 3, (1.3 + (0.55 - GameVars.scaleY) * 3) * GameVars.scaleY);

            this.topContainer.setScale(1, GameVars.scaleY);
            this.botContainer.setScale(1.5 + (0.55 - GameVars.scaleY) * 3, (1.5 + (0.55 - GameVars.scaleY) * 3) * GameVars.scaleY);
        }
    }

    public showWinner(endData: any): void {

        this.winnerLayer.showWinner(endData);
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
        this.potImage.x = this.potText.x + this.potText.width / 2 + 10;
    }
}
