/**
 * Main menu file
 * @author Honglue Zheng, Ray Lam, Rui Qi Ren
 * @version beta
 */

import Phaser from 'phaser';

// Reset all game storage
function clearStorage() {
    localStorage.setItem("Level1.fragments", 0);
    localStorage.setItem("Level1.claimedFragments", null);
    localStorage.setItem("Level2.fragments", 0);
    localStorage.setItem("Level2.claimedFragments", null);
    localStorage.setItem("Level3.fragments", 0);
    localStorage.setItem("Level3.claimedFragments", null);

    localStorage.setItem("threeWeirdos", "false");
    localStorage.setItem("sequencer", "false");
    localStorage.setItem("nbGuesser", "false");

    localStorage.setItem("runeSequenceLock", "false");
    localStorage.setItem("sudoku", "false");
    localStorage.setItem("pressurePads", "false");
    localStorage.setItem("slidingTiles", "false");
}

// devMode level selector
function devMode(scene, windowWidth, windowHeight) {
    if (!scene.devActive) {
        // Spawn title
        scene.devText = scene.add.text(0, 0, "Les niveaux sont suggérés d'être joués en ordre.", {
            fontSize: "16px",
            fontFamily: 'minecraft',
            color: "red"
        });
        // Position titles
        scene.devText.x = windowWidth / 5 - scene.devText.width / 2;
        scene.devText.y = windowHeight / 2 - 50;
        // Level selectors
        scene.devSelector = scene.rexUI.add.buttons({
            x : windowWidth / 5,
            y : windowHeight / 2 + 100,
            orientation: "vertical",
            buttons: [
                // Button index 1 properties (1st level button)
                scene.rexUI.add.label({
                    width: 100,
                    height: 50,
                    background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000, 0.5),
                    text: scene.add.text(0, 0, "Niveau 1", {
                        fontSize: "16px",
                        fontFamily: 'minecraft',
                    }),
                    space: {
                        left: 20,
                        right: 20,
                    },
                    align: "center"
                }).setInteractive({ useHandCursor: true }), 
                // Button index 2 properties (2nd level button)
                scene.rexUI.add.label({
                    width: 100,
                    height: 50,
                    background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000, 0.5),
                    text: scene.add.text(0, 0, "Niveau 2", {
                        fontSize: "16px",
                        fontFamily: 'minecraft',
                    }),
                    space: {
                        left: 20,
                        right: 20,
                    },
                    align: "center"
                }).setInteractive({ useHandCursor: true }), 
                // Button index 3 properties (3rd level button)
                scene.rexUI.add.label({
                    width: 100,
                    height: 50,
                    background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000, 0.5),
                    text: scene.add.text(0, 0, "Niveau 3", {
                        fontSize: "16px",
                        fontFamily: 'minecraft',
                    }),
                    space: {
                        left: 20,
                        right: 20,
                    },
                    align: "center"
                }).setInteractive({ useHandCursor: true }),  
                // Button index 4 properties (clear storage)
                scene.rexUI.add.label({
                    width: 100,
                    height: 50,
                    background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000, 0.5),
                    text: scene.add.text(0, 0, "Effacer localStorage", {
                        fontSize: "16px",
                        fontFamily: 'minecraft',
                    }),
                    space: {
                        left: 20,
                        right: 20,
                    },
                    align: "center"
                }).setInteractive({ useHandCursor: true }),   
            ],
            space: { item: 10 }
        })// on hover: change color
        .on("button.over", (button) => {
            button.getElement('background').setFillStyle(0x000000, 0.75);
            scene.sound.play("hover");
        })
        .on("button.out", (button) => {
            button.getElement('background').setFillStyle(0x000000, 0.5);
        })
        // Level selector
        .on('button.click', (button) => {
            scene.sound.play("click");
            const lastGame = localStorage.getItem('lastGame');
            // If nothing was saved, set default
            if (lastGame == null) localStorage.setItem('lastGame', JSON.stringify({
                level: "Level1",
                checkpoint: 0
            }));
            // New game
            if (button.text == "Niveau 1") {
                // Set last game checkpoint to default
                localStorage.setItem('lastGame', JSON.stringify({
                    level: "Level1", 
                    checkpoint: 0
                }));
                newScene("Level1", scene);
            } else if (button.text == "Niveau 2") {
                // Set last game checkpoint to default
                localStorage.setItem('lastGame', JSON.stringify({
                    level: "Level2",
                    checkpoint: 0
                }));
                newScene("Level2", scene);
            } else if (button.text == "Niveau 3"){
                // Set last game checkpoint to default
                localStorage.setItem('lastGame', JSON.stringify({
                    level: "Level3",
                    checkpoint: 0
                }));
                newScene("Level3", scene);
            } else {
                clearStorage();
            }
        }).layout();

        scene.devActive = true;
    } else {
        // Destroy all items
        scene.devText.destroy();
        scene.devSelector.destroy();
        scene.devActive = false;
    }
}

class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
        this.devActive = false;
        this.devText;
        this.devSelector;
    }

    // Preload background image
    preload() {
        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI',
        });
        this.load.audio("childrenOfOmnissiah", "/assets/sounds/musics/childrenOfOmnissiah.mp3");
        this.load.audio("hover", "/assets/sounds/sfx/hover.wav");
        this.load.audio("click", "/assets/sounds/sfx/click.mp3");
        this.load.spritesheet("bgSheet", "/assets/img/mainMenu.png", {
            frameWidth: 959,
            frameHeight: 500
        });
    }

    create() {
        // Get window size
        const windowWidth = this.cameras.main.width;
        const windowHeight = this.cameras.main.height;

        // Add background image (gif)
        const bg = this.add.sprite(0, 0, "bgSheet");
        this.anims.create({
            key: "bgCycle",
            frames: this.anims.generateFrameNumbers("bgSheet", {
                start: 0,
                end: 65
            }),
            frameRate: 20,
            repeat: -1
        });
        bg.play("bgCycle", true);
        bg.setScale(1.75).setOrigin(0.5, 0.4).setPosition(windowWidth / 2, windowHeight / 2);

        // Blur the bg
        bg.postFX.addBlur();

        // Render title with styles
        const title = this.add.text(windowWidth / 2, windowHeight / 2 - 170, 'R. E. L. I. C.', {
            fontFamily: 'noita',
            fontSize: '200px',
            color: '#fcc477',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);
        // Title shadow
        title.postFX.addShadow(0, 0, 0.1, 3, 0x000000, 3, 0.5);

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
                }).setInteractive({ useHandCursor: true }), 
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
                }).setInteractive({ useHandCursor: true }), 
                // Button index 2 properties (Guide button)
                this.rexUI.add.label({
                    width: 300,
                    height: 100,
                    background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x000000, 0.5),
                    text: this.add.text(0, 0, "DEV", {
                        fontSize: "32px",
                        fontFamily: 'minecraft',
                    }),
                    space: {
                        left: 20,
                        right: 20,
                    },
                    align: "center"
                }).setInteractive({ useHandCursor: true }),     
            ],
            space: { item: 10 }
        })
        // on hover: change color
        .on("button.over", (button) => {
            button.getElement('background').setFillStyle(0x000000, 0.75);
            this.sound.play("hover");
        })
        .on("button.out", (button) => {
            button.getElement('background').setFillStyle(0x000000, 0.5);
        })
        // Handle clicks - WIP
        .on('button.click', (button) => {
            this.sound.play("click");
            const lastGame = localStorage.getItem('lastGame');
            // If nothing was saved, set default
            if (lastGame == null) {
                localStorage.setItem('lastGame', JSON.stringify({
                    level: "Level1",
                    checkpoint: 0
                }));
                clearStorage();
            }
            // New game
            if (button.text == "NOUVEAU JEU") {
                // Set last game checkpoint to default
                localStorage.setItem('lastGame', JSON.stringify({
                    level: "Level1", /** @note DEV: CHANGE HERE TO SKIP TO YOUR LEVEL */ 
                    checkpoint: 0
                }));
                clearStorage();
                newScene("Level1", this);
            } else if (button.text == "CONTINUER") {
                // Restart latest progress
                const level = JSON.parse(localStorage.getItem('lastGame')).level;
                newScene(`${level}`, this);
            } else {
                devMode(this, windowWidth, windowHeight);
            }
        })
        .layout(); // arrange positions

        this.music = this.sound.add('childrenOfOmnissiah', {
            loop: true,
            volume: 0.5,
        });
        this.music.play();
    } 
}

// Start new scene with fade effect
function newScene(target, scene, music = true) {
    // Start a 1-second fade to black
    scene.cameras.main.fadeOut(2000, 0, 0, 0); // (duration, red, green, blue)

    // Gradually decrease music volume
    if (music) {
        setInterval(() => {
            if (scene.music.volume > 0) scene.music.volume -= 0.1;
        }, 200);
    }

    // When fade completes, switch scenes
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        scene.scene.start(`${target}`);
        scene.sound.stopAll(); // Stop all sounds
        // Destroy current scene
        // this.scene.stop();
    });
}

export { MainMenu, newScene };
