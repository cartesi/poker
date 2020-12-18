import { GameVars } from "./../../../GameVars";

export class Table extends Phaser.GameObjects.Container {

    constructor(scene: Phaser.Scene) {

        super(scene);

        const leftCorner = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "table_border");
        leftCorner.setOrigin(1, .5);
        this.add(leftCorner);

        const rightCorner = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "table_border");
        rightCorner.setOrigin(1, .5);
        rightCorner.scaleX = -1;
        this.add(rightCorner);

        this.setScalesAndPostions();
    }

    public setScalesAndPostions(): void {

        if (GameVars.landscape) {
            this.scaleX = GameVars.scaleX;
            this.setAngle(0);
        } else {
            this.scaleX = GameVars.scaleY;
            this.setAngle(90);
        }
    }
}
