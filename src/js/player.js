/**
 * @author Honglue Zheng
 * @version beta
 * @note Universal player functions
 */

function loadPlayer(scene) {
    // LOAD PLAYER
    scene.player = scene.physics.add.sprite(0, 0, "playerSheet");
    // Create playeranimation
    createAnimation(scene);
    scene.player.setScale(3).setSize(18, 32).setOffset(17, 4);
    scene.player.direction = 1; // Set player direction (0 = left, 1 = right)
    // Set player collision detection
    scene.player.setCollideWorldBounds(true);
    // Set player properties
    scene.player.direction = 1;
    scene.player.disabledCrouch = false;
    scene.player.isSliding = false;
    scene.player.isAttacking = false;
    scene.player.canClimb = false;
    scene.player.isClimbing = false;
    // Player gravity
    scene.player.body.setGravityY(1000);
    // Create player attack hitbox
    createAttackHitbox(scene);
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
function updatePlayerMovement(scene) {

    // Limit player falling velocity to prevent speed being faster than game update ticks
    if (scene.player.body.velocity.y > 1000) scene.player.body.setVelocityY(1000);

    // Reenable crouch
    if (scene.keys.s.isUp) scene.disableCrouch = false;

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
    if (scene.player.canClimb && scene.keys.w.isDown && !scene.player.isClimbing) {
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
    scene.player.setSize(15, 15).setOffset(20, 20); // Shrink player hitbox
    scene.player.play("slide", true); // Play slide animation
    // Reset after 250ms
    setTimeout(() => {
        endSlide(scene);
    }, 250);
}
function endSlide(scene) {
    scene.disableCrouch = true;             // Disable crouching until key release to prevent abuse
    scene.player.setSize(18, 32).setOffset(17, 4);  // Reset player hitbox
    scene.player.isSliding = false;         // Reset sliding flag
    // Resume appropriate animation
    if (scene.player.body.velocity.x > 0) {
        scene.player.play("run", true);
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
    // Prevent other animations from overriding
    scene.player.isAttacking = true;
    scene.player.setSize(18, 32).setOffset(17, 4);  // Reset player hitbox

    // Attack mech here TODO

    // Ground attack
    if (scene.player.body.onFloor()) {
        scene.player.play("attack", true).on("animationcomplete", () => {
            scene.player.isAttacking = false;
        });
    // Air attack
    } else {
        scene.player.play("airAttack", true).on("animationcomplete", () => {
            scene.player.isAttacking = false;
        });
    }
}

// Player move left functions
function moveLeft(scene) {
    updateDirection(scene, 0);
    scene.player.setVelocityX(-300); 
    if (scene.player.body.onFloor() && !scene.player.isSliding && !scene.player.isAttacking) {
        scene.player.setSize(18, 32).setOffset(17, 4);
        scene.player.play("run", true);
    }

}

// Player move right function
function moveRight(scene) {
    updateDirection(scene, 1);
    scene.player.setVelocityX(300);
    if (scene.player.body.onFloor() && !scene.player.isSliding && !scene.player.isAttacking) {
        scene.player.setSize(18, 32).setOffset(17, 4);
        scene.player.play("run", true);
    }
}

// Player idle function
function idle(scene) {
    scene.player.setVelocityX(0);
    if (scene.player.body.onFloor() && !scene.player.isSliding && !scene.player.isAttacking) {
        scene.player.setSize(18, 32).setOffset(17, 4);
        scene.player.play("idle", true);
    }
}

// Player jump function
function jump(scene) {
    if (scene.player.body.onFloor() && !scene.player.isAttacking) {
        scene.player.play("jump", true);
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
        scene.player.setSize(15, 15).setOffset(20, 20);
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
            scene.player.setVelocityY(-50); // Climb up
            scene.player.play("climb", true);
        } else if (scene.keys.s.isDown) {
            scene.player.setVelocityY(50); // Climb down
            scene.player.play("climb", true);
        } else {
            scene.player.setVelocityY(0);
            scene.player.play("climb", true).stop(); // Idle on ladder/vine
        }
    }
}

export { loadPlayer, createAnimation, updatePlayerMovement, updateDirection, createAttackHitbox, hitboxUpdater };
