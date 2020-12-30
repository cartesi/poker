import { GameVars } from "../../../GameVars";
import { GameConstants } from "../../../GameConstants";
import { RoomManager } from "../RoomManager";

export class GUI extends Phaser.GameObjects.Container {

    private topContainer: Phaser.GameObjects.Container;
    private topBackground: Phaser.GameObjects.Graphics;
    private stateText: Phaser.GameObjects.Text;
    private winnerText: Phaser.GameObjects.Text;

    private midContainer: Phaser.GameObjects.Container; 
    private potText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.topBackground = new Phaser.GameObjects.Graphics(this.scene);
        this.topBackground.fillStyle(0x000000, .75);
        this.topBackground.fillRect(0, 0, GameConstants.GAME_WIDTH, 50);
        this.add(this.topBackground);

        this.topContainer = new Phaser.GameObjects.Container(this.scene, GameConstants.GAME_WIDTH / 2, 0);
        this.add(this.topContainer);

        this.stateText = new Phaser.GameObjects.Text(this.scene, 0, 25, "", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        this.stateText.setOrigin(.5);
        this.topContainer.add(this.stateText);

        this.winnerText = new Phaser.GameObjects.Text(this.scene, 200, 25, "", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        this.winnerText.setOrigin(.5);
        this.topContainer.add(this.winnerText);

        this.midContainer = new Phaser.GameObjects.Container(this.scene, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
        this.add(this.midContainer);

        this.potText = new Phaser.GameObjects.Text(this.scene, 0, -60, "POT: ???", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        this.potText.setOrigin(.5);
        this.midContainer.add(this.potText);

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
            this.topBackground.setScale(1);
        } else {

            this.midContainer.y = GameConstants.GAME_HEIGHT / 2 - 30;
            this.midContainer.setScale(1.3 + (0.55 - GameVars.scaleY) * 3, (1.3 + (0.55 - GameVars.scaleY) * 3) * GameVars.scaleY);

            this.topContainer.setScale(1, GameVars.scaleY);
            this.topBackground.setScale(1, .75);
        }
    }

    public updateBoard(): void {

        this.setStateText();
        this.setPotText();
    }

    public setStateText(): void {

        this.stateText.text = GameConstants.STATES[RoomManager.getState()];
    }

    public setPotText(): void {

        this.potText.text = "POT: " + (RoomManager.getPlayerBets() + RoomManager.getOpponentBets());
    }

    public setWinnerText(endData: any): void {

        let text = "DRAW!";

        console.log(endData);

        if (endData.isWinner[ALICE]) {
            text = "PLAYER WON!";
        } else if (endData.isWinner[BOB]) {
            text = "OPPONENT WON!";
        }

        this.winnerText.text = text;

        setTimeout(() => {
            this.winnerText.text = "";
        }, 4000);
    }

    public onEnd(endData: any): void {

        this.setWinnerText(endData);
    }
}
