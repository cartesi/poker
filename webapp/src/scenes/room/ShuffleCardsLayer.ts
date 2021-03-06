import { AudioManager } from "../../AudioManager";
import { GameConstants } from "../../GameConstants";
import { GameVars } from "../../GameVars";

export class ShuffleCardsLayer extends Phaser.GameObjects.Container {

    private midContainer: Phaser.GameObjects.Container;

    private cards: Phaser.GameObjects.Image[];
    private titleText: Phaser.GameObjects.Text;

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

        let text = new Phaser.GameObjects.Text(this.scene, -70, 30, "SHUFFLING", { fontFamily: "Oswald-Medium", fontSize: "80px", color: "#FFFFFF" });
        text.setOrigin(.5);
        this.midContainer.add(text);

        this.titleText = new Phaser.GameObjects.Text(this.scene, 0, 125, "Initializing...", { fontFamily: "Oswald-Medium", fontSize: "40px", color: "#FFFFFF", align: "center" });
        this.titleText.setOrigin(.5);
        this.midContainer.add(this.titleText);

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

    public updateHeading(text: string) {
        setTimeout(() => {
            if (this.scene && this.titleText) {
                this.titleText.setText(text);
            }
        }, 300);
    }

    public hide(): void {
        if (!this.scene) {
            return;
        }
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

        setTimeout(() => {
            this.startAnimation();
        }, 500);
    }

    private startAnimation(): void {

        const left = [];
        const right = [];

        AudioManager.playSound("cards_in");

        setTimeout(() => {
            AudioManager.playSound("cards_out");
        }, 350);

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
                            if (i === this.cards.length - 1 && this.visible) {
                                setTimeout(() => {
                                    this.startAnimation();
                                }, 100);
                            }
                        },
                        onCompleteScope: this
                    });
                },
                onCompleteScope: this
            });
        }
    }
}
