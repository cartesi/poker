export class StateLayer extends Phaser.GameObjects.Container {

    private stateText: Phaser.GameObjects.Text;
    private bck: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.y = 30;

        this.bck = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "phase_shadow");
        this.add(this.bck);

        this.stateText = new Phaser.GameObjects.Text(this.scene, 0, 0, "PRE FLOP", {fontFamily: "Oswald-Medium", fontSize: "80px", color: "#FFFFFF"});
        this.stateText.setOrigin(.5);
        this.add(this.stateText);

        this.alpha = 0;

        this.bck.setScale(this.stateText.width / this.bck.width + 0.2, 1);
    }

    public setText(text: string): void {

        if (text === this.stateText.text || text === "END") {
            return;
        }

        this.stateText.text = text;
        this.bck.setScale(this.stateText.width / this.bck.width + 0.2, 1);

        this.alpha = 0;
        this.setScale(.75);

        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            ease: Phaser.Math.Easing.Linear,
            duration: 250,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this,
                    alpha: 0,
                    scaleX: .75,
                    scaleY: .75,
                    ease: Phaser.Math.Easing.Linear,
                    duration: 250,
                    delay: 1000
                });
            },
            onCompleteScope: this
        });
    }

    public setWinnerText(text: string): void {

        this.stateText.text = text;
        this.bck.setScale(this.stateText.width / this.bck.width + 0.2, 1);

        this.alpha = 0;
        this.setScale(.6);

        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            ease: Phaser.Math.Easing.Linear,
            duration: 500,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this,
                    alpha: 0,
                    scaleX: .6,
                    scaleY: .6,
                    ease: Phaser.Math.Easing.Linear,
                    duration: 250,
                    delay: 2000
                });
            },
            onCompleteScope: this
        });
    }
}
