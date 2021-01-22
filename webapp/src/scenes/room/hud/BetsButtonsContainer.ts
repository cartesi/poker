import { RaiseButton } from './RaiseButton';
import { GameVars } from './../../../GameVars';
import { GameConstants } from './../../../GameConstants';
import { BetButton } from './BetButton';
import { RoomManager } from "../RoomManager";

export class BetsButtonsContainer extends Phaser.GameObjects.Container {

    constructor(scene: Phaser.Scene) {

        super(scene);
    }

    public show(): void {

        this.visible = true;

        this.setButtons();
    }

    public setButtons(): void {

        this.removeAll();

        let scaleX = Math.min(GameVars.scaleX, 1.2);

        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                scaleX = 1;
            }
        }

        if (RoomManager.getPlayerBets() < RoomManager.getOpponentBets()) {

            if (GameVars.landscape) {
                let foldButton = new BetButton(this.scene, GameConstants.ACTION_FOLD, -414 / scaleX, 14 / scaleX);
                this.add(foldButton);
    
                let callButton = new BetButton(this.scene, GameConstants.ACTION_CALL, -237 / scaleX, 21.5 / scaleX);
                this.add(callButton);
    
                let raiseButton = new RaiseButton(this.scene, 175 / scaleX, 61 / scaleX);
                this.add(raiseButton);
    
                let btn_divider = new Phaser.GameObjects.Image(this.scene, foldButton.x + 69 / scaleX, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
    
                btn_divider = new Phaser.GameObjects.Image(this.scene, callButton.x + 106 / scaleX, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            } else {
                let foldButton = new BetButton(this.scene, GameConstants.ACTION_FOLD, -340, 12);
                this.add(foldButton);
    
                let callButton = new BetButton(this.scene, GameConstants.ACTION_CALL, -190, 18);
                this.add(callButton);
    
                let raiseButton = new RaiseButton(this.scene, 150, 50.2);
                this.add(raiseButton);
    
                let btn_divider = new Phaser.GameObjects.Image(this.scene, foldButton.x + 60, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
    
                btn_divider = new Phaser.GameObjects.Image(this.scene, callButton.x + 88, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            }
        } else {

            if (GameVars.landscape) {
                let checkButton = new BetButton(this.scene, GameConstants.ACTION_CHECK, -330 / scaleX, 30 / scaleX);
                this.add(checkButton);
        
                let raiseButton = new RaiseButton(this.scene, 151 / scaleX, 66.2 / scaleX);
                this.add(raiseButton);
        
                let btn_divider = new Phaser.GameObjects.Image(this.scene, checkButton.x + 150 / scaleX, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            } else {
                let checkButton = new BetButton(this.scene, GameConstants.ACTION_CHECK, -300, 20);
                this.add(checkButton);

                let raiseButton = new RaiseButton(this.scene, 100, 60);
                this.add(raiseButton);

                let btn_divider = new Phaser.GameObjects.Image(this.scene, checkButton.x + 100 / scaleX, -35, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            }
        } 
    }
}
