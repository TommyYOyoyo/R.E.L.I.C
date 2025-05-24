import Phaser from "phaser";
import { loadPlayer, updatePlayer, hitboxUpdater } from "../player.js";
import PlayerUI from "../playerUI.js";

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    mapWidth: window.innerWidth * 5,
    mapHeight: window.innerHeight * 3,
};

function loadAssets(scene) {
    scene.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
    scene.load.image("dungeonTileset", "assets/img/Dungeon_Pack/Tileset.png");
    scene.load.image("bgLayer2", "assets/img/backgrounds/background_4/Plan_5.png");
    scene.load.tilemapTiledJSON("map", "assets/img/maps/l1_map.tmj");
    scene.load.spritesheet("playerSheet", "assets/img/Player/spritesheet.png", {
        frameWidth: 50,
        frameHeight: 37
    });

    // Sound assets
    scene.load.audio("wellDead", "/assets/sounds/musics/wellDead.mp3");
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
        this.latestCheckpoint;
        this.nextCheckpoint;
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
        this.physics.world.createDebugGraphic();
        this.playerUI = new PlayerUI(this);
    
        const scale = this.scaleMultiplier;
        this.bg2 = this.add.image(0, 0, "bgLayer2")
            .setOrigin(0)
            .setScrollFactor(0.001)
            .setDepth(-2)
            .setScale(scale); 

        const music = this.sound.add('wellDead', {
            loop: true,
            volume: 0.5,
        });
        music.play();

        // Create map and tileset
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("Tileset", "dungeonTileset");

        // Create all layers with proper depth ordering
        const layers = {
            skyline: map.createLayer("skyline", tileset, 0, 0).setDepth(1).setScrollFactor(0.2),
            backwalls: map.createLayer("backwalls", tileset, 0, 0).setDepth(3),
            backwalls2: map.createLayer("backwalls2", tileset, 0, 0).setDepth(2),
            collidables: map.createLayer("collidables", tileset, 0, 0).setDepth(7),
            arenaWalls: map.createLayer("arenaWalls", tileset, 0, 0).setDepth(6),
            walls: map.createLayer("walls", tileset, 0, 0).setDepth(8),
            deco: map.createLayer("deco", tileset, 0, 0).setDepth(4),
            door: map.createLayer("door", tileset, 0, 0).setDepth(10),
            outside: map.createLayer("outside", tileset, 0, 0).setDepth(13),
            outside2: map.createLayer("outside2", tileset, 0, 0).setDepth(14),
            layering: map.createLayer("layering", tileset, 0, 0).setDepth(15)
        }
        
        this.checkpoints = map.createFromObjects("interact", {
            type:"Checkpoint"
        });
        this.ladders = map.createFromObjects("interact", {
            type:"Ladder"
        });
        this.activateWalls = map.createFromObjects("interact", {
            type:"Activate"
        });

        this.spawnObjects(this.checkpoints);
        this.spawnObjects(this.ladders);
        this.spawnObjects(this.activateWalls);


        this.outsideLayer = layers.outside;
        this.outside2Layer = layers.outside2;
        this.walls1 = layers.backwalls2;
        this.walls2 = layers.arenaWalls;

        // Scale all layers
        Object.values(layers).forEach(layer => {
            if (layer) layer.setScale(scale).setOrigin(0);
        });

        // Create object groups
        this.climbableGroup = this.physics.add.staticGroup();
        this.inoutGroup = this.physics.add.staticGroup();
        this.inout2Group = this.physics.add.staticGroup();
        this.checkpointGroup = this.physics.add.staticGroup();
        this.activateWallsGroup = this.physics.add.staticGroup();

        this.addToGroup(this.checkpoints, this.checkpointGroup);
        this.addToGroup(this.ladders, this.climbableGroup);
        this.addToGroup(this.activateWalls, this.activateWallsGroup);

        this.walls1.setVisible(false);
this.walls2.setVisible(false);
this.walls1.setCollisionByExclusion([-1], false); // No collision for walls1
this.walls2.setCollisionByExclusion([-1], true);  // Enable collision tiles for walls2

        // Get all interactive objects from the map
        const interactObjects = map.getObjectLayer("interact")?.objects || [];
        
        // Process each interactive object
        interactObjects.forEach(obj => {
            const x = obj.x * scale;
            const y = obj.y * scale;
            const width = obj.width * scale;
            const height = obj.height * scale;
            
            if (obj.type === "INOUT") {
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

        // Initialize walls state
        // Initialize walls state

        // Load and scale player
        loadPlayer(this);
        this.player.setScale(scale).setDepth(11);
        
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
        if (this.physics.overlap(this.player, this.climbableGroup)) {
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

        // Handle activate walls
        const touchingActivateWalls = this.physics.overlap(this.player, this.activateWallsGroup);
if (touchingActivateWalls) {
    this.walls1.setVisible(true);
    this.walls2.setVisible(true);

    this.walls1.setCollisionByExclusion([-1], false);

    this.time.addEvent({
        delay: 50,
        callback: () => {
            if (!this.scene) return; // Safety check

            this.walls2.setCollisionByExclusion([-1], true);

            // Now safe to create collider if it doesn't exist
            if (!this.wallCollider) {
                this.wallCollider = this.physics.add.collider(this.player, this.walls2);
            }
        },
        callbackScope: this
    });
} else {
    this.walls1.setVisible(false);
    this.walls2.setVisible(false);
    this.walls2.setCollisionByExclusion([-1], false);

    // Destroy the collider if it exists
    if (this.wallCollider) {
        this.wallCollider.destroy();
        this.wallCollider = null;
    }
}
        

        updatePlayer(this);
        hitboxUpdater(this);
    }

    // Spawn all objects from tilemap, scale them and enable physics
    spawnObjects(objects) {
        objects.forEach(element => {
            element.setOrigin(0.5, 0.5);
            element.setPosition(element.x * this.scaleMultiplier, element.y * this.scaleMultiplier);
            this.physics.add.existing(element, true);
            element.body.setSize(element.body.width * this.scaleMultiplier, element.body.height * this.scaleMultiplier);
        });
    }

    // Add object to group
    addToGroup(objects, group) {
        objects.forEach(element => {
            group.add(element);
        });
        group.setVisible(false);
    }
}

export { Level1 };
