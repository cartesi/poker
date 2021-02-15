import { GameConstants } from "../../GameConstants";
import { GameVars } from "../../GameVars";

export class SuffleCardsLayer extends Phaser.GameObjects.Container {
    
    private midContainer: Phaser.GameObjects.Container;

    private cards: Phaser.GameObjects.Image[];
    private timer: NodeJS.Timeout;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.visible = false;

        this.cards = [];

        this.midContainer = new Phaser.GameObjects.Container(this.scene);
        this.midContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
        this.add(this.midContainer);

        let bck = new Phaser.GameObjects.Image(this.scene, 0, 30, "texture_atlas_1", "phase_shadow");
        bck.setScale(1, 1);
        this.midContainer.add(bck);

        let text = new Phaser.GameObjects.Text(this.scene, -70, 30, "SHUFFLING", {fontFamily: "Oswald-Medium", fontSize: "80px", color: "#FFFFFF"});
        text.setOrigin(.5);
        this.midContainer.add(text);

        this.setScalesAndPositions();
    }

    public show(): void {

        this.alpha = 0;
        this.visible = true;
        
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            ease: Phaser.Math.Easing.Linear,
            duration: 250,
            onComplete: () => {
                // 
            },
            onCompleteScope: this
        });

        this.startShuffle();
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

        clearInterval(this.timer);
    }

    public setScalesAndPositions(): void {

        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.midContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.midContainer.setScale(GameVars.scaleX, 1);
            }
            this.midContainer.y = GameConstants.GAME_HEIGHT / 2;
        } else {

            this.midContainer.y = GameConstants.GAME_HEIGHT / 2 - 47;
            this.midContainer.setScale(1.3 + (0.55 - GameVars.scaleY) * 3, (1.3 + (0.55 - GameVars.scaleY) * 3) * GameVars.scaleY);
        }
    }

    private startShuffle(): void {

        this.midContainer.remove(this.cards);

        this.cards = [];

        for (let i = 0; i < 10; i++) {

            let img = new Phaser.GameObjects.Image(this.scene, 200 - i * 1, 30 - i * 1, "texture_atlas_2", "card-back");
            img.setScale(.7);
            this.midContainer.add(img);
            this.cards.push(img);
        }

        this.timer = setInterval(() => {
            this.startAnimation();
        }, 800);
    }

    private startAnimation(): void {

        const left = [];
        const right = [];

        for (let i = 0; i < this.cards.length; i++) {
            const card = {
              i: this.cards[i],
              xStart: this.cards[i].x,
              yStart: this.cards[i].y,
              xTarget: 50 + 10 * Math.random(),
              yTarget: -i * 1 / 4
            };

            if (Math.random() < 0.5) {
              left.push(card);
              card.xTarget *= -1;
            } else {
              right.push(card);
            }

            const { xStart, xTarget, yStart, yTarget } = card;

            this.scene.tweens.add({
                targets: this.cards[i],
                x: xStart + xTarget,
                y: yStart + yTarget,
                ease: Phaser.Math.Easing.Cubic.InOut,
                duration: 250,
                delay: i * 4,
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: this.cards[i],
                        x: xStart,
                        y: yStart,
                        ease: Phaser.Math.Easing.Cubic.InOut,
                        duration: 250,
                        delay: 100,
                        onComplete: () => {
                            // 
                        },
                        onCompleteScope: this
                    });
                },
                onCompleteScope: this
            });
        }
    }
}
