import { RoomManager } from './../RoomManager';
import { GameConstants } from "./../../../GameConstants";

export class Timer extends Phaser.GameObjects.Container {

    private value: Phaser.GameObjects.Text;

    private timeout: number;
    private interval: NodeJS.Timeout;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.x = GameConstants.GAME_WIDTH / 2;
        this.y = 5;

        let capsule = new Phaser.GameObjects.Image(this.scene, -10, 10, "texture_atlas_1", "timer_capsule");
        capsule.setOrigin(1, 0);
        capsule.setScale(.75);
        this.add(capsule);
        
        let title = new Phaser.GameObjects.Text(this.scene, -120, 33, "TIMER", {fontFamily: "Oswald-Medium", fontSize: "25px", color: "#FFFFFF"});
        title.setOrigin(.5);
        this.add(title);

        this.value = new Phaser.GameObjects.Text(this.scene, -120, 86, "", {fontFamily: "Oswald-Medium", fontSize: "50px", color: "#FFFFFF"});
        this.value.setOrigin(.5);
        this.add(this.value); 

        this.alpha = 0;
    }

    public show(): void {

        if (this.alpha === 0) {
            this.scene.tweens.add({
                targets: this,
                alpha: 1,
                ease: Phaser.Math.Easing.Cubic.Out,
                duration: 500
            }); 
        }
    }

    public hide(): void {

        if (this.alpha === 1) {
            this.scene.tweens.add({
                targets: this,
                alpha: 1,
                ease: Phaser.Math.Easing.Cubic.Out,
                duration: 500
            }); 
        }
    }

    public reset(timeout: number): void {

        this.show();

        this.timeout = timeout;
        this.value.text = new Date(this.timeout * 1000).toISOString().substr(14, 5);

        clearInterval(this.interval);

        this.interval = setInterval(() => {
            this.timeout--;
            this.value.text = new Date(this.timeout * 1000).toISOString().substr(14, 5);

            if (this.timeout === 0) {
                clearInterval(this.interval);
                RoomManager.onTimeOut();
            }
        }, 1000);
    }
}
