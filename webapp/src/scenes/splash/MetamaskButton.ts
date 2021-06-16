import { ChooseAvatarLayer } from './ChooseAvatarLayer';
import { AudioManager } from './../../AudioManager';
import { Onboarding } from "../../services/Onboarding";

export class MetamaskButton extends Phaser.GameObjects.Container {

    private background: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;

    private chooseAvatarLayer: ChooseAvatarLayer;

    constructor(scene: Phaser.Scene, chooseAvatarLayer: ChooseAvatarLayer) {

        super(scene);

        this.chooseAvatarLayer = chooseAvatarLayer;

        this.background = new Phaser.GameObjects.Graphics(this.scene);
        this.background.fillStyle(0x007bff);
        this.background.fillRect(-150, -35, 300, 70);
        this.background.setInteractive(new Phaser.Geom.Rectangle(-150, -50, 300, 100), Phaser.Geom.Rectangle.Contains);
        this.background.on("pointerover", () => {
            this.setScale(1.05);
        }, this);
        this.background.on("pointerout", () => {
            this.setScale(1);
        }, this);
        this.add(this.background);

        let img = new Phaser.GameObjects.Image(this.scene, -110, 0, "texture_atlas_1", "metamask");
        img.setScale(.4);
        this.add(img);

        this.text = new Phaser.GameObjects.Text(this.scene, -80, 0, "", {fontFamily: "Oswald-Medium", fontSize: "22px", color: "#FFFFFF", align: "left"});
        this.text.setOrigin(0, .5);
        this.add(this.text);

        Onboarding.start(this.onOnboardingChange.bind(this));
    }

    private onOnboardingChange({label, onclick, loading, error, ready}) {

        // update button label
        this.text.setText(label);
        this.background.clear();
        this.background.fillStyle(0x007bff);
        this.background.fillRect(-150, -35, this.text.width + 95, 70);
        this.background.setInteractive(new Phaser.Geom.Rectangle(-150, -35, this.text.width + 95, 70), Phaser.Geom.Rectangle.Contains);

        // update button action when user clicks (or remove any action)
        if (onclick) {
            this.background.on("pointerup", () => {
                AudioManager.playSound("btn_click");
                onclick(this.onOnboardingChange.bind(this));
            }, this);
        } else {
            this.text.off("pointerup");
        }

        if (loading) {
            // TODO: show some "loading" feedback like a spinner
            this.background.disableInteractive();
            this.setScale(1);
        } else {
            this.background.setInteractive(new Phaser.Geom.Rectangle(-150, -35, this.text.width + 95, 70), Phaser.Geom.Rectangle.Contains);
        }

        // change style to inform user if an error has occurred
        // TODO: choose better style
        this.text.setScale(error ? 1.5 : 1);

        // if ready, we're good to go        
        if (ready) {
            this.background.disableInteractive();
            this.chooseAvatarLayer.showPlay();
        } else {
            this.background.setInteractive(new Phaser.Geom.Rectangle(-150, -35, this.text.width + 95, 70), Phaser.Geom.Rectangle.Contains);
            this.chooseAvatarLayer.hidePlay();
        }
    }
}
