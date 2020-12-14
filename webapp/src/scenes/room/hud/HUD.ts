import { GameConstants } from './../../../GameConstants';
import { GameVars } from "../../../GameVars";
import { RoomManager } from "../RoomManager";
import { Button } from "./Button";

export class HUD extends Phaser.GameObjects.Container {

    private startButton: Button;

    private betsContainer: Phaser.GameObjects.Container;
    private call: Button;
    private check: Button;
    private fold: Button;
    private raise: Button;
    private raiseInput: Phaser.GameObjects.DOMElement;

    constructor(scene: Phaser.Scene) {

        super(scene);

        let topContainer = new Phaser.GameObjects.Container(this.scene);
        topContainer.scaleX = GameVars.scaleX;
        this.add(topContainer);

        this.startButton = new Button(this.scene, 80, 55, "btn_blue", "START", () => {
            RoomManager.startRound(true);
        });
        topContainer.add(this.startButton);

        this.betsContainer = new Phaser.GameObjects.Container(this.scene);
        this.betsContainer.setPosition(GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT);
        this.betsContainer.scaleX = GameVars.scaleX;
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
        
        // this.raiseInput = this.scene.add.dom(100, 100).createFromCache("raiseform");
        this.raiseInput = this.scene.add.dom(300, -52);
        this.raiseInput.createFromCache("raiseform");
        this.betsContainer.add(this.raiseInput);

        this.removeBetButtons();
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
