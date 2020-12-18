import { GameConstants } from "./../../../GameConstants";
import { GameVars } from "../../../GameVars";
import { RoomManager } from "../RoomManager";
import { Button } from "./Button";

export class HUD extends Phaser.GameObjects.Container {

    private startButton: Button;

    private betsContainer: Phaser.GameObjects.Container;
    private topContainer: Phaser.GameObjects.Container;
    private call: Button;
    private check: Button;
    private fold: Button;
    private raise: Button;
    private raiseInput: Phaser.GameObjects.DOMElement;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.topContainer = new Phaser.GameObjects.Container(this.scene);
        this.add(this.topContainer);

        this.startButton = new Button(this.scene, 80, 55, "btn_blue", "START", () => {
            RoomManager.startRound(true);
        });
        this.topContainer.add(this.startButton);

        this.betsContainer = new Phaser.GameObjects.Container(this.scene);
        this.betsContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT);
        this.add(this.betsContainer);

        this.call = new Button(this.scene, -300, -52, "btn_blue", "CALL", RoomManager.playerCall);
        this.betsContainer.add(this.call);

        this.check = new Button(this.scene, -150, -52, "btn_blue", "CHECK", RoomManager.playerCheck);
        this.betsContainer.add(this.check);

        this.fold = new Button(this.scene, 0, -52, "btn_red", "FOLD", RoomManager.playerFold);
        this.betsContainer.add(this.fold);

        this.raise = new Button(this.scene, 150, -52, "btn_blue", "RAISE", () => {
            const inputText = <any> this.raiseInput.getChildByName("raiseField");
            let value = parseInt(inputText.value);
            RoomManager.playerRaise(value);
        });
        this.betsContainer.add(this.raise);
        
        this.raiseInput = this.scene.add.dom(300, -52);
        this.raiseInput.createFromCache("raiseform");
        this.betsContainer.add(this.raiseInput);

        this.removeBetButtons();

        this.setScalesAndPostions();
        
    }

    public setScalesAndPostions(): void {
        
        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.topContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
                this.betsContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.topContainer.setScale(GameVars.scaleX, 1);
                this.betsContainer.setScale(GameVars.scaleX, 1);
            }
        } else {
            this.topContainer.setScale(1.2, GameVars.scaleY * 1.2);
            this.betsContainer.setScale(1.2, GameVars.scaleY * 1.2);
        }

    }

    public removeBetButtons(): void {

        this.betsContainer.visible = false;
    }

    public showBetButtons(): void {

        this.betsContainer.visible = true;

        this.call.activate(RoomManager.getPlayerBets() < RoomManager.getOpponentBets());
        this.check.activate(RoomManager.getPlayerBets() === RoomManager.getOpponentBets());
        this.fold.activate(RoomManager.getPlayerBets() !== RoomManager.getOpponentBets());
        this.fold.activate(RoomManager.getPlayerFunds() > RoomManager.getOpponentBets());
    } 
}
