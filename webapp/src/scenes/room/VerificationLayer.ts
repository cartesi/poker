import { GameConstants } from "../../GameConstants";
import { GameVars } from "../../GameVars";
import { VerificationState, VerificationStates } from "../../services/Game";

export class VerificationLayer extends Phaser.GameObjects.Container {
    
    private midContainer: Phaser.GameObjects.Container;
    private midBackground: Phaser.GameObjects.Graphics;
    private loadingBar: Phaser.GameObjects.Graphics;
    private stateText: Phaser.GameObjects.Text;
    private verificationText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.visible = false;

        let background = new Phaser.GameObjects.Graphics(this.scene);
        background.fillStyle(0x000000, .5);
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
        this.midBackground.fillRoundedRect(-400, -200, 800, 400, 15);
        this.midBackground.lineStyle(3, 0x2E7787);
        this.midBackground.strokeRoundedRect(-400, -200, 800, 400, 15);
        this.midContainer.add(this.midBackground);

        let title = new Phaser.GameObjects.Text(this.scene, 0, -110, "This game has been challenged and is now being verified".toUpperCase(), {fontFamily: "Oswald-Medium", fontSize: "28px", color: "#ffffff"});
        title.setOrigin(.5);
        this.midContainer.add(title);

        let loadingBack = new Phaser.GameObjects.Graphics(this.scene);
        loadingBack.fillStyle(0x22494E, 1);
        loadingBack.fillRect(-325, -70, 650, 40);
        this.midContainer.add(loadingBack);

        this.loadingBar = new Phaser.GameObjects.Graphics(this.scene);
        this.loadingBar.setPosition(-325, -70);
        this.loadingBar.fillStyle(0x48ECFF, 1);
        this.loadingBar.fillRect(0, 0, 650, 40);
        this.loadingBar.scaleX = 0;
        this.midContainer.add(this.loadingBar);

        this.stateText = new Phaser.GameObjects.Text(this.scene, 0, 15, "", {fontFamily: "Oswald-Medium", fontSize: "30px", color: "#ffffff"});
        this.stateText.setOrigin(.5);
        this.midContainer.add(this.stateText);

        this.verificationText = new Phaser.GameObjects.Text(this.scene, 0, 100, "Alleged cause: 'Failure to reveal cards'", {fontFamily: "Oswald-Medium", fontSize: "40px", color: "#ffffff"});
        this.verificationText.setOrigin(.5);
        this.midContainer.add(this.verificationText);

        title = new Phaser.GameObjects.Text(this.scene, 0, 160, "Please stand by, this process can take several minutes to complete", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#A4A4A4"});
        title.setOrigin(.5);
        this.midContainer.add(title);

        this.midContainer.setScale(GameVars.scaleX, 1);
    }

    public show(msg: string): void {

        msg = `Alleged cause: ${msg}`;

        this.verificationText.setText(msg);
        this.stateText.setText("STATE: NONE");
        this.loadingBar.scaleX = 0;

        this.visible = true;
        this.alpha = 0;

        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            ease: Phaser.Math.Easing.Linear,
            duration: 500
        });
    }

    public updateValue(state: VerificationState): void {

        this.stateText.setText("STATE: " + state);
        const stateIndex = VerificationStates.indexOf(state);

        this.scene.tweens.add({
            targets: this.loadingBar,
            scaleX: stateIndex / 5,
            ease: Phaser.Math.Easing.Linear,
            duration: 500
        });

        console.log("UPDATE VALUE " + state);

        if (state === VerificationState.ENDED) {
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
