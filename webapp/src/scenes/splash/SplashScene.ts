import { ChooseAvatarLayer } from './ChooseAvatarLayer';
import { AudioManager } from "../../AudioManager";
import { GameConstants } from "../../GameConstants";
import { GameManager } from "../../GameManager";
import { GameVars } from "../../GameVars";

export class SplashScene extends Phaser.Scene {

    public static currentInstance: SplashScene;

    private background: Phaser.GameObjects.Image;
    private topContainer: Phaser.GameObjects.Container;
    private walletInfoContainer: Phaser.GameObjects.Container;
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

        this.walletInfoContainer = this.add.container(0, 0);
        let walletInfoBg = new Phaser.GameObjects.Image(this, 0, 0, "texture_atlas_1", "wallet_info_popup");
        walletInfoBg.setOrigin(0, 0).setScale(1.3);

        let walletAddressLabel = new Phaser.GameObjects.Text(this, 10, 50, "Wallet Address", { fontFamily: "Oswald-Variable", fontSize: "20px", color: "#ffffff" });
        let walletNetworkLabel = new Phaser.GameObjects.Text(this, walletAddressLabel.x, walletAddressLabel.y + 35, "Network", { fontFamily: "Oswald-Variable", fontSize: "20px", color: "#ffffff" });
        let pokerTokensLabel = new Phaser.GameObjects.Text(this, walletNetworkLabel.x, walletNetworkLabel.y + 35, "Poker Tokens", { fontFamily: "Oswald-Variable", fontSize: "20px", color: "#ffffff" });
        let balanceLabel = new Phaser.GameObjects.Text(this, pokerTokensLabel.x, pokerTokensLabel.y + 35, "Balance", { fontFamily: "Oswald-Variable", fontSize: "20px", color: "#ffffff" });


        let walletAddressText = new Phaser.GameObjects.Text(this, walletInfoBg.x + walletInfoBg.displayWidth - 35, walletAddressLabel.y, "0abcdefghijklmnopqrstuvwxyz", { fontFamily: "Oswald-Variable", fontSize: "20px", color: "#ffffff", align: "center" });
        let walletNetworkText = new Phaser.GameObjects.Text(this, walletInfoBg.x + walletInfoBg.displayWidth - 10, walletNetworkLabel.y, "MATIC (Mumbai)", { fontFamily: "Oswald-Variable", fontSize: "20px", color: "#ffffff" });
        let pokerTokensText = new Phaser.GameObjects.Text(this, walletInfoBg.x + walletInfoBg.displayWidth - 10, pokerTokensLabel.y, "1000", { fontFamily: "Oswald-Variable", fontSize: "20px", color: "#ffffff" });
        let balanceText = new Phaser.GameObjects.Text(this, walletInfoBg.x + walletInfoBg.displayWidth - 10, balanceLabel.y, "1", { fontFamily: "Oswald-Variable", fontSize: "20px", color: "#ffffff" });
        walletAddressText.setOrigin(1, 0);
        walletNetworkText.setOrigin(1, 0);
        pokerTokensText.setOrigin(1, 0);
        balanceText.setOrigin(1, 0);

        let closeBtn = new Phaser.GameObjects.Image(this, 0, 0, "texture_atlas_1", "btn_close_2");
        closeBtn.x = walletInfoBg.displayWidth - 20;
        closeBtn.y = 20;
        closeBtn.setScale(0.4);
        closeBtn.setInteractive({ useHandCursor: true }).once(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
            this.walletInfoContainer.destroy(true);
        }, this);


        let copyBtn = new Phaser.GameObjects.Image(this, 0, 0, "texture_atlas_1", "btn_copy");
        copyBtn.x = walletInfoBg.displayWidth - 20;
        copyBtn.y = walletAddressText.y + walletAddressText.displayHeight / 2;
        copyBtn.setScale(0.4);
        copyBtn.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, async () => {
            const address = walletAddressText.text;
            navigator.clipboard.writeText(address);
            walletAddressText.setText("COPIED");
            await new Promise(r => {
                setTimeout(r, 1000);
            })
            walletAddressText.setText(address);
        }, this);

        this.walletInfoContainer.add([
            walletInfoBg,
            walletAddressLabel,
            walletNetworkLabel,
            pokerTokensLabel,
            balanceLabel,
            walletAddressText,
            walletNetworkText,
            pokerTokensText,
            balanceText,
            closeBtn,
            copyBtn
        ]);

        this.onOrientationChange();

        const tx = GameConstants.GAME_WIDTH - this.walletInfoContainer.getBounds().width - 20;
        this.walletInfoContainer.y = 20;
        this.add.tween({
            targets: this.walletInfoContainer,
            alpha: { from: 0, to: 1 },
            x: { from: tx + 30, to: tx },
            ease: Phaser.Math.Easing.Back.Out,
            duration: 400
        });
        console.log(this.walletInfoContainer.getBounds());

        AudioManager.playMusic("soundtrack", 0.1);
    }

    public onOrientationChange(): void {
        this.walletInfoContainer.x = GameConstants.GAME_WIDTH - this.walletInfoContainer.getBounds().width - 20;
        this.walletInfoContainer.y = 20;

        console.log(this.walletInfoContainer.getBounds());


        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.topContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                this.chooseAvatarLayer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                this.walletInfoContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.topContainer.setScale(GameVars.scaleX, 1);
                this.chooseAvatarLayer.setScale(GameVars.scaleX, 1);
                this.walletInfoContainer.setScale(GameVars.scaleX, 1);
            }
            this.chooseAvatarLayer.setLandscapeMode();
        } else {

            let extraScale = (0.67 - GameVars.scaleY) * 2.5;
            this.topContainer.setScale(1.2 + extraScale, GameVars.scaleY * (1.2 + extraScale));
            this.chooseAvatarLayer.setScale(1.2 + extraScale / 2, GameVars.scaleY * (1.2 + extraScale / 2));
            this.chooseAvatarLayer.setPortraitMode();
            this.walletInfoContainer.setScale(1.2 + extraScale / 2, GameVars.scaleY * (1.2 + extraScale / 2));
        }
    }
}
