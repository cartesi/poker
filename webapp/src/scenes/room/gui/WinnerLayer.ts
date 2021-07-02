import { Card } from "../table-container/Card";
import { RoomManager } from "../RoomManager";
import { GameVars } from "../../../GameVars";

export class WinnerLayer extends Phaser.GameObjects.Container {

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.visible = false;
    }

    public showWinner(endData: any): void {

        this.removeAll();
        this.visible = true;
        this.alpha = 0;

        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            ease: Phaser.Math.Easing.Linear,
            duration: 500,
        });

        let text = "";
        let winnerHand = [];

        const isPlayerWinner = endData.isWinner[GameVars.playerIndex];
        const isOpponentWinner = endData.isWinner[GameVars.opponentIndex];
        const playerHand = (endData.hands && endData.hands[GameVars.playerIndex]) ? endData.hands[GameVars.playerIndex] : [];
        const opponentHand = (endData.hands && endData.hands[GameVars.opponentIndex]) ? endData.hands[GameVars.opponentIndex] : [];

        if (isPlayerWinner && isOpponentWinner) {
            text = "IT'S A TIE!";
            winnerHand = playerHand;
        } else if (isPlayerWinner) {
            text = "PLAYER WON!";
            winnerHand = playerHand;
        } else {
            text = "OPPONENT WON!";
            winnerHand = opponentHand;
        }

        let title = new Phaser.GameObjects.Text(this.scene, 0, -122, text, {fontFamily: "Oswald-Medium", fontSize: "40px", color: "#FFFFFF"});
        title.setOrigin(.5);
        this.add(title);

        if (winnerHand && winnerHand.length) {
            for (let i = 0; i < 5; i++) {
                let card = new Card(this.scene, -130 + 65 * i, -55);
                card.alpha = 0;
                card.setScale(.55);
                card.setValue(winnerHand[i]);
                this.add(card);
    
                this.scene.tweens.add({
                    targets: card,
                    alpha: 1,
                    ease: Phaser.Math.Easing.Linear,
                    duration: 150,
                    delay: 500 + i * 150
                });
            }
        }
    }

    public hide(): void {

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            ease: Phaser.Math.Easing.Linear,
            duration: 250,
            onComplete: () => {
                this.visible = false;
            },
            onCompleteScope: this
        });

    }
}
