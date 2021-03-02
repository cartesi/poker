import { GameConstants } from "../../GameConstants";
import { GameVars } from "../../GameVars";

export class MatchingLayer extends Phaser.GameObjects.Container {

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.x = GameConstants.GAME_WIDTH / 2;
        this.y = GameConstants.GAME_HEIGHT/ 2;

        let bgVs = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "bg_vs");
        this.add(bgVs);

        let vs = new Phaser.GameObjects.Image(this.scene, 0, 7, "texture_atlas_1", "txt_vs");
        this.add(vs);

        let frameBg = new Phaser.GameObjects.Image(this.scene, -250, 0, "texture_atlas_1", "frame_bg_matching");
        this.add(frameBg);

        let playerImage = new Phaser.GameObjects.Image(this.scene, -250, 0, "texture_atlas_1", "avatar_player");
        this.add(playerImage);

        let frame = new Phaser.GameObjects.Image(this.scene, -250, 0, "texture_atlas_1", "frame_matching");
        this.add(frame);

        frameBg = new Phaser.GameObjects.Image(this.scene, 250, 0, "texture_atlas_1", "frame_bg_matching");
        this.add(frameBg);

        let opponentImage = new Phaser.GameObjects.Image(this.scene, 250, 0, "texture_atlas_1", "avatar_opponent");
        opponentImage.scaleX = -1;
        this.add(opponentImage);

        frame = new Phaser.GameObjects.Image(this.scene, 250, 0, "texture_atlas_1", "frame_matching");
        this.add(frame);

        let text = new Phaser.GameObjects.Text(this.scene, 0, 300, "MATCHING...", {fontFamily: "Oswald-Medium", fontSize: "40px", color: "#FFFFFF"});
        text.setOrigin(.5);
        text.setShadow(2, 2, "#000000", 5);
        this.add(text);
    }

    public setScalesAndPositions(): void {

        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.setScale(GameVars.scaleX, 1);
            }
        } else {
            this.setScale(1.2, GameVars.scaleY * 1.2);
        }
    }
}