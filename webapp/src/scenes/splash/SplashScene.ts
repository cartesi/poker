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

        this.background = new Phaser.GameObjects.Image(this, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2, "bg");
        this.background.setScale(1);
        this.add.existing(this.background);

        this.topContainer = new Phaser.GameObjects.Container(this);
        this.topContainer.setPosition(GameConstants.GAME_WIDTH / 2, 0);
        this.add.existing(this.topContainer);

        let title = new Phaser.GameObjects.Image(this, 0, 20, "texture_atlas_1", "logo_main");
        title.setOrigin(.5, 0);
        this.topContainer.add(title);

        let powered = new Phaser.GameObjects.Text(this, 0, 310, " powered by Cartesi ", { fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF" });
        powered.setOrigin(.5, 0);
        powered.setShadow(1, 1, "#000000", 5);
        this.topContainer.add(powered);

        this.chooseAvatarLayer = new ChooseAvatarLayer(this);
        this.add.existing(this.chooseAvatarLayer);

        let walletInfo = this.add.container(0, 0);
        let walletInfoBg = new Phaser.GameObjects.Image(this, 0, 0, "texture_atlas_1", "base_open_wallet");
        walletInfoBg.setOrigin(0, 0).setScale(0.6);

        let walletAddressLabel = new Phaser.GameObjects.Text(this, 10, 50, "Wallet Address", { fontFamily: "Priori Sans OT", fontSize: "16px", color: "#444444" });
        let walletNetworkLabel = new Phaser.GameObjects.Text(this, walletAddressLabel.x, walletAddressLabel.y + 25, "Network", { fontFamily: "Priori Sans OT", fontSize: "16px", color: "#444444" });
        let pokerTokensLabel = new Phaser.GameObjects.Text(this, walletNetworkLabel.x, walletNetworkLabel.y + 25, "Poker Tokens", { fontFamily: "Priori Sans OT", fontSize: "16px", color: "#444444" });
        let balanceLabel = new Phaser.GameObjects.Text(this, pokerTokensLabel.x, pokerTokensLabel.y + 25, "Balance", { fontFamily: "Priori Sans OT", fontSize: "16px", color: "#444444" });

        let walletAddressText = new Phaser.GameObjects.Text(this, 295, walletAddressLabel.y, "0abcdefghijklmnopqrstuvwxyz", { fontFamily: "Priori Sans OT", fontSize: "16px", color: "#444444" });
        let walletNetworkText = new Phaser.GameObjects.Text(this, 295, walletNetworkLabel.y, "MATIC (Mumbai)", { fontFamily: "Priori Sans OT", fontSize: "16px", color: "#444444" });
        let pokerTokensText = new Phaser.GameObjects.Text(this, 295, pokerTokensLabel.y, "1000", { fontFamily: "Priori Sans OT", fontSize: "16px", color: "#444444" });
        let balanceText = new Phaser.GameObjects.Text(this, 295, balanceLabel.y, "1", { fontFamily: "Priori Sans OT", fontSize: "16px", color: "#444444" });
        walletAddressText.setOrigin(1, 0);
        walletNetworkText.setOrigin(1, 0);
        pokerTokensText.setOrigin(1, 0);
        balanceText.setOrigin(1, 0);

        let closeBtn = new Phaser.GameObjects.Image(this, 0, 0, "texture_atlas_1", "btn_close_2");
        closeBtn.x = 295;
        closeBtn.y = 12;
        closeBtn.setScale(0.7);
        closeBtn.setInteractive({ useHandCursor: true }).once(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
            walletInfo.destroy(true);
        }, this);

        walletInfo.add([
            walletInfoBg,
            walletAddressLabel,
            walletNetworkLabel,
            pokerTokensLabel,
            balanceLabel,
            walletAddressText,
            walletNetworkText,
            pokerTokensText,
            balanceText,
            closeBtn
        ]);
        const tx = parseInt(`${this.game.config.width}`) - 320;
        walletInfo.y = 20;
        this.add.tween({
            targets: walletInfo,
            alpha: { from: 0, to: 1 },
            x: { from: tx + 30, to: tx },
            ease: Phaser.Math.Easing.Back.Out,
            duration: 400
        });

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
            this.chooseAvatarLayer.setLandscapeMode();
        } else {

            let extraScale = (0.67 - GameVars.scaleY) * 2.5;
            this.topContainer.setScale(1.2 + extraScale, GameVars.scaleY * (1.2 + extraScale));
            this.chooseAvatarLayer.setScale(1.2 + extraScale / 2, GameVars.scaleY * (1.2 + extraScale / 2));
            this.chooseAvatarLayer.setPortraitMode();
        }
    }
}
