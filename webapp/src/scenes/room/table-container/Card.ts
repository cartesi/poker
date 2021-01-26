export class Card extends Phaser.GameObjects.Container {

    private image: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene, x: number, y: number) {

        super(scene);

        this.x = x;
        this.y = y;

        this.image = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_2", "card-back");
        this.add(this.image);
    }

    public setValue(card: {value: number, suit: number}) {

        if (!card) {
            this.image.setFrame("card-back");
        } else {
            this.image.setFrame(card.suit + "_" + (card.value + 1));
        }
    }

    public showCard(card: {value: number, suit: number}, delay: number) {

        if (!card) {
            this.visible = false;
            this.alpha = 0;
            this.image.setFrame("card-back");
        } else {
            if (this.image.frame.name === (card.suit + "_" + (card.value + 1))) {
                return;
            }
    
            this.visible = true;
            this.alpha = 1;
            this.image.setFrame("card-back");
    
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
                onCompleteScope: this
            });
        }
    }
}
