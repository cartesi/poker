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

    constructor(scene: Phaser.Scene, isPlayer: boolean) {

        super(scene);

        this.isPlayer = isPlayer; 

        if (GameVars.landscape) {
            this.scaleX = GameVars.scaleX;
            this.x = isPlayer ? -300 * GameVars.scaleX : 300 * GameVars.scaleX;
        } else {
            // TODO: position and scale for portrait
        }

        this.nickname = new Phaser.GameObjects.Text(this.scene, 0, -120, isPlayer ? "PLAYER" : "OPPONENT", {fontFamily: "Oswald-Medium", fontSize: "20px", color: "#FFFFFF"});
        this.nickname.setOrigin(.5);
        this.nickname.setStroke("#000000", 4);
        this.add(this.nickname);

        this.image = new Phaser.GameObjects.Image(this.scene, 0, -40, "texture_atlas_1", isPlayer ? "avatar_player" : "avatar_opponent");
        this.add(this.image);

        this.funds = new Phaser.GameObjects.Text(this.scene, 0, 50, "FUNDS: ???", {fontFamily: "Oswald-Medium", fontSize: "20px", color: "#FFFFFF"});
        this.funds.setOrigin(.5);
        this.add(this.funds);

        this.bet = new Phaser.GameObjects.Text(this.scene,  isPlayer ? 150 : -150, 120, "BET: ???", {fontFamily: "Oswald-Medium", fontSize: "20px", color: "#FFFFFF"});
        this.bet.setOrigin(.5);
        this.add(this.bet);

        this.cards = [];

        let card = new Card(this.scene, -45, 120);
        this.add(card);
        this.cards.push(card);

        card = new Card(this.scene, 45, 120);
        this.add(card);
        this.cards.push(card);
    }

    public updatePlayer(): void {

        let cards = this.isPlayer ? RoomManager.getPlayerCards() : RoomManager.getOpponentCards();

        this.cards[0].setValue(cards[0]);
        this.cards[1].setValue(cards[1]);

        this.setFunds();
        this.setBet();
    }

    public setFunds(): void {

        this.funds.text = "FUNDS: " + (this.isPlayer ? RoomManager.getPlayerFunds().toString() : RoomManager.getOpponentFunds().toString());
    }

    public setBet(): void {

        this.bet.text = "BET: " + (this.isPlayer ? RoomManager.getPlayerBets().toString() : RoomManager.getOpponentBets().toString());
    }
}
