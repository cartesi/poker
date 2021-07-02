import { RaiseButton } from './RaiseButton';
import { GameVars } from './../../../GameVars';
import { GameConstants } from './../../../GameConstants';
import { BetType } from "../../../services/Game";
import { BetButton } from './BetButton';
import { RoomManager } from "../RoomManager";

export class BetsButtonsContainer extends Phaser.GameObjects.Container {

    constructor(scene: Phaser.Scene) {

        super(scene);
    }

    public show(): void {

        this.setButtons();

        this.visible = true;
        this.y = GameConstants.GAME_HEIGHT + 200;

        this.scene.tweens.add({
            targets: this,
            y: GameConstants.GAME_HEIGHT,
            ease: Phaser.Math.Easing.Linear,
            duration: 500
        });

    }

    public hide(): void {

        this.scene.tweens.add({
            targets: this,
            y: GameConstants.GAME_HEIGHT + 200,
            ease: Phaser.Math.Easing.Linear,
            duration: 500,
            onComplete: () => {
                this.visible = false;
            },
            onCompleteScope: this
        });
    }

    public async setButtons(): Promise<void> {

        this.removeAll();

        let scaleX = Math.min(GameVars.scaleX, 1.2);

        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                scaleX = 1;
            }
        }

        const playerBets = await RoomManager.getPlayerBets();
        const opponentBets = await RoomManager.getOpponentBets();
        
        if (playerBets < opponentBets) {

            if (GameVars.landscape) {
                let foldButton = new BetButton(this.scene, BetType.FOLD, -555 / scaleX, 12 / scaleX);
                this.add(foldButton);
    
                let callButton = new BetButton(this.scene, BetType.CALL, -345 / scaleX, 18 / scaleX);
                this.add(callButton);
    
                let raiseButton = new RaiseButton(this.scene, 210 / scaleX, 61.5 / scaleX);
                this.add(raiseButton);
    
                let btn_divider = new Phaser.GameObjects.Image(this.scene, foldButton.x + 83 / scaleX, -47, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
    
                btn_divider = new Phaser.GameObjects.Image(this.scene, callButton.x + 125 / scaleX, -47, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            } else {
                let foldButton = new BetButton(this.scene, BetType.FOLD, -462, 10);
                this.add(foldButton);
    
                let callButton = new BetButton(this.scene, BetType.CALL, -288, 15);
                this.add(callButton);
    
                let raiseButton = new RaiseButton(this.scene, 175, 51.5);
                this.add(raiseButton);
    
                let btn_divider = new Phaser.GameObjects.Image(this.scene, foldButton.x + 68, -47, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
    
                btn_divider = new Phaser.GameObjects.Image(this.scene, callButton.x + 102, -47, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            }
        } else {

            if (GameVars.landscape) {
                let checkButton = new BetButton(this.scene, BetType.CHECK, -500 / scaleX, 20 / scaleX);
                this.add(checkButton);
        
                let raiseButton = new RaiseButton(this.scene, 140 / scaleX, 71.5 / scaleX);
                this.add(raiseButton);
        
                let btn_divider = new Phaser.GameObjects.Image(this.scene, checkButton.x + 140 / scaleX, -47, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            } else {
                let checkButton = new BetButton(this.scene, BetType.CHECK, -420, 16);
                this.add(checkButton);
    
                let raiseButton = new RaiseButton(this.scene, 113, 60.2);
                this.add(raiseButton);
    
                let btn_divider = new Phaser.GameObjects.Image(this.scene, checkButton.x + 110 / scaleX, -47, "texture_atlas_1", "btn_divider");
                this.add(btn_divider);
            }
        } 
    }
}
