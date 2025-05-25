/**
 * @author Honglue Zheng
 * @note Universal player functions
 * @comment I should've made this a Player class... But it's too late to change :(
 */

import { interactWithWeirdos } from "./puzzles/threeWeirdos.js";
import { echoing_chimes_puzzle } from "./puzzles/sequencer.js";
import { numberGuesser } from "./puzzles/numberGuesser.js";

function loadPlayer(scene) {
    scene.latestCheckpoint;
    scene.nextCheckpoint;
    const fetchedCheckpoint = JSON.parse(localStorage.getItem('lastGame')).checkpoint;
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
        const fetchedCheckpointIndex = fetchedCheckpoint.name.substr(fetchedCheckpoint.name.length - 1);
        if (fetchedCheckpointIndex == scene.checkpoints.length - 1) {
            scene.nextCheckpoint = scene.checkpoints[scene.checkpoints.length - 1]; // No more checkpoints
        } else {
            scene.nextCheckpoint = scene.checkpoints[parseInt(fetchedCheckpointIndex) + 1];
        }
    }
    // Spawn player at latest checkpoint
    let spawnX = scene.latestCheckpoint.x;
    let spawnY = scene.latestCheckpoint.y - 10;
    // LOAD/SPAWN PLAYER
    scene.player = scene.physics.add.sprite(spawnX, spawnY, "playerSheet");
    // Create playeranimation
    createAnimation(scene);
    // Set player properties
    scene.player.direction = 1;
    scene.player.direction = 1; // Set player direction (0 = left, 1 = right)
    scene.player.disabledCrouch = false;
    scene.player.isSliding = false;
    scene.player.isAttacking = false;
    scene.player.canClimb = false;
    scene.player.isClimbing = false;
    scene.player.wasFalling = false;
    scene.player.isCrouching = false;
    scene.player.isJumping = false;
    scene.player.isNearQuest = false;
    scene.player.isQuestActive = false;
    scene.player.currentQuest;
    scene.player.attackCooldown = 0;
    scene.player.hitboxWidth = 15;
    scene.player.hitboxHeight = 32;
    scene.player.hitboxOffsetX = 18;
    scene.player.hitboxOffsetY = 4;
    scene.player.crouchHitboxWidth = 15;
    scene.player.crouchHitboxHeight = 15;
    scene.player.crouchHitboxOffsetX = 20;
    scene.player.crouchHitboxOffsetY = 20;
    scene.player.setScale(3).setSize(scene.player.hitboxWidth, scene.player.hitboxHeight)
                            .setOffset(scene.player.hitboxOffsetX, scene.player.hitboxOffsetY);
    // Set player collision detection
    scene.player.setCollideWorldBounds(true);
    // Enable floor/wall collision detection, dealt by Phaser game engine
    scene.groundCollider = scene.physics.add.collider(scene.player, scene.ground);
    scene.ground.setCollisionByExclusion(-1);
    // Player gravity
    scene.player.body.setGravityY(1000);
    // Create player attack hitbox
    createAttackHitbox(scene);
    scene.player.body.setMaxSpeed(950); // Cap velocity to prevent going through blocks

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
        }
    });

    // Create quest notification text
    // Resizable div
    scene.player.questNotifContainer = scene.rexUI.add.sizer({
        orientation: 0,
        space: { item: 10 },
        anchor: { centerX: '50%', centerY: '50%' },
        x: 0,
        y: 0,
    });
    // Show player that they should press the F key
    const keyPopup = scene.add.image(0, 0, "questKey").setOrigin(0.5, 0.5).setScale(0.125);
    // "Interact" text warning
    const notif = scene.add.text(0, 0, "Intéragir", {
            fontSize: "16px",
            fontFamily: 'minecraft',
            color: "white"
    }).setOrigin(0.5, 0.5);

    // Ensure texts always stay on top of all other objects
    keyPopup.setDepth(100);
    notif.setDepth(100);

    // Add texts to quest notification container
    scene.player.questNotifContainer.add(keyPopup).add(notif).layout();

    // Add quest detection
    scene.physics.add.overlap(scene.player, scene.questSpawnsGroup, (player, quest) => {
        scene.player.isNearQuest = true;
        if (!scene.player.isQuestActive) scene.player.questNotifContainer.setVisible(true);
        scene.player.currentQuest = quest;
    });
}

// Function to create animations for the player
function createAnimation(scene) {
    // Idle animation
    scene.anims.create({
        key: "idle",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [112, 113, 114, 115]
        }),
        frameRate: 10,
        repeat: -1
    });
    // Run animation
    scene.anims.create({
        key: "run",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [147, 148, 149, 150, 151, 152]
        }),
        frameRate: 10,
        repeat: -1
    });
    // Jump animation
    scene.anims.create({
        key: "jump",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [133, 134, 135, 136]
        }),
        frameRate: 10,
        repeat: 0
    });
    // Fall animation
    scene.anims.create({
        key: "fall",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [98, 99]
        }),
        frameRate: 10,
        repeat: -1
    });
    // Draw sword animation
    scene.anims.create({
        key: "drawSword",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [175, 176, 177, 178]
        }),
        frameRate: 20,
        repeat: 0
    });
    // Sheathe sword animation
    scene.anims.create({
        key: "sheatheSword",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [182, 183, 184, 185]
        }),
        frameRate: 20,
        repeat: 0
    });
    // Attack animation
    scene.anims.create({
        key: "attack",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [28, 29, 30, 31, 32]
        }),
        frameRate: 10,
        repeat: 0
    });
    // Hurt animation
    scene.anims.create({
        key: "hurt",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [50, 51]
        }),
        frameRate: 10,
        repeat: 0
    });
    // Death animation
    scene.anims.create({
        key: "death",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [94, 95, 96, 97]
        }),
        frameRate: 10,
        repeat: 0
    });
    // Slide animation
    scene.anims.create({
        key: "slide",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [168, 169, 170]
        }),
        frameRate: 10,
        repeat: 0
    });
    // Climb animation
    scene.anims.create({
        key: "climb",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [140, 141, 142, 143]
        }),
        frameRate: 10,
        repeat: -1
    });
    // Crouch animation
    scene.anims.create({
        key: "crouch",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [84, 85, 86, 87]
        }),
        frameRate: 10,
        repeat: -1
    });
    // Air attack animation
    scene.anims.create({
        key: "airAttack",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [7, 8, 9, 10]
        }),
        frameRate: 10,
        repeat: 0
    });
}

// Player movement updator
function updatePlayer(scene) {

    // Checkpoint updater
    updateCheckpoint(scene);

    // Player disable isJumping property if on ground
    if (scene.player.body.onFloor()) scene.player.isJumping = false;

    // Player disable crouch hitbox if not sliding nor crouching, or is in the air while trying to crouch/slide
    // To prevent crouch+jump thru wall glitch abuse
    if ((!scene.player.isCrouching && !scene.player.isSliding) ||
        (scene.player.isJumping && scene.player.isCrouching)) {
        scene.player.setScale(3).setSize(scene.player.hitboxWidth, scene.player.hitboxHeight)
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
    if (scene.player.wasFalling && scene.player.body.onFloor()) scene.sound.play("landing");
    if (scene.player.body.velocity.y > 0) {
        scene.player.wasFalling = true;
    } else {
        scene.player.wasFalling = false;
    }

    // Reenable crouch
    if (scene.keys.s.isUp) scene.disableCrouch = false;

    // MOVEMENTS TRIGGERS BELOW ----------------------------------------------------------
    // Move left
    if (scene.keys.a.isDown) {
        moveLeft(scene);
    // Move right
    } else if (scene.keys.d.isDown) {
        moveRight(scene);
    // Stop x-axis movement and put player in idle
    } else {
        idle(scene);
    }

    // Fall
    if (!scene.player.body.onFloor() &&
        scene.player.body.velocity.y > 0 &&
        !scene.player.isSliding &&
        !scene.player.isAttacking &&
        !scene.player.isClimbing) {
        fall(scene);
    }

    // Crouch
    if (scene.keys.s.isDown && !scene.disableCrouch && !scene.player.isAttacking) {
        crouch(scene);
    } else {
        scene.player.isCrouching = false; // Disable user isCrouching property for appropriate hitbox management
    }

    // Climbing/jumping logics
    if (scene.player.isClimbing) {
        climb(scene);
    } else {
        // Regular jump/fall logic
        if (scene.keys.w.isDown && scene.player.body.onFloor()) {
            jump(scene);
        }
    }

    // Enter climbing state
    if (scene.player.canClimb && (scene.keys.w.isDown || scene.keys.s.isDown) && !scene.player.isClimbing) {
        // Cancel climbing if any non-climbing input detected
        const hasHorizontalInput = scene.keys.a.isDown || scene.keys.d.isDown;
        const hasAttackInput = scene.keys.space.isDown;
        const hasConflictingInput = hasHorizontalInput || hasAttackInput;
        
        if (!hasConflictingInput) {
            enterClimb(scene); // Enter climbing state if no conflicting input detected
        } else {
            exitClimb(scene, false); // Voluntary exit, no impulse
        }
    }

    // Attack
    if (scene.keys.space.isDown) {
        attack(scene);
    }

    if (scene.keys.f.isDown) {
        if (scene.player.isNearQuest && !scene.player.isQuestActive) {
            scene.player.isQuestActive = true;
            runQuest(scene);
        }
    }

    scene.player.questNotifContainer.setPosition(scene.player.x + 100, scene.player.y);

    // Untrigger if player is not near quest
    if (!scene.physics.overlap(scene.player, scene.questSpawnsGroup)) {
        scene.player.isNearQuest = false;
        scene.player.currentQuest = null;
    }
    // Unshow interact warning
    if (!scene.physics.overlap(scene.player, scene.questSpawnsGroup) || scene.player.isQuestActive) {
        scene.player.questNotifContainer.setVisible(false);
    }
    
}

// Function to update player direction
function updateDirection(scene, direction) {
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
function startSlide(scene) {
    scene.player.isSliding = true;
    scene.player.setScale(3).setSize(scene.player.crouchHitboxWidth, scene.player.crouchHitboxHeight)
                            .setOffset(scene.player.crouchHitboxOffsetX, scene.player.crouchHitboxOffsetY); // Shrink player hitbox
    scene.player.play("slide", true); // Play slide animation
    scene.sound.play("jump"); // Play jump sound effect
    // Reset after 500ms
    setTimeout(() => {
        endSlide(scene);
    }, 500);
}
function endSlide(scene) {
    scene.disableCrouch = true;             // Disable crouching until key release to prevent abuse
    scene.player.isSliding = false;         // Reset sliding flag
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
function createAttackHitbox(scene) {
    // Create attack hitbox
    scene.attackHitbox = scene.add.rectangle(
        0,
        0,
        175, // width
        120, // height
        0x000000, // color (red for visualization)
        0 // alpha (for debugging)
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
function hitboxUpdater(scene) {
    // Update player attack hitbox
    scene.attackHitbox.body.y = scene.player.body.y - 20;

    // Change player's hitbox according to direction
    if (scene.player.direction == 1) {
        scene.attackHitbox.body.x = scene.player.x - scene.player.width / 2 - 25;
    } else {
        scene.attackHitbox.body.x = scene.player.x - 145 + scene.player.width / 2;
    }
}

// Functions to initiate and end player attacking appropriately
    function attack(scene) {
    if (scene.player.attackCooldown == 0) {
        scene.player.isAttacking = true;
        scene.player.attackCooldown = 50;
        scene.sound.play("attack", { volume: 0.5 });

        // Add enemy damage detection
        scene.physics.overlap(scene.attackHitbox, scene.enemies, (hitbox, enemy) => {
            if (!enemy.isDead) {
                enemy.health -= 1;
                enemy.play('skeletonHit', true);
                enemy.isAttacking = false; // Cancel current attack
                
                if (enemy.health <= 0) {
                    enemy.isDead = true;
                    enemy.play('skeletonDead', true);
                    enemy.body.enable = false;
                    scene.time.delayedCall(1000, () => enemy.destroy());
                }
            }
        });

        if (scene.player.body.onFloor()) {
            scene.player.play("attack", true);
        } else {
            scene.player.play("airAttack", true);
        }
    }
}



// Player move left functions
function moveLeft(scene) {
    updateDirection(scene, 0);
    scene.player.setVelocityX(-300); 
    if (scene.player.body.onFloor() && !scene.player.isSliding && !scene.player.isAttacking) {
        scene.player.play("run", true);
        if (scene.gameTick % 30 == 0) scene.sound.play("run"); // Play run sound effect
    }

}

// Player move right function
function moveRight(scene) {
    updateDirection(scene, 1);
    scene.player.setVelocityX(300);
    if (scene.player.body.onFloor() && !scene.player.isSliding && !scene.player.isAttacking) {
        scene.player.play("run", true);
        if (scene.gameTick % 30 == 0) scene.sound.play("run"); // Play run sound effect
    }
}

// Player idle function
function idle(scene) {
    scene.player.setVelocityX(0);
    if (scene.player.body.onFloor() && !scene.player.isSliding && !scene.player.isAttacking) {
        scene.player.play("idle", true);
    }
}

// Player jump function
function jump(scene) {
    scene.player.isJumping = true;
    if (scene.player.body.onFloor() && !scene.player.isAttacking) {
        scene.player.play("jump", true);
        scene.sound.play("jump"); // Play jump sound effect
    }
    scene.player.setVelocityY(-600);
}

// Player fall function
function fall(scene) {
    scene.player.play("fall", true);
}

// Player crouch function
function crouch(scene) {
    // Player is moving
    if (!scene.player.isSliding && scene.player.body.velocity.x != 0 && scene.player.body.onFloor()) {
        startSlide(scene);
    // Player is not moving
    } else if (scene.player.body.velocity.x == 0 && scene.player.body.onFloor()) {
        scene.player.play("crouch", true);
        scene.player.setScale(3).setSize(scene.player.crouchHitboxWidth, scene.player.crouchHitboxHeight)
                            .setOffset(scene.player.crouchHitboxOffsetX, scene.player.crouchHitboxOffsetY); // Shrink player hitbox
        scene.player.isCrouching = true;
    }
}

// Player enter climbing function
function enterClimb(scene) {
    scene.groundCollider.active = false;
    scene.player.isClimbing = true;
    scene.player.body.setAllowGravity(false);
    scene.player.setVelocityY(0);
    scene.player.setVelocityX(0);
    scene.player.play("climb", true);
}

// Player exit climbing function
function exitClimb(scene, impulse) {
    scene.groundCollider.active = true;
    scene.player.body.setAllowGravity(true);
    scene.player.isClimbing = false;
    scene.player.canClimb = false;

    // Apply small vertical impulse when exiting
    if (impulse) jump(scene);
    
    // Transition to appropriate animation
    if (!scene.player.body.onFloor()) {
        scene.player.play("jump", true);
    }
}

// Function that deals with player climbing
function climb(scene) {
    // Horizontal movement/attack cancels climbing
    // End of ladder/vine also cancels climbing
    if (!scene.player.canClimb || scene.keys.a.isDown || scene.keys.d.isDown || scene.keys.space.isDown) {
        if (!scene.player.canClimb) {
            if (scene.player.body.velocity.y < 0) {
                exitClimb(scene, true);   // Player has reached the end of vine/ladder while climbing, exit with impulse
            } else {
                exitClimb(scene, false);   // Player has reached the end of vine/ladder while descending, exit without impulse
            }
        } else {
            exitClimb(scene, false);  // Voluntary exit, no impulse
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
function updateCheckpoint(scene) {

    // Safety checks
    if (!scene.nextCheckpoint || !scene.latestCheckpoint) console.log("[WARNING] No checkpoints found.");

    if (scene.nextCheckpoint.name == scene.latestCheckpoint.name) return; // No new checkpoint, ignore

    // Check if player is within 20 pixels of the checkpoint (X and Y)
    const isNearX = Math.abs(scene.player.x - scene.nextCheckpoint.x) <= 50;
    const isNearY = Math.abs(scene.player.y - scene.nextCheckpoint.y) <= 50;

    if (isNearX && isNearY) {
        console.log("New checkpoint");
        const nextCheckpointIndex = scene.checkpoints.indexOf(scene.nextCheckpoint) + 1;
        scene.latestCheckpoint = scene.nextCheckpoint;
        // Set new latest checkpoint in localStorage
        localStorage.setItem("lastGame", JSON.stringify({
            level: JSON.parse(localStorage.getItem('lastGame')).level,
            checkpoint: scene.latestCheckpoint
        }));
        // Set new next checkpoint
        if (nextCheckpointIndex < scene.checkpoints.length) {
            scene.nextCheckpoint = scene.checkpoints[nextCheckpointIndex];
        } else {
            return;     // No next checkpoint
        }
    }
}

// Function to detect and run quest
function runQuest(scene) {
    const div = document.getElementById('puzzleDiv');

    switch(true) {
        case scene.player.currentQuest.name.startsWith("threeweirdos"):
            interactWithWeirdos(scene);
            break;
        case scene.player.currentQuest.name.startsWith("sequencer"):
            div.style.display = 'block';
            // Timeout to prevent ghost key hold glitch
            setTimeout(() => {
                echoing_chimes_puzzle(div, scene);
                scene.children.bringToTop(div);
            }, 200);
            break;
        case scene.player.currentQuest.name.startsWith("numberGuesser"):
            div.style.display = 'block';
            // Timeout to prevent ghost key hold glitch
            setTimeout(() => {
                numberGuesser(div, scene);
                scene.children.bringToTop(div);
            }, 200);
            break;
        default:
            break;
    }
}

// Function to trigger fragment find animation
function fragmentFind(scene) {

}

export { loadPlayer, createAnimation, updatePlayer, updateDirection, createAttackHitbox, hitboxUpdater, fragmentFind };
