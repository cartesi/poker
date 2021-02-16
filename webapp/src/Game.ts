import { GameVars } from "./GameVars";
import { AudioManager } from "./AudioManager";

export class Game extends Phaser.Game {

    public static currentInstance: Phaser.Game;

    constructor(config: Phaser.Types.Core.GameConfig) {
        
        super(config);
      
        Game.currentInstance = this;
    }

    public onBlur(): void {

        super.onBlur();

        if (AudioManager.sound) {
            AudioManager.sound.mute(true);
        }
        
    }

    public onFocus(): void {

        super.onFocus();

        if (AudioManager.sound) {
            if (!GameVars.gameData.muted) {
                AudioManager.sound.mute(false);
            }
        }
    }
}
