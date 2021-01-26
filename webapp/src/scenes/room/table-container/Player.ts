import { GameVars } from "../../../GameVars";
import { RoomManager } from "../RoomManager";
import { Card } from "./Card";
import {Hand} from "pokersolver";

export class Player extends Phaser.GameObjects.Container {


    private image: Phaser.GameObjects.Image;
    private nickname: Phaser.GameObjects.Text;

    private cards: Card[];
    private funds: Phaser.GameObjects.Text;
    private bet: Phaser.GameObjects.Text;
    private hand: Phaser.GameObjects.Text;

    private isPlayer: boolean;
    private showingBet: boolean;

    private betBck: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, isPlayer: boolean) {

        super(scene);

        this.isPlayer = isPlayer;

        this.setScalesAndPostions();

        let nicknameBck = new Phaser.GameObjects.Image(this.scene, isPlayer ? -200 : 200, 67, "texture_atlas_1", "txt_box_names");
        this.add(nicknameBck);

        this.nickname = new Phaser.GameObjects.Text(this.scene, isPlayer ? -200 : 200, 67, isPlayer ? "Player" : "Opponent", {fontFamily: "Oswald-Medium", fontSize: "18px", color: "#FFFFFF"});
        this.nickname.setOrigin(.5);
        this.add(this.nickname);

        this.image = new Phaser.GameObjects.Image(this.scene, isPlayer ? -200 : 200, -20, "texture_atlas_1", isPlayer ? "avatar_player" : "avatar_opponent");
        this.image.scaleX = isPlayer ? 1 : -1;
        this.add(this.image);

        this.betBck = new Phaser.GameObjects.Graphics(this.scene);
        this.betBck.fillStyle(0x000000, .5);
        this.add(this.betBck);

        let chip = new Phaser.GameObjects.Image(this.scene, isPlayer ? 120 : -100, isPlayer ? -30 : 85, "texture_atlas_1", "chip");
        chip.setOrigin(1, .5);
        chip.setScale(.9);
        this.add(chip);

        this.bet = new Phaser.GameObjects.Text(this.scene, isPlayer ? 122 : -98, isPlayer ? -30 : 85, "", {fontFamily: "Oswald-Medium", fontSize: "20px", color: "#FFFFFF"});
        this.bet.setOrigin(0, .5);
        this.add(this.bet);

        this.betBck.fillRoundedRect(this.bet.x - 33, this.bet.y - 16, this.bet.width + 45, 30, 15);

        this.cards = [];

        let card = new Card(this.scene, -40, -20);
        card.setScale(.8);
        card.visible = false;
        card.alpha = 0;
        this.add(card);
        this.cards.push(card);

        card = new Card(this.scene, 40, -20);
        card.setScale(.8);
        card.visible = false;
        card.alpha = 0;
        this.add(card);
        this.cards.push(card);

        let capsule = new Phaser.GameObjects.Image(this.scene, 0, 40, "texture_atlas_1", "capsule");
        this.add(capsule);

        this.funds = new Phaser.GameObjects.Text(this.scene, 0, 42, "", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        this.funds.setOrigin(.5);
        this.add(this.funds);

        this.hand = new Phaser.GameObjects.Text(this.scene,  0, 10, "", {fontFamily: "Oswald-Medium", fontSize: "16px", color: "#FFFFFF"});
        this.hand.setOrigin(.5);
        this.add(this.hand);
    }

    public setScalesAndPostions(): void {

        if (GameVars.landscape) {
            this.setScale(GameVars.scaleX, 1);
            this.x = 0;
            this.y = this.isPlayer ? 160 : -180;
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
            x: -40,
            y: -20,
            ease: Phaser.Math.Easing.Linear,
            duration: 250,
            delay: this.isPlayer ? 250 : 0
        });

        this.scene.tweens.add({
            targets: this.cards[1],
            x: 40,
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
        this.setHand();
    }

    public setFunds(): void {

        if (this.showingBet) {
            return;
        }

        this.funds.text = (this.isPlayer ? RoomManager.getPlayerFunds().toString() : RoomManager.getOpponentFunds().toString());
    }

    public setHand(): void {

        let auxCards = (this.isPlayer ? RoomManager.getPlayerCards() : RoomManager.getOpponentCards()).concat(RoomManager.getCommunityCards());
        let cards = [];
        for (let i = 0; i < auxCards.length; i++) {
            if (auxCards[i]) {
                cards.push(this.getCardString(auxCards[i]));
            }
        }

        if (cards.length) {
            var hand = Hand.solve(cards);
            this.hand.setText(hand.descr);
        } else {
            this.hand.setText("");
        }
    }

    public showBet(value: string): void {

        this.funds.text = value;
        this.showingBet = true;

        setTimeout(() => {
            this.showingBet = false;
            this.setFunds();
        }, 2000);
    }

    public setBet(): void {

        this.bet.text = this.isPlayer ? RoomManager.getPlayerBets().toString() : RoomManager.getOpponentBets().toString();

        this.betBck.clear();
        this.betBck.fillRoundedRect(this.bet.x - 33, this.bet.y - 16, this.bet.width + 45, 30, 15);
    }

    public startOpponentTurn(): void {

        this.bringToTop(this.cards[0]);
        this.bringToTop(this.cards[1]);

        this.scene.tweens.add({
            targets: this.cards[0],
            scaleX: .5,
            scaleY: .5,
            angle: -5,
            x: 170 - 15,
            y: 30,
            ease: Phaser.Math.Easing.Linear,
            duration: 150
        });

        this.scene.tweens.add({
            targets: this.cards[1],
            scaleX: .5,
            scaleY: .5,
            angle: 5,
            x: 170 + 15,
            y: 30,
            ease: Phaser.Math.Easing.Linear,
            duration: 150
        });
    }

    public endOpponentTurn(): void {

        this.scene.tweens.add({
            targets: this.cards[0],
            scaleX: .8,
            scaleY: .8,
            angle: 0,
            x: -40,
            y: -20,
            ease: Phaser.Math.Easing.Linear,
            duration: 150,
            onComplete: () => {
                this.sendToBack(this.cards[0]);
                this.sendToBack(this.cards[1]);
            },
            onCompleteScope: this
        });

        this.scene.tweens.add({
            targets: this.cards[1],
            scaleX: .8,
            scaleY: .8,
            angle: 0,
            x: 40,
            y: -20,
            ease: Phaser.Math.Easing.Linear,
            duration: 150,
            onComplete: () => {
                this.sendToBack(this.cards[0]);
                this.sendToBack(this.cards[1]);
            },
            onCompleteScope: this
        });
    }

    private getCardString(card: {value: number, suit: number}) {

        let str = "";

        switch (card.value) {
            case 0:
                str += "A";
                break;
            case 9:
                str += "T";
                break;
            case 10:
                str += "J";
                break;
            case 11:
                str += "Q";
                break;
            case 12:
                str += "K";
                break;
            default:
                str += (card.value + 1);
                break;
        }

        switch (card.suit) {
            case 0:
                str += "c";
                break;
            case 1:
                str += "d";
                break;
            case 2:
                str += "h";
                break;
            case 3:
                str += "s";
                break;
            default:
                break;
        }

        return str;
    }
}
