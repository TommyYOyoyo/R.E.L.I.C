/**
 * Main menu file
 * @author Honglue Zheng
 * @version beta
 */

import Phaser from 'phaser';

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
        const windowWidth = this.cameras.main.width;
        const windowHeight = this.cameras.main.height;

        // Add background image
        const bg = this.add.image(0, 0, 'bg').setOrigin(0, 0).setScale(0.75);
        // Blur change
        bg.postFX.addBlur();

        // Render title
        this.add.text(windowWidth / 2, windowHeight / 2 - 150, 'R.E.L.I.C', {
            fontFamily: 'minecraft',
            fontSize: '150px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        // Render buttons    
        let buttons = this.rexUI.add.buttons({
            x : windowWidth / 2,
            y : windowHeight / 2 + 100,
            orientation: "vertical",
            buttons: [
                // Button index 0
                this.rexUI.add.label({
                    width: 200,
                    height: 100,
                    background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000, 0.5),
                    text: this.add.text(0, 0, "Nouveau jeu", {
                        fontSize: "32px",
                        fontFamily: 'minecraft',
                    }),
                    space: {
                        left: 20,
                        right: 20,
                    },
                    align: "center"
                }).setInteractive({useHandCursor: true }), 
                // Button index 1
                this.rexUI.add.label({
                    width: 200,
                    height: 100,
                    background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000, 0.5),
                    text: this.add.text(0, 0, "Continuer", {
                        fontSize: "32px",
                        fontFamily: 'minecraft',
                    }),
                    space: {
                        left: 20,
                        right: 20,
                    },
                    align: "center"
                }).setInteractive({useHandCursor: true }), 
                // Button index 2
                this.rexUI.add.label({
                    width: 200,
                    height: 100,
                    background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000, 0.5),
                    text: this.add.text(0, 0, "Guide", {
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
        .on('button.click', (index) => {
            console.log(`Button ${index} clicked`);
        })
        .layout();

    }    
}

export { MainMenu };
