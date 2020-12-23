import { GameVars } from "./../../../GameVars";
import { CommunityCards } from "./CommunityCards";
import { Player } from "./Player";
import { GameConstants } from "../../../GameConstants";
import { Table } from "./Table";

export class TableContainer extends Phaser.GameObjects.Container {

    private table: Table;

    private player: Player;
    private opponent: Player;

    private communityCards: CommunityCards;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.x = GameConstants.GAME_WIDTH / 2;
        this.y = GameConstants.GAME_HEIGHT / 2;

        this.table = new Table(this.scene);
        this.add(this.table);

        this.communityCards = new CommunityCards(this.scene);
        this.add(this.communityCards);

        this.player = new Player(this.scene, true);
        this.add(this.player);

        this.opponent = new Player(this.scene, false);
        this.add(this.opponent);

        this.setScalesAndPostions();
    }

    public setScalesAndPostions(): void {

        if (GameVars.landscape) {
            this.y = GameConstants.GAME_HEIGHT / 2;
            if (GameVars.scaleX > 1.2) {
                this.setScale(1 - (GameVars.scaleX - 1.2));
            } else {
                this.setScale(1);
            }
        } else {
            this.y = GameConstants.GAME_HEIGHT / 2 - 30;
            this.setScale(1.3 + (0.55 - GameVars.scaleY) * 3);
        }

        this.table.setScalesAndPostions();
        this.communityCards.setScalesAndPostions();
        this.player.setScalesAndPostions();
        this.opponent.setScalesAndPostions();
    }

    public showBet(value: string, player: number): void {

        if (player === ALICE) {
            this.player.showBet(value);
        } else {
            this.opponent.showBet(value);
        }
    }

    public updateBoard(): void {

        this.player.updatePlayer();
        this.opponent.updatePlayer();

        this.communityCards.setCards();
    }
}
