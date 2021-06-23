import { GameConstants } from "./../../../GameConstants";

export class Timer extends Phaser.GameObjects.Container {

    private value: Phaser.GameObjects.Text;

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

        this.value = new Phaser.GameObjects.Text(this.scene, -120, 86, "05:00", {fontFamily: "Oswald-Medium", fontSize: "50px", color: "#FFFFFF"});
        this.value.setOrigin(.5);
        this.add(this.value);

    }
}
