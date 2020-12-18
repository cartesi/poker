import { GameVars } from "../../../GameVars";
import { GameConstants } from "../../../GameConstants";
import { RoomManager } from "../RoomManager";

export class GUI extends Phaser.GameObjects.Container {

    private stateText: Phaser.GameObjects.Text;
    private winnerText: Phaser.GameObjects.Text;
    private betText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.x = GameConstants.GAME_WIDTH / 2;
        this.y = GameConstants.GAME_HEIGHT / 2;

        this.stateText = new Phaser.GameObjects.Text(this.scene, 0, -240, "", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        this.stateText.setOrigin(.5);
        this.stateText.setStroke("#000000", 4);
        this.add(this.stateText);

        this.winnerText = new Phaser.GameObjects.Text(this.scene, 0, -140, "", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        this.winnerText.setOrigin(.5);
        this.winnerText.setStroke("#000000", 4);
        this.add(this.winnerText);

        this.betText = new Phaser.GameObjects.Text(this.scene, 0, 40, "", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        this.betText.setOrigin(.5);
        this.betText.setStroke("#000000", 4);
        this.add(this.betText);

        this.setScalesAndPostions();
    }

    public setScalesAndPostions(): void {
        
        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.setScale(GameVars.scaleY, 1);
            }
            this.stateText.setPosition(0, -240);
            this.betText.setPosition(0, 40);
            this.winnerText.setPosition(0, -140);
        } else {
            this.setScale(1.3 + (0.55 - GameVars.scaleY), (1.3 + (0.55 - GameVars.scaleY)) * GameVars.scaleY);
            this.stateText.setPosition(200, -270);
            this.betText.setPosition(200, -230);
            this.winnerText.setPosition(200, -190);
        }
    }

    public setStateText(): void {

        this.stateText.text = GameConstants.STATES[RoomManager.getState()];
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
        }, 2000);
    }

    public onEnd(endData: any): void {

        this.setWinnerText(endData);
    }

    public showBet(value: string, number: number): void {

        this.betText.text = (number === ALICE ? "PLAYER " : "OPPONENT ") + value;

        setTimeout(() => {
            this.betText.text = "";
        }, 1000);
    }
}
