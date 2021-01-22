import { BetsButtonsContainer } from "./BetsButtonsContainer";
import { GameConstants } from "./../../../GameConstants";
import { GameVars } from "../../../GameVars";
import { RoomManager } from "../RoomManager";

export class HUD extends Phaser.GameObjects.Container {

    private menuButton: Phaser.GameObjects.Image;

    private betsButtonsContainer: BetsButtonsContainer;
    private topContainer: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.topContainer = new Phaser.GameObjects.Container(this.scene);
        this.add(this.topContainer);

        this.menuButton = new Phaser.GameObjects.Image(this.scene, 50, 50, "texture_atlas_1", "btn_menu");
        this.menuButton.setInteractive();
        this.menuButton.on("pointerover", () => {
            this.menuButton.setScale(1.05);
        }, this);
        this.menuButton.on("pointerout", () => {
            this.menuButton.setScale(1);
        }, this);
        this.topContainer.add(this.menuButton);

        this.betsButtonsContainer = new BetsButtonsContainer(this.scene);
        this.betsButtonsContainer.visible = false;
        this.betsButtonsContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT);
        this.add(this.betsButtonsContainer);

        this.setScalesAndPostions();
        
    }

    public setScalesAndPostions(): void {
        
        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.topContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                this.betsButtonsContainer.setScale(1, 1 / GameVars.scaleX);
            } else {
                this.topContainer.setScale(GameVars.scaleX, 1);
                this.betsButtonsContainer.setScale(GameVars.scaleX, 1);
            }
        } else {
            this.topContainer.setScale(1.2, GameVars.scaleY * 1.2);
            this.betsButtonsContainer.setScale(1.2, GameVars.scaleY * 1.2);
        }

        if (this.betsButtonsContainer.visible) {
            this.betsButtonsContainer.setButtons();
        }
    }

    public removeBetButtons(): void {

        this.betsButtonsContainer.visible = false;
    }

    public showBetButtons(): void {

        GameVars.raiseValue = 1;
        
        this.betsButtonsContainer.show();
    } 
}
