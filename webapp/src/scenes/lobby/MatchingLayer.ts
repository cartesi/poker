import { GameConstants } from "../../GameConstants";
import { GameVars } from "../../GameVars";

export class MatchingLayer extends Phaser.GameObjects.Container {

    private waitingText: Phaser.GameObjects.Text;
    private watchingTimer: number;

    private playerContainer: Phaser.GameObjects.Container;
    private opponentContainer: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.watchingTimer = 0;

        this.x = GameConstants.GAME_WIDTH / 2;
        this.y = GameConstants.GAME_HEIGHT/ 2;

        let bgVs = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "bg_vs");
        bgVs.alpha = 0;
        this.add(bgVs);

        let vs = new Phaser.GameObjects.Image(this.scene, 0, 7, "texture_atlas_1", "txt_vs");
        vs.alpha = 0;
        this.add(vs);

        this.playerContainer = new Phaser.GameObjects.Container(this.scene);
        this.playerContainer.alpha = 0;
        this.add(this.playerContainer);

        let frameBg = new Phaser.GameObjects.Image(this.scene, -250, 0, "texture_atlas_1", "frame_bg_matching");
        this.playerContainer.add(frameBg);

        let playerImage = new Phaser.GameObjects.Image(this.scene, -250, 0, "texture_atlas_1", GameVars.playerAvatar === 1 ? "avatar_player" : "avatar_opponent");
        this.playerContainer.add(playerImage);

        let frame = new Phaser.GameObjects.Image(this.scene, -250, 0, "texture_atlas_1", "frame_matching");
        this.playerContainer.add(frame);

        let nicknameBck = new Phaser.GameObjects.Image(this.scene, -250, 120, "texture_atlas_1", "txt_box_names");
        this.playerContainer.add(nicknameBck);

        let nickname = new Phaser.GameObjects.Text(this.scene, -250, 120, GameVars.playerName, {fontFamily: "Oswald-Medium", fontSize: "24px", color: "#FFFFFF"});
        nickname.setOrigin(.5);
        this.playerContainer.add(nickname);

        this.opponentContainer = new Phaser.GameObjects.Container(this.scene);
        this.opponentContainer.alpha = 0;
        this.add(this.opponentContainer);

        frameBg = new Phaser.GameObjects.Image(this.scene, 250, 0, "texture_atlas_1", "frame_bg_matching");
        this.opponentContainer.add(frameBg);

        let opponentImage = new Phaser.GameObjects.Image(this.scene, 250, 0, "texture_atlas_1", "avatar_opponent");
        opponentImage.scaleX = -1;
        this.opponentContainer.add(opponentImage);

        frame = new Phaser.GameObjects.Image(this.scene, 250, 0, "texture_atlas_1", "frame_matching");
        this.opponentContainer.add(frame);

        nicknameBck = new Phaser.GameObjects.Image(this.scene, 250, 120, "texture_atlas_1", "txt_box_names");
        this.opponentContainer.add(nicknameBck);

        nickname = new Phaser.GameObjects.Text(this.scene, 250, 120, "???", {fontFamily: "Oswald-Medium", fontSize: "24px", color: "#FFFFFF"});
        nickname.setOrigin(.5);
        this.opponentContainer.add(nickname);

        this.waitingText = new Phaser.GameObjects.Text(this.scene, -80, 300, "MATCHING...", {fontFamily: "Oswald-Medium", fontSize: "40px", color: "#FFFFFF"});
        this.waitingText.setOrigin(0, .5);
        this.waitingText.setShadow(2, 2, "#000000", 5);
        this.add(this.waitingText);

        this.scene.tweens.add({
            targets: this.playerContainer,
            alpha: 1,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500,
            delay: 500
        });

        this.scene.tweens.add({
            targets: [bgVs, vs],
            alpha: 1,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500,
            delay: 1000
        });

        this.scene.tweens.add({
            targets: this.opponentContainer,
            alpha: 1,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500,
            delay: 1500
        });

        this.scene.sys.updateList.add(this);
    }

    public preUpdate(time: number, delta: number): void {

        if (this.watchingTimer++ === 60) {

            this.watchingTimer = 0;

            switch(this.waitingText.text) {
                case "MATCHING.":
                    this.waitingText.text = "MATCHING.."
                    break;
                case "MATCHING..":
                    this.waitingText.text = "MATCHING..."
                    break;
                case "MATCHING...":
                    this.waitingText.text = "MATCHING."
                    break;
            }
        }
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