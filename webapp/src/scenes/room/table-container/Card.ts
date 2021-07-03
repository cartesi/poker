import { AudioManager } from "../../../AudioManager";
import { Card as CardInfo } from "../../../services/Card";

export class Card extends Phaser.GameObjects.Container {

    public info: CardInfo;

    private image: Phaser.GameObjects.Image;
    private mark: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene, x: number, y: number) {

        super(scene);

        this.x = x;
        this.y = y;

        this.image = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_2", "card-back");
        this.add(this.image);

        this.mark = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "frame_winner_hand");
        this.mark.visible = false;
        this.add(this.mark);

        this.info = null;
        
    }

    public setValue(card: CardInfo) {

        if (!card) {
            this.image.setFrame("card-back");
            this.info = null;
        } else {
            this.image.setFrame(card.toString());
            this.info = card;
        }
    }

    public hideCard(): void {
        
        this.visible = false;
        this.alpha = 0;
        this.mark.visible = false;
        this.image.setFrame("card-back");
        this.info = null;
    }

    public showCard(card: CardInfo, delay: number) {

        if (!card) {
            this.visible = false;
            this.alpha = 0;
            this.image.setFrame("card-back");
            this.info = null;
        } else {
            if (this.image.frame.name === (card.toString())) {
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
                    this.image.setFrame(card.toString());
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

        this.mark.alpha = 0;
        this.mark.visible = true;

        this.scene.tweens.add({
            targets: this.mark,
            alpha: 1,
            ease: Phaser.Math.Easing.Linear,
            duration: 500
        });
    }
}
