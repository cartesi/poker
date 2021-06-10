import { GameVars } from './../../GameVars';
import { AudioManager } from "../../AudioManager";
import { GameConstants } from "../../GameConstants";
import { GameManager } from "../../GameManager";
import { Onboarding } from "../../web3/Onboarding";
import { Avatar } from "./Avatar";

export class ChooseAvatarLayer extends Phaser.GameObjects.Container {

    private chooseAvatarFrame: Phaser.GameObjects.Image;
    private chooseAvatar: Phaser.GameObjects.Image;
    private playButton: Phaser.GameObjects.Image;
    private avatars: Avatar[];
    private inputBackground: Phaser.GameObjects.Image;
    private inputElement: Phaser.GameObjects.DOMElement;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2 - 30);

        this.chooseAvatar = new Phaser.GameObjects.Image(this.scene, 0, 90, "texture_atlas_1", "choose_avatar_base_landscape");
        this.chooseAvatar.scaleX = 1.05;
        this.add(this.chooseAvatar);

        this.avatars = [];
        
        for (let i = 0; i < 6; i++) {

            let avatar = new Avatar(this.scene, i + 1, this);
            avatar.setPosition( -368 + 147 * i, 117);
            this.add(avatar);
            this.avatars.push(avatar);
        }

        this.chooseAvatarFrame = new Phaser.GameObjects.Image(this.scene, this.avatars[2].x, 130, "texture_atlas_1", "choose_avatar_frame");
        this.chooseAvatarFrame.setScale(1.2);
        this.add(this.chooseAvatarFrame);

        this.inputBackground = new Phaser.GameObjects.Image(this.scene, 0, 260, "texture_atlas_1", "txt_box");
        this.add(this.inputBackground);

        this.inputElement = this.scene.add.dom(0, 257).createFromCache("input-text");
        this.add(this.inputElement);

        let inputText: any = this.inputElement.getChildByName("fname");
        if (GameVars.gameData.name) {
            inputText.value = GameVars.gameData.name;
        }

        this.playButton = new Phaser.GameObjects.Image(this.scene, 0, 355, "texture_atlas_1", "btn_play");
        this.playButton.setInteractive();
        this.playButton.on("pointerover", () => {
            this.playButton.setScale(1.05);
        }, this);
        this.playButton.on("pointerout", () => {
            this.playButton.setScale(1);
        }, this);
        this.playButton.on("pointerup", () => {
            AudioManager.playSound("btn_click");
            GameManager.setPlayerName(inputText.value);
            GameManager.enterLobbyScene();
        }, this);
        this.playButton.setVisible(false);
        this.add(this.playButton);

        this.onAvatarDown(GameVars.gameData.avatar);

        Onboarding.start(({label, onclick, error, ready}) => {
            if (ready) {
                this.playButton.setVisible(true);
            }
        });

    }

    public onAvatarDown(index: number): void {

        GameManager.setPlayerAvatar(index);
        this.chooseAvatarFrame.setPosition(this.avatars[index - 1].x, this.avatars[index - 1].y + 3);
    }

    public setLandscapeMode(): void {

        this.chooseAvatar.setFrame("choose_avatar_base_landscape");
        this.playButton.y = 355;
        this.inputElement.y = 257;
        this.inputBackground.y = 260;
        this.chooseAvatar.scaleX = 1.05;

        for (let i = 0; i < 6; i++) {
            this.avatars[i].setPosition( -368 + 147 * i, 117);
        }

        this.onAvatarDown(GameVars.gameData.avatar);
    }

    public setPortraitMode(): void {

        this.chooseAvatar.setFrame("choose_avatar_base_portrait");
        this.playButton.y = 435;
        this.inputElement.y = 337;
        this.inputBackground.y = 340;
        this.chooseAvatar.scaleX = 1;

        for (let i = 0; i < 3; i++) {
            this.avatars[i].setPosition( -152 + 152 * i, 40);
        }

        for (let i = 0; i < 3; i++) {
            this.avatars[i + 3].setPosition( -152 + 152 * i, 190);
        }

        this.onAvatarDown(GameVars.gameData.avatar);
    }
}
