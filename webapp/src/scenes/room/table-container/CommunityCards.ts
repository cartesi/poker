import { GameVars } from "../../../GameVars";
import { RoomManager } from "../RoomManager";
import { Card } from "./Card";

export class CommunityCards extends Phaser.GameObjects.Container {

    private cards: Card[];

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.cards = [];

        for (let i = 0; i < 5; i++) {
            let card = new Card(this.scene, -180 + 90 * i, 0);
            this.add(card);
            this.cards.push(card);
        }

        this.setScalesAndPostions();
    }

    public setScalesAndPostions(): void {

        if (GameVars.landscape) {
            this.setScale(GameVars.scaleX, 1);
            this.y = -50;
        } else {
            this.setScale(1, GameVars.scaleY);
            this.y = 0;
        }
    }

    public setCards(): void {

        let cards = RoomManager.getCommunityCards();

        for (let i = 0; i < 5; i++) {
            this.cards[i].setValue(cards[i]);
        }
    }
}
