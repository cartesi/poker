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

        let reducedScale = .8;

        if (GameVars.landscape) {
            this.setScale(reducedScale * GameVars.scaleX, reducedScale);
            this.setAngle(0);
        } else {
            this.setScale(GameVars.scaleY, 1);
            this.setAngle(90);
        }
    }
}
