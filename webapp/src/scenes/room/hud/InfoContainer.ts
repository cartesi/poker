export class InfoContainer extends Phaser.GameObjects.Container {

    private background: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    private loading: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene) {

        super(scene);

        this.background = new Phaser.GameObjects.Graphics(this.scene);
        this.background.fillStyle(0x0A2036);
        this.background.fillRoundedRect(-150, -30, 300, 60, 10);
        this.background.lineStyle(4, 0x47E8FC);
        this.background.strokeRoundedRect(-150, -30, 300, 60, 10);
        this.add(this.background);

        this.loading = new Phaser.GameObjects.Image(this.scene, -110, 0, "texture_atlas_1", "loading");
        this.loading.setScale(.28);
        this.loading.visible = false;
        this.add(this.loading);

        this.scene.tweens.add({
            targets: this.loading,
            angle: 360,
            ease: Phaser.Math.Easing.Linear,
            duration: 1000,
            repeat: -1
        });

        this.text = new Phaser.GameObjects.Text(this.scene, -80, 0, "", { fontFamily: "Oswald-Medium", fontSize: "22px", color: "#FFFFFF", align: "left" });
        this.text.setOrigin(0, .5);
        this.add(this.text);
    }

    public show() {
        this.setAlpha(1);
    }

    public hide() {
        this.setAlpha(0);
    }

    public update(label: string, loading: boolean): boolean {
        if (!this.background.active) {
            return;
        }

        // update button label
        this.text.setText(label);
        this.background.clear();
        this.background.fillStyle(0x0A2036);
        this.background.fillRoundedRect(-(this.text.width + 95) / 2, -30, this.text.width + 95, 60, 10);
        this.background.lineStyle(4, 0x47E8FC);
        this.background.strokeRoundedRect(-(this.text.width + 95) / 2, -30, this.text.width + 95, 60, 10);
        this.background.setInteractive(new Phaser.Geom.Rectangle(-(this.text.width + 95) / 2, -30, this.text.width + 95, 60), Phaser.Geom.Rectangle.Contains);
        this.loading.x = -(this.text.width + 95) / 2 + 40;
        this.text.x = this.loading.x + 10;

        if (loading) {
            this.loading.visible = true;
            // fixing text position if an icon is being shown
            this.text.x += 20;
        } else {
            this.loading.visible = false;
        }

        this.show();
    }
}
