import { GameConstants } from "../../GameConstants";

export class VerificationLayer extends Phaser.GameObjects.Container {
    
    private midContainer: Phaser.GameObjects.Container;
    private midBackground: Phaser.GameObjects.Graphics;
    private stateText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.visible = false;

        let background = new Phaser.GameObjects.Graphics(this.scene);
        background.fillStyle(0x000000, .25);
        background.fillRect(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
        background.setInteractive(new Phaser.Geom.Rectangle(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);
        background.on("pointerdown", () => {
            // 
        }, this);
        this.add(background);

        this.midContainer = new Phaser.GameObjects.Container(this.scene);
        this.midContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
        this.add(this.midContainer);

        this.midBackground = new Phaser.GameObjects.Graphics(this.scene);
        this.midBackground.fillStyle(0x09070B, .8);
        this.midBackground.fillRoundedRect(-200, -200, 400, 400, 15);
        this.midBackground.lineStyle(3, 0x2E7787);
        this.midBackground.strokeRoundedRect(-200, -200, 400, 400, 15);
        this.midContainer.add(this.midBackground);

        let title = new Phaser.GameObjects.Text(this.scene, 0, -140, "VERIFICATION", {fontFamily: "Oswald-Medium", fontSize: "40px", color: "#ffffff"});
        title.setOrigin(.5);
        this.midContainer.add(title);

        title = new Phaser.GameObjects.Text(this.scene, 0, 105, "STATE", {fontFamily: "Oswald-Medium", fontSize: "30px", color: "#ffffff"});
        title.setOrigin(.5);
        this.midContainer.add(title);

        this.stateText = new Phaser.GameObjects.Text(this.scene, 0, 150, "", {fontFamily: "Oswald-Medium", fontSize: "40px", color: "#ffffff"});
        this.stateText.setOrigin(.5);
        this.midContainer.add(this.stateText);
    }

    public show(): void {

        this.visible = true;
        this.alpha = 0;

        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            ease: Phaser.Math.Easing.Linear,
            duration: 500
        });
    }

    public updateValue(value: number): void {

        this.stateText.setText(GameConstants.VERIFICATION_STATES[value]);

        console.log("UPDATE VALUE " + value);

        if (value === 5) {
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                ease: Phaser.Math.Easing.Linear,
                duration: 500,
                delay: 2000,
                onComplete: () => {
                    this.visible = false;
                },
                onCompleteScope: this
            });
        }
    }
}
