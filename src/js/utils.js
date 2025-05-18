/**
 * @author Honglue Zheng
 * @version beta
 * @note Universal utility functions
 */


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
            frames: [70, 71, 72, 73]
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

// Player movement update
function updatePlayerMovement(scene) {
    // Reenable crouch
    if (scene.keys.s.isUp) scene.disableCrouch = false;

    // Move left
    if (scene.keys.a.isDown) {
        updateDirection(scene, 0);
        scene.player.setVelocityX(-300);
        if (scene.player.body.onFloor() && !scene.player.isSliding && !scene.player.isAttacking) {
            scene.player.setSize(18, 32).setOffset(17, 4);
            scene.player.play("run", true);
        }
    // Move right
    } else if (scene.keys.d.isDown) {
        updateDirection(scene, 1);
        scene.player.setVelocityX(300);
        if (scene.player.body.onFloor() && !scene.player.isSliding && !scene.player.isAttacking) {
            scene.player.setSize(18, 32).setOffset(17, 4);
            scene.player.play("run", true);
        }
    // Stop x-axis movement and put player in idle
    } else {
        scene.player.setVelocityX(0);
        if (scene.player.body.onFloor() && !scene.player.isSliding && !scene.player.isAttacking) {
            scene.player.setSize(18, 32).setOffset(17, 4);
            scene.player.play("idle", true);
        }
    }

    // Jump
    if (scene.keys.w.isDown && scene.player.body.onFloor()) {
        if (scene.player.body.onFloor() && !scene.player.isAttacking) {
            scene.player.play("jump", true);
        }
        // Fall
        if (!scene.player.body.onFloor() && scene.player.body.velocity.y > 0  && !scene.player.isAttacking) {
            scene.player.play("fall", true);
        }

        scene.player.setVelocityY(-600);
    }

    // Fall
    if (!scene.player.body.onFloor() && scene.player.body.velocity.y > 0 && !scene.player.isSliding && !scene.player.isAttacking) {
        scene.player.play("fall", true);
    }

    // Crouch
    if (scene.keys.s.isDown && !scene.disableCrouch) {
        // Player is moving
        if (!scene.player.isSliding && scene.player.body.velocity.x != 0 && scene.player.body.onFloor()) {
            startSlide(scene);
        // Player is not moving
        } else if (scene.player.body.velocity.x == 0 && scene.player.body.onFloor()) {
            scene.player.play("crouch", true);
            scene.player.setSize(15, 15).setOffset(20, 20);
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

// Functions to initiate and end player attacking appropriately
function attack(scene) {
    // Prevent other animations from overriding
    scene.player.isAttacking = true;

    // Attack mech here TODO

    // Ground attack
    if (scene.player.body.onFloor()) {
        scene.player.play("attack", true).on("animationcomplete", () => {
            scene.player.isAttacking = false;
            scene.player.setSize(18, 32).setOffset(17, 4);  // Reset player hitbox
        });
    // Air attack
    } else {
        scene.player.play("airAttack", true).on("animationcomplete", () => {
            scene.player.isAttacking = false;
            scene.player.setSize(18, 32).setOffset(17, 4);  // Reset player hitbox
        });
    }
}

// Function to create an attack hitbox
function createAttackHitbox(scene) {
    const heading = scene.player.direction;

    scene.attackHitbox = scene.add.rectangle(
        0,
        0,
        150, // width
        120, // height
        0xff0000, // color (red for visualization)
        0.3 // alpha (for debugging)
    );

    // Add physics to hitbox
    scene.physics.add.existing(scene.attackHitbox);
    scene.attackHitbox.body.setAllowGravity(false);

    /* PC DESTROYER 3000 BEAM, DO NOT COMMENT OUT UNLESS...
    // Make hitbox follow player
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
        scene.attackHitbox.body.x = scene.player.x - scene.player.width / 2;
    } else {
        scene.attackHitbox.body.x = scene.player.x - 145 + scene.player.width / 2;
    }
}

export { createAnimation, updatePlayerMovement, updateDirection, createAttackHitbox, hitboxUpdater };
