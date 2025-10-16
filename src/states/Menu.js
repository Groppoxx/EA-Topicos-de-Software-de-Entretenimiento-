import Phaser from "phaser";

export default class Menu extends Phaser.Scene {
    constructor() {
        super("Menu");
    }

    create() {
        const { width, height } = this.scale;

        this.add.image(0, 0, "background").setOrigin(0, 0);
        this.add.image(width * 0.5, 120, "title").setOrigin(0.5, 0);
        this.add.image(0, height, "monster-cover").setOrigin(0, 1);

        const startBtn = this.add
            .sprite(width - 20, height - 20, "button-start", 0)
            .setOrigin(1, 1)
            .setInteractive({ useHandCursor: true });

        startBtn.on("pointerover", () => startBtn.setFrame(1));
        startBtn.on("pointerout", () => startBtn.setFrame(0));
        startBtn.on("pointerdown", () => startBtn.setFrame(2));
        startBtn.on("pointerup", () => {
            startBtn.setFrame(0);
            this.scene.start("Game");
        });
    }
}
