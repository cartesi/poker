import { GameVars } from "../../../GameVars";
import { RoomManager } from "../RoomManager";
import { Card } from "./Card";
import { AudioManager } from "../../../AudioManager";
import { PokerSolver } from "../../../services/PokerSolver";
import { Timer } from "./Timer";

export class Player extends Phaser.GameObjects.Container {


    private image: Phaser.GameObjects.Image;
    private nickname: Phaser.GameObjects.Text;

    private cards: Card[];
    private funds: Phaser.GameObjects.Text;
    private hand: Phaser.GameObjects.Text;
    private timer: Timer;

    private isPlayer: boolean;
    private showingBet: boolean;

    private betContainer: Phaser.GameObjects.Container;
    private betBck: Phaser.GameObjects.Graphics;
    private bet: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, isPlayer: boolean) {

        super(scene);

        this.isPlayer = isPlayer;

        this.setScalesAndPostions();

        this.image = new Phaser.GameObjects.Image(this.scene, isPlayer ? -280 : 280, -45, "texture_atlas_1", isPlayer ? "avatar_0" + GameVars.gameData.avatar : "avatar_0" + GameVars.opponentAvatar);
        this.image.scaleX = isPlayer ? -1 : 1;
        this.add(this.image);

        let nicknameBck = new Phaser.GameObjects.Image(this.scene, isPlayer ? -280 : 280, 49, "texture_atlas_1", "txt_box_names");
        this.add(nicknameBck);

        this.nickname = new Phaser.GameObjects.Text(this.scene, isPlayer ? -280 : 280, 49, isPlayer ? GameVars.gameData.name : GameVars.opponentName, {fontFamily: "Oswald-Medium", fontSize: "24px", color: "#FFFFFF"});
        this.nickname.setOrigin(.5);
        this.add(this.nickname);

        this.betContainer = new Phaser.GameObjects.Container(this.scene);
        this.betContainer.visible = false;
        this.betContainer.setPosition(isPlayer ? 150 : -120, isPlayer ? -40 : 105);
        this.add(this.betContainer);

        this.betBck = new Phaser.GameObjects.Graphics(this.scene);
        this.betBck.fillStyle(0x000000, .5);
        this.betContainer.add(this.betBck);

        let chip = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "chip");
        chip.setOrigin(1, .5);
        chip.setScale(.9);
        this.betContainer.add(chip);

        this.bet = new Phaser.GameObjects.Text(this.scene, 5, 0, "", {fontFamily: "Oswald-Medium", fontSize: "35px", color: "#FFFFFF"});
        this.bet.setOrigin(0, .5);
        this.betContainer.add(this.bet);

        this.betBck.fillRoundedRect(this.bet.x - 52, this.bet.y - 25, this.bet.width + 65, 50, 25);

        this.cards = [];

        let card = new Card(this.scene, -45, -20);
        card.setScale(.8);
        card.visible = false;
        card.alpha = 0;
        this.add(card);
        this.cards.push(card);

        card = new Card(this.scene, 45, -20);
        card.setScale(.8);
        card.visible = false;
        card.alpha = 0;
        this.add(card);
        this.cards.push(card);

        let capsule = new Phaser.GameObjects.Image(this.scene, 0, 40, "texture_atlas_1", "capsule");
        this.add(capsule);

        this.funds = new Phaser.GameObjects.Text(this.scene, 0, 47, "", {fontFamily: "Oswald-Medium", fontSize: "35px", color: "#FFFFFF"});
        this.funds.setOrigin(.5);
        this.add(this.funds);

        this.hand = new Phaser.GameObjects.Text(this.scene,  0, 6, "", {fontFamily: "Oswald-Medium", fontSize: "20px", color: "#FFFFFF"});
        this.hand.setOrigin(.5);
        this.add(this.hand);

        this.timer = new Timer(this.scene, isPlayer);
        this.add(this.timer);
    }

    public setScalesAndPostions(): void {

        if (GameVars.landscape) {
            this.setScale(GameVars.scaleX, 1);
            this.x = 0;
            this.y = this.isPlayer ? 200 : -225;
        } else {
            this.setScale(1, GameVars.scaleY);
            this.x = 0;
            this.y = this.isPlayer ? 250 * GameVars.scaleY : -300 * GameVars.scaleY;
        }
    }

    public initTimer(value: number): void {

        this.timer.reset(value);
    }

    public resetTable(): void {

        this.cards[0].hideCard();
        this.cards[1].hideCard();

        this.betContainer.visible = false;

        this.funds.text = (this.isPlayer ? GameVars.playerFunds.toString() : GameVars.opponentFunds.toString());
    }

    public markCards(endData: any): void {

        let winnerHand = [];

        if (endData.isWinner[GameVars.playerIndex]) {
            if (endData.hands && endData.hands[GameVars.playerIndex]) {
                winnerHand = endData.hands[GameVars.playerIndex];
            } 
        } else if (endData.isWinner[GameVars.opponentIndex]) {
            if (endData.hands && endData.hands[GameVars.opponentIndex]) {
                winnerHand = endData.hands[GameVars.opponentIndex];
            }
        }

        if (winnerHand && winnerHand.length) {

            for (let i = 0; i < winnerHand.length; i++) {
                let winnerHandCard = winnerHand[i];
                for (let j = 0; j < this.cards.length; j++) {
                    if (winnerHandCard && this.cards[j].info && winnerHandCard.toIndex() === this.cards[j].info.toIndex()) {
                        this.cards[j].showMark();
                    }
                }
            }
        }
    }

    public async distributeFirstCards(): Promise<void> {

        let cards = this.isPlayer ? await RoomManager.getPlayerCards() : await RoomManager.getOpponentCards();

        this.cards[0].setValue(cards[0]);
        this.cards[1].setValue(cards[1]);

        this.cards[0].visible = true;
        this.cards[1].visible = true;

        this.cards[0].setPosition(0, -this.y);
        this.cards[1].setPosition(0, -this.y);

        this.scene.tweens.add({
            targets: this.cards[0],
            alpha: 1,
            x: -45,
            y: -20,
            ease: Phaser.Math.Easing.Linear,
            duration: 250,
            delay: this.isPlayer ? 250 : 0,
            onStart: () => {
                AudioManager.playSound("cards_in");
            },
            onStartScope: this
        });

        this.scene.tweens.add({
            targets: this.cards[1],
            x: 45,
            y: -20,
            alpha: 1,
            ease: Phaser.Math.Easing.Linear,
            duration: 250,
            delay: 100 + (this.isPlayer ? 250 : 0),
            onStart: () => {
                AudioManager.playSound("cards_out");
            },
            onStartScope: this
        });
    }

    public async showCards(): Promise<void> {

        let cards = this.isPlayer ? await RoomManager.getPlayerCards() : await RoomManager.getOpponentCards();

        this.cards[0].showCard(cards[0], 0);
        this.cards[1].showCard(cards[1], 0);
    }

    public updatePlayer(): void {

        this.setFunds();
        this.setBet();
        this.setHand();
        this.setCards();
    }

    public async setCards(): Promise<void> {

        let cards = this.isPlayer ? await RoomManager.getPlayerCards() : await RoomManager.getOpponentCards();

        this.cards[0].setValue(cards[0]);
        this.cards[1].setValue(cards[1]);
    }

    public async setFunds(): Promise<void> {

        if (this.showingBet) {
            return;
        }
        const playerFunds = await RoomManager.getPlayerFunds();
        const playerBets = await RoomManager.getPlayerBets();
        const opponentFunds = await RoomManager.getOpponentFunds();
        const opponentBets = await RoomManager.getOpponentBets();
        this.funds.text = (this.isPlayer ? (playerFunds.sub(playerBets)).toString() : (opponentFunds.sub(opponentBets)).toString());
    }

    public async setHand(): Promise<void> {

        let cards = (this.isPlayer ? await RoomManager.getPlayerCards() : await RoomManager.getOpponentCards()).concat(await RoomManager.getCommunityCards());

        let result = PokerSolver.solve([cards]);

        if (result.bestHandsDescriptions && result.bestHandsDescriptions[0]) {
            this.hand.setText(result.bestHandsDescriptions[0]);
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

    public async setBet(): Promise<void> {

        this.betContainer.visible = true;

        const playerBets = await RoomManager.getPlayerBets();
        const opponentBets = await RoomManager.getOpponentBets();
        let newBet = this.isPlayer ? playerBets.toString() : opponentBets.toString();

        if (newBet.toString() !== this.bet.text) {
            
            this.scene.tweens.add({
                targets: this.betContainer,
                scaleX: 1.05,
                scaleY: 1.05,
                ease: Phaser.Math.Easing.Cubic.In,
                duration: 200,
                onComplete: () => {
    
                    this.scene.tweens.add({
                        targets: this.betContainer,
                        scaleX: 1,
                        scaleY: 1,
                        ease: Phaser.Math.Easing.Cubic.Out,
                        duration: 200,
                        delay: 200
                    });
                },
                onCompleteScope: this
            });

            this.scene.tweens.add({
                targets: this.bet,
                scaleY: 0,
                ease: Phaser.Math.Easing.Cubic.In,
                duration: 200,
                onComplete: () => {

                    this.bet.text = this.isPlayer ? playerBets.toString() : opponentBets.toString();
    
                    this.betBck.clear();
                    this.betBck.fillStyle(0x000000, .5);
                    this.betBck.fillRoundedRect(this.bet.x - 52, this.bet.y - 25, this.bet.width + 65, 50, 25);
    
                    this.scene.tweens.add({
                        targets: this.bet,
                        scaleY: 1,
                        ease: Phaser.Math.Easing.Cubic.Out,
                        duration: 200,
                        delay: 200
                    });
                },
                onCompleteScope: this
            });

            AudioManager.playSound("total_pot_fx");
        }
    }

    public startOpponentTurn(): void {

        this.bringToTop(this.cards[0]);
        this.bringToTop(this.cards[1]);

        this.scene.tweens.add({
            targets: this.cards[0],
            scaleX: .5,
            scaleY: .5,
            angle: -5,
            x: 220 - 15,
            y: 10,
            ease: Phaser.Math.Easing.Linear,
            duration: 150
        });

        this.scene.tweens.add({
            targets: this.cards[1],
            scaleX: .5,
            scaleY: .5,
            angle: 5,
            x: 220 + 15,
            y: 10,
            ease: Phaser.Math.Easing.Linear,
            duration: 150
        });

        AudioManager.playSound("cards_in");
    }

    public removeTimer(): void {

        this.timer.pause();
    }

    public endOpponentTurn(): void {

        this.scene.tweens.add({
            targets: this.cards[0],
            scaleX: .8,
            scaleY: .8,
            angle: 0,
            x: -45,
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
            x: 45,
            y: -20,
            ease: Phaser.Math.Easing.Linear,
            duration: 150,
            onComplete: () => {
                this.sendToBack(this.cards[0]);
                this.sendToBack(this.cards[1]);
            },
            onCompleteScope: this
        });

        AudioManager.playSound("cards_out");
    }
}
