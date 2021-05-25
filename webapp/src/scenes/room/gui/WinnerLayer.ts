import { Card } from "../table-container/Card";
import { RoomManager } from "../RoomManager";

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

        let text = "DRAW!";
        let winnerHand = [];

        if (endData.isWinner[ALICE]) {
            text = "PLAYER WON!";
            if (endData.hands && endData.hands[ALICE]) {
                winnerHand = endData.hands[ALICE];
            } 
        } else if (endData.isWinner[BOB]) {
            text = "OPPONENT WON!";
            if (endData.hands && endData.hands[BOB]) {
                winnerHand = endData.hands[BOB];
            }
        }

        let title = new Phaser.GameObjects.Text(this.scene, 0, -122, text, {fontFamily: "Oswald-Medium", fontSize: "40px", color: "#FFFFFF"});
        title.setOrigin(.5);
        this.add(title);

        if (winnerHand && winnerHand.length) {
            for (let i = 0; i < 5; i++) {
                let card = new Card(this.scene, -130 + 65 * i, -55);
                card.alpha = 0;
                card.setScale(.55);
                card.setValue(RoomManager.getCardSuitValue(winnerHand[i]));
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
