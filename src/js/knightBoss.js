/**
 * @author Ray Lam
 * @note Code for the Tutorial boss fight (Sentinel) in the new level made by Ray (in the time of writing the number is still level 2.1). you can TECHNICALLY just skip the boss (cuz i didnt place barriers) but i DID make him chase you till the end of the earth. also hes fun to fight against and takes skill. THIS CODE WAS ASSISTED BY AI FOR MOSTLY DEBUGGING BECAUSE OF HOW MANY SYSTEMS I HAD TO THROW AWAY AND ADD BACK JUST TO BALANCE THE BOSS TO THE STATE IT IS NOW.     
 */

//load boss assets 
function loadBossAssets(scene) {
    const folder = "assets/enemySheet/Skeleton/Sprite Sheets/Knight_1/";
    scene.load.spritesheet("bossAttack1", folder + "Attack 1.png", { frameWidth: 86, frameHeight: 86 });
    scene.load.spritesheet("bossAttack2", folder + "Attack 2.png", { frameWidth: 108, frameHeight: 86 });
    scene.load.spritesheet("bossAttack3", folder + "Attack 3.png", { frameWidth: 100, frameHeight: 86 });
    scene.load.spritesheet("bossWalk", folder + "Walk.png", { frameWidth: 73, frameHeight: 86 });
    scene.load.spritesheet("bossIdle", folder + "Idle.png", { frameWidth: 73, frameHeight: 86 });
    scene.load.spritesheet("bossThrust", folder + "Run+Attack.png", { frameWidth: 76, frameHeight: 86 });
    scene.load.spritesheet("bossHurt", folder + "Hurt.png", { frameWidth: 70, frameHeight: 86 });
    scene.load.spritesheet("bossDead", folder + "Dead.png", { frameWidth: 80, frameHeight: 86 });
    scene.load.spritesheet("bossRun", folder + "Run.png", { frameWidth: 71, frameHeight: 86 });
    scene.load.spritesheet("bossDefend", folder + "Defend.png", { frameWidth: 80, frameHeight: 86 });
    scene.load.audio("perilous", "assets/sounds/sfx/perilous.mp3");
}

//create boss animations using the spritesheets (calculated by AI)
function createBossAnimations(scene) {
    function getFrames(key, count) {
        const frames = [];
        for (let i = 0; i < count; i++) frames.push({ key: key, frame: i });
        return frames;
    }
    if (scene.textures.get("bossAttack1"))
        scene.anims.create({ key: "bossAttack1", frames: getFrames("bossAttack1", 5), frameRate: 12, repeat: 0 });
    if (scene.textures.get("bossAttack2"))
        scene.anims.create({ key: "bossAttack2", frames: getFrames("bossAttack2", 4), frameRate: 12, repeat: 0 });
    if (scene.textures.get("bossAttack3"))
        scene.anims.create({ key: "bossAttack3", frames: getFrames("bossAttack3", 4), frameRate: 12, repeat: 0 });
    const comboFrames = [...getFrames("bossAttack1", 5), ...getFrames("bossAttack2", 4), ...getFrames("bossAttack3", 4)];
    scene.anims.create({ key: "bossCombo", frames: comboFrames, frameRate: 12, repeat: 0 });
    if (scene.textures.get("bossWalk"))
        scene.anims.create({ key: "bossWalk", frames: scene.anims.generateFrameNumbers("bossWalk", { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
    if (scene.textures.get("bossIdle"))
        scene.anims.create({ key: "bossIdle", frames: scene.anims.generateFrameNumbers("bossIdle", { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    if (scene.textures.get("bossThrust"))
        scene.anims.create({ key: "bossThrust", frames: scene.anims.generateFrameNumbers("bossThrust", { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
    if (scene.textures.get("bossHurt"))
        scene.anims.create({ key: "bossHit", frames: scene.anims.generateFrameNumbers("bossHurt", { start: 0, end: 1 }), frameRate: 6, repeat: 0 });
    if (scene.textures.get("bossDead"))
        scene.anims.create({ key: "bossDead", frames: scene.anims.generateFrameNumbers("bossDead", { start: 0, end: 5 }), frameRate: 8, repeat: 0 });
    if (scene.textures.get("bossRun"))
        scene.anims.create({ key: "bossRun", frames: scene.anims.generateFrameNumbers("bossRun", { start: 0, end: 6 }), frameRate: 12, repeat: 0 });
    if (scene.textures.get("bossDefend"))
        scene.anims.create({ key: "bossDefend", frames: scene.anims.generateFrameNumbers("bossDefend", { start: 0, end: 4 }), frameRate: 10, repeat: 0 });
}

//spawn boss
function spawnBoss(scene) {
    let spawnPoint = scene.enemySpawns?.find(sp => sp.name === "knightSpawn");
    if (!spawnPoint) {
        spawnPoint = scene.bossSpawns?.find(sp => sp.name === "boss");
    }
    if (!spawnPoint) {
        spawnPoint = scene.bossSpawns?.[0];
    }
    if (!spawnPoint) {
        console.error("knightSpawn/boss not found");
        return null;
    }
    const x = spawnPoint.x;
    const groundY = spawnPoint.y;
    const bodyWidth = 80, bodyHeight = 80;
    let y = groundY - bodyHeight / 2 + 140;
    const boss = scene.physics.add.sprite(x, y, "bossIdle")
        .setOrigin(0.5, 0.5).setScale(2).setDepth(20);
    boss.body.setSize(bodyWidth, bodyHeight);
    boss.body.setCollideWorldBounds(true);
    boss.body.setGravityY(1000);
    boss.play("bossIdle");

    //boss properties 
    boss.health = 30;
    boss.maxHealth = 30;
    boss.isDead = false;
    boss.isAttacking = false;
    boss.isThrusting = false;
    boss.isCharging = false;
    boss.isBlocking = false;
    boss.isInvincible = false;
    boss.invincibleTimer = 0;
    boss.detectionRangeX = 1000;
    boss.detectionRangeY = 500;
    boss.speed = 80;
    boss.thrustSpeed = 550;
    boss.chargeSpeed = 800;
    boss.direction = 1;
    boss.attackCooldown = 0;  //half of the properties were added by AI because consistency was a huge problem
    boss.thrustCooldown = 0;
    boss.chargeCooldown = 0;
    boss.comboCooldown = 0;
    boss.blockCooldown = 0;
    boss.globalCooldown = 0;
    boss.hitStreak = 0;
    boss.lastHitTime = 0;
    boss.graceTimer = 0;  //invincibility after hit
    boss.telegraphTimer = 0;  //wind up
    boss.pendingAttack = null;   
    boss.telegraphFrame = null;
    boss.staggerImmunityTimer = 0; //stun lock prevention after being hit
    boss.minPlayerDistance = 0; //push away player (not used at the end because it caused more problems than it solved)

    //connect boss and health bar
    const barWidth = 600, barHeight = 40;
    const barX = scene.cameras.main.width / 2, barY = scene.cameras.main.height - 70;

    //boss name
    boss.nameText = scene.add.text(barX, barY - 40, "SENTINEL", {
        fontSize: "28px",
        fontFamily: "monospace",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        fontWeight: "bold"
    }).setOrigin(0.5, 0.5).setDepth(100).setScrollFactor(0);

    //healthbar placement
    boss.healthbarBg = scene.add.rectangle(barX, barY, barWidth, barHeight, 0x000000, 0.8).setOrigin(0.5, 0.5).setDepth(100).setScrollFactor(0);
    boss.healthbarFill = scene.add.rectangle(barX, barY, barWidth, barHeight, 0xff0000, 1).setOrigin(0.5, 0.5).setDepth(101).setScrollFactor(0);

    //hide healthbar
    boss.healthbarBg.setVisible(false);
    boss.healthbarFill.setVisible(false);
    boss.nameText.setVisible(false);

    //set healthbar visibility and make connect healthbar to boss health
    boss.setHealthbarVisible = (visible) => {
        if (boss.isDead) return;
        boss.healthbarBg.setVisible(visible);
        boss.healthbarFill.setVisible(visible);
        boss.nameText.setVisible(visible);
        if (visible) {
            const percent = boss.health / boss.maxHealth;
            boss.healthbarFill.width = barWidth * percent;
            if (boss.health <= 15) boss.healthbarFill.setFillStyle(0xff66cc);
            else boss.healthbarFill.setFillStyle(0xff0000);
        }
    };

    //boss reflection text
    boss.reflectText = scene.add.text(0, 0, "REFLEXION", {
        fontSize: "24px",
        fontFamily: "monospace",
        color: "#ff0000",
        stroke: "#000000",
        strokeThickness: 3,
        fontWeight: "bold"
    }).setOrigin(0.5, 0).setDepth(200).setScrollFactor(1);
    boss.reflectText.setVisible(false);

    //hitboxes (calculated by AI)
    boss.attackHitbox = scene.add.rectangle(0, 0, 300, 200, 0xff0000, 0.5).setOrigin(0.5, 0.5);
    scene.physics.add.existing(boss.attackHitbox);
    boss.attackHitbox.body.setAllowGravity(false).setImmovable(true);
    boss.attackHitbox.setVisible(false);

    boss.thrustHitbox = scene.add.rectangle(0, 0, 200, 20, 0x00ff00, 0.5).setOrigin(0.5, 0.5);
    scene.physics.add.existing(boss.thrustHitbox);
    boss.thrustHitbox.body.setAllowGravity(false).setImmovable(true);
    boss.thrustHitbox.setVisible(false);

    boss.chargeHitbox = scene.add.rectangle(0, 0, 300, 180, 0xffff00, 0.5).setOrigin(0.5, 0.5);
    scene.physics.add.existing(boss.chargeHitbox);
    boss.chargeHitbox.body.setAllowGravity(false).setImmovable(true);
    boss.chargeHitbox.setVisible(false);

    boss.comboHitbox = scene.add.rectangle(0, 0, 300, 200, 0xff66ff, 0.5).setOrigin(0.5, 0.5);
    scene.physics.add.existing(boss.comboHitbox);
    boss.comboHitbox.body.setAllowGravity(false).setImmovable(true);
    boss.comboHitbox.setVisible(false);

    // Ensure the sound is added to the sound manager (this fix was made by AI to help me debug the sound problem)
    if (scene.cache.audio.exists("perilous")) {
        scene.sound.add("perilous");
    }

    scene.boss = boss;
    return boss;
}

//update boss hitboxes
function updateBossHitboxes(boss) {
    if (boss.isDead) return;
    const centerY = boss.y;
    boss.attackHitbox.x = boss.x;
    boss.comboHitbox.x = boss.x;
    boss.thrustHitbox.x = boss.x + (boss.flipX ? -220 : 220); //thrust hitboxes forward or backward
    boss.thrustHitbox.y = boss.y + 40;
    boss.chargeHitbox.x = boss.x + (boss.flipX ? -100 : 100);

    boss.attackHitbox.y = boss.comboHitbox.y = centerY;
    boss.chargeHitbox.y = centerY;
}

//increase damage when phase 2
function getDamage(boss, baseDamage) {
    return (boss.health <= 15) ? 1 : 0.5;
}

//ALL TINT was done by AI. This is just a visual look for second phase
function applyPermanentTint(boss) {
    if (boss.health <= 15 && !boss.isDead && !boss.isInvincible && boss.telegraphTimer <= 0 && !boss.isBlocking) {
        boss.setTint(0xFF66CC);
    } else if (boss.health > 15 && !boss.isInvincible && !boss.isBlocking && boss.telegraphTimer <= 0) {
        boss.clearTint();
    }
}

//boss takes damages. Complicated because had to micro nerf or micro buff the boss to make it not too easy not too hard
function bossTakeDamage(boss, scene, damage = 1, fromBack = false) {
    // If this is the final boss wrapper, delegate to its logic
    if (boss && boss.isFinalBoss) {
        if (typeof boss.finalBossTakeDamage === 'function') {
            boss.finalBossTakeDamage(damage);
        }
        return;
    }
    if (boss.isDead || boss.isInvincible) return;

    //hit streak logic: if the player hits the boss multiple times in a short period, the boss will block to prevent easy damage stacking. 
    const now = Date.now();
    if (now - boss.lastHitTime < 2000) boss.hitStreak++;
    else boss.hitStreak = 1;
    boss.lastHitTime = now;

    //boss defense logic: if the boss is low health, it will try to block after every hit to slow down the player and not just spam attacks to win.
    const shouldDefend = (boss.hitStreak >= 2 || (boss.health <= 15 && boss.hitStreak >= 1));
    if (shouldDefend && !boss.isBlocking && !boss.isDead && boss.staggerImmunityTimer <= 0 && !boss.isCharging && boss.blockCooldown <= 0) {
        //interrupts EVERYTHING
        boss.isAttacking = false;
        boss.isThrusting = false;
        boss.isCharging = false;
        boss.telegraphTimer = 0;
        boss.pendingAttack = null;

        //block properties
        boss.isBlocking = true;
        boss.blockTimer = 1500;
        boss.blockCooldown = 4000;
        boss.play("bossDefend");
        boss.reflectText.setVisible(true);
        boss.reflectText.setPosition(boss.x, boss.y - 120);
        boss.hitStreak = 0;
        return; 
    }

    //boss block logic: if the boss is blocking, it will reflect the damage back to the player so that player doesnt spam and actually learns to use their brains
    if (boss.isBlocking) {
        const reflectedDamage = damage * 0.5;
        if (!scene.player.isImmune) {
            scene.player.health = Math.max(0, scene.player.health - reflectedDamage);
            if (scene.player.health > 0) {
                scene.player.isHurting = true;
                scene.player.isImmune = true;
                if (!scene.player.deathPlayed) scene.player.play("hurt", true);
            } else {
                scene.player.canMove = false;
                scene.player.isDead = true;
                scene.player.deathPlayed = true;
                scene.player.play("death", true);
            }
            scene.sound.play("hurt", { volume: 0.5 });
        }
        return;
    }
    //normal damage application
    boss.health -= damage;

    //boss stun logic: if the boss is low health, it will stop attacking and thrusting to prevent the player from spamming attacks
    const canStun = (boss.staggerImmunityTimer <= 0 && !boss.isBlocking && !boss.isInvincible && !boss.isDead);
    if (canStun) {
        //interrupts EVERYTHING
        boss.isAttacking = false;
        boss.isThrusting = false;
        boss.isCharging = false;
        boss.telegraphTimer = 0;
        boss.pendingAttack = null;

        if (boss.anims.currentAnim?.key !== "bossHit") {
            boss.play("bossHit");
        }

        //boss knockback
        boss.setVelocityX((boss.flipX ? 1 : -1) * 150);
        boss.setVelocityY(-150);

        boss.isInvincible = true;
        boss.invincibleTimer = 400;
        boss.staggerImmunityTimer = 600; //cannot be restunned instantly
        boss.globalCooldown = 400;

        boss.setTint(0xffffff);
        scene.time.delayedCall(200, () => {
            if (boss && !boss.isDead && !boss.isAttacking && !boss.isThrusting && !boss.isCharging && !boss.isBlocking) {
                applyPermanentTint(boss);
            }
        });
    }

    //destroy boss when he dies
    if (boss.health <= 0) {
        boss.isDead = true;
        boss.setVelocity(0, 0);
        if (scene.anims.exists("bossDead")) boss.play("bossDead");
        boss.attackHitbox.destroy();
        boss.thrustHitbox.destroy();
        boss.chargeHitbox.destroy();
        boss.comboHitbox.destroy();
        boss.healthbarBg.destroy(); boss.healthbarFill.destroy();
        if (boss.nameText) boss.nameText.destroy();
        if (boss.reflectText) boss.reflectText.destroy();
        boss.once("animationcomplete", () => { boss.destroy(); scene.boss = null; });
        return;
    }

    //healthbar update
    if (boss.healthbarBg.visible) {
        const percent = boss.health / boss.maxHealth;
        boss.healthbarFill.width = 600 * percent;
        if (boss.health <= 15) boss.healthbarFill.setFillStyle(0xff66cc);
        else boss.healthbarFill.setFillStyle(0xff0000);
    }
    applyPermanentTint(boss);
}

//play warning sound before attacks
function playPerilousSound(scene) {
    if (scene.cache.audio.exists("perilous")) {
        if (!scene.sound.get("perilous")) {
            scene.sound.add("perilous");
        }
        scene.sound.play("perilous", { volume: 0.8 });
    }
}

//update boss (AI BEHAVIOR)
function updateBoss(scene) {
    const boss = scene.boss;
    if (!boss || boss.isDead) return;

    const player = scene.player;
    if (!player || player.isDead) {
        boss.setVelocityX(0);
        return;
    }
    
    const dt = scene.game.loop.delta; //calculates milliseconds before last frame (recommended action by AI to make it consistent across frame rates)
    if (boss.graceTimer > 0) boss.graceTimer -= dt;
    if (boss.invincibleTimer > 0) {
        boss.invincibleTimer -= dt;
        if (boss.invincibleTimer <= 0) boss.isInvincible = false;
    }
    if (boss.staggerImmunityTimer > 0) boss.staggerImmunityTimer -= dt;
    if (boss.attackCooldown > 0) boss.attackCooldown -= dt;
    if (boss.thrustCooldown > 0) boss.thrustCooldown -= dt;
    if (boss.chargeCooldown > 0) boss.chargeCooldown -= dt;
    if (boss.comboCooldown > 0) boss.comboCooldown -= dt;
    if (boss.blockCooldown > 0) boss.blockCooldown -= dt;
    if (boss.globalCooldown > 0) boss.globalCooldown -= dt;
     
    //blocking timer
    if (boss.blockTimer > 0) {
        boss.blockTimer -= dt;
        if (boss.anims.currentAnim?.key !== "bossDefend") {
            boss.play("bossDefend");
        }
        boss.setVelocityX(0);
        boss.reflectText.setVisible(true);
        boss.reflectText.setPosition(boss.x, boss.y - 120);

        //when block ends, boss is stunned for 1.5s
        if (boss.blockTimer <= 0) {
            boss.isBlocking = false;
            boss.reflectText.setVisible(false);
            boss.globalCooldown = 1500;
            boss.staggerImmunityTimer = 1500;
            applyPermanentTint(boss);
            boss.hitStreak = 0;
            boss.play("bossIdle");
        }
        return; //nothing else happens when blocking, so return early
    } else {
        if (boss.reflectText.visible) boss.reflectText.setVisible(false);
    }

    //healthbar follows camera
    if (boss.healthbarBg.visible && !boss.isDead) {
        const barX = scene.cameras.main.width / 2, barY = scene.cameras.main.height - 70;
        boss.healthbarBg.setPosition(barX, barY);
        boss.healthbarFill.setPosition(barX, barY);
        if (boss.nameText) boss.nameText.setPosition(barX, barY - 40);
    }

    const currentAnim = boss.anims.currentAnim;
    
    //wind up the animation before an attack
    if (boss.telegraphTimer > 0) {
        boss.telegraphTimer -= dt;
        boss.setVelocityX(0);

        //shows the first frame of the attack as a telegraph so player knows its coming and can recognize the attack patterns
        if (boss.telegraphFrame && boss.telegraphFrame !== boss.texture.key) {
            boss.setTexture(boss.telegraphFrame);
            boss.setFrame(0);
        }
        if (boss.telegraphTimer <= 0) {
            if (boss.pendingAttack === "attack") {
                boss.isAttacking = true;
                boss.play("bossAttack1");
                boss.once("animationcomplete", () => {
                    if (boss && !boss.isDead) {
                        boss.isAttacking = false;
                        boss.attackCooldown = 2000;
                        boss.globalCooldown = (boss.health <= 15) ? 400 : 800;
                        applyPermanentTint(boss);
                        boss.play("bossIdle");
                    }
                });
            } else if (boss.pendingAttack === "thrust") {
                boss.isThrusting = true;
                boss.play("bossThrust");
                boss.setVelocityX(boss.thrustSpeed * boss.direction);
                boss.once("animationcomplete", () => {
                    if (boss && !boss.isDead) {
                        boss.isThrusting = false;
                        boss.thrustCooldown = 3000;
                        boss.setVelocityX(0);
                        boss.globalCooldown = (boss.health <= 15) ? 400 : 800;
                        applyPermanentTint(boss);
                        boss.play("bossIdle");
                    }
                });
            }
            boss.pendingAttack = null;
            boss.telegraphFrame = null;
        }
        return;
    }

    //boss can escape from the player and reset, this is to prevent spamming from the player once more
    const distToPlayer = Phaser.Math.Distance.Between(player.x, player.y, boss.x, boss.y);
    const playerIsAttacking = (player.isAttacking || player.anims.currentAnim?.key?.includes("attack"));
    if (!boss.isBlocking && boss.globalCooldown <= 0 && !boss.isAttacking && !boss.isThrusting && !boss.isCharging && boss.chargeCooldown <= 0 && distToPlayer < 180 && playerIsAttacking) {
        boss.isCharging = true;
        boss.play("bossRun");
        const escapeDir = (player.x > boss.x) ? -1 : 1; //he will try to escape in the opposite direction of the player
        boss.flipX = escapeDir < 0;
        boss.setVelocityX(boss.chargeSpeed * escapeDir);
        boss.isInvincible = true; //invincible during the escape
        boss.invincibleTimer = 800;
        boss.once("animationcomplete", () => {
            if (boss && !boss.isDead) {
                boss.isCharging = false;
                boss.chargeCooldown = 10000; //has a cooldown though
                boss.setVelocityX(0);
                boss.isInvincible = false; 
                boss.globalCooldown = 600;
                applyPermanentTint(boss);
                boss.play("bossIdle");
            }
        });
        return;
    }
    

    //boss AI for attacks
    if (!boss.isBlocking && boss.globalCooldown <= 0 && !boss.isAttacking && !boss.isThrusting && !boss.isCharging && boss.telegraphTimer <= 0 && !boss.isInvincible) {
        const dx = player.x - boss.x, dy = player.y - boss.y;
        const distanceX = Math.abs(dx), distanceY = Math.abs(dy);
        boss.direction = dx > 0 ? 1 : -1;
        boss.flipX = boss.direction < 0;
        updateBossHitboxes(boss);
        
        //detect distance from player
        const inDetection = distanceX < boss.detectionRangeX && distanceY < boss.detectionRangeY;
        if (!inDetection) {
            boss.setVelocityX(0);
            if (currentAnim?.key !== "bossIdle") boss.play("bossIdle");
            return;
        }
        
        //walk towards the player
        boss.setVelocityX(boss.speed * boss.direction);
        if (currentAnim?.key !== "bossWalk") boss.play("bossWalk");

        const canAttack = boss.attackCooldown <= 0;
        const canThrust = boss.thrustCooldown <= 0;
        const canCharge = boss.chargeCooldown <= 0;
        const canCombo = boss.comboCooldown <= 0;
        const distX = distanceX;
        const inAttackHitbox = scene.physics.overlap(player, boss.attackHitbox);
        
        //combo is a powerful attack it will try to do to punish the player if they are stupid and try to tank hits too much. it teaches the player that you have to MOVE OUT of the WAY!!!!
        if (canCombo && inAttackHitbox && Math.random() < 0.2 && boss.health > 5) {
            playPerilousSound(scene);
            boss.isAttacking = true;
            boss.play("bossCombo");
            boss.setVelocityX(0);
            boss.once("animationcomplete", () => {
                if (boss && !boss.isDead) {
                    boss.isAttacking = false;
                    boss.comboCooldown = 5000;
                    boss.globalCooldown = (boss.health <= 15) ? 400 : 800;
                    applyPermanentTint(boss);
                    boss.play("bossIdle");
                }
            });
            return;
        }

        //running to close gap if player tries to run away 
        if (canCharge && distX > 150 && distX <= 350 && Math.random() < 0.35) {
            boss.isCharging = true;
            boss.play("bossRun");
            boss.setVelocityX(boss.chargeSpeed * boss.direction);
            boss.isInvincible = true;
            boss.invincibleTimer = 800;
            boss.once("animationcomplete", () => {
                if (boss && !boss.isDead) {
                    boss.isCharging = false;
                    boss.chargeCooldown = 10000;
                    boss.setVelocityX(0);
                    boss.isInvincible = false;
                    boss.globalCooldown = (boss.health <= 15) ? 400 : 800;
                    applyPermanentTint(boss);
                    boss.play("bossIdle");
                }
            });
            return;
        }

        //thrust attack (slow but far)
        if (canThrust && distX > 120 && distX <= 600 && Math.random() < 0.55) {
            playPerilousSound(scene);
            boss.telegraphTimer = 600;
            boss.pendingAttack = "thrust";
            boss.telegraphFrame = "bossThrust";
            boss.setVelocityX(0);
            const thrustAnim = scene.anims.get("bossThrust");
            if (thrustAnim && thrustAnim.frames[0]) {
                const frameName = thrustAnim.frames[0].frame;
                boss.setTexture(frameName.key);
                boss.setFrame(frameName.frame);
            }
            return;
        }
        //normal attack (fast and close)
        if (canAttack && inAttackHitbox && Math.random() < 0.65) {
            playPerilousSound(scene);
            boss.telegraphTimer = 600;
            boss.pendingAttack = "attack";
            boss.telegraphFrame = "bossAttack1";
            boss.setVelocityX(0);
            const attackAnim = scene.anims.get("bossAttack1");
            if (attackAnim && attackAnim.frames[0]) {
                const frameName = attackAnim.frames[0].frame;
                boss.setTexture(frameName.key);
                boss.setFrame(frameName.frame);
            }
            return;
        }
    } else {
        updateBossHitboxes(boss);
    }

    //apply damage to player
    const isAttackingNow = (boss.isAttacking || boss.isThrusting || boss.isCharging);
    const animKey = currentAnim?.key;
    const isAttackAnim = animKey === "bossAttack1" || animKey === "bossAttack2" ||
        animKey === "bossAttack3" || animKey === "bossCombo" ||
        animKey === "bossThrust" || animKey === "bossRun";

        //check if overlaps hitboxes
    if (isAttackingNow || isAttackAnim) {
        const dist = Phaser.Math.Distance.Between(player.x, player.y, boss.x, boss.y);
        const overlapsHitbox = scene.physics.overlap(player, boss.attackHitbox) ||
            scene.physics.overlap(player, boss.comboHitbox) ||
            scene.physics.overlap(player, boss.thrustHitbox) ||
            scene.physics.overlap(player, boss.chargeHitbox);
        //charge is the escape and close in, so it deals no damage
        let isCharge = (animKey === "bossRun" || boss.isCharging);

        //tried to make thrust jumpable (HEAVILY AI ASSISTED but i dont think it works)
        let thrustBlocked = false;
        if (animKey === "bossThrust" && player.body.velocity.y < -100 && player.y < boss.y - 30) {
            thrustBlocked = true;
        }
        
        const isVeryClose = (dist <= 150);
        const shouldDamage = !isCharge && (isVeryClose || overlapsHitbox) && !thrustBlocked;

        //damage player if in hitboxes
        if (shouldDamage && !player.isImmune) {
            if (isVeryClose || boss.graceTimer <= 0) {
                const damage = getDamage(boss, 1);
                player.health = Math.max(0, player.health - damage);

                if (player.health > 0) {
                    player.isHurting = true;
                    player.isImmune = true;
                    if (!player.deathPlayed) player.play("hurt", true);
                } else {
                    player.canMove = false;
                    player.isDead = true;
                    player.deathPlayed = true;
                    player.play("death", true);
                }
                scene.sound.play("hurt", { volume: 0.5 });
            }
        }
    }

    applyPermanentTint(boss); //apply pink to the boss when on second phase
}

export { loadBossAssets, createBossAnimations, spawnBoss, updateBoss, bossTakeDamage };