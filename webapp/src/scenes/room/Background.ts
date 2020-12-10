import { GameConstants } from "../../GameConstants";
import { GameVars } from "../../GameVars";

export class Background extends Phaser.GameObjects.Container {

    constructor(scene: Phaser.Scene) {

        super(scene);

        // TODO: ajustar tamaño segun las medidas de la pantalla

        this.x = GameConstants.GAME_WIDTH / 2;
        this.y = GameConstants.GAME_HEIGHT / 2;

        if (GameVars.landscape) {
            this.scaleX = GameVars.scaleX;
        } else {
            this.setAngle(90);
            this.setScale(GameVars.scaleY * 1.5, 1.5);
        }

        const leftCorner = this.scene.add.image(0, 0, "texture_atlas_1", "table_border");
        leftCorner.setOrigin(1, .5);
        this.add(leftCorner);

        const rightCorner = this.scene.add.image(0, 0, "texture_atlas_1", "table_border");
        rightCorner.setOrigin(1, .5);
        rightCorner.scaleX = -1;
        this.add(rightCorner);
    }
}
