import { AudioManager } from "../../AudioManager";
import { GameConstants } from "../../GameConstants";
import { GameManager } from "../../GameManager";
import { GameVars } from "../../GameVars";

export class MatchingLayer extends Phaser.GameObjects.Container {

    private static NAMES: string[] = ["Ruth","Jackson","Debra","Allen","Gerald","Harris","Raymond","Carter","Jacqueline","Torres","Joseph","Nelson","Carlos","Sanchez","Ralph","Clark","Jean","Alexander","Stephen","Roberts","Eric","Long","Amanda","Scott","Teresa","Diaz","Wanda","Thomas"];

    private waitingText: Phaser.GameObjects.Text;
    private watchingTimer: number;

    private playerContainer: Phaser.GameObjects.Container;
    private opponentContainer: Phaser.GameObjects.Container;

    private upperAvatarImage: Phaser.GameObjects.Image;
    private lowerAvatarImage: Phaser.GameObjects.Image;

    private adversarySelected: boolean;
    private setToStop: boolean;
    private stopScrolling: boolean;

    private opponentNickname: Phaser.GameObjects.Text;

    private maskShape: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.adversarySelected = false;
        this.setToStop = false;
        this.stopScrolling = false;
        this.watchingTimer = 0;

        this.x = GameConstants.GAME_WIDTH / 2;
        this.y = GameConstants.GAME_HEIGHT / 2;

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

        let playerImage = new Phaser.GameObjects.Image(this.scene, -250, 0, "texture_atlas_1", "avatar_0" + GameVars.gameData.avatar);
        playerImage.scaleX = -1;
        this.playerContainer.add(playerImage);

        let frame = new Phaser.GameObjects.Image(this.scene, -250, 0, "texture_atlas_1", "frame_matching");
        this.playerContainer.add(frame);

        let nicknameBck = new Phaser.GameObjects.Image(this.scene, -250, 120, "texture_atlas_1", "txt_box_names");
        this.playerContainer.add(nicknameBck);

        let nickname = new Phaser.GameObjects.Text(this.scene, -250, 120, GameVars.gameData.name, {fontFamily: "Oswald-Medium", fontSize: "24px", color: "#FFFFFF"});
        nickname.setOrigin(.5);
        this.playerContainer.add(nickname);

        this.opponentContainer = new Phaser.GameObjects.Container(this.scene);
        this.opponentContainer.alpha = 0;
        this.add(this.opponentContainer);

        frameBg = new Phaser.GameObjects.Image(this.scene, 250, 0, "texture_atlas_1", "frame_bg_matching");
        this.opponentContainer.add(frameBg);

        this.upperAvatarImage = new Phaser.GameObjects.Image(this.scene, 250, 0, "texture_atlas_1", "avatar_01");
        this.opponentContainer.add(this.upperAvatarImage);

        this.lowerAvatarImage = new Phaser.GameObjects.Image(this.scene, 250, 0, "texture_atlas_1", "avatar_02");
        this.opponentContainer.add(this.lowerAvatarImage);

        this.maskShape = new Phaser.GameObjects.Graphics(this.scene);
        this.maskShape.x = this.x + 250;
        this.maskShape.y = this.y;
        this.maskShape.fillStyle(0xFF0000);
        this.maskShape.fillRect(-GameConstants.GAME_WIDTH / 2, -70 * GameVars.scaleY, GameConstants.GAME_WIDTH, 140 * GameVars.scaleY);

        const mask = this.maskShape.createGeometryMask();
        this.upperAvatarImage.setMask(mask);
        this.lowerAvatarImage.setMask(mask);

        frame = new Phaser.GameObjects.Image(this.scene, 250, 0, "texture_atlas_1", "frame_matching");
        this.opponentContainer.add(frame);

        nicknameBck = new Phaser.GameObjects.Image(this.scene, 250, 120, "texture_atlas_1", "txt_box_names");
        this.opponentContainer.add(nicknameBck);

        this.opponentNickname = new Phaser.GameObjects.Text(this.scene, 250, 120, "???", {fontFamily: "Oswald-Medium", fontSize: "24px", color: "#FFFFFF"});
        this.opponentNickname.setOrigin(.5);
        this.opponentContainer.add(this.opponentNickname);

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
            delay: 1500,
            onStart: () => {
                AudioManager.playMatching("matching");
            },
            onStartScope: this
        });

        this.scene.sys.updateList.add(this);
    }

    public preUpdate(time: number, delta: number): void {

        if (this.watchingTimer++ === 60 && !this.stopScrolling) {

            this.watchingTimer = 0;

            switch (this.waitingText.text) {
                case "MATCHING.":
                    this.waitingText.text = "MATCHING..";
                    break;
                case "MATCHING..":
                    this.waitingText.text = "MATCHING...";
                    break;
                case "MATCHING...":
                    this.waitingText.text = "MATCHING.";
                    break;
                default:
                    break;
            }
        }

        this.maskShape.x = this.x + 250;

        if (this.stopScrolling) {
            return;
        }
        
        this.lowerAvatarImage.y += 20;
        this.upperAvatarImage.y = this.lowerAvatarImage.y - 300;

        if (this.lowerAvatarImage.y >= 200) {

            if (this.setToStop) {

                this.stopScrolling = true;
                this.upperAvatarImage.y = 0;

                this.opponentNickname.setText(GameVars.opponentName);

            } else {

                const tmpAvatarImage = this.lowerAvatarImage;
                this.lowerAvatarImage = this.upperAvatarImage;
                this.upperAvatarImage = tmpAvatarImage;

                this.lowerAvatarImage.setFrame("avatar_0" + Math.ceil(Math.random() * 5));
    
                if (this.adversarySelected) {
                    this.upperAvatarImage.setFrame("avatar_0" + GameVars.opponentAvatar);
                    this.setToStop = true;
                }

                this.opponentNickname.setText(MatchingLayer.NAMES[Math.floor(Math.random() * MatchingLayer.NAMES.length)]);
            }
        }
    }

    public onStopScrolling(): void {

        AudioManager.stopMatching();

        this.adversarySelected = true;

        this.scene.tweens.add({
            targets: this.waitingText,
            alpha: 0,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500
        });

        let playButton = new Phaser.GameObjects.Image(this.scene, 0, this.waitingText.y, "texture_atlas_1", "btn_play");
        playButton.setInteractive();
        playButton.alpha = 0;
        playButton.on("pointerover", () => {
            playButton.setScale(1.05);
        }, this);
        playButton.on("pointerout", () => {
            playButton.setScale(1);
        }, this);
        playButton.on("pointerup", () => {
            AudioManager.playSound("btn_click");
            GameManager.enterRoomScene();
        }, this);
        this.add(playButton);

        this.scene.tweens.add({
            targets: playButton,
            alpha: 1,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 500,
            delay: 500
        });
    }

    public setScalesAndPositions(): void {

        this.maskShape.clear();

        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                this.maskShape.fillRect(-GameConstants.GAME_WIDTH / 2, -70 * (1 - (GameVars.scaleX - 1.2)), GameConstants.GAME_WIDTH, 140 * (1 - (GameVars.scaleX - 1.2)));
            } else {
                this.setScale(GameVars.scaleX, 1);
                this.maskShape.fillRect(-GameConstants.GAME_WIDTH / 2, -70, GameConstants.GAME_WIDTH, 140);
            }
        } else {
            this.setScale(1.2, GameVars.scaleY * 1.2);
            this.maskShape.fillRect(-GameConstants.GAME_WIDTH / 2, -70 * GameVars.scaleY * 1.2, GameConstants.GAME_WIDTH, 140 * GameVars.scaleY * 1.2);
        }
    }
}
