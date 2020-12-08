export class Game extends Phaser.Game {

    public static currentInstance: Phaser.Game;

    constructor(config: Phaser.Types.Core.GameConfig) {
        
        super(config);
      
        Game.currentInstance = this;
    }

    public onBlur(): void {

        super.onBlur();
    }

    public onFocus(): void {

        super.onFocus();
    }
}
