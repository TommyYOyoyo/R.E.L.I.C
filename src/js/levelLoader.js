/**
 * @author Honglue Zheng
 * @note Dynamic level asset loader - centralizes common asset loading, keyboard setup, and object management
 */

// Load all assets shared across every level
function loadCommonAssets(scene) {
    // Webfont loader
    scene.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    // Player spritesheet
    scene.load.spritesheet("playerSheet", "/assets/img/Player/spritesheet.png", {
        frameWidth: 50,
        frameHeight: 37
    });

    // Common UI images
    scene.load.image("questKey", "/assets/img/interactKey.png");
    scene.load.image("fragment", "/assets/img/fragment.png");
    scene.load.image("heart", "/assets/img/heart.png");
    scene.load.image("charm_1", "/assets/img/timecharm_1.png");
    scene.load.image("charm_2", "/assets/img/timecharm_2.png");
    scene.load.image("charm_3", "/assets/img/timecharm_3.png");

    // Common sound effects
    scene.load.audio("click", "/assets/sounds/sfx/click.mp3");
    scene.load.audio("climb", "/assets/sounds/sfx/climb.wav");
    scene.load.audio("hurt", "/assets/sounds/sfx/hurt.mp3");
    scene.load.audio("jump", "/assets/sounds/sfx/jump.wav");
    scene.load.audio("run", "/assets/sounds/sfx/step.mp3");
    scene.load.audio("teleport", "/assets/sounds/sfx/teleport.wav");
    scene.load.audio("landing", "/assets/sounds/sfx/landing.wav");
    scene.load.audio("attack", "/assets/sounds/sfx/attack.mp3");
    scene.load.audio("pickup", "/assets/sounds/sfx/pickup.mp3");
    scene.load.audio("gameOver", "/assets/sounds/sfx/game-over.mp3");
}

// Load standard keyboard keys used by the player
function loadKeyboardKeys(scene) {
    scene.keys = scene.input.keyboard.addKeys({
        a:  Phaser.Input.Keyboard.KeyCodes.A,
        s:  Phaser.Input.Keyboard.KeyCodes.S,
        d:  Phaser.Input.Keyboard.KeyCodes.D,
        w:  Phaser.Input.Keyboard.KeyCodes.W,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        f: Phaser.Input.Keyboard.KeyCodes.F
    });
}

// Spawn all objects from tilemap, scale them and enable physics
function spawnObjects(objects, scaleMultiplier, scene) {
    objects.forEach(element => {
        element.setOrigin(0.5, 0.5);
        // Scale the object position based on the global scale multiplier
        element.setPosition(element.x * scaleMultiplier, element.y * scaleMultiplier);

        // Enable physics and scale collision body
        scene.physics.add.existing(element, true);
        element.body.setSize(element.body.width * scaleMultiplier, element.body.height * scaleMultiplier);
    });
}

// Add object collection to a physics group
function addToGroup(objects, group) {
    // Add each object from the collection to the appropriate physics group
    objects.forEach(element => {
        group.add(element);
    });
    group.setVisible(false);
}

import Phaser from "phaser";

export { loadCommonAssets, loadKeyboardKeys, spawnObjects, addToGroup };
