/**
 * Level 1 game file
 * @author Ray Lam 
 */

import Phaser from "phaser";
import Player from "../player.js";
import { loadEnemyAssets, spawnSkeleton, createSkeleton, updateSkeleton } from "../enemy.js";
import { loadCommonAssets, loadKeyboardKeys, spawnObjects, addToGroup } from "../levelLoader.js";

//Load level-specific assets  
function loadAssets(scene) {
    // Load common assets shared across all levels
    loadCommonAssets(scene);

    scene.load.image("dungeonTileset", "assets/img/Dungeon_Pack/Tileset-extruded.png");
    scene.load.image("bgLayer2", "assets/img/backgrounds/background_4/Plan_5.png");
    scene.load.tilemapTiledJSON("map", "assets/img/maps/l1_map.tmj");

    //Sounds
    scene.load.audio("wellDead", "/assets/sounds/musics/wellDead.mp3");

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
        this.skeletonsKilled = 0;
    }

    //Preload player movement
    preload() {
        loadAssets(this);
        // Load standard keyboard keys
        loadKeyboardKeys(this);
    }
//Create everything  
    create() {

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
            floor: map.createLayer("floor", tileset, 0, 0).setDepth(16),
            backwalls: map.createLayer("backwalls", tileset, 0, 0).setDepth(4),
            backwalls2: map.createLayer("backwalls2", tileset, 0, 0).setDepth(3),
            backwalls3: map.createLayer("backwalls3", tileset, 0, 0).setDepth(2),
            collidables: map.createLayer("collidables", tileset, 0, 0).setDepth(7),
            arenaWalls: map.createLayer("arenaWalls", tileset, 0, 0).setDepth(6),
            walls: map.createLayer("walls", tileset, 0, 0).setDepth(8),
            deco: map.createLayer("deco", tileset, 0, 0).setDepth(5),
            door: map.createLayer("door", tileset, 0, 0).setDepth(10),
            outside: map.createLayer("outside", tileset, 0, 0).setDepth(13),
            outside2: map.createLayer("outside2", tileset, 0, 0).setDepth(14),
            layering: map.createLayer("layering", tileset, 0, 0).setDepth(15)
        }
        
        this.ground = layers.floor; //makes layer collidables collidable
        
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
        this.questSpawns = map.createFromObjects("interact", {
            type: "Quest",
        });
        this.chestSpawns = map.createFromObjects("interact", {
            type: "TCChest",
        });
        this.level2 = map.createFromObjects("interact", {
            type: "Portal",
        });

        //object spawn (using level loader utility)
        spawnObjects(this.checkpoints, this.scaleMultiplier, this);
        spawnObjects(this.ladders, this.scaleMultiplier, this);
        spawnObjects(this.activateWalls, this.scaleMultiplier, this);
        spawnObjects(this.inout1, this.scaleMultiplier, this);
        spawnObjects(this.inout2, this.scaleMultiplier, this);
        spawnObjects(this.enemySpawns, this.scaleMultiplier, this);
        spawnObjects(this.questSpawns, this.scaleMultiplier, this);
        spawnObjects(this.chestSpawns, this.scaleMultiplier, this);
        spawnObjects(this.level2, this.scaleMultiplier, this);
        
        //layer references
        this.outsideLayer = layers.outside;
        this.outside2Layer = layers.outside2;
        this.walls1 = layers.backwalls2;
        this.walls3 = layers.backwalls3;
        this.walls2 = layers.arenaWalls;
        this.walls = layers.collidables

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
        this.interactablesGroup = this.physics.add.staticGroup();

        //adding objects to groups (using level loader utility)
        addToGroup(this.checkpoints, this.checkpointGroup);
        addToGroup(this.ladders, this.climbableGroup);
        addToGroup(this.activateWalls, this.activateWallsGroup);
        addToGroup(this.inout1, this.inoutGroup);
        addToGroup(this.inout2, this.inout2Group);
        addToGroup(this.enemySpawns, this.enemySpawnsGroup);
        addToGroup(this.questSpawns, this.questSpawnsGroup);
        addToGroup(this.chestSpawns, this.interactablesGroup);
        addToGroup(this.level2, this.interactablesGroup);

        
        //preload walls
        this.walls1.setVisible(false);
        this.walls3.setVisible(false);
        this.walls2.setVisible(false);
        this.walls1.setCollisionByExclusion([-1], false);
        this.walls3.setCollisionByExclusion([-1], false);
        this.walls2.setCollisionByExclusion([-1], true);
        this.walls.setCollisionByExclusion([-1], true);


        //load and scale player
        this.playerInstance = new Player(this);
        this.playerInstance.load();
        this.player.setScale(scale).setDepth(11);
        
        //ground collider reference
        this.groundCollider = this.physics.add.collider(this.player, layers.collidables);

        //setup camera and bounds
        this.physics.world.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.startFollow(this.player);
       
        this.events.on('skeletonKilled', () => {
            this.skeletonsKilled++;
            console.log(`Skeletons killed: ${this.skeletonsKilled}`);
        });
        createSkeleton(this, this.walls, 1, 350);

    }

//check for updates
    update() {
    updateSkeleton(this);
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

// Handle wall visibility and collisions
if (touchingActivateWalls && this.skeletonsKilled < 15) {
    //show walls
    [this.walls1, this.walls2, this.walls3].forEach(wall => {
        wall.setVisible(true);
    });
    
    //create collider if it doesn't exist
    if (!this.wallCollider) {
        this.wallCollider = this.physics.add.collider(this.player, this.walls2);
    }
    
    //problem where player collider is stuck in wall collider
    this.time.addEvent({
        delay: 50,
        callback: () => {
            if (this.scene) {
                this.walls2.setCollisionByExclusion([-1], true);
            }
        }
    });
} else {
    //hide walls and colliders
    [this.walls1, this.walls2, this.walls3].forEach(wall => {
        wall.setVisible(false);
        wall.setCollisionByExclusion([-1], false);
    });
    
    //remove it completely
    if (this.wallCollider) {
        this.wallCollider.destroy();
        this.wallCollider = null;
    }
}

if (this.skeletonsKilled > 14 && !this.hasShownText) {
    //screen size
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    //create the text
    this.territoireText = this.add.text(centerX, centerY - 40, 'TERRITOIRE PURIFIÉ', {
        fontFamily: 'noita',
        fontSize: '100px',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        padding: { left: 30, right: 30, top: 15, bottom: 15 }
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(100); 
    
    //remove after 3 seconds
    this.time.delayedCall(2000, () => {
        if (this.territoireText) {
            this.tweens.add({
                targets: this.territoireText,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    this.territoireText.destroy();
                    this.territoireText = null;
                    }
            });
        }
    });
    
    this.hasShownText = true;
}
    
//update player
    this.playerInstance.update();
    this.playerInstance.hitboxUpdater();
    updateSkeleton(this)
}
}


export { Level1 };