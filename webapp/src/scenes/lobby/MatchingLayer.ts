import { GameConstants } from "../../GameConstants";
import { GameVars } from "../../GameVars";

export class MatchingLayer extends Phaser.GameObjects.Container {

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.x = GameConstants.GAME_WIDTH / 2;
        this.y = GameConstants.GAME_HEIGHT/ 2;

        let vs = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "txt_vs");
        this.add(vs);


    }

    public setScalesAndPositions(): void {

        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.setScale(1 - (GameVars.scaleX - 1.2));
            } else {
                this.setScale(1);
            }
        } else {
            this.setScale(1.3 + (0.55 - GameVars.scaleY) * 3);
        }
    }
}