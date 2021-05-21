import { GameConstants } from "../../GameConstants";

export class CheatLayer extends Phaser.GameObjects.Container {
    
    private midContainer: Phaser.GameObjects.Container;
    private midBackground: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {

        super(scene);

        // this.visible = false;

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
        this.midBackground.fillRoundedRect(-200, -300, 400, 600, 15);
        this.midBackground.lineStyle(3, 0x2E7787);
        this.midBackground.strokeRoundedRect(-200, -300, 400, 600, 15);
        this.midContainer.add(this.midBackground);

        this.scene.input.keyboard.createCombo("CARTESI");

        let self = this;

        this.scene.input.keyboard.on("keycombomatch", function (event) {

            console.log("HOLAA!");
            self.visible = !self.visible;
            this.scene.input.keyboard.createCombo("CARTESI");

        });
    }
}
