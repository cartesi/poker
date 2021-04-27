import { ChooseAvatarLayer } from './ChooseAvatarLayer';
import { AudioManager } from "../../AudioManager";
import { GameConstants } from "../../GameConstants";
import { GameManager } from "../../GameManager";
import { GameVars } from "../../GameVars";

export class SplashScene extends Phaser.Scene {

    public static currentInstance: SplashScene;

    private background: Phaser.GameObjects.Image;
    private topContainer: Phaser.GameObjects.Container;
    private chooseAvatarLayer: ChooseAvatarLayer;

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

        this.chooseAvatarLayer = new ChooseAvatarLayer(this);
        this.add.existing(this.chooseAvatarLayer);

        this.onOrientationChange();

        AudioManager.playMusic("soundtrack", 0.1);
    }

    public onOrientationChange(): void {

        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.topContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                this.chooseAvatarLayer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.topContainer.setScale(GameVars.scaleX, 1);
                this.chooseAvatarLayer.setScale(GameVars.scaleX, 1);
            }
        } else {

            let extraScale = (0.67 - GameVars.scaleY) * 2.5;
            this.topContainer.setScale(1.2 + extraScale, GameVars.scaleY * (1.2 + extraScale));
            this.chooseAvatarLayer.setScale(1.2 + extraScale, GameVars.scaleY * (1.2 + extraScale));

            console.log(GameVars.scaleY);
        }
    }
}
