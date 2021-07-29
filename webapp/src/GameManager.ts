import { GameConstants } from "./GameConstants";
import { GameVars } from "./GameVars";

import { AudioManager } from "./AudioManager";
import { Lobby } from "./services/Lobby";
import { LobbyScene } from "./scenes/lobby/LobbyScene";
import { ethers } from "ethers";

export class GameManager {

    public static async init(): Promise<void> {

        GameVars.currentScene.game.scale.displaySize = GameVars.currentScene.game.scale.parentSize;
        GameVars.currentScene.game.scale.refresh();

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

        GameVars.playerFunds = ethers.BigNumber.from(0);

        GameVars.opponentAvatar = 5;

        GameManager.readGameData();
    }

    public static readGameData(): void {

        GameManager.getGameStorageData(
            GameConstants.SAVED_GAME_DATA_KEY,
            function (gameData: string): void {

                if (gameData) {
                    GameVars.gameData = JSON.parse(gameData);
                } else {
                    GameVars.gameData = {
                        muted: false,
                        name: null,
                        avatar: 1
                    };
                }

                GameManager.startGame();
            }
        );
    }

    public static onGameAssetsLoaded(): void {

        AudioManager.init();
        GameManager.enterSplashScene();
    }

    public static enterSplashScene(): void {

        GameVars.currentScene.scene.start("SplashScene");
    }

    public static enterLobbyScene(): void {

        GameVars.currentScene.scene.start("LobbyScene");

        const { name, avatar } = GameVars.gameData;
        const playerInfo = { name, avatar };

        Lobby.joinGame(playerInfo, (index, context) => {
            console.log(`Joining game ${index} with context ${JSON.stringify(context)}`);

            const opponentPlayerInfo = context.playerInfos[context.opponentIndex];
            const playerFunds = context.playerFunds[context.playerIndex];
            const opponentFunds = context.playerFunds[context.opponentIndex];
            GameVars.gameIndex = index;
            GameVars.playerIndex = context.playerIndex;
            GameVars.playerFunds = playerFunds;
            GameVars.opponentIndex = context.opponentIndex;
            GameVars.opponentFunds = opponentFunds;
            GameVars.opponentName = opponentPlayerInfo.name;
            GameVars.opponentAvatar = opponentPlayerInfo.avatar;

            LobbyScene.currentInstance.onOpponentJoined();
        });
    }

    public static enterRoomScene(): void {

        GameVars.currentScene.scene.start("RoomScene");
    }

    public static writeGameData(): void {

        GameManager.setGameStorageData(
            GameConstants.SAVED_GAME_DATA_KEY,
            GameVars.gameData,
            function (): void {
                GameManager.log("game data successfully saved");
            }
        );
    }

    public static setCurrentScene(scene: Phaser.Scene): void {

        GameVars.currentScene = scene;
    }

    public static log(text: string, error?: Error): void {

        if (!GameConstants.VERBOSE) {
            return;
        }

        if (error) {
            console.error(text + ":", error);
        } else {
            console.log(text);
        }
    }

    public static setPlayerAvatar(value: number): void {

        GameVars.gameData.avatar = value;
        GameManager.writeGameData();
    }

    public static setPlayerName(value: string): void {

        GameVars.gameData.name = value;
        GameManager.writeGameData();
    }

    private static startGame(): void {

        GameVars.currentScene.scene.start("PreloadScene");
    }
    
    private static getGameStorageData(key: string, successCb: Function): void {

        const gameDataStr = localStorage.getItem(key);
        successCb(gameDataStr);
    }

    private static setGameStorageData(key: string, value: any, successCb: Function): void {

        localStorage.setItem(key, JSON.stringify(value));
        successCb();
    }
}
