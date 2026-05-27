/**
 * @author Honglue Zheng, Ray Lam, Rui Qi Ren
 * 
 * @note Improvements from 2025:
 * - Refactored the entire player.js ino a Player class for easier implementation
 * - Patched player clipping abuse
 * - Improved player attack animation logic
 * - Added sloped tiles collider
 * - Improved death handling
 * -
 */

import { interactWithWeirdos } from "./puzzles/threeWeirdos.js";
import { echoing_chimes_puzzle } from "./puzzles/sequencer.js";
import { numberGuesser } from "./puzzles/numberGuesser.js";

import { runeSequenceLock } from "./puzzles/runeSequenceLock.js";
import { pressurePads } from "./puzzles/pressurePads.js";
import { sudoku } from "./puzzles/sudoku.js";
import { slidingTiles } from "./puzzles/slidingTiles.js";

import { diary } from "./puzzles/diary.js";
import { shutdown } from "./utils.js";
import { bossTakeDamage } from "./knightBoss.js";
import PlayerUI from "./playerUI.js";

export default class Player {
    constructor(scene) {
        this.scene = scene;
    }

    // Load/spawn the player and set up all properties
    load() {
        const scene = this.scene;

        scene.latestCheckpoint;
        scene.level = JSON.parse(localStorage.getItem("lastGame")).level;
        scene.nextCheckpoint;
        const fetchedCheckpoint = JSON.parse(
            localStorage.getItem("lastGame"),
        ).checkpoint;
        // Set fetched checkpoints
        if (fetchedCheckpoint == 0) {
            scene.latestCheckpoint = scene.checkpoints[0]; // Default spawnpoint
            if (scene.checkpoints.length > 1) {
                scene.nextCheckpoint = scene.checkpoints[1]; // Grab next checkpoint only if it exists
            } else {
                scene.nextCheckpoint = scene.checkpoints[0]; // No more checkpoints
            }
        } else {
            scene.latestCheckpoint = fetchedCheckpoint;
            const fetchedCheckpointIndex = fetchedCheckpoint.name.substr(
                fetchedCheckpoint.name.length - 1,
            );
            if (fetchedCheckpointIndex == scene.checkpoints.length - 1) {
                scene.nextCheckpoint =
                    scene.checkpoints[scene.checkpoints.length - 1]; // No more checkpoints
            } else {
                scene.nextCheckpoint =
                    scene.checkpoints[parseInt(fetchedCheckpointIndex) + 1];
            }
        }
        // Spawn player at latest checkpoint
        let spawnX = scene.latestCheckpoint.x;
        let spawnY = scene.latestCheckpoint.y - 10;
        // LOAD/SPAWN PLAYER
        scene.player = scene.physics.add.sprite(spawnX, spawnY, "playerSheet");
        // Create playeranimation
        this.createAnimation();
        // Set player properties
        scene.player.direction = 1;
        scene.player.direction = 1; // Set player direction (0 = left, 1 = right)
        scene.player.disabledCrouch = false;
        scene.player.isSliding = false;
        scene.player.slideLocked = false;
        scene.player.isAttacking = false;
        scene.player.canClimb = false;
        scene.player.isClimbing = false;
        scene.player.wasFalling = false;
        scene.player.isCrouching = false;
        scene.player.isJumping = false;
        scene.player.isNearInteract = false;
        scene.player.isInteractActive = false;
        scene.player.isInteractOpen = false;
        scene.player.isHurting = false;
        scene.player.canMove = true;
        scene.player.isImmune = false;
        scene.player.currentInteractable;
        scene.player.attackCooldown = 0;
        scene.player.attackDirection = scene.player.direction;
        scene.player.hitboxWidth = 15;
        scene.player.hitboxHeight = 32;
        scene.player.hitboxOffsetX = 18;
        scene.player.hitboxOffsetY = 4;
        scene.player.crouchHitboxWidth = 15;
        scene.player.crouchHitboxHeight = 15;
        scene.player.crouchHitboxOffsetX = 20;
        scene.player.crouchHitboxOffsetY = 20;
        scene.player.fragmentsCount = 0;
        scene.player.health = 10;
        scene.player.maxHealth = 10;
        scene.player.deathPlayed = false; // Death animation override flag
        scene.gameOverQueued = false;
        scene.player
            .setScale(3)
            .setSize(scene.player.hitboxWidth, scene.player.hitboxHeight)
            .setOffset(scene.player.hitboxOffsetX, scene.player.hitboxOffsetY);
        // Set player collision detection
        scene.player.setCollideWorldBounds(true);
        // Enable floor/wall collision detection, dealt by Phaser game engine
        scene.groundCollider = scene.physics.add.collider(
            scene.player,
            scene.ground,
        );
        scene.ground.setCollisionByExclusion(-1);
        // Player gravity
        scene.player.body.setGravityY(1000);
        // Create player attack hitbox
        this.createAttackHitbox();
        scene.player.body.setMaxSpeed(950); // Cap velocity to prevent going through blocks
        // Fragments count
        localStorage.getItem(`${scene.level}.fragments`) == null
            ? (scene.player.fragmentsCount = 0)
            : (scene.player.fragmentsCount = localStorage.getItem(
                  `${scene.level}.fragments`,
              ));

        // Claimed fragments
        scene.player.claimedFragments = [];
        const fetchedFragments = JSON.parse(
            localStorage.getItem(`${scene.level}.claimedFragments`),
        );

        if (fetchedFragments == null) {
            scene.player.claimedFragments = []; // New game
        } else {
            scene.player.claimedFragments = fetchedFragments;

            fetchedFragments.forEach((fragment) => {
                if (fragment == 0) return;
                // Destroy any existing claimed fragments
                scene.fragments.forEach((existingFragment) => {
                    if (fragment.name == existingFragment.name) {
                        existingFragment.destroy();
                    }
                });
            });
        }

        // Reset player isAttacking property when attack animations finish or get interrupted
        scene.player.on("animationcomplete", (anim) => {
            if (anim.key === "attack" || anim.key === "airAttack") {
                scene.player.isAttacking = false; // Reset when attack anims finish naturally
            }
        });
        scene.player.on("animationstop", (anim) => {
            if (anim.key === "attack" || anim.key === "airAttack") {
                scene.player.isAttacking = false; // Reset if attack anims are interrupted by other anims
            }
        });
        scene.player.on("animationstop", (anim) => {
            if (anim.key === "slide") {
                scene.player.isSliding = false; // Reset if sliding anims are interrupted by other anims
                scene.player.slideLocked = false;
            }
        });
        scene.player.on("animationcomplete", (anim) => {
            if (anim.key === "hurt") {
                scene.player.isHurting = false; // Reset if hurting anims finished naturally
                scene.player.isImmune = false; // Reset immunity frame
            }
        });
        scene.player.on("animationstop", (anim) => {
            if (anim.key === "hurt") {
                scene.player.isHurting = false; // Reset if hurting anims are interrupted by other anims
                scene.player.isImmune = false; // Reset immunity frame
            }
        });

        // Create interact notification text
        // Resizable div
        scene.player.interactNotifContainer = scene.rexUI.add.sizer({
            orientation: 0,
            space: { item: 10 },
            anchor: { centerX: "50%", centerY: "50%" },
            x: 0,
            y: 0,
        });
        // Show player that they should press the F key
        const keyPopup = scene.add
            .image(0, 0, "questKey")
            .setOrigin(0.5, 0.5)
            .setScale(0.125);
        // "Interact" text warning
        const notif = scene.add
            .text(0, 0, "Intéragir", {
                fontSize: "16px",
                fontFamily: "minecraft",
                color: "white",
            })
            .setOrigin(0.5, 0.5);

        // Ensure texts always stay on top of all other objects
        keyPopup.setDepth(100);
        notif.setDepth(100);

        // Add texts to interact notification container
        scene.player.interactNotifContainer.add(keyPopup).add(notif).layout();

        // Add quest detection
        scene.physics.add.overlap(
            scene.player,
            scene.questSpawnsGroup,
            (player, quest) => {
                scene.player.isNearInteract = true;
                if (!scene.player.isInteractActive)
                    scene.player.interactNotifContainer.setVisible(true);
                scene.player.currentInteractable = quest;
                scene.player.currentInteractable.class = "quest";
            },
        );

        // Add interactables detection
        if (typeof scene.interactablesGroup !== "undefined") {
            scene.physics.add.overlap(
                scene.player,
                scene.interactablesGroup,
                (player, interactable) => {
                    scene.player.isNearInteract = true;
                    if (!scene.player.isInteractActive)
                        scene.player.interactNotifContainer.setVisible(true);
                    scene.player.currentInteractable = interactable;
                    scene.player.currentInteractable.class = "interactable";
                },
            );
        }

        scene.playerUI = new PlayerUI(scene); // Create player UI
        scene.playerUI.updateFragmentCount(scene.player.fragmentsCount);
    }

    // Function to create animations for the player
    createAnimation() {
        const scene = this.scene;

        // Idle animation
        scene.anims.create({
            key: "idle",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [112, 113, 114, 115],
            }),
            frameRate: 10,
            repeat: -1,
        });
        // Run animation
        scene.anims.create({
            key: "run",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [147, 148, 149, 150, 151, 152],
            }),
            frameRate: 10,
            repeat: -1,
        });
        // Jump animation
        scene.anims.create({
            key: "jump",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [133, 134, 135, 136],
            }),
            frameRate: 10,
            repeat: 0,
        });
        // Fall animation
        scene.anims.create({
            key: "fall",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [98, 99],
            }),
            frameRate: 10,
            repeat: -1,
        });
        // Draw sword animation
        scene.anims.create({
            key: "drawSword",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [175, 176, 177, 178],
            }),
            frameRate: 20,
            repeat: 0,
        });
        // Sheathe sword animation
        scene.anims.create({
            key: "sheatheSword",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [182, 183, 184, 185],
            }),
            frameRate: 20,
            repeat: 0,
        });
        // Attack animation
        scene.anims.create({
            key: "attack",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [28, 29, 30, 31, 32],
            }),
            frameRate: 10,
            repeat: 0,
        });
        // Hurt animation
        scene.anims.create({
            key: "hurt",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [105, 106, 107],
            }),
            frameRate: 5,
            repeat: 0,
            interruptible: false,
        });
        // Death animation
        scene.anims.create({
            key: "death",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [91, 92, 93, 94, 95, 96, 97],
            }),
            frameRate: 10,
            repeat: 0,
        });
        // Slide animation
        scene.anims.create({
            key: "slide",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [168, 169, 170],
            }),
            frameRate: 10,
            repeat: 0,
        });
        // Climb animation
        scene.anims.create({
            key: "climb",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [140, 141, 142, 143],
            }),
            frameRate: 10,
            repeat: -1,
        });
        // Crouch animation
        scene.anims.create({
            key: "crouch",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [84, 85, 86, 87],
            }),
            frameRate: 10,
            repeat: -1,
        });
        // Air attack animation
        scene.anims.create({
            key: "airAttack",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                frames: [7, 8, 9, 10],
            }),
            frameRate: 10,
            repeat: 0,
        });
    }

    // Player movement updator
    update() {
        const scene = this.scene;

        //console.log(scene.player.x, scene.player.y);

        scene.playerUI.drawHealthBar();

        // Player is dead
        if (scene.player.isDead && !scene.isPaused) {
            if (scene.gameOverQueued) return;
            scene.gameOverQueued = true;

            // Zero velocity
            if (scene.player.body) {
                scene.player.body.setVelocity(0, 0);
                scene.player.body.setAcceleration(0, 0);
            }
            // Ensure death animation always overrides other animations once
            if (!scene.player.deathPlayed) {
                scene.player.deathPlayed = true;
                // Stop any current animations
                if (scene.player.anims) scene.player.anims.stop();
                // Play death animation (force)
                scene.player.anims.play("death");
            }
            setTimeout(() => {
                this.gameOver();
            }, 500);
            return;
        }

        // Checkpoint updater
        this.updateCheckpoint();

        // Player disable isJumping property if on ground
        if (scene.player.body.onFloor()) scene.player.isJumping = false;

        // Player disable crouch hitbox if not sliding nor crouching, or is in the air while trying to crouch/slide
        // To prevent crouch+jump thru wall glitch abuse
        if (scene.player.slideLocked) {
            if (this.canStandUp()) {
                scene.player.slideLocked = false;
                scene.player.isSliding = false;
            } else {
                scene.player.isSliding = true;
            }
        }
        if (
            (!scene.player.isCrouching && !scene.player.isSliding) ||
            (scene.player.isJumping && scene.player.isCrouching)
        ) {
            scene.player
                .setScale(3)
                .setSize(scene.player.hitboxWidth, scene.player.hitboxHeight)
                .setOffset(scene.player.hitboxOffsetX, scene.player.hitboxOffsetY); // Reset player hitbox
        }

        // Check if player overlaps with the climbable objects (ladders/vines) (enable climbing), or else disable player climbing
        if (scene.physics.overlap(scene.player, scene.climbableGroup)) {
            scene.player.canClimb = true;
        } else {
            scene.player.canClimb = false;
        }

        // Player attack cooldown countdown
        if (scene.player.attackCooldown > 0) --scene.player.attackCooldown;

        // Landing sound mechanism
        if (scene.player.wasFalling && scene.player.body.onFloor())
            scene.sound.play("landing");
        if (scene.player.body.velocity.y > 0) {
            scene.player.wasFalling = true;
        } else {
            scene.player.wasFalling = false;
        }

        // Reenable crouch
        if (scene.keys.s.isUp) scene.disableCrouch = false;

        scene.player.interactNotifContainer.setPosition(
            scene.player.x + 100,
            scene.player.y,
        );

        // Untrigger if player is not near interactable
        if (!scene.physics.overlap(scene.player, scene.questSpawnsGroup)) {
            // Optional interactables
            if (typeof scene.interactablesGroup !== "undefined") {
                if (
                    !scene.physics.overlap(scene.player, scene.interactablesGroup)
                ) {
                    scene.player.isNearInteract = false; // Untrigger if player is not near interactable
                    scene.player.currentInteractable = null;
                }
            } else {
                scene.player.isNearInteract = false; // Untrigger if player is not near interactable
                scene.player.currentInteractable = null;
            }
        }
        // Unshow interact warning
        if (
            !scene.physics.overlap(scene.player, scene.questSpawnsGroup) ||
            scene.player.isInteractActive
        ) {
            // Optional interactables
            if (typeof scene.interactablesGroup !== "undefined") {
                if (
                    !scene.physics.overlap(scene.player, scene.interactablesGroup)
                ) {
                    scene.player.interactNotifContainer.setVisible(false); // Unshow interact warning
                }
            } else {
                scene.player.interactNotifContainer.setVisible(false); // Unshow interact warning
            }
        }

        // MOVEMENTS TRIGGERS BELOW ----------------------------------------------------------
        if (!scene.player.canMove) return; // Player cannot move nor interact

        // Only allow horizontal movement if sliding is locked
        if (scene.player.slideLocked) {
            if (scene.keys.a.isDown) {
                this.moveLeft();
            } else if (scene.keys.d.isDown) {
                this.moveRight();
            } else {
                scene.player.setVelocityX(0);
            }

            if (!scene.player.isSliding) {
                scene.player.isSliding = true;
            }

            return;
        }

        // Move left
        if (scene.keys.a.isDown) {
            this.moveLeft();
            // Move right
        } else if (scene.keys.d.isDown) {
            this.moveRight();
            // Stop x-axis movement and put player in idle
        } else {
            this.idle();
        }

        // Fall
        if (
            !scene.player.body.onFloor() &&
            scene.player.body.velocity.y > 0 &&
            !scene.player.isSliding &&
            !scene.player.isAttacking &&
            !scene.player.isClimbing &&
            !scene.player.isHurting
        ) {
            this.fall();
        }

        // Crouch
        if (
            scene.keys.s.isDown &&
            !scene.disableCrouch &&
            !scene.player.isAttacking &&
            !scene.player.isHurting
        ) {
            this.crouch();
        } else {
            scene.player.isCrouching = false; // Disable user isCrouching property for appropriate hitbox management
        }

        // Climbing/jumping logics
        if (scene.player.isClimbing) {
            this.climb();
        } else {
            // Regular jump/fall logic
            if (scene.keys.w.isDown && scene.player.body.onFloor()) {
                this.jump();
            }
        }

        // Enter climbing state
        if (
            scene.player.canClimb &&
            (scene.keys.w.isDown || scene.keys.s.isDown) &&
            !scene.player.isClimbing
        ) {
            // Cancel climbing if any non-climbing input detected
            const hasHorizontalInput = scene.keys.a.isDown || scene.keys.d.isDown;
            const hasAttackInput = scene.keys.space.isDown;
            const hasConflictingInput = hasHorizontalInput || hasAttackInput;

            if (!hasConflictingInput) {
                this.enterClimb(); // Enter climbing state if no conflicting input detected
            } else {
                this.exitClimb(false); // Voluntary exit, no impulse
            }
        }

        // Attack
        if (scene.keys.space.isDown) {
            this.attack();
        }

        if (scene.keys.f.isDown) {
            if (scene.player.isNearInteract && !scene.player.isInteractActive) {
                scene.player.isInteractActive = true;
                scene.player.currentInteractable.class == "quest"
                    ? this.runQuest()
                    : this.runInteractable(); // Run quest or interactable accordingly
            }
        }
    }

    // Function to update player direction
    updateDirection(direction) {
        const scene = this.scene;

        if (scene.player.isAttacking) return;

        // Don't flip sprites if player is facing right
        if (direction == 1) {
            scene.player.direction = 1;
            scene.player.setFlipX(false);
            return;
        }

        // Flip if player is facing left
        scene.player.direction = 0;
        scene.player.setFlipX(true);
    }

    // Functions to initiate and end player sliding appropriately
    startSlide() {
        const scene = this.scene;

        scene.player.isSliding = true;
        scene.player.slideLocked = false;
        scene.player
            .setScale(3)
            .setSize(
                scene.player.crouchHitboxWidth,
                scene.player.crouchHitboxHeight,
            )
            .setOffset(
                scene.player.crouchHitboxOffsetX,
                scene.player.crouchHitboxOffsetY,
            ); // Shrink player hitbox
        scene.player.play("slide", true); // Play slide animation
        scene.sound.play("jump"); // Play jump sound effect
        // Reset after 500ms
        setTimeout(() => {
            this.endSlide();
        }, 500);
    }

    endSlide() {
        const scene = this.scene;

        scene.disableCrouch = true; // Disable crouching until key release to prevent abuse (clipping)
        if (!this.canStandUp()) {
            scene.player.isSliding = true;
            scene.player.slideLocked = true;
            scene.player.play("slide", true);
            return;
        }

        scene.player.slideLocked = false;
        scene.player.isSliding = false; // Reset sliding flag
        // Resume appropriate animation
        if (scene.player.body.velocity.x > 0) {
            scene.player.play("run", true);
        } else if (scene.player.body.velocity.y < 0) {
            scene.player.play("jump", true);
        } else {
            scene.player.play("idle", true);
        }
    }

    // Function to create an attack hitbox
    createAttackHitbox() {
        const scene = this.scene;

        // Create attack hitbox
        scene.attackHitbox = scene.add.rectangle(
            0,
            0,
            175, // width
            120, // height
            0x000000, // color (red for visualization)
            0, // alpha (for debugging)
        );

        // Add physics to hitbox
        scene.physics.add.existing(scene.attackHitbox);
        scene.attackHitbox.body.setAllowGravity(false);

        /* 
        // PC DESTROYER 3000 BEAM, DO NOT COMMENT OUT UNLESS...
        scene.attackHitbox.body.setVelocityX(scene.player.body.velocity.x);
        scene.attackHitbox.body.setVelocityY(scene.player.body.velocity.y);
        */
    }

    // Function to update the attack hitbox position
    hitboxUpdater() {
        const scene = this.scene;

        // Update player attack hitbox
        scene.attackHitbox.body.y = scene.player.body.y - 20;

        // Choose facing: lock to attackDirection while attacking
        const facing = scene.player.isAttacking ? scene.player.attackDirection : scene.player.direction;

        // Change player's hitbox according to facing
        if (facing == 1) {
            scene.attackHitbox.body.x = scene.player.x - scene.player.width / 2 - 25;
        } else {
            scene.attackHitbox.body.x = scene.player.x - 145 + scene.player.width / 2;
        }
    }

    // Check whether the player can safely expand back to the standing hitbox
    canStandUp() {
        const scene = this.scene;
        const body = scene.player.body;
        // Collision layers 
        const collisionLayers = Array.isArray(scene.playerCollisionLayers)
            ? scene.playerCollisionLayers.filter(Boolean)
            : (scene.ground ? [scene.ground] : []);

        // If no collision layers or no player physics body, return true
        if (!body || collisionLayers.length === 0) return true;

        const standingX = body.x + (scene.player.hitboxOffsetX - scene.player.crouchHitboxOffsetX);
        const standingY = body.y + (scene.player.hitboxOffsetY - scene.player.crouchHitboxOffsetY);

        // Check if player is standing up
        return !collisionLayers.some((layer) => {
            if (!layer?.getTilesWithinWorldXY) return false;

            const tiles = layer.getTilesWithinWorldXY(
                standingX,
                standingY,
                scene.player.hitboxWidth,
                scene.player.hitboxHeight,
            );

            return tiles.some((tile) => tile && tile.collides);
        });
    }

    // Functions to initiate and end player attacking appropriately
    attack() {
        const scene = this.scene;

        // Player's attack cooldown is over
        if (scene.player.attackCooldown == 0) {
            // Prevent other animations from overriding
            scene.player.isAttacking = true;
            scene.player.attackDirection = scene.player.direction;
            scene.player.setFlipX(scene.player.attackDirection == 0);

            // Set player attack cooldown
            scene.player.attackCooldown = 50;

            // Play attack sound
            scene.sound.play("attack", {
                volume: 0.5,
            });

            // Add enemy damage detection
            scene.physics.overlap(
                scene.attackHitbox,
                scene.enemies,
                (hitbox, enemy) => {
                    if (!enemy.isDead) {
                        enemy.health -= 1;
                        enemy.play("skeletonHit", true);

                        // Enemy has been killed
                        if (enemy.health <= 0) {
                            enemy.isDead = true;
                            enemy.play("skeletonDead", true);
                            enemy.body.enable = false;
                            enemy.attackHitbox.destroy();
                            scene.events.emit("skeletonKilled");
                            scene.time.delayedCall(1000, () => enemy.destroy());
                        }
                    }
                },
            );
            
            if (scene.boss && !scene.boss.isDead) {
                // Only damage boss if attack hitbox overlaps boss's physics body
                if (scene.physics.overlap(scene.attackHitbox, scene.boss)) {
                    const isBehind = (scene.boss.flipX && scene.player.x > scene.boss.x) ||
                        (!scene.boss.flipX && scene.player.x < scene.boss.x);
                    bossTakeDamage(scene.boss, scene, 1, isBehind);
                }
            }

            // Ground attack
            if (scene.player.body.onFloor()) {
                scene.player.play("attack", true);
                    // Air attack
            } else {
                scene.player.play("airAttack", true);
            }
        }
    }

    // Player move left functions
    moveLeft() {
        const scene = this.scene;

        this.updateDirection(0);
        scene.player.setVelocityX(-300);
        if (
            scene.player.body.onFloor() &&
            !scene.player.isSliding &&
            !scene.player.isAttacking &&
            !scene.player.isHurting
        ) {
            scene.player.play("run", true);
            if (scene.gameTick % 30 == 0) scene.sound.play("run"); // Play run sound effect
        }
    }

    // Player move right function
    moveRight() {
        const scene = this.scene;

        this.updateDirection(1);
        scene.player.setVelocityX(300);
        if (
            scene.player.body.onFloor() &&
            !scene.player.isSliding &&
            !scene.player.isAttacking &&
            !scene.player.isHurting
        ) {
            scene.player.play("run", true);
            if (scene.gameTick % 30 == 0) scene.sound.play("run"); // Play run sound effect
        }
    }

    // Player idle function
    idle() {
        const scene = this.scene;

        scene.player.setVelocityX(0);
        if (
            scene.player.body.onFloor() &&
            !scene.player.isSliding &&
            !scene.player.isAttacking &&
            !scene.player.isHurting
        ) {
            scene.player.play("idle", true);
        }
    }

    // Player jump function
    jump() {
        const scene = this.scene;

        // Prevent player from clipping through walls
        if (scene.player.slideLocked || (scene.player.isSliding && !this.canStandUp())) {
            scene.player.isJumping = false;
            return;
        }

        scene.player.isJumping = true;
        if (
            scene.player.body.onFloor() &&
            !scene.player.isAttacking &&
            !scene.player.isHurting
        ) {
            scene.player.play("jump", true);
            scene.sound.play("jump"); // Play jump sound effect
        }
        scene.player.setVelocityY(-600);
    }

    // Player fall function
    fall() {
        const scene = this.scene;

        scene.player.play("fall", true);
    }

    // Player crouch function
    crouch() {
        const scene = this.scene;

        // Player is moving
        if (
            !scene.player.isSliding &&
            scene.player.body.velocity.x != 0 &&
            scene.player.body.onFloor()
        ) {
            this.startSlide();
            // Player is not moving
        } else if (
            scene.player.body.velocity.x == 0 &&
            scene.player.body.onFloor()
        ) {
            scene.player.play("crouch", true);
            scene.player
                .setScale(3)
                .setSize(
                    scene.player.crouchHitboxWidth,
                    scene.player.crouchHitboxHeight,
                )
                .setOffset(
                    scene.player.crouchHitboxOffsetX,
                    scene.player.crouchHitboxOffsetY,
                ); // Shrink player hitbox
            scene.player.isCrouching = true;
        }
    }

    // Player enter climbing function
    enterClimb() {
        const scene = this.scene;

        scene.groundCollider.active = false;
        scene.player.isClimbing = true;
        scene.player.body.setAllowGravity(false);
        scene.player.setVelocityY(0);
        scene.player.setVelocityX(0);
        scene.player.play("climb", true);
    }

    // Player exit climbing function
    exitClimb(impulse) {
        const scene = this.scene;

        scene.groundCollider.active = true;
        scene.player.body.setAllowGravity(true);
        scene.player.isClimbing = false;
        scene.player.canClimb = false;

        // Apply small vertical impulse when exiting
        if (impulse) this.jump();

        // Transition to appropriate animation
        if (!scene.player.body.onFloor()) {
            scene.player.play("jump", true);
        }
    }

    // Function that deals with player climbing
    climb() {
        const scene = this.scene;

        // Horizontal movement/attack cancels climbing
        // End of ladder/vine also cancels climbing
        if (
            !scene.player.canClimb ||
            scene.keys.a.isDown ||
            scene.keys.d.isDown ||
            scene.keys.space.isDown
        ) {
            if (!scene.player.canClimb) {
                if (scene.player.body.velocity.y < 0) {
                    this.exitClimb(true); // Player has reached the end of vine/ladder while climbing, exit with impulse
                } else {
                    this.exitClimb(false); // Player has reached the end of vine/ladder while descending, exit without impulse
                }
            } else {
                this.exitClimb(false); // Voluntary exit, no impulse
            }
        } else {
            if (scene.keys.w.isDown) {
                if (scene.gameTick % 15 == 0) scene.sound.play("climb"); // Play climbing sound effect
                scene.player.setVelocityY(-150); // Climb up
                scene.player.play("climb", true);
            } else if (scene.keys.s.isDown) {
                if (scene.gameTick % 20 == 0) scene.sound.play("climb"); // Play climbing sound effect
                scene.player.setVelocityY(100); // Climb down
                scene.player.play("climb", true);
            } else {
                scene.player.setVelocityY(0);
                scene.player.play("climb", true).stop(); // Idle on ladder/vine
            }
        }
    }

    // Function to update latest checkpoint
    updateCheckpoint() {
        const scene = this.scene;

        // Safety checks
        if (!scene.nextCheckpoint || !scene.latestCheckpoint)
            console.log("[WARNING] No checkpoints found.");

        if (scene.nextCheckpoint.name == scene.latestCheckpoint.name) return; // No new checkpoint, ignore

        // Check if player is within 20 pixels of the checkpoint (X and Y)
        const isNearX = Math.abs(scene.player.x - scene.nextCheckpoint.x) <= 50;
        const isNearY = Math.abs(scene.player.y - scene.nextCheckpoint.y) <= 50;

        if (isNearX && isNearY) {
            console.log("New checkpoint");

            // Create checkpoint warning
            const checkpointText = scene.add
                .text(
                    scene.cameras.main.centerX, // X: Center of screen
                    scene.cameras.main.centerY - 50, // Y: Slightly above center
                    "CHECKPOINT ENREGISTRÉ",
                    {
                        fontFamily: "noita",
                        fontSize: "100px",
                        color: "#ffffff",
                        backgroundColor: "rgba(0, 0, 0, 0)",
                        padding: { left: 30, right: 30, top: 15, bottom: 15 },
                    },
                )
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(101);
            scene.tweens.add({
                targets: checkpointText,
                alpha: 0,
                duration: 1000,
                delay: 2000,
                onComplete: () => {
                    checkpointText.destroy(); // Remove text after fade
                },
            });

            const nextCheckpointIndex = scene.checkpoints.indexOf(scene.nextCheckpoint) + 1;
            scene.latestCheckpoint = scene.nextCheckpoint;
            // Set new latest checkpoint in localStorage
            localStorage.setItem(
                "lastGame",
                JSON.stringify({
                    level: JSON.parse(localStorage.getItem("lastGame")).level,
                    checkpoint: scene.latestCheckpoint,
                }),
            );
            // Set new next checkpoint
            if (nextCheckpointIndex < scene.checkpoints.length) {
                scene.nextCheckpoint = scene.checkpoints[nextCheckpointIndex];
            } else {
                return; // No next checkpoint
            }
        }
    }

    // Function to detect and run quests or open fragment chests
    runQuest() {
        const scene = this.scene;

        // If player spammed the F key and kept opening the quest, ignore
        if (scene.player.isInteractOpen) return;
        scene.player.isInteractOpen = true;

        const div = document.getElementById("puzzleDiv");

        setTimeout(() => {
            scene.input.keyboard.enabled = false; // Disable keyboard input after a certain delay to prevent glitch
        }, 200);

        switch (true) {
            case scene.player.currentInteractable.name.startsWith("threeweirdos"):
                interactWithWeirdos(scene);
                break;
            case scene.player.currentInteractable.name.startsWith("sequencer"):
                div.style.display = "block";
                // Timeout to prevent ghost key hold glitch
                setTimeout(() => {
                    echoing_chimes_puzzle(div, scene);
                    scene.children.bringToTop(div);
                }, 200);
                break;
            case scene.player.currentInteractable.name.startsWith("numberGuesser"):
                div.style.display = "block";
                // Timeout to prevent ghost key hold glitch
                setTimeout(() => {
                    numberGuesser(div, scene);
                    scene.children.bringToTop(div);
                }, 200);
                break;

            case scene.player.currentInteractable.name.startsWith(
                "RuneSequenceLock",
            ):
                div.style.display = "block";
                setTimeout(() => {
                    runeSequenceLock(div, scene);
                    scene.children.bringToTop(div);
                }, 200);
                break;

            case scene.player.currentInteractable.name.startsWith("PressurePads"):
                div.style.display = "block";
                setTimeout(() => {
                    pressurePads(div, scene);
                    scene.children.bringToTop(div);
                }, 200);
                break;

            case scene.player.currentInteractable.name.startsWith("Sudoku"):
                div.style.display = "block";
                setTimeout(() => {
                    sudoku(div, scene);
                    scene.children.bringToTop(div);
                }, 200);
                break;

            case scene.player.currentInteractable.name.startsWith("SlidingTiles"):
                div.style.display = "block";
                setTimeout(() => {
                    slidingTiles(div, scene);
                    scene.children.bringToTop(div);
                }, 200);
                break;

            case scene.player.currentInteractable.name.startsWith("diary"):
                div.style.display = "block";
                setTimeout(() => {
                    diary(div, scene);
                    scene.children.bringToTop(div);
                }, 200);
                break;

            default:
                break;
        }
    }

    // Function to trigger interactable
    runInteractable() {
        const scene = this.scene;
        const interactable = scene.player.currentInteractable;

        // Lever interaction: play switch.mp3, disable lever, increment counter
        // Check by tag first (set in level5.js) since Tiled object names may vary
        if (interactable._isLever) {
            if (!interactable._activated) {
                interactable._activated = true;
                scene.sound.play("lever", { volume: 0.5 });
                if (typeof scene.enabledLevers === "undefined") scene.enabledLevers = 0;
                scene.enabledLevers++;

                const leverId = interactable._saveId || interactable.name || `${Math.round(interactable.x)},${Math.round(interactable.y)}`;
                scene._leverSaveState = scene._leverSaveState || [];
                if (!scene._leverSaveState.includes(leverId)) {
                    scene._leverSaveState.push(leverId);
                }

                const lastGame = JSON.parse(localStorage.getItem("lastGame") || "{}");
                lastGame.leverStates = scene._leverSaveState;
                localStorage.setItem("lastGame", JSON.stringify(lastGame));

                // Notify level-specific lever handler if it exists
                if (typeof scene.onLeverActivated === "function") {
                    scene.onLeverActivated(interactable);
                }
            }
            // Reset interaction state so player can walk away
            scene.player.isInteractActive = false;
            scene.player.isInteractOpen = false;
            return;
        }

        switch (true) {
            case interactable.name.startsWith("fragment"):
                Player.fragmentFind(scene);
                break;
            case interactable.name == "end":
                scene.playerUI.createTimeCharm(scene);
                break;
            case interactable.name.startsWith("TCchest"):
                Player.TCchestFind(scene);
                break;
        }
    }

    // Function to trigger game over
    gameOver() {
        /**
         * @author Ray Lam, Honglue Zheng
         */
        const scene = this.scene;

        scene.sound.stopAll();
        scene.sound.play("gameOver", { volume: 0.8 });

        // Create full-black overlay
        scene.blackOverlay = scene.add
            .rectangle(
                0,
                0,
                scene.cameras.main.width,
                scene.cameras.main.height,
                0x000000,
            )
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(50)
            .setAlpha(0);

        // Slow zoom in on timer (3 seconds)
        scene.cameras.main.zoomTo(2, 3000, "Linear", true, (camera, progress) => {
            if (progress === 1) {
                this.showGameOverScreen();
            }
        });

        // Fade to black
        scene.tweens.add({
            targets: scene.blackOverlay,
            alpha: 0.5,
            duration: 10000,
        });

        scene.isPaused = true;
        return;
    }

    showGameOverScreen() {
        const scene = this.scene;
        const { width, height } = scene.cameras.main;

        // Create RETRY button
        const retryButton = scene.add
            .text(width / 2, height / 2 - 40, "RÉESSAYER", {
                fontFamily: "noita",
                fontSize: "32px",
                color: "#ffffff",
                backgroundColor: "rgba(0, 0, 0, 0)",
                padding: { left: 30, right: 30, top: 15, bottom: 15 },
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => retryButton.setColor("#916100"))
            .on("pointerout", () => retryButton.setColor("#ffffff"))
            .on("pointerdown", () => {
                scene.sound.play("click");
                setTimeout(() => {
                    shutdown(scene);
                    scene.playerUI = undefined;
                    scene.isPaused = false;
                    scene.scene.restart();
                }, 300);
            })
            .setDepth(1001);

        // Create RETURN TO MAIN MENU button
        const menuButton = scene.add
            .text(width / 2, height / 2 + 40, "RETOUR AU MENU", {
                fontFamily: "noita",
                fontSize: "32px",
                color: "#ffffff",
                backgroundColor: "#rgba(0, 0, 0, 0)",
                padding: { left: 30, right: 30, top: 15, bottom: 15 },
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => menuButton.setColor("#916100"))
            .on("pointerout", () => menuButton.setColor("#ffffff"))
            .on("pointerdown", () => {
                scene.sound.play("click");
                setTimeout(() => {
                    window.location.reload();
                }, 300);
            })
            .setDepth(1001);

        // Fade in buttons
        retryButton.setAlpha(0);
        menuButton.setAlpha(0);

        scene.tweens.add({
            targets: [retryButton, menuButton],
            alpha: 1,
            duration: 1000,
        });
    }

    // Function to trigger fragment find animation (static for puzzle access)
    static fragmentFind(scene, isQuest = false) {
        // Remove chest if not quest
        if (!isQuest) {
            // Update storage
            scene.player.claimedFragments.push(scene.player.currentInteractable);
            localStorage.setItem(
                `${scene.level}.claimedFragments`,
                JSON.stringify(scene.player.claimedFragments),
            );
            scene.player.currentInteractable.destroy();
        }

        scene.player.fragmentsCount++;
        scene.playerUI.updateFragmentCount(scene.player.fragmentsCount);
        scene.sound.play("pickup");
        scene.playerUI.flashInventoryBorder();

        scene.player.currentInteractable = null;
        scene.player.isInteractActive = false;
        scene.player.isInteractOpen = false;
    }

    // RAY CODE >:)
    static TCchestFind(scene) {
        scene.playerUI.addTimeCharm("1"); //add first time charm
        scene.playerUI.flashInventoryBorder();
    }
}
