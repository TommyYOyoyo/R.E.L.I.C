import "../css/style.css";
import Phaser from "phaser";

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image("background", "./src/assets/img/background.png");
    this.load.image("player", "./src/assets/img/player.png");
    this.load.image("enemy", "./src/assets/img/enemy.png");
}

function create() {
    this.add.image(400, 300, "background");

    this.physics.world.setBounds(0, 0, 800, 600);

    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.enemy = this.physics.add.sprite(400, 300, "enemy");
    this.enemy.setBounce(0.2);
    this.enemy.setCollideWorldBounds(true);

    this.scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "32px", fill: "#000" });
    this.score = 0;

    this.input.on("pointerdown", () => {
        if (!this.physics.at(this.player, this.enemy)) {
            this.player.setVelocityX(-200);
        }
    });
}

function update() {
    this.physics.world.wrap(this.player);
    this.physics.world.wrap(this.enemy);

    if (this.physics.at(this.player, this.enemy)) {
        this.player.setVelocityX(0);
        this.enemy.setVelocityX(0);
    }

    this.scoreText.setText(`Score: ${this.score}`);

    this.physics.world.debugDraw();
}