import { RoomManager } from '../RoomManager';

export class Timer extends Phaser.GameObjects.Container {

    private value: Phaser.GameObjects.Text;

    private timeout: number;
    private interval: NodeJS.Timeout;
    private tween: Phaser.Tweens.Tween;
    private animating: boolean;

    constructor(scene: Phaser.Scene, private isPlayer: boolean) {

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

        if (this.animating) {
            console.log(`Animation underway: will wait a little and try to show again`);
            setTimeout(this.show.bind(this), 700);
            return;
        }
        if (this.alpha === 0) {
            this.scene.tweens.add({
                targets: this,
                alpha: 1,
                ease: Phaser.Math.Easing.Cubic.Out,
                duration: 500
            });
            this.animating = true;
            setTimeout(() => this.animating = false, 700);
        }
    }

    public hide(): void {

        if (this.animating) {
            console.log(`Animation underway: will wait a little and try to hide again`);
            setTimeout(this.hide.bind(this), 700);
            return;
        }
        if (this.alpha === 1) {
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                ease: Phaser.Math.Easing.Cubic.Out,
                duration: 500
            });
            this.animating = true;
            setTimeout(() => this.animating = false, 700);
        }
    }

    public pause(): void {

        if (this.tween) {
            this.tween.stop();
        }
        this.value.alpha = 1;
        this.value.setColor("#FFFFFF");

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
            try {
                this.value.text = new Date(this.timeout * 1000).toISOString().substr(15, 4);
            } catch (error) {
                // Timer no longer valid, clear interval and return
                clearInterval(this.interval);
                return;
            }

            if (this.timeout <= 10) {
                this.value.setColor("#ff4747");
            } else {
                this.value.setColor("#FFFFFF");
            }

            if (this.timeout === 10) {
                this.tween = this.scene.tweens.add({
                    targets: this.value,
                    alpha: 0,
                    ease: Phaser.Math.Easing.Linear,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                }); 
            }

            if (this.timeout === 0) {
                if (this.tween) {
                    this.tween.stop();
                }
                this.value.alpha = 1;
                clearInterval(this.interval);
                RoomManager.onTimeOut(this.isPlayer);
            }
        }, 1000);
    }
}
