import { GameVars } from "../../../GameVars";
import { RoomManager } from "../RoomManager";
import { Card } from "./Card";

export class CommunityCards extends Phaser.GameObjects.Container {

    private cards: Card[];

    constructor(scene: Phaser.Scene) {

        super(scene);

        for (let i = 0; i < 5; i++) {
            let mark = new Phaser.GameObjects.Image(this.scene, -220 + 110 * i, 0, "texture_atlas_1", "mark_card");
            this.add(mark);
        }

        this.cards = [];

        for (let i = 0; i < 5; i++) {
            let card = new Card(this.scene, -220 + 110 * i, 0);
            card.visible = false;
            this.add(card);
            this.cards.push(card);
        }

        this.setScalesAndPostions();
    }

    public setScalesAndPostions(): void {

        let reducedScale = .75;

        if (GameVars.landscape) {
            this.setScale(reducedScale * GameVars.scaleX, reducedScale * 1);
            this.y = 30;
        } else {
            this.setScale(reducedScale * 1, GameVars.scaleY * reducedScale);
            this.y = 0;
        }
    }

    public setCards(): void {

        let cards = RoomManager.getCommunityCards();

        for (let i = 0; i < 5; i++) {
            this.cards[i].showCard(cards[i], i * 100 + 1000);
        }
    }
}
