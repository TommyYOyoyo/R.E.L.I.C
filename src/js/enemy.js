/**
 * @author Ray Lam, Honglue Zheng
 * @comment should've been a class
 */

// Function to load all enemy assets
function loadEnemyAssets(scene) {
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
}

// Create skeletons and add them to the enemy group
// density: (number) per (space available for one skeleton)
function createSkeleton(scene, collidablesLayer, density) {
    scene.enemies = scene.physics.add.group();
    scene.enemySpawns.forEach(spawn => {
        
    });
    createSkeletonAnimations(scene);
    scene.physics.add.collider(scene.enemies, collidablesLayer);
}

// Function to spawn a skeleton and its properties
function spawnSkeleton(x, y, scene) {
    const skeleton = scene.physics.add.sprite(x, y, 'skeletonIdle')
        .setScale(3.5)
        .setDepth(11)
        .setSize(22, 30)
        .setOffset(0, 5);
    
    skeleton.health = 3;
    skeleton.attackRange = 50;
    skeleton.detectionRange = 200;
    skeleton.isAttacking = false;
    skeleton.isDead = false;
    skeleton.attackConnected = false;
    scene.enemies.add(skeleton);
}

// Create all skeleton animations
function createSkeletonAnimations(scene) {
    // Idle
    scene.anims.create({
        key: 'skeletonIdle',
        frames: scene.anims.generateFrameNumbers('skeletonIdle', { start: 0, end: 10 }),
        frameRate: 10,
        repeat: -1
    });

    // Walk
    scene.anims.create({
        key: 'skeletonWalk',
        frames: scene.anims.generateFrameNumbers('skeletonWalk', { start: 0, end: 12 }),
        frameRate: 10,
        repeat: -1
    });

    // Attack
    scene.anims.create({
        key: 'skeletonAttack',
        frames: scene.anims.generateFrameNumbers('skeletonAttack', { start: 0, end: 17 }),
        frameRate: 10,
        repeat: 0
    });

    // Hit
    scene.anims.create({
        key: 'skeletonHit',
        frames: scene.anims.generateFrameNumbers('skeletonHit', { start: 0, end: 7 }),
        frameRate: 5,
        repeat: 0
    });

    // Death
    scene.anims.create({
        key: 'skeletonDead',
        frames: scene.anims.generateFrameNumbers('skeletonDead', { start: 0, end: 14 }),
        frameRate: 8,
        repeat: 0
    });
}  

function updateSkeleton(enemy, scene) {
     scene.enemies.getChildren().forEach(enemy => {
        if (!enemy || enemy.isDead) return;

        // Add null checks for animations
        const currentAnim = enemy.anims?.currentAnim;
        const currentFrame = enemy.anims?.currentFrame;

        // Add hit reaction
        if (currentAnim?.key === 'skeletonHit' && enemy.anims.isPlaying) {
            enemy.setVelocityX(0);
            return;
        }

        const dx = scene.player.x - enemy.x;
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
                    scene.player.health -= 1;
                    scene.playerUI.updateHealth(scene.player.health);
                    enemy.attackConnected = true;
                    
                    // Play hurt animation
                    if (scene.player.health > 0) {
                        scene.player.play('hurt', true);
                    } else {
                        scene.player.play('death', true);
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
}

export { loadEnemyAssets, createSkeleton, spawnSkeleton, createSkeletonAnimations, updateSkeleton };