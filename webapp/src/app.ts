import "phaser";
import "howler";

import { PreloadScene } from './scenes/PreloadScene';
import { Game } from "./Game";
import { GameConstants } from "./GameConstants";
import { BootScene } from "./scenes/BootScene";
import { RoomScene } from "./scenes/room/RoomScene";
import { GameVars } from "./GameVars";

let game: Game;

window.onload = () => {

    const gameConfig = {

        version: GameConstants.VERSION,
        type: Phaser.AUTO,
        backgroundColor: "222222",
        dom: {
            createContainer: true
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "content",
            width: GameConstants.GAME_WIDTH,
            height: GameConstants.GAME_HEIGHT
        },
        scene:  [
            BootScene,
            PreloadScene,
            RoomScene
        ]
    };

    game = new Game(gameConfig);

    // window.addEventListener("resize", resize, false);
    window.addEventListener("orientationchange", checkOriention, false);

    function checkOriention(): void {

        if (Game.currentInstance.device.os.desktop) {
            return;
        }
    
        GameVars.currentScene.time.addEvent({delay: 200, callback: () => {
    
            if (window.innerHeight < window.innerWidth) {
                let aspectRatio = window.innerWidth / window.innerHeight;
                GameVars.scaleX = (GameConstants.GAME_WIDTH / GameConstants.GAME_HEIGHT) / aspectRatio;
                GameVars.scaleY = 1;
            } else {
                let aspectRatio = window.innerHeight / window.innerWidth;
                GameVars.scaleY = (GameConstants.GAME_HEIGHT / GameConstants.GAME_WIDTH) / aspectRatio;
                GameVars.scaleX = 1;
            }
            
        }, callbackScope: GameVars.currentScene});
    }
};

