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
    // Air attack 1 animation
    scene.anims.create({
        key: "airAttack",
        frames: scene.anims.generateFrameNumbers("playerSheet", {
            frames: [21, 22, 23]
        }),
        frameRate: 10,
        repeat: 0
    });
    // Air attack 2 animation
    scene.anims.create({
        key: "airAttack2",
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
        if (scene.player.body.onFloor() && !scene.player.isSliding) {
            scene.player.setSize(18, 32).setOffset(17, 4);
            scene.player.play("run", true);
        }
    // Move right
    } else if (scene.keys.d.isDown) {
        updateDirection(scene, 1);
        scene.player.setVelocityX(300);
        if (scene.player.body.onFloor() && !scene.player.isSliding) {
            scene.player.setSize(18, 32).setOffset(17, 4);
            scene.player.play("run", true);
        }
    // Stop x-axis movement and put player in idle
    } else {
        scene.player.setVelocityX(0);
        if (scene.player.body.onFloor() && !scene.player.isSliding) {
            scene.player.setSize(18, 32).setOffset(17, 4);
            scene.player.play("idle", true);
        }
    }

    // Jump
    if (scene.keys.w.isDown && scene.player.body.onFloor()) {
        if (scene.player.body.onFloor()) {
            scene.player.play("jump", true);
        }
        // Fall
        if (!scene.player.body.onFloor() && scene.player.body.velocity.y >0) {
            scene.player.play("fall", true);
        }

        scene.player.setVelocityY(-600);
    }

    // Fall
    if (!scene.player.body.onFloor() && scene.player.body.velocity.y > 0 && !scene.player.isSliding) {
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
        // Ground attack
        if (scene.player.body.onFloor()) {
            scene.player.play("attack", true);
        // Air attack
        } else {
            scene.player.play("airAttack", true);
        }
    }
    
}

// Function to update player direction
function updateDirection(scene, direction) {
    // Player direction didn't change
    if (scene.player.direction == direction) {
        return;
    } else {
        scene.player.direction = direction;
        // Don't flip sprites if player is facing right
        if (direction == 1) {
            scene.player.setFlipX(false);
            // Set player's hitbox according to attack or not
            if (scene.player.isAttacking == true) {
                scene.player.setSize(32, 32).setOffset(32, 32);
            } else {
                scene.player.setSize(18, 32).setOffset(17, 4);
            }
            return;
        }
       
        // Flip if player is facing left
        scene.player.setFlipX(true);
        // Set player's hitbox according to attack or not
        if (scene.player.isAttacking == true) {
            scene.player.setSize(32, 32).setOffset(32, 32);
        } else {
            scene.player.setSize(18, 32).setOffset(17, 4);
        }
    }
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

export { createAnimation, updatePlayerMovement, updateDirection };
