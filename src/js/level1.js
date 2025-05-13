/**
 * Level 1 game file
 * @author Ray Lam
 * @version beta
 */

import Phaser from "phaser";
//import { createMenu, removeMenu } from './MainMenu';

const speedDown = 0;

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    mapWidth: window.innerWidth * 5,
    mapHeight: window.innerHeight * 3,
};

class Level1 extends Phaser.Scene {
    constructor() {
        super('gameScene');
        this.player;
        this.cursor;
        this.playerVelocity = speedDown + 400;
    }

    preload() {
        this.load.image('bg', '../../public/assets/img/bg.webp');
        this.load.image('player','../../public/assets/img/Player/Player1.png');
        // Create a 1x1 transparent pixel image named 'invisible.png' for collisions
        this.load.image('invisible', './Sprites/invisible.png');
    }

    create() {
        // Set background to cover full screen

        const bg = this.add.image(0, 0, 'bg').setOrigin(0, 0);
        bg.setDisplaySize(this.scale.width, this.scale.height);

        // Create player (scaled relative to screen size)
        const playerSize = Math.min(this.scale.width, this.scale.height) * 0.1;
        this.player = this.physics.add.image(
            playerSize,
            this.scale.height - playerSize * 1.5,
            'player'
        );
        this.player.setDisplaySize(playerSize, playerSize);
        this.player.setCollideWorldBounds(true);

        // Create floor collider (using physics body)
        const floorCollider = this.add.rectangle(
            0, this.scale.height - 300,  // Changed from -1 to -100 to match your original position
            this.scale.width, 50,         // Increased height from 2 to 50 for better collision
            0x000000, 0                   // Still completely invisible
        ).setOrigin(0, 0);
        this.physics.add.existing(floorCollider, true);
        this.physics.add.collider(this.player, floorCollider);



        // Keyboard controls
        this.cursor = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
            arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
            arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
            arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            f: Phaser.Input.Keyboard.KeyCodes.F // For fullscreen toggle
        });

        // Fullscreen toggle
        this.input.keyboard.on('keydown-F', () => {
            if (this.scale.isFullscreen) {
                this.scale.exitFullscreen();
            } else {
                this.scale.startFullscreen();
            }
        });

        // Handle window resize
        this.scale.on('resize', (gameSize) => {
            bg.setDisplaySize(gameSize.width, gameSize.height);
            floorCollider.setSize(gameSize.width, 2);
            floorCollider.y = gameSize.height - 100;
            this.scale.on('resize', (gameSize) => {
                floorCollider.y = gameSize.height + 10000;  // Updated to match new position
            });
        });
    }

    update() {
        const { left, right, up, down, arrowLeft, arrowRight, arrowUp, arrowDown } = this.cursor;

        let velocityX = 0;
        let velocityY = 0;

        // Horizontal Movement
        if (left.isDown || arrowLeft.isDown) velocityX = -this.playerVelocity;
        if (right.isDown || arrowRight.isDown) velocityX = this.playerVelocity;

        // Vertical Movement
        if (up.isDown || arrowUp.isDown) velocityY = -this.playerVelocity;
        if (down.isDown || arrowDown.isDown) velocityY = this.playerVelocity;

        // Normalize diagonal speed
        if (velocityX !== 0 && velocityY !== 0) {
            const diagonalSpeed = this.playerVelocity / Math.sqrt(2);
            velocityX = velocityX < 0 ? -diagonalSpeed : diagonalSpeed;
            velocityY = velocityY < 0 ? -diagonalSpeed : diagonalSpeed;
        }

        this.player.setVelocity(velocityX, velocityY);
    }
}

export { Level1 }