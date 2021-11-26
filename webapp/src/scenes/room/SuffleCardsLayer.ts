import { AudioManager } from "../../AudioManager";
import { GameConstants } from "../../GameConstants";
import { GameVars } from "../../GameVars";

export class SuffleCardsLayer extends Phaser.GameObjects.Container {

    private midContainer: Phaser.GameObjects.Container;

    private cards: Phaser.GameObjects.Image[];
    private timer: NodeJS.Timeout;

    private bar: Phaser.GameObjects.Image;
    private barBg: Phaser.GameObjects.Image;


    constructor(scene: Phaser.Scene) {

        super(scene);

        this.visible = false;

        this.cards = [];

        this.midContainer = new Phaser.GameObjects.Container(this.scene);
        this.midContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
        this.add(this.midContainer);

        let box = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "box");
        this.midContainer.add(box);


        let bck = new Phaser.GameObjects.Image(this.scene, 0, 30, "texture_atlas_1", "phase_shadow");
        bck.setScale(1, 1);
        this.midContainer.add(bck);

        let text = new Phaser.GameObjects.Text(this.scene, -70, 30, "SHUFFLING", { fontFamily: "Oswald-Medium", fontSize: "80px", color: "#FFFFFF" });
        text.setOrigin(.5);
        this.midContainer.add(text);


        this.barBg = new Phaser.GameObjects.Image(this.scene, 0, 150, "texture_atlas_1", "border");
        this.midContainer.add(this.barBg);

        this.bar = new Phaser.GameObjects.Image(this.scene, this.barBg.x + 4 - this.barBg.displayWidth / 2, this.barBg.y + 1, "texture_atlas_1", "bar");
        this.midContainer.add(this.bar);
        this.bar.x += this.bar.displayWidth / 2;

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

        this.scene.add.tween({
            targets: this.bar,
            x: {
                from: this.barBg.x - this.barBg.displayWidth / 2 + 4 + this.bar.displayWidth / 2,
                to: this.barBg.x + this.barBg.displayWidth / 2 - 4 - this.bar.displayWidth / 2
            },
            repeat: -1,
            yoyo: true,
            duration: 500
        })

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

        this.scene.tweens.killTweensOf(this.bar);

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
