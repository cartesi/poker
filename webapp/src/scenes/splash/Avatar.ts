import { ChooseAvatarLayer } from "./ChooseAvatarLayer";

export class Avatar extends Phaser.GameObjects.Container {

    private image: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene, index: number, chooseAvatarLayer: ChooseAvatarLayer) {

        super(scene);

        this.setScale(.9);

        let background = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "frame_bg_matching");
        background.setInteractive();
        background.on("pointerdown", () => {
            chooseAvatarLayer.onAvatarDown(index);
        }, this);
        this.add(background);

        this.image = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "avatar_0" + index);
        this.add(this.image);
    }
}