import { GameConstants } from "../../GameConstants";
import { GameManager } from "../../GameManager";
import { GameVars } from "../../GameVars";

export class SplashScene extends Phaser.Scene {

    public static currentInstance: SplashScene;

    private background: Phaser.GameObjects.Image;
    private topContainer: Phaser.GameObjects.Container;
    private midContainer: Phaser.GameObjects.Container;

    private chooseAvatarFrame: Phaser.GameObjects.Image;

    constructor() {

        super("SplashScene");

        SplashScene.currentInstance = this;
    }

    public create(): void {

        GameManager.setCurrentScene(this);

        this.background = new Phaser.GameObjects.Image(this, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2, "texture_atlas_1", "bg_gradient");
        this.background.setScale(2);
        this.add.existing(this.background);

        this.topContainer = new Phaser.GameObjects.Container(this);
        this.topContainer.setPosition(GameConstants.GAME_WIDTH / 2, 0);
        this.add.existing(this.topContainer);

        let title = new Phaser.GameObjects.Image(this, 0, 20, "texture_atlas_1", "logo_main");
        title.setOrigin(.5, 0);
        this.topContainer.add(title);

        let powered = new Phaser.GameObjects.Text(this, 0, 310, " powered by Cartesi ", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        powered.setOrigin(.5, 0);
        powered.setShadow(1, 1, "#000000", 5);
        this.topContainer.add(powered);

        this.midContainer = new Phaser.GameObjects.Container(this);
        this.midContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
        this.add.existing(this.midContainer);

        let chooseAvatar = new Phaser.GameObjects.Image(this, 0, 90, "texture_atlas_1", "choose_avatar");
        this.midContainer.add(chooseAvatar);

        let avatar1graphic = new Phaser.GameObjects.Graphics(this);
        avatar1graphic.setPosition(-85, 111);
        avatar1graphic.fillStyle(0xffffff, .01);
        avatar1graphic.fillRect(-55, -55, 110, 110);
        avatar1graphic.setInteractive(new Phaser.Geom.Rectangle(-55, -55, 110, 110), Phaser.Geom.Rectangle.Contains);
        avatar1graphic.on("pointerdown", () => {
            this.chooseAvatarFrame.setPosition(-85, 111);
            GameManager.setPlayerAvatar(1);
        }, this);
        this.midContainer.add(avatar1graphic);

        let avatar2graphic = new Phaser.GameObjects.Graphics(this);
        avatar2graphic.setPosition(85, 111);
        avatar2graphic.fillStyle(0xffffff, .01);
        avatar2graphic.fillRect(-55, -55, 110, 110);
        avatar2graphic.setInteractive(new Phaser.Geom.Rectangle(-55, -55, 110, 110), Phaser.Geom.Rectangle.Contains);
        avatar2graphic.on("pointerdown", () => {
            this.chooseAvatarFrame.setPosition(85, 111);
            GameManager.setPlayerAvatar(2);
        }, this);
        this.midContainer.add(avatar2graphic);


        this.chooseAvatarFrame = new Phaser.GameObjects.Image(this, -85, 111, "texture_atlas_1", "choose_avatar_frame");
        this.midContainer.add(this.chooseAvatarFrame);

        let playButton = new Phaser.GameObjects.Image(this, 0, 300, "texture_atlas_1", "btn_play");
        playButton.setInteractive();
        playButton.on("pointerover", () => {
            playButton.setScale(1.05);
        }, this);
        playButton.on("pointerout", () => {
            playButton.setScale(1);
        }, this);
        playButton.on("pointerup", () => {
            GameManager.enterLobbyScene();
        }, this);
        this.midContainer.add(playButton);

        GameManager.setPlayerAvatar(1);

        this.onOrientationChange();
    }

    public onOrientationChange(): void {

        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.topContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                this.midContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.topContainer.setScale(GameVars.scaleX, 1);
                this.midContainer.setScale(GameVars.scaleX, 1);
            }
        } else {

            let extraScale = (0.67 - GameVars.scaleY) * 2.5;
            this.topContainer.setScale(1.2 + extraScale, GameVars.scaleY * (1.2 + extraScale));
            this.midContainer.setScale(1.2 + extraScale, GameVars.scaleY * (1.2 + extraScale));

            console.log(GameVars.scaleY);
        }
    }
}