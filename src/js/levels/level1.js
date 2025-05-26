/**
 * Level 1 game file
 * @author Ray Lam 
 */

import Phaser from "phaser";
import { loadPlayer, updatePlayer, hitboxUpdater } from "../player.js";
import PlayerUI from "../playerUI.js";
import { loadEnemyAssets, spawnSkeleton, createSkeleton, updateSkeleton } from "../enemy.js";

//Load all assets  
function loadAssets(scene) {
    scene.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
    scene.load.image("dungeonTileset", "assets/img/Dungeon_Pack/Tileset.png");
    scene.load.image("bgLayer2", "assets/img/backgrounds/background_4/Plan_5.png");
    scene.load.tilemapTiledJSON("map", "assets/img/maps/l1_map.tmj");
    scene.load.spritesheet("playerSheet", "assets/img/Player/spritesheet.png", {
        frameWidth: 50,
        frameHeight: 37
    });

    scene.load.image("questKey", "/assets/img/interactKey.png");
    //Sounds
    scene.load.audio("wellDead", "/assets/sounds/musics/wellDead.mp3");
    scene.load.audio("click", "/assets/sounds/sfx/click.mp3");
    scene.load.audio("climb", "/assets/sounds/sfx/climb.wav");
    scene.load.audio("hurt", "/assets/sounds/sfx/hurt.mp3");
    scene.load.audio("jump", "/assets/sounds/sfx/jump.wav");
    scene.load.audio("run", "/assets/sounds/sfx/step.mp3");
    scene.load.audio("teleport", "/assets/sounds/sfx/teleport.wav");
    scene.load.audio("landing", "/assets/sounds/sfx/landing.wav");
    scene.load.audio("attack", "/assets/sounds/sfx/attack.mp3");

    loadEnemyAssets(scene);
}
//Game scene settings
class Level1 extends Phaser.Scene {
    constructor() {
        super("Level1");
        this.scaleMultiplier = 3.5;
        this.gameTick = 0;
        this.latestCheckpoint;
        this.nextCheckpoint;
        this.groundCollider;
        this.ground;
    }

    //Preload player movement
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
//Create everything  
    create() {
        this.physics.world.createDebugGraphic(); 
        this.playerUI = new PlayerUI(this);  //Create player UI
    
        const scale = this.scaleMultiplier;  //Scale multiplier
        this.bg2 = this.add.image(0, 0, "bgLayer2") //Create background
            .setOrigin(0)
            .setScrollFactor(0.0000000001) //make background manually larger
            .setDepth(-2) //background behind everything
            .setScale(scale); //scale multiplier

            //music
        const music = this.sound.add('wellDead', {
            loop: true,
            volume: 0.5,
        });
        music.play();

        //Create map and tileset
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("Tileset", "dungeonTileset");

        //Create all layers with proper depth
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
        this.ground = layers.collidables; //makes layer collidables collidable
        
        //object pull
        this.checkpoints = map.createFromObjects("interact", {
            type:"Checkpoint" //checkpoint
        });
        this.ladders = map.createFromObjects("interact", {
            type:"Ladder" //ladder
        });
        this.activateWalls = map.createFromObjects("interact", {
            type:"Activate" //activate walls
        });
        this.inout1 = map.createFromObjects("interact", {
            type:"INOUT" //inout
        });
        this.inout2 = map.createFromObjects("interact", {
            type:"INOUT2" //inout2
        });
         this.enemySpawns = map.createFromObjects("interact", {
            type: "EnemySpawn",
        });
        this.questSpawns = map.createFromObjects("Objects", {
            type: "Quest",
        });

        //object spawn
        this.spawnObjects(this.checkpoints);
        this.spawnObjects(this.ladders);
        this.spawnObjects(this.activateWalls);
        this.spawnObjects(this.inout1);
        this.spawnObjects(this.inout2);
        this.spawnObjects(this.enemySpawns);
        this.spawnObjects(this.questSpawns);
        
        //layer references
        this.outsideLayer = layers.outside;
        this.outside2Layer = layers.outside2;
        this.walls1 = layers.backwalls2;
        this.walls2 = layers.arenaWalls;

        //scale all layers
        Object.values(layers).forEach(layer => {
            if (layer) layer.setScale(scale).setOrigin(0);
        });

        //create object groups
        this.climbableGroup = this.physics.add.staticGroup();
        this.inoutGroup = this.physics.add.staticGroup();
        this.inout2Group = this.physics.add.staticGroup();
        this.checkpointGroup = this.physics.add.staticGroup();
        this.activateWallsGroup = this.physics.add.staticGroup();
        this.enemySpawnsGroup = this.physics.add.staticGroup();
        this.questSpawnsGroup = this.physics.add.staticGroup();
        
        //adding objects to groups
        this.addToGroup(this.checkpoints, this.checkpointGroup);
        this.addToGroup(this.ladders, this.climbableGroup);
        this.addToGroup(this.activateWalls, this.activateWallsGroup);
        this.addToGroup(this.inout1, this.inoutGroup);
        this.addToGroup(this.inout2, this.inout2Group);
        this.addToGroup(this.enemySpawns, this.enemySpawnsGroup);
        this.addToGroup(this.questSpawns, this.questSpawnsGroup);
        
        //preload walls
        this.walls1.setVisible(false);
        this.walls2.setVisible(false);
        this.walls1.setCollisionByExclusion([-1], false);
        this.walls2.setCollisionByExclusion([-1], true);


        //load and scale player
        loadPlayer(this);
        this.player.setScale(scale).setDepth(11);
        this.player.health = 100;
        this.playerUI.updateHealth(100);
        
        //ground collider reference
        this.groundCollider = this.physics.add.collider(this.player, layers.collidables);

        //setup camera and bounds
        this.physics.world.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.startFollow(this.player);
       
        createSkeleton(this, this.ground, 1, 350);

        this.gameTick = 0;
    }

//check for updates
    update() {
    this.gameTick++;

    //climb system
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

    //if touching
    const touchingInout = this.physics.overlap(this.player, this.inoutGroup);
    const touchingInout2 = this.physics.overlap(this.player, this.inout2Group);

    //toggling visibility
    if (touchingInout2) {
        this.outsideLayer.setVisible(true);
        this.outside2Layer.setVisible(false);
    } else if (touchingInout) {
        this.outsideLayer.setVisible(false);
        this.outside2Layer.setVisible(true);
    } else {
        this.outsideLayer.setVisible(true);
        this.outside2Layer.setVisible(true);
    }

    //if touching obj activateWalls
    const touchingActivateWalls = this.physics.overlap(this.player, this.activateWallsGroup);
    if (touchingActivateWalls) {
        this.walls1.setVisible(true); //show walls
        this.walls2.setVisible(true);
        this.walls1.setCollisionByExclusion([-1], false); //walls collidable
        this.time.addEvent({ //failsafe in case player gets stuck on walls
            delay: 50,
            callback: () => {
                if (!this.scene) return;
                this.walls2.setCollisionByExclusion([-1], true);
                if (!this.wallCollider) {
                    this.wallCollider = this.physics.add.collider(this.player, this.walls2);
                }
            }
        });
    } else {
        this.walls1.setVisible(false); //hide walls if player not touching activateWalls
        this.walls2.setVisible(false);
        this.walls2.setCollisionByExclusion([-1], false);
        if (this.wallCollider) {
            this.wallCollider.destroy();
            this.wallCollider = null;
        }
    }
//update player
    updatePlayer(this);
    hitboxUpdater(this);
    updateSkeleton(this)
}
//spawn objects with the scale multiplier
    spawnObjects(objects) {
        objects.forEach(element => {
            element.setOrigin(0.5, 0.5);
            element.setPosition(element.x * this.scaleMultiplier, element.y * this.scaleMultiplier);
            this.physics.add.existing(element, true);
            element.body.setSize(element.body.width * this.scaleMultiplier, element.body.height * this.scaleMultiplier);
        });
    }
//add objects to groups
    addToGroup(objects, group) {
        objects.forEach(element => {
            group.add(element);
        });
        group.setVisible(false);
    }
}

export { Level1 };