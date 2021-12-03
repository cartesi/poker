import { ChooseAvatarLayer } from './ChooseAvatarLayer';
import { AudioManager } from "../../AudioManager";
import { GameConstants } from "../../GameConstants";
import { GameManager } from "../../GameManager";
import { GameVars } from "../../GameVars";
import { Wallet } from '../../services/Wallet';
import { ethers } from 'ethers';

export class SplashScene extends Phaser.Scene {

    public static currentInstance: SplashScene;

    private background: Phaser.GameObjects.Image;
    private topContainer: Phaser.GameObjects.Container;
    private walletInfoContainer: Phaser.GameObjects.Container;
    private walletInfoMinContainer: Phaser.GameObjects.Container;
    private chooseAvatarLayer: ChooseAvatarLayer;

    private walletAddressText: Phaser.GameObjects.Text;
    private walletNetworkText: Phaser.GameObjects.Text;
    private balanceText: Phaser.GameObjects.Text;
    private pokerTokensText: Phaser.GameObjects.Text;
    private walletAddressValue: string;

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
        walletInfoBg.setOrigin(1, 0).setScale(1);


        let walletAddressLabel = new Phaser.GameObjects.Text(this, walletInfoBg.getLeftCenter().x + 10, 50, "Wallet Address", { fontFamily: "Oswald-Medium", fontSize: "22px", color: "#ffffff" });
        let walletNetworkLabel = new Phaser.GameObjects.Text(this, walletAddressLabel.x, walletAddressLabel.y + 35, "Network", { fontFamily: "Oswald-Medium", fontSize: "22px", color: "#ffffff" });
        let balanceLabel = new Phaser.GameObjects.Text(this, walletNetworkLabel.x, walletNetworkLabel.y + 35, "Balance", { fontFamily: "Oswald-Medium", fontSize: "22px", color: "#ffffff" });
        let pokerTokensLabel = new Phaser.GameObjects.Text(this, balanceLabel.x, balanceLabel.y + 35, "Poker Tokens", { fontFamily: "Oswald-Medium", fontSize: "22px", color: "#ffffff" });


        this.walletAddressText = new Phaser.GameObjects.Text(this, walletInfoBg.getRightCenter().x - 35, walletAddressLabel.y, "Loading...", { fontFamily: "Oswald-Medium", fontSize: "22px", color: "#ffffff", align: "center" });
        this.walletNetworkText = new Phaser.GameObjects.Text(this, walletInfoBg.getRightCenter().x - 10, walletNetworkLabel.y, "Loading...", { fontFamily: "Oswald-Medium", fontSize: "22px", color: "#ffffff" });
        this.balanceText = new Phaser.GameObjects.Text(this, walletInfoBg.getRightCenter().x - 10, balanceLabel.y, "Loading...", { fontFamily: "Oswald-Medium", fontSize: "22px", color: "#ffffff" });
        this.pokerTokensText = new Phaser.GameObjects.Text(this, walletInfoBg.getRightCenter().x - 10, pokerTokensLabel.y, "Loading...", { fontFamily: "Oswald-Medium", fontSize: "22px", color: "#ffffff" });
        this.walletAddressText.setOrigin(1, 0);
        this.walletNetworkText.setOrigin(1, 0);
        this.balanceText.setOrigin(1, 0);
        this.pokerTokensText.setOrigin(1, 0);

        let minimiseBtn = new Phaser.GameObjects.Image(this, 0, 0, "texture_atlas_1", "btn_minimise");
        minimiseBtn.x = walletInfoBg.getRightCenter().x - 25;
        minimiseBtn.y = 23;
        minimiseBtn.setScale(0.7);
        minimiseBtn.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, this.toggleWalletInfo, this);


        let copyBtn = new Phaser.GameObjects.Image(this, 0, 0, "texture_atlas_1", "btn_copy");
        copyBtn.x = walletInfoBg.getRightCenter().x - 20;
        copyBtn.y = this.walletAddressText.y + this.walletAddressText.displayHeight / 2;
        copyBtn.setScale(0.4);
        copyBtn.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, async () => {
            const addressText = this.walletAddressText.text;
            navigator.clipboard.writeText(this.walletAddressValue);
            this.walletAddressText.setText("COPIED");
            await new Promise(r => {
                setTimeout(r, 1000);
            })
            this.walletAddressText.setText(addressText);
        }, this);

        this.walletInfoContainer.add([
            walletInfoBg,
            walletAddressLabel,
            walletNetworkLabel,
            pokerTokensLabel,
            balanceLabel,
            this.walletAddressText,
            this.walletNetworkText,
            this.balanceText,
            this.pokerTokensText,
            minimiseBtn,
            copyBtn
        ]);

        this.walletInfoContainer.setVisible(false);

        this.walletInfoMinContainer = this.add.container(0, 0);
        const walletInfoMinIcon = new Phaser.GameObjects.Image(this, 0, 0, "texture_atlas_1", "wallet_info_popup_min").setOrigin(0, 0);
        walletInfoMinIcon.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, this.toggleWalletInfo, this);
        const walletInfoMinTitle = new Phaser.GameObjects.Text(this, 0, 0, "WALLET", { fontFamily: "Oswald-Medium", fontSize: "20px", color: "#ffffff" });
        walletInfoMinTitle.setOrigin(0.5);
        walletInfoMinTitle.x = walletInfoMinIcon.x + walletInfoMinIcon.displayWidth / 2;
        walletInfoMinTitle.y = 20;
        this.walletInfoMinContainer.add([walletInfoMinIcon, walletInfoMinTitle]);



        this.onOrientationChange();

        /* let tx = GameConstants.GAME_WIDTH - this.walletInfoContainer.getBounds().width - 20;
        this.walletInfoContainer.y = 20;
        this.add.tween({
            targets: this.walletInfoContainer,
            alpha: { from: 0, to: 1 },
            x: { from: tx + 30, to: tx },
            ease: Phaser.Math.Easing.Back.Out,
            duration: 400
        }); */



        let tx = GameConstants.GAME_WIDTH - this.walletInfoMinContainer.getBounds().width - 20;
        this.walletInfoMinContainer.y = 20;
        this.add.tween({
            targets: this.walletInfoMinContainer,
            alpha: { from: 0, to: 1 },
            x: { from: tx + 30, to: tx },
            ease: Phaser.Math.Easing.Back.Out,
            duration: 400
        });

        AudioManager.playMusic("soundtrack", 0.1);
    }
    private toggleWalletInfo() {
        if (this.walletInfoMinContainer.visible) {
            this.walletInfoContainer.setAlpha(0).setVisible(true);
            this.add.tween({
                targets: this.walletInfoMinContainer,
                alpha: 0,
                duration: 50,
                onComplete: () => { this.walletInfoMinContainer.setVisible(false) },
                onCompleteScope: this
            });
            this.add.tween({
                targets: this.walletInfoContainer,
                scale: { from: 0, to: 1 },
                alpha: { from: 0, to: 1 },
                duration: 200
            });
        } else {
            this.walletInfoMinContainer.setAlpha(0).setVisible(true);
            this.add.tween({
                targets: this.walletInfoMinContainer,
                alpha: 1,
                duration: 50
            });
            this.add.tween({
                targets: this.walletInfoContainer,
                scale: { from: 1, to: 0 },
                alpha: { from: 1, to: 0 },
                duration: 200,
                onComplete: () => { this.walletInfoContainer.setVisible(false) },
                onCompleteScope: this
            });
        }
    }

    public onOrientationChange(): void {
        this.walletInfoContainer.setScale(GameVars.scaleX, 1);
        this.walletInfoMinContainer.setScale(GameVars.scaleX, 1);

        this.walletInfoContainer.x = GameConstants.GAME_WIDTH - 20;
        this.walletInfoContainer.y = 20;

        this.walletInfoMinContainer.x = GameConstants.GAME_WIDTH - this.walletInfoMinContainer.getBounds().width - 20;
        this.walletInfoMinContainer.y = 20;

        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.topContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                this.chooseAvatarLayer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                // this.walletInfoContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                // this.walletInfoMinContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));

            } else {
                this.topContainer.setScale(GameVars.scaleX, 1);
                this.chooseAvatarLayer.setScale(GameVars.scaleX, 1);
                // this.walletInfoContainer.setScale(GameVars.scaleX, 1);
                // this.walletInfoMinContainer.setScale(GameVars.scaleX, 1);

            }
            this.chooseAvatarLayer.setLandscapeMode();
        } else {

            let extraScale = (0.67 - GameVars.scaleY) * 2.5;
            this.topContainer.setScale(1.2 + extraScale, GameVars.scaleY * (1.2 + extraScale));
            this.chooseAvatarLayer.setScale(1.2 + extraScale / 2, GameVars.scaleY * (1.2 + extraScale / 2));
            this.chooseAvatarLayer.setPortraitMode();
            // this.walletInfoContainer.setScale(1.2 + extraScale / 2, GameVars.scaleY * (1.2 + extraScale / 2));
            // this.walletInfoMinContainer.setScale(1.2 + extraScale / 2, GameVars.scaleY * (1.2 + extraScale / 2));

        }
    }

    public updateWalletInfo() {
        if (!this.walletInfoContainer || !this.walletInfoContainer.active) {
            return;
        }
        Wallet.getAddress().then(addr => {
            this.walletAddressValue = addr;
            this.walletAddressText.text = `${addr.substr(0, 6)}...${addr.substr(addr.length - 4)}`;
        });
        this.walletNetworkText.text = Wallet.getNetwork();

        Wallet.getBalance().then(balance => {
            this.balanceText.text = parseFloat(ethers.utils.formatEther(balance)).toFixed(2);
        });
        Wallet.getPokerTokens().then(tokens => {
            this.pokerTokensText.text = tokens.toString();
        });
    }
}
