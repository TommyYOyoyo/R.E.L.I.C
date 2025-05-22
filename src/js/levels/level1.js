import Phaser from "phaser";
import { loadPlayer, updatePlayerMovement, hitboxUpdater } from "../player.js";

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    mapWidth: window.innerWidth * 5,
    mapHeight: window.innerHeight * 3,
};

function loadAssets(scene) {
    scene.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
    scene.load.image("dungeonTileset", "assets/img/Dungeon_Pack/Tileset.png");
    scene.load.image("bgLayer1", "assets/img/backgrounds/background_1/Plan_3.png");
    scene.load.image("bgLayer2", "assets/img/backgrounds/background_4/Plan_5.png");
    scene.load.tilemapTiledJSON("map", "assets/img/maps/l1_map.tmj");
    scene.load.spritesheet("playerSheet", "assets/img/Player/spritesheet.png", {
        frameWidth: 50,
        frameHeight: 37
    });

    // Sound assets
    scene.load.audio("onceInALullaby", "/assets/sounds/musics/onceInALullaby.mp3");
    scene.load.audio("click", "/assets/sounds/sfx/click.mp3");
    scene.load.audio("climb", "/assets/sounds/sfx/climb.wav");
    scene.load.audio("hurt", "/assets/sounds/sfx/hurt.mp3");
    scene.load.audio("jump", "/assets/sounds/sfx/jump.wav");
    scene.load.audio("run", "/assets/sounds/sfx/step.mp3");
    scene.load.audio("teleport", "/assets/sounds/sfx/teleport.wav");
    scene.load.audio("landing", "/assets/sounds/sfx/landing.wav");
    scene.load.audio("attack", "/assets/sounds/sfx/attack.mp3");
}

class Level1 extends Phaser.Scene {
    constructor() {
        super("Level1");
        this.scaleMultiplier = 3.5;
        this.gameTick = 0;
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
        const scale = this.scaleMultiplier;
  this.bg1 = this.add.image(0, 0, "bgLayer1")
        .setOrigin(0)
        .setScrollFactor(0.5)
        .setDepth(-5)
        .setScale(scale);  // Added scale
    
    this.bg2 = this.add.image(0, 0, "bgLayer2")
        .setOrigin(0)
        .setScrollFactor(0.3)
        .setDepth(-2)
        .setScale(scale); 

        // Create map and tileset
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("Tileset", "dungeonTileset");

        // Create all layers with proper depth ordering
        const layers = {
            skyline: map.createLayer("skyline", tileset, 0, 0).setDepth(-3),
            backwalls: map.createLayer("backwalls", tileset, 0, 0).setDepth(0),
            walls: map.createLayer("walls", tileset, 0, 0).setDepth(1),
            deco: map.createLayer("deco", tileset, 0, 0).setDepth(2),
            collidables: map.createLayer("collidables", tileset, 0, 0).setDepth(3),
            outside: map.createLayer("outside", tileset, 0, 0).setDepth(4),
            outside2: map.createLayer("outside2", tileset, 0, 0).setDepth(5),
            layering: map.createLayer("layering", tileset, 0, 0).setDepth(10) 
        };

        this.outsideLayer = layers.outside;
        this.outside2Layer = layers.outside2; // Store reference to outside2
        // Scale all layers
        Object.values(layers).forEach(layer => {
            if (layer) layer.setScale(scale).setOrigin(0);
        });

        // Create object groups
         this.ladderGroup = this.physics.add.staticGroup();
    this.inoutGroup = this.physics.add.staticGroup();
    this.inout2Group = this.physics.add.staticGroup();

    // Get all interactive objects from the map
    const interactObjects = map.getObjectLayer("interact")?.objects || [];
    
    // Process each interactive object - MODIFIED SECTION
    interactObjects.forEach(obj => {
        const x = obj.x * scale;
        const y = obj.y * scale;
        const width = obj.width * scale;
        const height = obj.height * scale;
        
        // Create invisible physics bodies instead of sprites
        if (obj.type === "ladder") {
            const ladder = this.add.rectangle(x + width/2, y + height/2, width, height, 0x000000, 0);
            this.physics.add.existing(ladder, true);
            this.ladderGroup.add(ladder);
        } 
        else if (obj.type === "INOUT") {
            const inout = this.add.rectangle(x + width/2, y + height/2, width, height, 0x000000, 0);
            this.physics.add.existing(inout, true);
            this.inoutGroup.add(inout);
        }
        else if (obj.type === "INOUT2") {
            const inout2 = this.add.rectangle(x + width/2, y + height/2, width, height, 0x000000, 0);
            this.physics.add.existing(inout2, true);
            this.inout2Group.add(inout2);
        }
    });

        // Load and scale player
        loadPlayer(this);
        this.player.setScale(scale).setDepth(5);
        this.player.setPosition(100,1000); // Set initial position

        // Store ground collider reference
        this.groundCollider = this.physics.add.collider(this.player, layers.collidables);

        // Set up collisions
        if (layers.collidables) {
            layers.collidables.setCollisionByExclusion([-1]);
        }

        // Set world and camera bounds
        this.physics.world.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.startFollow(this.player);

        this.gameTick = 0;
    }

     update() {
        this.gameTick++;

        // Level2-style climbing detection
        if (this.physics.overlap(this.player, this.ladderGroup)) {
            this.player.canClimb = true;
        } else {
            this.player.canClimb = false;
            if (this.player.isClimbing) {
                this.player.isClimbing = false;
                this.groundCollider.active = true;
                this.player.body.setAllowGravity(true);
            }
        }

        // Check for INOUT interactions
        const touchingInout = this.physics.overlap(this.player, this.inoutGroup);
        const touchingInout2 = this.physics.overlap(this.player, this.inout2Group);

        // Toggle layer visibility
        if (touchingInout2) {
            // When touching INOUT2, hide outside and show outside2
            this.outsideLayer.setVisible(true);
            this.outside2Layer.setVisible(false);
        } else if (touchingInout) {
            // When touching INOUT (but not INOUT2), hide outside
            this.outsideLayer.setVisible(false);
            this.outside2Layer.setVisible(true);
        } else {
            // When not touching either, show outside and hide outside2
            this.outsideLayer.setVisible(true);
            this.outside2Layer.setVisible(true);
        }

        updatePlayerMovement(this);
        hitboxUpdater(this);
    }
}

export { Level1 };