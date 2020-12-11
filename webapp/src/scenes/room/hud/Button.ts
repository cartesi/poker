export class Button extends Phaser.GameObjects.Container {

    private image: Phaser.GameObjects.Image;
    private text: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, imageName: string, text: string, callback: () => void) {

        super(scene);

        this.x = x;
        this.y = y;

        this.image = new Phaser.GameObjects.Image(this.scene, 0, 0, "texture_atlas_1", imageName);
        this.image.setInteractive();
        this.image.on("pointerdown", callback, this);
        this.image.on("pointerover", () => {
            this.setScale(1.05);
        }, this);

        this.image.on("pointerout", () => {
            this.setScale(1);
        }, this);
        this.add(this.image);

        this.text = new Phaser.GameObjects.Text(this.scene, 0, 0, text, {fontFamily: "Oswald-Medium", fontSize: "30px", color: "#FFFFFF"});
        this.text.setOrigin(.5); 
        this.add(this.text);
    }

    public activate(value: boolean): void {
        
        this.alpha = value ? 1 : .5;
        this.image.input.enabled = value;
    }
}
