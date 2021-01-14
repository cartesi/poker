import { RoomManager } from "./../RoomManager";

export class RaiseButton extends Phaser.GameObjects.Container {

    constructor(scene: Phaser.Scene, x: number, scaleX: number) {

        super(scene);

        this.setPosition(x, 0);

        let bckImage = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "btn_raise");
        bckImage.setOrigin(.5, 1);
        bckImage.scaleX = scaleX;
        bckImage.setInteractive();
        bckImage.on("pointerdown", this.onDown, this);
        this.add(bckImage);

        let textImage = new Phaser.GameObjects.Image(this.scene, 0, -30, "texture_atlas_1", "txt_raise");
        this.add(textImage);

    }

    private onDown(): void {

        // TODO: determinar el valor
        RoomManager.playerRaise(1);
    }
}
