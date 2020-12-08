import { GameManager } from "../GameManager"; 
import { Game as PhaserGame} from "../Game";
import { GameConstants } from "../GameConstants";
import { GameVars } from "../GameVars";

export class BootScene extends Phaser.Scene {

    public static currentInstance: BootScene;

    public static onOrientationChange(): void {

        BootScene.currentInstance.time.addEvent({ delay: 100, callback: () => {
            GameVars.scaleY = (GameConstants.GAME_HEIGHT / GameConstants.GAME_WIDTH) / (window.innerHeight / window.innerWidth);
            Game.currentInstance.scale.refresh();
        }, callbackScope: BootScene.currentInstance});
    }
    
    constructor() {

        super("BootScene");
    }

    public preload(): void {
        //
    }

    public create(): void {

        // const alice_tx = new Transport();
        // const bob_tx = new Transport();    

        // const alice = new Game(
        //     0, 1000, 1000, "", alice_tx,
        //     () => {},
        //     () => {},
        //     (msg) => {console.log(msg)}
        // );

        // console.log(alice);

        // console.log(alice_tx);

        BootScene.currentInstance = this;
        GameManager.setCurrentScene(this);

        this.scene.setVisible(false);

        if (GameVars.currentScene.sys.game.device.os.desktop) {
            GameManager.init();
        } else {

            if (window.innerWidth < window.innerHeight) {
                document.getElementById("orientation").style.display = "block";
                document.getElementById("content").style.display = "none";
            } else {
                GameManager.init();
            }
        }
    }
}
