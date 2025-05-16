/**
 * Main menu file
 * @author Honglue Zheng
 * @version beta
 */

import Phaser from 'phaser';

function guide() {
    // TODO
}

class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    // Preload background image
    preload() {
        this.load.image('bg', '/assets/img/bg.webp');
        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI',
        });
    }

    create() {
        // Get window size
        const windowWidth = this.cameras.main.width;
        const windowHeight = this.cameras.main.height;

        // Add background image
        const bg = this.add.image(0, 0, 'bg').setOrigin(0, 0).setScale(0.75);
        // Blur change
        bg.postFX.addBlur();

        // Render title with styles
        const title = this.add.text(windowWidth / 2, windowHeight / 2 - 170, 'R.E.L.I.C', {
            fontFamily: 'minecraft',
            fontSize: '180px',
            color: '#fcc477',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);
        // Title shadow
        title.postFX.addShadow(0, 0, 0.1, 3, 0x000000, 3, 0.5)

        // Render buttons    
        let buttons = this.rexUI.add.buttons({
            x : windowWidth / 2,
            y : windowHeight / 2 + 100,
            orientation: "vertical",
            buttons: [
                // Button index 0 properties (New game button)
                this.rexUI.add.label({
                    width: 300,
                    height: 100,
                    background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000, 0.5),
                    text: this.add.text(0, 0, "NOUVEAU JEU", {
                        fontSize: "32px",
                        fontFamily: 'minecraft',
                    }),
                    space: {
                        left: 20,
                        right: 20,
                    },
                    align: "center"
                }).setInteractive({useHandCursor: true }), 
                // Button index 1 properties (Continue button)
                this.rexUI.add.label({
                    width: 300,
                    height: 100,
                    background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000, 0.5),
                    text: this.add.text(0, 0, "CONTINUER", {
                        fontSize: "32px",
                        fontFamily: 'minecraft',
                    }),
                    space: {
                        left: 20,
                        right: 20,
                    },
                    align: "center"
                }).setInteractive({useHandCursor: true }), 
                // Button index 2 properties (Guide button)
                this.rexUI.add.label({
                    width: 300,
                    height: 100,
                    background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000, 0.5),
                    text: this.add.text(0, 0, "GUIDE", {
                        fontSize: "32px",
                        fontFamily: 'minecraft',
                    }),
                    space: {
                        left: 20,
                        right: 20,
                    },
                    align: "center"
                }).setInteractive({useHandCursor: true }),     
            ],
            space: { item: 10 }
        })
        // on hover: change color
        .on("button.over", (button) => {
            button.getElement('background').setFillStyle(0x000000, 0.75);
        })
        .on("button.out", (button) => {
            button.getElement('background').setFillStyle(0x000000, 0.5);
        })
        // Handle clicks - WIP
        .on('button.click', (button) => {
            const lastGame = localStorage.getItem('lastGame');
            // If nothing was saved, set default
            if (lastGame == null) localStorage.setItem('lastGame', JSON.stringify({
                level: "Level1",
                checkpoint: 1
            }));
            // New game
            if (button.text == "NOUVEAU JEU") {
                // Set last game checkpoint to default
                localStorage.setItem('lastGame', JSON.stringify({
                    level: "Level2", /** @note DEV: CHANGE HERE TO SKIP TO YOUR LEVEL */ 
                    checkpoint: 1
                }));
                // Start new game scene
                this.scene.start('Level2');
            } else if (button.text == "CONTINUER") {
                // Restart latest progress
                const level = JSON.parse(localStorage.getItem('lastGame')).level;
                this.scene.start(`${level}`);
            } else {
                guide();
            }
        })
        .layout(); // arrange positions
    }    
}

export { MainMenu };
