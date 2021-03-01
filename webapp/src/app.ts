import "phaser";
import "howler";

import { PreloadScene } from './scenes/PreloadScene';
import { Game } from "./Game";
import { GameConstants } from "./GameConstants";
import { BootScene } from "./scenes/BootScene";
import { RoomScene } from "./scenes/room/RoomScene";
import { GameVars } from "./GameVars";
import { LobbyScene } from "./scenes/lobby/LobbyScene";

let game: Game;

window.onload = () => {

    const gameConfig: Phaser.Types.Core.GameConfig = {

        version: GameConstants.VERSION,
        type: Phaser.AUTO,
        backgroundColor: "041A49",
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
            RoomScene,
            LobbyScene
        ],
        render: {
            antialias: true,
            pixelArt: false
        }
    };

    game = new Game(gameConfig);

    window.addEventListener("resize", onResize, false);
    window.addEventListener("orientationchange", onOrientationChange, false);

    function onOrientationChange(): void {
    
        GameVars.currentScene.time.addEvent({delay: 100, callback: () => {
    
            if (window.innerHeight < window.innerWidth) {
                let aspectRatio = window.innerWidth / window.innerHeight;
                GameVars.scaleX = (GameConstants.GAME_WIDTH / GameConstants.GAME_HEIGHT) / aspectRatio;
                GameVars.scaleY = 1;
                GameVars.landscape = true;
            } else {
                let aspectRatio = window.innerHeight / window.innerWidth;
                GameVars.scaleY = (GameConstants.GAME_HEIGHT / GameConstants.GAME_WIDTH) / aspectRatio;
                GameVars.scaleX = 1;
                GameVars.landscape = false;
            }
            
            if (GameVars.currentScene === RoomScene.currentInstance) {
                RoomScene.currentInstance.onOrientationChange();
            } else if (GameVars.currentScene === LobbyScene.currentInstance) {
                LobbyScene.currentInstance.onOrientationChange();
            }
            
        }, callbackScope: GameVars.currentScene});
    }

    function onResize(): void {
        
        if (window.innerHeight < window.innerWidth) {
            let aspectRatio = window.innerWidth / window.innerHeight;
            GameVars.scaleX = (GameConstants.GAME_WIDTH / GameConstants.GAME_HEIGHT) / aspectRatio;
            GameVars.scaleY = 1;
            GameVars.landscape = true;
        } else {
            let aspectRatio = window.innerHeight / window.innerWidth;
            GameVars.scaleY = (GameConstants.GAME_HEIGHT / GameConstants.GAME_WIDTH) / aspectRatio;
            GameVars.scaleX = 1;
            GameVars.landscape = false;
        }
        
        if (GameVars.currentScene === RoomScene.currentInstance) {
            RoomScene.currentInstance.onOrientationChange();
        } else if (GameVars.currentScene === LobbyScene.currentInstance) {
            LobbyScene.currentInstance.onOrientationChange();
        }
    }
};

