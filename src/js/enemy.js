/**
 * @author Ray Lam, Honglue Zheng
 * @comment should've been a class
 */

// Function to load all enemy assets
function loadEnemyAssets(scene) {
    scene.load.spritesheet("skeletonAttack", "assets/enemySheet/Skeleton/Sprite Sheets/Skeleton Attack.png", {
        frameWidth: 96,
        frameHeight: 64
    });
    scene.load.spritesheet("skeletonWalk", "assets/enemySheet/Skeleton/Sprite Sheets/Skeleton Walk.png", {
        frameWidth: 96,
        frameHeight: 64
    });
    scene.load.spritesheet("skeletonDead", "assets/enemySheet/Skeleton/Sprite Sheets/Skeleton Dead.png", {
        frameWidth: 96,
        frameHeight: 64
    });
    scene.load.spritesheet("skeletonHit", "assets/enemySheet/Skeleton/Sprite Sheets/Skeleton Hit.png", {
        frameWidth: 96,
        frameHeight: 64
    });
    scene.load.spritesheet("skeletonIdle", "assets/enemySheet/Skeleton/Sprite Sheets/Skeleton Idle.png", {
        frameWidth: 96,
        frameHeight: 64
    });
}

// Create skeletons and add them to the enemy group
// density: number per unit
function createSkeleton(scene, collidablesLayer, density, unit) {
    let spaces = [];
    let numSpaces;
    let spaceX;
    // Enemies physics group
    scene.enemies = scene.physics.add.group({
        collideWorldBounds: true,
        gravity: 1000,
    });
    createSkeletonAnimations(scene);

    // Spawn enemies in groups according to density
    scene.enemySpawns.forEach(spawn => {
        numSpaces = Math.floor(spawn.body.width / unit); // Number of spaces to spawn
        spaceX = spawn.x - spawn.body.width / 2; // Current X position
        for (let i = 0; i < numSpaces; i++) {
            spaces.push({ start: spaceX, end: spaceX + unit }); // Start and end positions of each space
            spaceX += unit; // Update current X position
        }
        // Spawn enemies according to density per space
        for (let i = 0; i < spaces.length; i++) {
            for (let ii = 0; ii < density; ii++) {
                // Random X position among the space
                const randomX = Math.floor(Math.random() * (spaces[i].end - spaces[i].start)) + spaces[i].start;
                spawnSkeleton(randomX, spawn.y - 205, scene);
            }
        }
    });
    // Add collider
    scene.enemyCollider = scene.physics.add.collider(scene.enemies, collidablesLayer);

}

// Function to spawn a skeleton and its properties
function spawnSkeleton(x, y, scene) {
    // Spawn sprite
    const skeleton = scene.physics.add.sprite(0, 0, 'skeletonIdle')
        .setOrigin(0.5, 0.5)
        .setScale(2)
        .setDepth(11)
        .setSize(30, 50)
        .setOffset(35, 15)
        .setPosition(x, y);

    // Play animation
    skeleton.play('skeletonIdle', true);

    // Add skeleton to physics group
    scene.enemies.add(skeleton);

    const randomFacing = Math.floor(Math.random() * 2); // Random facing (0 or 1)
    skeleton.flipX = randomFacing === 0 ? false : true; // Flip sprite if facing is 0

    // Create attack hitbox
    skeleton.attackHitbox = scene.add.rectangle(
        0,
        0,
        180, // width
        150, // height
        0x000000, // color (red for visualization)
        0 // alpha (for debugging)
    ).setOrigin(0.5, 0.5);

    // Add physics to hitbox
    scene.physics.add.existing(skeleton.attackHitbox);
    skeleton.attackHitbox.body.setAllowGravity(false);

    // Set properties
    skeleton.health = 3;
    skeleton.detectionRange = 400;
    skeleton.isAttacking = false;
    skeleton.isDead = false;
    skeleton.attacked = false;
    skeleton.direction = 0;
}

// Create all skeleton animations
function createSkeletonAnimations(scene) {
    // Idle
    scene.anims.create({
        key: 'skeletonIdle',
        frames: scene.anims.generateFrameNumbers('skeletonIdle', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });

    // Walk
    scene.anims.create({
        key: 'skeletonWalk',
        frames: scene.anims.generateFrameNumbers('skeletonWalk', { start: 0, end: 9 }),
        frameRate: 10,
        repeat: -1
    });

    // Attack
    scene.anims.create({
        key: 'skeletonAttack',
        frames: scene.anims.generateFrameNumbers('skeletonAttack', { start: 0, end: 9 }),
        frameRate: 10,
        repeat: 0
    });

    // Hit
    scene.anims.create({
        key: 'skeletonHit',
        frames: scene.anims.generateFrameNumbers('skeletonHit', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0
    });

    // Death
    scene.anims.create({
        key: 'skeletonDead',
        frames: scene.anims.generateFrameNumbers('skeletonDead', { start: 0, end: 12 }),
        frameRate: 10,
        repeat: 0
    });
}  

function hitboxUpdater(enemy) {
    if (enemy.isDead) return;

    // Set hitbox size and position based on direction
    const offsetX = 80; // 20px overlap
    const attackWidth = 180;
    
    // Calculate base position relative to enemy
    enemy.attackHitbox.y = enemy.body.y + enemy.body.height/2;
    
    if (enemy.flipX) { // Facing left
        // Position hitbox to the left with overlap
        enemy.attackHitbox.x = enemy.x - enemy.body.width/2 - attackWidth/2 + offsetX;
    } else { // Facing right
        // Position hitbox to the right with overlap
        enemy.attackHitbox.x = enemy.x + enemy.body.width/2 + attackWidth/2 - offsetX;
    }
}

// Function to update skeletons
function updateSkeleton(scene) {

    // Get each skeleton individually
    scene.enemies.getChildren().forEach(enemy => {
        if (!enemy || enemy.isDead) return; // If enemy is dead, return

        // Null checks for animations to prevent errors
        const currentAnim = enemy.anims?.currentAnim; // Current animation
        const currentFrame = enemy.anims?.currentFrame; // Current frame

        // Trigger hit reaction and immobilize enemy
        if (currentAnim?.key === 'skeletonHit' && enemy.anims.isPlaying) {
            enemy.setVelocityX(0);
            return;
        }

        const dx = scene.player.x - enemy.x; // Distance between enemy and player
        const distance = Math.abs(dx);        // Absolute distance (no negative values)
        enemy.direction = dx > 0 ? 1 : -1;    // Direction of movement (1 for right, -1 for left)

        // Flip sprite if facing is 0
        enemy.flipX = enemy.direction < 0;

        hitboxUpdater(enemy);

        // Attack mechanism (attack animation is playing)
        if (currentAnim.key === 'skeletonAttack') {
            // Attack frames are playing
            if (currentFrame && currentFrame.index >= 6 && currentFrame.index <= 9) {
                // If enemy has not hit yet
                if (!enemy.attacked) {
                    enemy.attacked = true; // Prevent enemy from spamming attack

                    --scene.player.health;

                    // UI element
                    
                    // Player play hurt/death animation
                    if (scene.player.health > 0) {
                        scene.player.isHurting = true;
                        scene.player.play('hurt', true);
                        scene.sound.play('hurt');
                    } else {
                        scene.player.canMove = false;
                        scene.player.isDead = true;
                        scene.player.play('death', true);
                        scene.sound.play('hurt');
                    }
                }
            }
        }

        // Player within enemy detection range
        if (distance < enemy.detectionRange) {
            // Player outside of attack range
            if (!scene.physics.overlap(scene.player, enemy.attackHitbox)) {
                // Movement state
                enemy.setVelocityX(100 * enemy.direction);
                // If no animation is  playing or the current animation is not walk, play walk animation
                if (!enemy.anims.isPlaying || !currentAnim || currentAnim.key !== 'skeletonWalk') {
                    enemy.anims.play('skeletonWalk', true);
                }
                enemy.isAttacking = false;
            // Player within attack range
            } else {
                // Stop enemy after a certain extent
                if (distance < 50) enemy.setVelocityX(0);
                // If enemy is not yet attacking
                if (!enemy.isAttacking) {
                    enemy.isAttacking = true;
                    // Play attack animation
                    enemy.anims.play('skeletonAttack', true);
                    enemy.once('animationcomplete', () => {
                        enemy.isAttacking = false;
                        enemy.attacked = false;
                        enemy.anims.play('skeletonIdle', true);
                    });
                }
            }
        } else {
            // Idle state
            enemy.setVelocityX(0);
            // If no animation is playing or the current animation is not idle, play idle animation
            if (!enemy.anims.isPlaying || !currentAnim || currentAnim.key !== 'skeletonIdle') {
                enemy.anims.play('skeletonIdle', true);
            }
            enemy.isAttacking = false;
        }
    });
}

export { loadEnemyAssets, createSkeleton, spawnSkeleton, createSkeletonAnimations, updateSkeleton };