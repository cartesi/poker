import { GameVars } from './../../GameVars';
import { GameConstants } from "./../../GameConstants";
import { Card } from './table-container/Card';
import { RoomManager } from './RoomManager';

export class WinnerLayer extends Phaser.GameObjects.Container {
    
    private midContainer: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.visible = false;

        let background = new Phaser.GameObjects.Graphics(this.scene);
        background.fillStyle(0x000000, .5);
        background.fillRect(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
        background.setInteractive(new Phaser.Geom.Rectangle(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);
        this.add(background);

        this.midContainer = new Phaser.GameObjects.Container(this.scene);
        this.midContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
        this.add(this.midContainer);

        this.setScalesAndPositions();
    }

    public setScalesAndPositions(): void {

        let reducedScale = .75;

        if (GameVars.landscape) {
            this.midContainer.setScale(reducedScale * GameVars.scaleX, reducedScale * 1);
            this.midContainer.y = GameConstants.GAME_HEIGHT / 2 + 30;
        } else {
            this.midContainer.setScale(reducedScale * 1, GameVars.scaleY * reducedScale);
            this.midContainer.y = GameConstants.GAME_HEIGHT / 2;
        }
    }

    public showWinner(endData: any): void {

        this.midContainer.removeAll();
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

        console.log(endData);

        if (endData.isWinner[ALICE]) {
            text = "PLAYER WON!";
            if (endData.hands) {
                winnerHand = endData.hands[ALICE];
            } 
        } else if (endData.isWinner[BOB]) {
            text = "OPPONENT WON!";
            if (endData.hands) {
                winnerHand = endData.hands[BOB];
            }
        }

        console.log(endData);

        let title = new Phaser.GameObjects.Text(this.scene, 0, -150, text, {fontFamily: "Oswald-Medium", fontSize: "80px", color: "#FFFFFF"});
        title.setOrigin(.5);
        this.midContainer.add(title);

        if (winnerHand.length) {
            for (let i = 0; i < 5; i++) {
                let card = new Card(this.scene, -220 + 110 * i, 0);
                card.alpha = 0;
                card.setValue(RoomManager.getCardSuitValue(winnerHand[i]));
                this.midContainer.add(card);
    
                this.scene.tweens.add({
                    targets: card,
                    alpha: 1,
                    ease: Phaser.Math.Easing.Linear,
                    duration: 150,
                    delay: 500 + i * 150
                });
            }
        }

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            ease: Phaser.Math.Easing.Linear,
            duration: 500,
            delay: 4000,
            onComplete: () => {
                this.visible = false;
            },
            onCompleteScope: this
        });

    }
}
