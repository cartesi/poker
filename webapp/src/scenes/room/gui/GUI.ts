import { GameVars } from "../../../GameVars";
import { GameConstants } from "../../../GameConstants";
import { RoomManager } from "../RoomManager";

export class GUI extends Phaser.GameObjects.Container {

    private stateText: Phaser.GameObjects.Text;
    private winnerText: Phaser.GameObjects.Text;
    private betText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.stateText = new Phaser.GameObjects.Text(this.scene, GameConstants.GAME_WIDTH / 2, 80, "", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        this.stateText.setOrigin(.5);
        this.stateText.setStroke("#000000", 4);
        this.add(this.stateText);

        this.winnerText = new Phaser.GameObjects.Text(this.scene, GameConstants.GAME_WIDTH / 2, 180, "", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        this.winnerText.setOrigin(.5);
        this.winnerText.setStroke("#000000", 4);
        this.add(this.winnerText);

        this.betText = new Phaser.GameObjects.Text(this.scene, GameConstants.GAME_WIDTH / 2, 360, "", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        this.betText.setOrigin(.5);
        this.betText.setStroke("#000000", 4);
        this.add(this.betText);

        if (GameVars.landscape) {
            this.stateText.scaleX = GameVars.scaleX;
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
