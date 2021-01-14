import { GameVars } from "./../../../GameVars";
import { CommunityCards } from "./CommunityCards";
import { Player } from "./Player";
import { GameConstants } from "../../../GameConstants";

export class TableContainer extends Phaser.GameObjects.Container {

    private gradient: Phaser.GameObjects.Image;
    private table: Phaser.GameObjects.Image;

    private player: Player;
    private opponent: Player;

    private communityCards: CommunityCards;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.x = GameConstants.GAME_WIDTH / 2;
        this.y = GameConstants.GAME_HEIGHT / 2;

        this.gradient = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "bg_gradient");
        this.gradient.setScale(2);
        this.add(this.gradient);

        this.table = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "table");
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

        let reducedScale = .8;

        if (GameVars.landscape) {
            this.table.setScale(reducedScale * GameVars.scaleX, reducedScale);
            this.table.setAngle(0);
        } else {
            this.table.setScale(GameVars.scaleY, 1);
            this.table.setAngle(90);
        }

        this.communityCards.setScalesAndPostions();
        this.player.setScalesAndPostions();
        this.opponent.setScalesAndPostions();
    }

    public distributeFirstCards(): void {

        this.player.distributeFirstCards();
        this.opponent.distributeFirstCards();
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

    public onEnd(endData: any): void {

        this.opponent.showCards();
    }
}
