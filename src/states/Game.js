import Phaser from "phaser";

export default class Game extends Phaser.Scene {
    constructor() {
        super("Game");
    }

    init() {
        this.score = 0;
        this.isPaused = false;
        this.isGameOver = false;

        this.FLOOR_TRIM_TOP_PX = 95;

        this.FOOT_OFFSET = 2;
    }

    create() {
        const { width, height } = this.scale;

        this.add.image(0, 0, "background").setOrigin(0, 0);

        this.floor = this.physics.add.staticImage(width * 0.5, height, "floor").setOrigin(0.5, 1);
        this.floor.displayWidth = width + 200;

        this.floor.refreshBody();
        this.floor.setDepth(5);

        const floorTex = this.textures.get("floor").getSourceImage();
        const scaleY = this.floor.displayHeight / floorTex.height;
        const trimScaled = this.FLOOR_TRIM_TOP_PX * scaleY;

        this.floorTopY = this.floor.getBounds().top + trimScaled;

        const hud = this.add.image(16, 16, "score-bg").setOrigin(0, 0).setDepth(20);
        this.scoreText = this.add
            .text(hud.x + 100, hud.y + 35, "0", { fontFamily: "Arial", fontSize: 30, color: "#ffffff" })
            .setOrigin(0, 0.5)
            .setDepth(21);

        this.add
            .image(width - 16, 16, "button-pause")
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .setDepth(21)
            .on("pointerup", () => this.togglePause());

        if (!this.anims.exists("monster-idle")) {
            this.anims.create({
                key: "monster-idle",
                frames: this.anims.generateFrameNumbers("monster-idle", { start: 0, end: 12 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!this.anims.exists("monster-eat")) {
            this.anims.create({
                key: "monster-eat",
                frames: this.anims.generateFrameNumbers("monster-eats", { start: 0, end: 3 }),
                frameRate: 12,
                repeat: 0
            });
        }

        this.monster = this.physics.add
            .sprite(width * 0.5, 0, "monster-idle", 0)
            .setOrigin(0.5, 1) // ← pies
            .setDepth(10)
            .setCollideWorldBounds(true);
        this.monster.body.allowGravity = false;
        this.monster.play("monster-idle");

        this.monster.y = this.floorTopY + this.FOOT_OFFSET;

        this.items = this.physics.add.group({ allowGravity: true, collideWorldBounds: false });

        this.physics.add.collider(this.items, this.floor, this.onHitFloor, undefined, this);

        this.physics.add.overlap(this.monster, this.items, this.handleCatch, null, this);

        this.spawnTimer = this.time.addEvent({
            delay: 900,
            loop: true,
            callback: this.spawnItem,
            callbackScope: this
        });

        this.targetX = this.monster.x;
    }

    update() {
        if (this.isPaused || this.isGameOver) return;

        const pointer = this.input.activePointer;
        this.targetX = Phaser.Math.Clamp(
            pointer.x,
            this.monster.displayWidth * 0.5,
            this.scale.width - this.monster.displayWidth * 0.5
        );
        this.monster.x += (this.targetX - this.monster.x) * 0.2;

        this.monster.y = this.floorTopY + this.FOOT_OFFSET;

        const killY = this.scale.height + 40;
        this.items.children.iterate((item) => {
            if (item && item.y > killY) item.destroy();
        });
    }

    onHitFloor(objA, objB) {
        const item =
            objA.body && objA.body.allowGravity ? objA :
                objB.body && objB.body.allowGravity ? objB : null;

        if (item && item.active) item.disableBody(true, true);
    }

    spawnItem() {
        const { width } = this.scale;
        const frame = Phaser.Math.Between(0, 5);

        const item = this.items.create(
            Phaser.Math.Between(30, width - 30),
            -30,
            "items",
            frame
        ).setDepth(8);

        item.setVelocityY(Phaser.Math.Between(150, 250));
        item.setData("isBomb", frame === 5);

        item.setInteractive({ useHandCursor: true });
        item.on("pointerdown", () => {
            if (this.isPaused || this.isGameOver) return;
            if (item.getData("isBomb")) {
                this.gameOver();
            } else {
                this.addScore(1);
                this.playEat();
            }
            item.destroy();
        });
    }

    handleCatch(monster, item) {
        if (this.isPaused || this.isGameOver) return;
        if (item.getData("isBomb")) {
            item.destroy();
            this.gameOver();
        } else {
            this.addScore(1);
            item.destroy();
            this.playEat();
        }
    }

    playEat() {
        const current = this.monster.anims.currentAnim && this.monster.anims.currentAnim.key;
        if (current === "monster-eat") return;
        this.monster.play("monster-eat");
        this.monster.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            if (!this.isGameOver) this.monster.play("monster-idle");
        });
        this.monster.y = this.floorTopY + this.FOOT_OFFSET;
    }

    addScore(n) {
        this.score += n;
        this.scoreText.setText(String(this.score));
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.world.pause();
            if (this.spawnTimer) this.spawnTimer.paused = true;
            this.anims.pauseAll();
            if (this.tweens && this.tweens.pauseAll) this.tweens.pauseAll();
        } else {
            this.physics.world.resume();
            if (this.spawnTimer) this.spawnTimer.paused = false;
            this.anims.resumeAll();
            if (this.tweens && this.tweens.resumeAll) this.tweens.resumeAll();
        }
    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        this.physics.world.pause();
        this.spawnTimer.remove(false);
        this.anims.pauseAll();

        const { width, height } = this.scale;
        this.add.image(width * 0.5, height * 0.35, "gameover").setDepth(100).setScale(0.9);

        this.time.delayedCall(1800, () => {
            this.anims.resumeAll();
            this.scene.start("Menu");
        });
    }
}
