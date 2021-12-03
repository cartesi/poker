import { ChooseAvatarLayer } from './ChooseAvatarLayer';
import { AudioManager } from './../../AudioManager';
import { Onboarding } from "../../services/Onboarding";
import { SplashScene } from './SplashScene';

export class MetamaskButton extends Phaser.GameObjects.Container {

    private background: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    private img: Phaser.GameObjects.Image;
    private loading: Phaser.GameObjects.Image;

    private chooseAvatarLayer: ChooseAvatarLayer;

    constructor(scene: Phaser.Scene, chooseAvatarLayer: ChooseAvatarLayer) {

        super(scene);

        this.chooseAvatarLayer = chooseAvatarLayer;

        this.background = new Phaser.GameObjects.Graphics(this.scene);
        this.background.fillStyle(0x0A2036);
        this.background.fillRoundedRect(-150, -30, 300, 60, 10);
        this.background.lineStyle(4, 0x47E8FC);
        this.background.strokeRoundedRect(-150, -30, 300, 60, 10);
        this.background.setInteractive(new Phaser.Geom.Rectangle(-150, -30, 300, 60), Phaser.Geom.Rectangle.Contains);
        this.background.on("pointerover", () => {
            this.setScale(1.05);
        }, this);
        this.background.on("pointerout", () => {
            this.setScale(1);
        }, this);
        this.add(this.background);

        this.img = new Phaser.GameObjects.Image(this.scene, -110, 0, "texture_atlas_1", "metamask");
        this.img.setScale(.4);
        this.add(this.img);

        this.loading = new Phaser.GameObjects.Image(this.scene, -110, 0, "texture_atlas_1", "loading");
        this.loading.setScale(.28);
        this.loading.visible = false;
        this.add(this.loading);

        this.scene.tweens.add({
            targets: this.loading,
            angle: 360,
            ease: Phaser.Math.Easing.Linear,
            duration: 1000,
            repeat: -1
        });

        this.text = new Phaser.GameObjects.Text(this.scene, -80, 0, "", { fontFamily: "Oswald-Medium", fontSize: "22px", color: "#FFFFFF", align: "left" });
        this.text.setOrigin(0, .5);
        this.add(this.text);

        Onboarding.start(this.onOnboardingChange.bind(this));
    }

    private onOnboardingChange({label, onclick, loading, error, ready}) {
        if (!this.background.active) {
            return;
        }

        // update button label
        this.text.setText(label);
        this.background.clear();
        this.background.fillStyle(0x0A2036);
        this.background.fillRoundedRect(-(this.text.width + 95) / 2, -30, this.text.width + 95, 60, 10);
        this.background.lineStyle(4, 0x47E8FC);
        this.background.strokeRoundedRect(-(this.text.width + 95) / 2, -30, this.text.width + 95, 60, 10);
        this.background.setInteractive(new Phaser.Geom.Rectangle(-(this.text.width + 95) / 2, -30, this.text.width + 95, 60), Phaser.Geom.Rectangle.Contains);
        this.img.x = -(this.text.width + 95) / 2 + 40;
        this.loading.x = -(this.text.width + 95) / 2 + 40;
        this.text.x = this.img.x + 10;

        // update button action when user clicks (or remove any action)
        if (onclick) {
            this.background.on("pointerup", () => {
                AudioManager.playSound("btn_click");
                onclick(this.onOnboardingChange.bind(this));
            }, this);
            this.img.visible = true;
        } else {
            this.background.off("pointerup");
            this.img.visible = false;
        }

        if (loading) {
            this.background.disableInteractive();
            this.setScale(1);
            this.loading.visible = true;
            this.img.visible = false;
        } else {
            this.background.setInteractive(new Phaser.Geom.Rectangle(-(this.text.width + 95) / 2, -35, this.text.width + 95, 70), Phaser.Geom.Rectangle.Contains);
            this.loading.visible = false;
            if (onclick) {
                this.img.visible = true;
            }
        }

        // if ready, we're good to go        
        if (ready) {
            this.background.disableInteractive();
            this.chooseAvatarLayer.showPlay();
        } else {
            if (!loading) {
                this.background.setInteractive(new Phaser.Geom.Rectangle(-(this.text.width + 95) / 2, -35, this.text.width + 95, 70), Phaser.Geom.Rectangle.Contains);
            }
            this.chooseAvatarLayer.hidePlay();
        }

        // forcing image (metamask icon) always hidden for now
        this.img.visible = false;

        // fixing text position if an icon is being shown
        if (this.loading.visible || this.img.visible) {
            this.text.x += 20;
        }

        SplashScene.currentInstance.updateWalletInfo();
    }
}
