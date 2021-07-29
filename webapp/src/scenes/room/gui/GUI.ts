import { StateLayer } from "./StateLayer";
import { GameVars } from "../../../GameVars";
import { GameConstants } from "../../../GameConstants";
import { RoomManager } from "../RoomManager";
import { WinnerLayer } from "./WinnerLayer";

export class GUI extends Phaser.GameObjects.Container {

    private topContainer: Phaser.GameObjects.Container;
    private cartesi: Phaser.GameObjects.Text;

    private midContainer: Phaser.GameObjects.Container; 
    private potText: Phaser.GameObjects.Text;
    private potImage: Phaser.GameObjects.Image;
    private stateLayer: StateLayer;

    private botContainer: Phaser.GameObjects.Container; 
    private winnerLayer: WinnerLayer;

    private canClick: boolean;
    private nextButton: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.canClick = false;

        this.topContainer = new Phaser.GameObjects.Container(this.scene, GameConstants.GAME_WIDTH / 2, 0);
        this.add(this.topContainer);

        let title = new Phaser.GameObjects.Image(this.scene, 0, 10, "texture_atlas_1", "logo_title");
        title.setOrigin(.5, 0);
        title.alpha = 0;
        title.setScale(.5);
        this.topContainer.add(title);

        this.cartesi = new Phaser.GameObjects.Text(this.scene, 95, 60, " powered by Cartesi ", {fontFamily: "Oswald-Medium", fontSize: "20px", color: "#FFFFFF"});
        this.cartesi.setOrigin(0, .5);
        this.cartesi.alpha = 0;
        this.cartesi.setScale(.5);
        this.cartesi.setShadow(1, 1, "#000000", 5);
        this.topContainer.add(this.cartesi);

        this.scene.tweens.add({
            targets: [title, this.cartesi],
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            ease: Phaser.Math.Easing.Cubic.Out,
            duration: 250,
            delay: 500
        });

        this.midContainer = new Phaser.GameObjects.Container(this.scene, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
        this.add(this.midContainer);

        this.potText = new Phaser.GameObjects.Text(this.scene, -30, -60, "POT: 0", {fontFamily: "Oswald-Medium", fontSize: "40px", color: "#216652"});
        this.potText.setOrigin(.5);
        this.potText.visible = false;
        this.midContainer.add(this.potText);

        this.potImage = new Phaser.GameObjects.Image(this.scene, this.potText.x + this.potText.width / 2 + 10, -58, "texture_atlas_1", "chip");
        this.potImage.setOrigin(0, .5);
        this.potImage.visible = false;
        this.midContainer.add(this.potImage);

        this.nextButton = new Phaser.GameObjects.Container(this.scene);
        this.nextButton.setPosition(310, 30);
        this.midContainer.add(this.nextButton);

        let nextText = new Phaser.GameObjects.Text(this.scene, 0, 0, "NEXT HAND", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#183D62"});
        nextText.setOrigin(.5);

        let nextBtn = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "btn_long");
        nextBtn.setOrigin(.5);
        nextBtn.scaleX = .7;
        nextBtn.setInteractive();
        nextBtn.on("pointerdown", () => {
            nextBtn.setScale(.7, 1);
            nextText.setScale(1);
        }, this);
        nextBtn.on("pointerup", this.onClickNext, this);
        nextBtn.on("pointerover", () => {
            nextBtn.setScale(.75, 1.05);
            nextText.setScale(1.05);
        }, this);
        nextBtn.on("pointerout", () => {
            nextBtn.setScale(.7, 1);
            nextText.setScale(1);
        }, this);
        this.nextButton.add(nextBtn);
        this.nextButton.add(nextText);

        this.nextButton.visible = false;

        this.stateLayer = new StateLayer(this.scene);
        this.midContainer.add(this.stateLayer);

        this.botContainer = new Phaser.GameObjects.Container(this.scene, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT);
        this.add(this.botContainer);

        this.winnerLayer = new WinnerLayer(this.scene);
        this.botContainer.add(this.winnerLayer);

        this.setScalesAndPostions();
    }

    public setScalesAndPostions(): void {
        
        if (GameVars.landscape) {
            if (GameVars.scaleX > 1.2) {
                this.midContainer.setScale((1 - (GameVars.scaleX - 1.2)) * GameVars.scaleX, 1 - (GameVars.scaleX - 1.2));
            } else {
                this.midContainer.setScale(GameVars.scaleX, 1);
            }
            this.midContainer.y = GameConstants.GAME_HEIGHT / 2;

            this.topContainer.setScale(GameVars.scaleX, 1);
            this.botContainer.setScale(GameVars.scaleX, 1);
            this.nextButton.setPosition(310, 30);

            this.cartesi.setPosition(95, 60);
            this.cartesi.setOrigin(0, .5);
        } else {

            this.midContainer.y = GameConstants.GAME_HEIGHT / 2 - 47;
            this.midContainer.setScale(1.3 + (0.55 - GameVars.scaleY) * 3, (1.3 + (0.55 - GameVars.scaleY) * 3) * GameVars.scaleY);

            this.topContainer.setScale(1.3 + (0.55 - GameVars.scaleY) * 3, (1.3 + (0.55 - GameVars.scaleY) * 3) * GameVars.scaleY);
            this.botContainer.setScale(1.5 + (0.55 - GameVars.scaleY) * 3, (1.5 + (0.55 - GameVars.scaleY) * 3) * GameVars.scaleY);
            this.nextButton.setPosition(0, 130);

            this.cartesi.setPosition(0, 120);
            this.cartesi.setOrigin(.5);
        }
    }

    public resetTable(): void {

        this.potText.visible = false;
        this.potImage.visible = false;

        this.winnerLayer.hide();
    }

    public showWinner(endData: any): void {

        this.winnerLayer.showWinner(endData);

        this.canClick = true;
        this.nextButton.visible = true;
        this.nextButton.alpha = 0;

        this.scene.tweens.add({
            targets: this.nextButton,
            alpha: 1,
            ease: Phaser.Math.Easing.Linear,
            duration: 250
        });
    }

    public updateBoard(): void {

        this.setStateText();
        this.setPotText();
    }

    public async setStateText(): Promise<void> {
        const state = await RoomManager.getState();
        console.log("STATE: " +  state);

        this.stateLayer.setText(state);
    }

    public async setPotText(): Promise<void> {

        this.potText.visible = true;
        this.potImage.visible = true;

        const playerBets = await RoomManager.getPlayerBets();
        const opponentBets = await RoomManager.getOpponentBets();
        this.potText.text = "POT: " + playerBets.add(opponentBets);
        this.potImage.x = this.potText.x + this.potText.width / 2 + 10;
    }

    private onClickNext(): void {

        if (!this.canClick) {
            return;
        }
    
        this.canClick = false;

        this.scene.tweens.add({
            targets: this.nextButton,
            alpha: 0,
            ease: Phaser.Math.Easing.Linear,
            duration: 250,
            onComplete: () => {
                this.nextButton.visible = false;
            },
            onCompleteScope: this
        });
        
        RoomManager.onClickNext();  
    }
}
