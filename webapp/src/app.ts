import "phaser";
import "howler";

import { Game } from "./Game";
import { GameConstants } from "./GameConstants";
import { BootScene } from "./scenes/Boot";

let game: Game;

window.onload = () => {

    const gameConfig = {

        version: GameConstants.VERSION,
        type: Phaser.WEBGL,
        backgroundColor: "CCCCCC",
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "content",
            width: GameConstants.GAME_WIDTH,
            height: GameConstants.GAME_HEIGHT
        },
        scene:  [
            BootScene,
        ]
    };

    game = new Game(gameConfig);
};

