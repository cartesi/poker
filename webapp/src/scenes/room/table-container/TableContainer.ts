import { CommunityCards } from './CommunityCards';
import { Player } from "./Player";
import { Card } from "./Card";
import { GameConstants } from "../../../GameConstants";

export class TableContainer extends Phaser.GameObjects.Container {

    private player: Player;
    private opponent: Player;

    private communityCards: CommunityCards;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.x = GameConstants.GAME_WIDTH / 2;
        this.y = GameConstants.GAME_HEIGHT / 2;

        this.communityCards = new CommunityCards(this.scene);
        this.add(this.communityCards);

        this.player = new Player(this.scene, true);
        this.add(this.player);

        this.opponent = new Player(this.scene, false);
        this.add(this.opponent);
    }

    public startRound(): void {

        this.player.initPlayer();
        this.opponent.initPlayer();
        
        this.communityCards.setCards();
    }
}
