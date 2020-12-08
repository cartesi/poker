import { GameConstants } from "./GameConstants";
import { GameVars } from "./GameVars";

import Web3 from "web3";
import Zoom from "./abis/Zoom.json";
import TurnBasedGame from "./abis/TurnBasedGame.json";

export class GameManager {

    public static async init(): Promise<void> {

        await this.loadWeb3();

        if (GameVars.currentScene.sys.game.device.os.desktop) {

            GameVars.scaleY = 1;

        } else {

            GameVars.currentScene.game.scale.displaySize = GameVars.currentScene.game.scale.parentSize;
            GameVars.currentScene.game.scale.refresh();

            const aspectRatio = window.innerHeight / window.innerWidth;
            GameVars.scaleY = (GameConstants.GAME_HEIGHT / GameConstants.GAME_WIDTH) / aspectRatio;
        }

        GameManager.readGameData();
    }

    public static async loadWeb3(): Promise<void> {

        GameVars.appState = {
            web3: {},
            account: "",
            ethBalance: "",
            zoom: {},
            user1: "",
            address1: "",
            user2: "",
            address2: ""
        };

        let w: any = window;
        
        if (w.ethereum) {
            w.web3 = new Web3(w.ethereum);
            await w.ethereum.enable();
        } else if (w.web3) {
            w.web3 = new Web3(w.web3.currentProvider);
        } else {
            window.alert("Non-Ethereum browser detected. You should consider trying MetaMask!")
        }
        const web3 = w.web3;

        const accounts = await web3.eth.getAccounts();

        GameVars.appState.account = accounts[0];
        GameVars.appState.web3 = web3;

        // Network ID
        const networkId = await web3.eth.net.getId();
        console.log(networkId);

        GameVars.appState.ethBalance = await web3.eth.getBalance(GameVars.appState.account);
        console.log(GameVars.appState.ethBalance);

        console.log(Zoom.networks[networkId].address);
        console.log(Zoom.abi);
        
        const zoom = new web3.eth.Contract(Zoom.abi, Zoom.networks["7777"].address);
        GameVars.appState.zoom = zoom;
        console.log(GameVars.appState.zoom);

        let temp =  await GameVars.appState.zoom.methods.getplayerslength().call({from: GameVars.appState.account});
        console.log(temp); 

        if (temp.toNumber() === 0) {
    
            let queuedetails =  await GameVars.appState.zoom.methods.getGameDetails().call({from: GameVars.appState.account});
            
            if (queuedetails.playerFunds.length) {
                console.log(queuedetails[0][0][0]);
                console.log(queuedetails[0][0][1]);
                GameVars.appState.user1 = queuedetails[0][0][0];
                GameVars.appState.address1 = queuedetails[0][0][1];
                GameVars.appState.user2 = "";
                GameVars.appState.address1 = "";
            }
        } else if (temp.toNumber() === 1) {
  
            // console.log(this.state.err.receipt.logs[0].data);
            // console.log(TurnBasedGame.abi);
            // console.log(TurnBasedGame.abi.filter(o => o.name === "GameReady")[0]);
            // let gameReadyABI = TurnBasedGame.abi.filter(o => o.name === "GameReady")[0];
            // let data = this.state.err.receipt.logs[0].data;
            // let index;
            // index = this.state.web3.eth.abi.decodeLog(gameReadyABI.inputs, data);
            // console.log(index[1]);
            // console.log(index[1][1][0]);
            // console.log(index[1][1][1]);
        
            // let getuserdetails =  await this.state.zoom.methods.getUserDetailsbyaddress(index[1][1][0]).call({from: this.state.account});
            // let getuserdetails1 =  await this.state.zoom.methods.getUserDetailsbyaddress(index[1][1][1]).call({from: this.state.account});
            //     await this.setState({
            //     user1:getuserdetails[0],
            //     address1:getuserdetails[1],
            //     user2:getuserdetails1[0],
            //     address2:getuserdetails1[1]
            // });
            // console.log(getuserdetails1);
            // console.log(getuserdetails1[0]);
            // console.log(getuserdetails1[1]);
        
        
            // console.log(getuserdetails);
            // console.log(getuserdetails[0]);
            // console.log(getuserdetails[1]);
            
            
        }
            
        // if (GameVars.appState.user1){
        //     alert("User"+this.state.user1+
        //     "Address"+this.state.address1+
        //     "Funds"+this.state.fund+ "User"+this.state.user2+
        //     "Address"+this.state.address2+
        //     "Funds"+this.state.fund);
    
    
        //     if (GameVars.appState.address2){
        //         // TODO: que hay que hacer aqui? Iniciar juego?
        //         // this.props.history.push("/game");
        //     }
        // }
    }

    public static readGameData(): void {

        GameManager.getGameStorageData(
            GameConstants.SAVED_GAME_DATA_KEY,
            function (gameData: string): void {

                if (gameData) {
                    GameVars.gameData = JSON.parse(gameData);
                } else {
                    GameVars.gameData = {
                        muted: false
                    };
                }

                GameManager.startGame();
            }
        );
    }

    public static onGameAssetsLoaded(): void {

        GameManager.enterSplashScene();
    }

    public static enterSplashScene(): void {

        // GameVars.currentScene.scene.start("SplashScene");
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
