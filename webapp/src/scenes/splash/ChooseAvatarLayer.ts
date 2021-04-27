import { AudioManager } from "../../AudioManager";
import { GameConstants } from "../../GameConstants";
import { GameManager } from "../../GameManager";

export class ChooseAvatarLayer extends Phaser.GameObjects.Container {

    private chooseAvatarFrame: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);

        let chooseAvatar = new Phaser.GameObjects.Image(this.scene, 0, 90, "texture_atlas_1", "choose_avatar");
        this.add(chooseAvatar);

        let arrowLeft = new Phaser.GameObjects.Image(this.scene, -380, 90, "texture_atlas_1", "arrow");
        arrowLeft.scaleX = -1;
        this.add(arrowLeft);

        let arrowRigth = new Phaser.GameObjects.Image(this.scene, 380, 90, "texture_atlas_1", "arrow");
        this.add(arrowRigth);

        // let avatar1graphic = new Phaser.GameObjects.Graphics(this.scene);
        // avatar1graphic.setPosition(-85, 111);
        // avatar1graphic.fillStyle(0xffffff, .01);
        // avatar1graphic.fillRect(-55, -55, 110, 110);
        // avatar1graphic.setInteractive(new Phaser.Geom.Rectangle(-55, -55, 110, 110), Phaser.Geom.Rectangle.Contains);
        // avatar1graphic.on("pointerdown", () => {
        //     this.chooseAvatarFrame.setPosition(-85, 111);
        //     AudioManager.playSound("btn_click");
        //     GameManager.setPlayerAvatar(1);
        // }, this);
        // this.add(avatar1graphic);

        // let avatar2graphic = new Phaser.GameObjects.Graphics(this.scene);
        // avatar2graphic.setPosition(85, 111);
        // avatar2graphic.fillStyle(0xffffff, .01);
        // avatar2graphic.fillRect(-55, -55, 110, 110);
        // avatar2graphic.setInteractive(new Phaser.Geom.Rectangle(-55, -55, 110, 110), Phaser.Geom.Rectangle.Contains);
        // avatar2graphic.on("pointerdown", () => {
        //     this.chooseAvatarFrame.setPosition(85, 111);
        //     AudioManager.playSound("btn_click");
        //     GameManager.setPlayerAvatar(2);
        // }, this);
        // this.add(avatar2graphic);

        // this.chooseAvatarFrame = new Phaser.GameObjects.Image(this.scene, -85, 111, "texture_atlas_1", "choose_avatar_frame");
        // this.add(this.chooseAvatarFrame);

        let playButton = new Phaser.GameObjects.Image(this.scene, 0, 300, "texture_atlas_1", "btn_play");
        playButton.setInteractive();
        playButton.on("pointerover", () => {
            playButton.setScale(1.05);
        }, this);
        playButton.on("pointerout", () => {
            playButton.setScale(1);
        }, this);
        playButton.on("pointerup", () => {
            AudioManager.playSound("btn_click");
            GameManager.enterLobbyScene();
        }, this);
        this.add(playButton);

        GameManager.setPlayerAvatar(1);
    }
}