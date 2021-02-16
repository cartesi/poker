import { AudioManager } from "../../../AudioManager";

export class Card extends Phaser.GameObjects.Container {

    public info: {value: number, suit: number};

    private image: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene, x: number, y: number) {

        super(scene);

        this.x = x;
        this.y = y;

        this.image = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_2", "card-back");
        this.add(this.image);

        this.info = {value: -1, suit : -1};
        
    }

    public setValue(card: {value: number, suit: number}) {

        if (!card) {
            this.image.setFrame("card-back");
            this.info = {value: -1, suit : -1};
        } else {
            this.image.setFrame(card.suit + "_" + (card.value + 1));
            this.info = card;
        }
    }

    public hideCard(): void {
        
        this.visible = false;
        this.alpha = 0;
        this.image.setFrame("card-back");
        this.info = {value: -1, suit : -1};
    }

    public showCard(card: {value: number, suit: number}, delay: number) {

        if (!card) {
            this.visible = false;
            this.alpha = 0;
            this.image.setFrame("card-back");
            this.info = {value: -1, suit : -1};
        } else {
            if (this.image.frame.name === (card.suit + "_" + (card.value + 1))) {
                return;
            }
    
            this.visible = true;
            this.alpha = 1;
            this.image.setFrame("card-back");
            this.info = card;
    
            let initScale = this.scaleX;
    
            this.scene.tweens.add({
                targets: this,
                scaleX: 0,
                ease: Phaser.Math.Easing.Linear,
                duration: 100,
                delay: delay,
                onComplete: () => {
                    this.image.setFrame(card.suit + "_" + (card.value + 1));
                    this.scene.tweens.add({
                        targets: this,
                        scaleX: initScale,
                        ease: Phaser.Math.Easing.Linear,
                        duration: 100
                    });
                },
                onCompleteScope: this,
                onStart: () => {
                    AudioManager.playSound("card_reveal_" + (Math.floor(Math.random() * 3) + 1));
                },
                onStartScope: this
            });
        }
    }

    public showMark(): void {

        let mark = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "frame_winner_hand");
        this.add(mark);

        mark.alpha = 0;

        this.scene.tweens.add({
            targets: mark,
            alpha: 1,
            ease: Phaser.Math.Easing.Linear,
            duration: 500,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: mark,
                    alpha: 0,
                    ease: Phaser.Math.Easing.Linear,
                    duration: 500,
                    delay: 4000,
                    onComplete: () => {
                        mark.destroy();
                    },
                    onCompleteScope: this
                });
            },
            onCompleteScope: this
        });
    }
}
