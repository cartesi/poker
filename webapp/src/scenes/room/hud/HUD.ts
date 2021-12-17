import { BetsButtonsContainer } from "./BetsButtonsContainer";
import { GameConstants } from "./../../../GameConstants";
import { GameVars } from "../../../GameVars";
import { RoomManager } from "../RoomManager";
import { ethers } from "ethers";
import { InfoContainer } from "../../InfoContainer";

export class HUD extends Phaser.GameObjects.Container {

    private menuButton: Phaser.GameObjects.Image;

    private betsButtonsContainer: BetsButtonsContainer;
    private topContainer: Phaser.GameObjects.Container;
    private infoContainer: InfoContainer;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.topContainer = new Phaser.GameObjects.Container(this.scene);
        this.add(this.topContainer);

        this.menuButton = new Phaser.GameObjects.Image(this.scene, 60, 60, "texture_atlas_1", "btn_menu");
        this.menuButton.setInteractive();
        this.menuButton.on("pointerover", () => {
            this.menuButton.setScale(1.05);
        }, this);
        this.menuButton.on("pointerout", () => {
            this.menuButton.setScale(1);
        }, this);
        this.menuButton.on("pointerup", () => {
            RoomManager.showSettingsMenu();
        }, this);
        this.topContainer.add(this.menuButton);

        this.betsButtonsContainer = new BetsButtonsContainer(this.scene);
        this.betsButtonsContainer.visible = false;
        this.betsButtonsContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT);
        this.add(this.betsButtonsContainer);

        this.infoContainer = new InfoContainer(this.scene);
        this.infoContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT - 50);
        this.infoContainer.hide();
        this.add(this.infoContainer);

        this.setScalesAndPostions();
        
    }

    public setScalesAndPostions(): void {
        
        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.topContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                this.betsButtonsContainer.setScale(1, 1 / GameVars.scaleX);
                this.infoContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.topContainer.setScale(GameVars.scaleX, 1);
                this.betsButtonsContainer.setScale(GameVars.scaleX, 1);
                this.infoContainer.setScale(GameVars.scaleX, 1);
            }
        } else {
            this.topContainer.setScale(1.2, GameVars.scaleY * 1.2);
            this.betsButtonsContainer.setScale(1.2, GameVars.scaleY * 1.2);
            this.infoContainer.setScale(1.2, GameVars.scaleY * 1.2);
        }

        if (this.betsButtonsContainer.visible) {
            this.betsButtonsContainer.setButtons();
        }
    }

    public removeBetButtons(): void {

        this.betsButtonsContainer.hide();
        this.infoContainer.hide();
    }

    public showBetButtons(): void {

        GameVars.raiseValue = ethers.BigNumber.from(1);
        
        this.betsButtonsContainer.show();
        this.infoContainer.hide();
    } 

    public clearInfo() {
        this.infoContainer.hide();
    }

    public updateInfo(msg: string) {
        this.infoContainer.update(msg, true);
    }
}
