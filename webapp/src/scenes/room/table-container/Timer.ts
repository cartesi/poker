import { RoomManager } from '../RoomManager';
import { GameConstants } from "../../../GameConstants";

export class Timer extends Phaser.GameObjects.Container {

    private value: Phaser.GameObjects.Text;

    private timeout: number;
    private interval: NodeJS.Timeout;

    constructor(scene: Phaser.Scene, isPlayer: boolean) {

        super(scene);

        this.y = -135;
        this.x = isPlayer ? -280 : 280;

        let capsule = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", "timer");
        capsule.setOrigin(.5);
        this.add(capsule);

        this.value = new Phaser.GameObjects.Text(this.scene, 15, 0, "", {fontFamily: "Oswald-Medium", fontSize: "21px", color: "#FFFFFF"});
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
                alpha: 0,
                ease: Phaser.Math.Easing.Cubic.Out,
                duration: 500
            }); 
        }
    }

    public pause(): void {

        this.hide();

        clearInterval(this.interval);
    }

    public reset(timeout: number): void {

        this.show();

        this.timeout = timeout;
        this.value.text = new Date(this.timeout * 1000).toISOString().substr(15, 4);

        clearInterval(this.interval);

        this.interval = setInterval(() => {
            this.timeout--;
            this.value.text = new Date(this.timeout * 1000).toISOString().substr(15, 4);

            if (this.timeout === 0) {
                clearInterval(this.interval);
                RoomManager.onTimeOut();
            }
        }, 1000);
    }
}
