import { GameVars } from "../../../GameVars";
import { RoomManager } from "../RoomManager";
import { Card } from "./Card";

export class Player extends Phaser.GameObjects.Container {


    private image: Phaser.GameObjects.Image;
    private nickname: Phaser.GameObjects.Text;

    private cards: Card[];
    private funds: Phaser.GameObjects.Text;
    private bet: Phaser.GameObjects.Text;

    private isPlayer: boolean;
    private showingBet: boolean;

    constructor(scene: Phaser.Scene, isPlayer: boolean) {

        super(scene);

        this.isPlayer = isPlayer; 

        this.setScalesAndPostions();

        this.nickname = new Phaser.GameObjects.Text(this.scene, -100, 50, isPlayer ? "PLAYER" : "OPPONENT", {fontFamily: "Oswald-Medium", fontSize: "20px", color: "#FFFFFF"});
        this.nickname.setOrigin(.5);
        this.nickname.setStroke("#000000", 4);
        this.add(this.nickname);

        this.image = new Phaser.GameObjects.Image(this.scene, -100, -20, "texture_atlas_1", isPlayer ? "avatar_player" : "avatar_opponent");
        this.image.setScale(.9);
        this.add(this.image);

        let chip = new Phaser.GameObjects.Image(this.scene, 140, isPlayer ? -85 : 85, "texture_atlas_1", "chip");
        chip.setOrigin(1, .5);
        this.add(chip);

        this.bet = new Phaser.GameObjects.Text(this.scene,  145, isPlayer ? -85 : 85, "???", {fontFamily: "Oswald-Medium", fontSize: "20px", color: "#FFFFFF"});
        this.bet.setOrigin(0, .5);
        this.add(this.bet);

        this.cards = [];

        let card = new Card(this.scene, -40 + 90, -20);
        card.setScale(.8);
        card.visible = false;
        card.alpha = 0;
        this.add(card);
        this.cards.push(card);

        card = new Card(this.scene, 40 + 90, -20);
        card.setScale(.8);
        card.visible = false;
        card.alpha = 0;
        this.add(card);
        this.cards.push(card);

        let capsule = new Phaser.GameObjects.Image(this.scene, 90, 40, "texture_atlas_1", "capsule");
        this.add(capsule);

        this.funds = new Phaser.GameObjects.Text(this.scene, 90, 48, "???", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#000000"});
        this.funds.setOrigin(.5);
        this.add(this.funds);
    }

    public setScalesAndPostions(): void {

        if (GameVars.landscape) {
            this.setScale(GameVars.scaleX, 1);
            this.x = 0;
            this.y = this.isPlayer ? 150 : -160;
        } else {
            this.setScale(1, GameVars.scaleY);
            this.x = 0;
            this.y = this.isPlayer ? 200 * GameVars.scaleY : -250 * GameVars.scaleY;
        }
    }

    public distributeFirstCards(): void {

        let cards = this.isPlayer ? RoomManager.getPlayerCards() : RoomManager.getOpponentCards();

        this.cards[0].setValue(cards[0]);
        this.cards[1].setValue(cards[1]);

        this.cards[0].visible = true;
        this.cards[1].visible = true;

        this.cards[0].setPosition(0, -this.y);
        this.cards[1].setPosition(0, -this.y);

        this.scene.tweens.add({
            targets: this.cards[0],
            alpha: 1,
            x: -40 + 90,
            y: -20,
            ease: Phaser.Math.Easing.Linear,
            duration: 250,
            delay: this.isPlayer ? 250 : 0
        });

        this.scene.tweens.add({
            targets: this.cards[1],
            x: 40 + 90,
            y: -20,
            alpha: 1,
            ease: Phaser.Math.Easing.Linear,
            duration: 250,
            delay: 100 + (this.isPlayer ? 250 : 0)
        });
    }

    public showCards(): void {

        let cards = this.isPlayer ? RoomManager.getPlayerCards() : RoomManager.getOpponentCards();

        this.cards[0].showCard(cards[0], 0);
        this.cards[1].showCard(cards[1], 0);
    }

    public updatePlayer(): void {

        this.setFunds();
        this.setBet();
    }

    public setFunds(): void {

        if (this.showingBet) {
            return;
        }

        this.funds.text = (this.isPlayer ? RoomManager.getPlayerFunds().toString() : RoomManager.getOpponentFunds().toString());
    }

    public showBet(value: string): void {

        this.funds.text = value;
        this.showingBet = true;

        setTimeout(() => {
            this.showingBet = false;
            this.setFunds();
        }, 1000);
    }

    public setBet(): void {

        this.bet.text = this.isPlayer ? RoomManager.getPlayerBets().toString() : RoomManager.getOpponentBets().toString();
    }
}
