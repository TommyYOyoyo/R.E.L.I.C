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
    scene.load.spritesheet("skeletonAttack", "assets/enemySheet/Skeleton/Sprite Sheets/Skeleton Attack.png", {
        frameWidth: 43,
        frameHeight: 37
    });
    scene.load.spritesheet("skeletonWalk", "assets/enemySheet/Skeleton/Sprite Sheets/Skeleton Walk.png", {
        frameWidth: 22,
        frameHeight: 33
    });
    scene.load.spritesheet("skeletonDead", "assets/enemySheet/Skeleton/Sprite Sheets/Skeleton Dead.png", {
        frameWidth: 33,
        frameHeight: 32
    });
    scene.load.spritesheet("skeletonHit", "assets/enemySheet/Skeleton/Sprite Sheets/Skeleton Hit.png", {
        frameWidth: 30,
        frameHeight: 32
    });
    scene.load.spritesheet("skeletonIdle", "assets/enemySheet/Skeleton/Sprite Sheets/Skeleton Idle.png", {
        frameWidth: 24,
        frameHeight: 32
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
        this.walls1.setCollisionByExclusion([-1], false);
        this.walls2.setCollisionByExclusion([-1], true);

        // Process interactive objects
        const interactObjects = map.getObjectLayer("interact")?.objects || [];
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

        // Load and scale player
        loadPlayer(this);
        this.player.setScale(scale).setDepth(11);
        this.player.health = 5;
        this.playerUI.updateHealth(5);
        
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

        // Enemy setup
        this.enemies = this.physics.add.group();
        this.createSkeletonAnimations();
        this.spawnSkeleton(800, 500);
        this.physics.add.collider(this.enemies, layers.collidables);

        this.gameTick = 0;
    }

    createSkeletonAnimations() {
        this.anims.create({
            key: 'skeletonIdle',
            frames: this.anims.generateFrameNumbers('skeletonIdle', { start: 0, end: 10 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'skeletonWalk',
            frames: this.anims.generateFrameNumbers('skeletonWalk', { start: 0, end: 12 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'skeletonAttack',
            frames: this.anims.generateFrameNumbers('skeletonAttack', { start: 0, end: 17 }),
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: 'skeletonHit',
            frames: this.anims.generateFrameNumbers('skeletonHit', { start: 0, end: 7 }),
            frameRate: 5,
            repeat: 0
        });

        this.anims.create({
            key: 'skeletonDead',
            frames: this.anims.generateFrameNumbers('skeletonDead', { start: 0, end: 14 }),
            frameRate: 8,
            repeat: 0
        });
    }

    spawnSkeleton(x, y) {
        const skeleton = this.physics.add.sprite(x, y, 'skeletonIdle')
            .setScale(this.scaleMultiplier)
            .setDepth(11)
            .setSize(22, 30)
            .setOffset(0, 3);
        
        skeleton.health = 3;
        skeleton.attackRange = 50;
        skeleton.detectionRange = 200;
        skeleton.isAttacking = false;
        skeleton.isDead = false;
        skeleton.attackConnected = false;
        this.enemies.add(skeleton);
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
        this.outsideLayer.setVisible(true);
        this.outside2Layer.setVisible(false);
    } else if (touchingInout) {
        this.outsideLayer.setVisible(false);
        this.outside2Layer.setVisible(true);
    } else {
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
                if (!this.scene) return;
                this.walls2.setCollisionByExclusion([-1], true);
                if (!this.wallCollider) {
                    this.wallCollider = this.physics.add.collider(this.player, this.walls2);
                }
            }
        });
    } else {
        this.walls1.setVisible(false);
        this.walls2.setVisible(false);
        this.walls2.setCollisionByExclusion([-1], false);
        if (this.wallCollider) {
            this.wallCollider.destroy();
            this.wallCollider = null;
        }
    }

    // Update enemies
    this.enemies.getChildren().forEach(enemy => {
        if (!enemy || enemy.isDead) return;

        // Add null checks for animations
        const currentAnim = enemy.anims?.currentAnim;
        const currentFrame = enemy.anims?.currentFrame;

        // Add hit reaction
        if (currentAnim?.key === 'skeletonHit' && enemy.anims.isPlaying) {
            enemy.setVelocityX(0);
            return;
        }

        const dx = this.player.x - enemy.x;
        const distance = Math.abs(dx);
        const direction = dx > 0 ? 1 : -1;

        enemy.flipX = direction < 0;

        // Adjust hitbox based on current animation
        if (currentAnim) {
            if (currentAnim.key === 'skeletonAttack') {
                // Attack hitbox (wider and properly aligned)
                enemy.body.setSize(40, 28);
                enemy.body.setOffset(enemy.flipX ? 3 : -15, 2);
            }
            
            if (currentFrame && currentFrame.index >= 6 && currentFrame.index <= 12 && !enemy.attackConnected) {
                if (distance <= enemy.attackRange) {
                    this.player.health -= 1;
                    this.playerUI.updateHealth(this.player.health);
                    enemy.attackConnected = true;
                    
                    // Play hurt animation
                    if (this.player.health > 0) {
                        this.player.play('hurt', true);
                    } else {
                        this.player.play('death', true);
                    }
                }
            } else {
                // Default hitbox for idle/walk
                enemy.body.setSize(22, 30);
                enemy.body.setOffset(0, 3);
                enemy.attackConnected = false;
            }
        }

        if (distance < enemy.detectionRange) {
            if (distance > enemy.attackRange) {
                // Movement state
                enemy.setVelocityX(100 * direction);
                if (!enemy.anims.isPlaying || !currentAnim || currentAnim.key !== 'skeletonWalk') {
                    enemy.anims.play('skeletonWalk', true);
                }
                enemy.isAttacking = false;
            } else {
                // Attack state
                enemy.setVelocityX(0);
                if (!enemy.isAttacking) {
                    enemy.isAttacking = true;
                    enemy.attackConnected = false;
                    enemy.anims.play('skeletonAttack', true);
                    enemy.once('animationcomplete', () => {
                        enemy.isAttacking = false;
                        enemy.anims.play('skeletonIdle', true);
                    });
                }
            }
        } else {
            // Idle state
            enemy.setVelocityX(0);
            if (!enemy.anims.isPlaying || !currentAnim || currentAnim.key !== 'skeletonIdle') {
                enemy.anims.play('skeletonIdle', true);
            }
            enemy.isAttacking = false;
        }
    });

    updatePlayer(this);
    hitboxUpdater(this);
}

    spawnObjects(objects) {
        objects.forEach(element => {
            element.setOrigin(0.5, 0.5);
            element.setPosition(element.x * this.scaleMultiplier, element.y * this.scaleMultiplier);
            this.physics.add.existing(element, true);
            element.body.setSize(element.body.width * this.scaleMultiplier, element.body.height * this.scaleMultiplier);
        });
    }

    addToGroup(objects, group) {
        objects.forEach(element => {
            group.add(element);
        });
        group.setVisible(false);
    }
}

export { Level1 };