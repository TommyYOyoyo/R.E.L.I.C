/**
 * Level 1 game file
 * @author Ray Lam
 * @version beta
 */

import Phaser from "phaser";
import { loadPlayer, updatePlayerMovement, hitboxUpdater } from "../player.js";

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    mapWidth: window.innerWidth * 5,
    mapHeight: window.innerHeight * 3,
};

// Load assets for the current level
function loadAssets(scene) {
    scene.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    // Main tileset
    scene.load.image("dungeonTileset", "assets/img/Dungeon_Pack/Tileset.png");
    
    // Background images
    scene.load.image("bgLayer1", "assets/img/backgrounds/background_1/Plan_3.png");
    scene.load.image("bgLayer2", "assets/img/backgrounds/background_4/Plan_5.png");
    
    // Main map - ensure this path is correct!
    scene.load.tilemapTiledJSON("map", "assets/img/maps/l1_map.tmj");

    // Player spritesheet
    scene.load.spritesheet("playerSheet", "assets/img/Player/spritesheet.png", {
        frameWidth: 50,
        frameHeight: 37
    });
}

class Level1 extends Phaser.Scene {
    constructor() {
        super("Level1");
        this.scaleMultiplier = 3.5;
        this.player = null;
        this.groundCollider = null;
        this.ladderGroup = null;
        this.ground = null;
    }

    preload() {
        loadAssets(this);

        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            f: Phaser.Input.Keyboard.KeyCodes.F
        });
    }

    create() {       
        // Create background
        this.add.image(0, 0, "bgLayer1").setOrigin(0).setScrollFactor(0.5).setDepth(-5);
        this.add.image(0, 0, "bgLayer2").setOrigin(0).setScrollFactor(0.3).setDepth(-4);

        // Main map creation - with error handling
        const map = this.make.tilemap({ key: "map" });
        if (!map) {
            console.error("Failed to load tilemap!");
            return;
        }

        // Add tileset - ensure "Dungeon" matches your Tiled tileset name
        const tileset = map.addTilesetImage("Tileset", "dungeonTileset");
        if (!tileset) {
            console.error("Failed to load tileset!");
            return;
        }

        // Create all layers with null checks
        const layers = {
            backwalls: map.createLayer("backwalls", tileset, 0, 0),
            walls: map.createLayer("walls", tileset, 0, 0),
            deco: map.createLayer("deco", tileset, 0, 0),
            collidables: map.createLayer("collidables", tileset, 0, 0),
            layering: map.createLayer("layering", tileset, 0, 0)
        };

        // Scale layers and set depth
        const layerDepths = {
    backwalls: -5,    // farthest back
    walls: -4,
    deco: -3,
    collidables: 2,
    player: 1,
    layering: 10      // front most
};


Object.entries(layers).forEach(([name, layer]) => {
    if (layer) {
        layer.setScale(this.scaleMultiplier).setOrigin(0, 0);
        layer.setDepth(layerDepths[name] ?? 0);  // default 0 if missing
    } else {
        console.warn(`Failed to create layer: ${name}`);
    }
});
        // Create object groups
        this.ladderGroup = this.physics.add.staticGroup();
        this.checkpointGroup = this.physics.add.staticGroup();

        // Load objects from interact layer
        const objectLayer = map.getObjectLayer("interact");
        if (objectLayer) {
            objectLayer.objects.forEach(obj => {
                const x = obj.x * this.scaleMultiplier;
                const y = obj.y * this.scaleMultiplier;
                const width = obj.width * this.scaleMultiplier;
                const height = obj.height * this.scaleMultiplier;

                if (obj.type === "Ladder") {
                    const ladder = this.physics.add.sprite(x, y, "")
                        .setSize(width, height)
                        .setOrigin(0, 0);
                    this.ladderGroup.add(ladder);
                }
                // Add other object types as needed
            });
        }

        // Load player
        loadPlayer(this);
        this.player.setScale(this.scaleMultiplier);

        // Set up physics world bounds
        this.physics.world.setBounds(
            0, 
            0, 
            map.widthInPixels * this.scaleMultiplier, 
            map.heightInPixels * this.scaleMultiplier
        );

        // Enable collisions - collidables layer should collide
        if (layers.collidables) {
            layers.collidables.setCollisionByExclusion([-1]);
            this.physics.add.collider(this.player, layers.collidables);
        }

        // Also collide with walls if needed
        if (layers.walls) {
            this.physics.add.collider(this.player, layers.walls);
        }

        // Camera setup
        this.cameras.main.setBounds(
            0, 
            0, 
            map.widthInPixels * this.scaleMultiplier, 
            map.heightInPixels * this.scaleMultiplier
        );
        this.cameras.main.startFollow(this.player);
    }

    update() {
        // Check ladder collisions
        if (this.player && this.ladderGroup) {
            this.player.canClimb = this.physics.overlap(this.player, this.ladderGroup);
        }
        
        // Update player
        if (this.player) {
            updatePlayerMovement(this);
            hitboxUpdater(this);
        }
    }
}

export { Level1 };