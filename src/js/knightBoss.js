// knightBoss.js – final: 100% consistent attack detection, large hitboxes, damage on every frame

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
}

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

function spawnBoss(scene) {
    let spawnPoint = scene.enemySpawns?.find(sp => sp.name === "knightSpawn");
    if (!spawnPoint) {
        console.error("❌ knightSpawn not found");
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

    boss.health = 30;
    boss.maxHealth = 30;
    boss.isDead = false;
    boss.isAttacking = false;
    boss.attacked = false;
    boss.isThrusting = false;
    boss.isCharging = false;
    boss.isBlocking = false;
    boss.isInvincible = false;
    boss.invincibleTimer = 0;
    boss.detectionRangeX = 1000;
    boss.detectionRangeY = 500;
    boss.speed = 120;
    boss.thrustSpeed = 550;
    boss.chargeSpeed = 800;
    boss.direction = 1;
    boss.attackCooldown = 0;
    boss.thrustCooldown = 0;
    boss.chargeCooldown = 0;
    boss.comboCooldown = 0;
    boss.blockCooldown = 0;
    boss.globalCooldown = 0;
    boss.hitStreak = 0;
    boss.lastHitTime = 0;
    boss.graceTimer = 0;
    boss.telegraphTimer = 0;
    boss.pendingAttack = null;
    boss.telegraphFrame = null;

    // Healthbar UI
    const barWidth = 400, barHeight = 30;
    const barX = scene.cameras.main.width / 2, barY = scene.cameras.main.height - 50;
    boss.healthbarBg = scene.add.rectangle(barX, barY, barWidth, barHeight, 0x000000, 0.8).setOrigin(0.5,0.5).setDepth(100).setScrollFactor(0);
    boss.healthbarFill = scene.add.rectangle(barX, barY, barWidth, barHeight, 0xff0000, 1).setOrigin(0.5,0.5).setDepth(101).setScrollFactor(0);
    boss.healthbarText = scene.add.text(barX, barY, `${boss.health}/${boss.maxHealth}`, { fontSize:"20px", fontFamily:"monospace", color:"#ffffff" }).setOrigin(0.5,0.5).setDepth(102).setScrollFactor(0);
    boss.healthbarBg.setVisible(false);
    boss.healthbarFill.setVisible(false);
    boss.healthbarText.setVisible(false);
    boss.setHealthbarVisible = (visible) => {
        if (boss.isDead) return;
        boss.healthbarBg.setVisible(visible);
        boss.healthbarFill.setVisible(visible);
        boss.healthbarText.setVisible(visible);
        if (visible) { 
            const percent = boss.health / boss.maxHealth;
            boss.healthbarFill.width = 400 * percent;
            boss.healthbarText.setText(`${boss.health}/${boss.maxHealth}`);
            if (boss.health <= 15) boss.healthbarFill.setFillStyle(0xff66cc);
            else boss.healthbarFill.setFillStyle(0xff0000);
        }
    };

    // "REFLECTION" text
    boss.reflectText = scene.add.text(0, 0, "REFLECTION", {
        fontSize: "24px",
        fontFamily: "monospace",
        color: "#ff0000",
        stroke: "#000000",
        strokeThickness: 3,
        fontWeight: "bold"
    }).setOrigin(0.5, 0).setDepth(200).setScrollFactor(1);
    boss.reflectText.setVisible(false);

    // Hitboxes – extremely large for consistency
    boss.attackHitbox = scene.add.rectangle(0,0,400,200,0xff0000,0.3).setOrigin(0.5,0.5);
    scene.physics.add.existing(boss.attackHitbox);
    boss.attackHitbox.body.setAllowGravity(false).setImmovable(true);
    boss.thrustHitbox = scene.add.rectangle(0,0,350,40,0x00ff00,0.3).setOrigin(0.5,0.5);
    scene.physics.add.existing(boss.thrustHitbox);
    boss.thrustHitbox.body.setAllowGravity(false).setImmovable(true);
    boss.chargeHitbox = scene.add.rectangle(0,0,240,140,0xffff00,0.3).setOrigin(0.5,0.5);
    scene.physics.add.existing(boss.chargeHitbox);
    boss.chargeHitbox.body.setAllowGravity(false).setImmovable(true);
    boss.chargeHitbox.setVisible(false);
    boss.comboHitbox = scene.add.rectangle(0,0,400,200,0xff66ff,0.3).setOrigin(0.5,0.5);
    scene.physics.add.existing(boss.comboHitbox);
    boss.comboHitbox.body.setAllowGravity(false).setImmovable(true);
    boss.comboHitbox.setVisible(false);

    scene.physics.add.overlap(scene.player, boss, () => { boss.graceTimer = 1500; });
    scene.boss = boss;
    return boss;
}

function updateBossHitboxes(boss) {
    if (boss.isDead) return;
    const centerY = boss.y;
    const attackOffset = 0;   // centered on boss
    const thrustOffset = 150;  // forward enough
    const chargeOffset = 100;
    const comboOffset = 0;
    if (boss.flipX) {
        boss.attackHitbox.x = boss.x;
        boss.thrustHitbox.x = boss.x - thrustOffset;
        boss.chargeHitbox.x = boss.x - chargeOffset;
        boss.comboHitbox.x = boss.x;
    } else {
        boss.attackHitbox.x = boss.x;
        boss.thrustHitbox.x = boss.x + thrustOffset;
        boss.chargeHitbox.x = boss.x + chargeOffset;
        boss.comboHitbox.x = boss.x;
    }
    boss.attackHitbox.y = boss.thrustHitbox.y = boss.chargeHitbox.y = boss.comboHitbox.y = centerY;
}

function getDamage(boss, baseDamage) {
    return (boss.health <= 15) ? baseDamage * 2 : baseDamage;
}

function applyPermanentTint(boss) {
    if (boss.health <= 15 && !boss.isDead && !boss.isInvincible && boss.telegraphTimer <= 0) {
        boss.setTint(0xff66cc);
    } else if (boss.health > 15 && !boss.isInvincible && !boss.isBlocking && boss.telegraphTimer <= 0) {
        boss.clearTint();
    }
}

function bossTakeDamage(boss, scene, damage = 1, fromBack = false) {
    if (boss.isDead || boss.isInvincible) return;

    const now = Date.now();
    if (now - boss.lastHitTime < 3000) boss.hitStreak++;
    else boss.hitStreak = 1;
    boss.lastHitTime = now;

    if (boss.isBlocking) {
        const halfDamage = 0.5;
        boss.health -= halfDamage;
        if (!scene.player.isImmune) {
            scene.player.health = Math.max(0, scene.player.health - halfDamage);
            if (scene.player.health > 0) {
                scene.player.isHurting = true; scene.player.isImmune = true;
                scene.player.play("hurt", true);
            } else {
                scene.player.canMove = false; scene.player.isDead = true;
                scene.player.play("death", true);
            }
            scene.sound.play("hurt", { volume: 0.5 });
        }
        boss.isBlocking = false;
        boss.blockTimer = 0;
        boss.reflectText.setVisible(false);
        boss.clearTint();
        boss.setTint(0x888888);
        scene.time.delayedCall(150, () => { if (boss && !boss.isDead) applyPermanentTint(boss); });
    } else {
        boss.health -= damage;
    }

    // Block mode after 2 hits within 3 seconds
    if (boss.hitStreak >= 2 && !boss.isBlocking && !boss.isDead) {
        boss.isBlocking = true;
        boss.blockTimer = 1500;
        boss.blockCooldown = 4000;
        boss.play("bossDefend");
        boss.reflectText.setVisible(true);
        boss.hitStreak = 0;
        console.log("Boss block!");
    }

    if (boss.health <= 0) {
        boss.isDead = true;
        boss.setVelocity(0,0);
        if (scene.anims.exists("bossDead")) boss.play("bossDead");
        boss.attackHitbox.destroy();
        boss.thrustHitbox.destroy();
        boss.chargeHitbox.destroy();
        boss.comboHitbox.destroy();
        boss.healthbarBg.destroy(); boss.healthbarFill.destroy(); boss.healthbarText.destroy();
        if (boss.reflectText) boss.reflectText.destroy();
        boss.once("animationcomplete", () => { boss.destroy(); scene.boss = null; });
        return;
    } else if (!boss.isBlocking && !boss.isInvincible) {
        boss.setTint(0xffffff);
        boss.isInvincible = true;
        boss.invincibleTimer = 400;
        scene.time.delayedCall(200, () => {
            if (boss && !boss.isDead && !boss.isAttacking && !boss.isThrusting && !boss.isCharging && !boss.isBlocking) {
                applyPermanentTint(boss);
            }
        });
        boss.setVelocityX((boss.flipX ? 1 : -1) * 150);
        boss.setVelocityY(-150);
    }

    if (boss.healthbarBg.visible) {
        const percent = boss.health / boss.maxHealth;
        boss.healthbarFill.width = 400 * percent;
        boss.healthbarText.setText(`${boss.health}/${boss.maxHealth}`);
        if (boss.health <= 15) boss.healthbarFill.setFillStyle(0xff66cc);
        else boss.healthbarFill.setFillStyle(0xff0000);
    }
    applyPermanentTint(boss);
}

function updateBoss(scene) {
    const boss = scene.boss;
    if (!boss || boss.isDead) return;
    const player = scene.player;
    if (!player || player.isDead) { boss.setVelocityX(0); return; }

    const dt = scene.game.loop.delta;
    if (boss.graceTimer > 0) boss.graceTimer -= dt;
    if (boss.invincibleTimer > 0) {
        boss.invincibleTimer -= dt;
        if (boss.invincibleTimer <= 0) boss.isInvincible = false;
    }
    if (boss.attackCooldown > 0) boss.attackCooldown -= dt;
    if (boss.thrustCooldown > 0) boss.thrustCooldown -= dt;
    if (boss.chargeCooldown > 0) boss.chargeCooldown -= dt;
    if (boss.comboCooldown > 0) boss.comboCooldown -= dt;
    if (boss.blockCooldown > 0) boss.blockCooldown -= dt;
    if (boss.globalCooldown > 0) boss.globalCooldown -= dt;

    // Block handling – highest priority
    if (boss.blockTimer > 0) {
        boss.blockTimer -= dt;
        if (boss.blockTimer <= 0) {
            boss.isBlocking = false;
            boss.reflectText.setVisible(false);
            applyPermanentTint(boss);
        } else {
            if (boss.anims.currentAnim?.key !== "bossDefend") boss.play("bossDefend");
            boss.setVelocityX(0);
            if (boss.reflectText.visible) boss.reflectText.setPosition(boss.x, boss.y - 120);
            return;
        }
    }

    // Global cooldown: hurt animation
    if (boss.globalCooldown > 0 && !boss.isBlocking && boss.telegraphTimer <= 0) {
        if (boss.anims.currentAnim?.key !== "bossHit") boss.play("bossHit");
        boss.setVelocityX(0);
        return;
    }

    if (boss.reflectText.visible) boss.reflectText.setPosition(boss.x, boss.y - 120);
    if (boss.healthbarBg.visible && !boss.isDead) {
        const barX = scene.cameras.main.width / 2, barY = scene.cameras.main.height - 50;
        boss.healthbarBg.setPosition(barX, barY);
        boss.healthbarFill.setPosition(barX, barY);
        boss.healthbarText.setPosition(barX, barY);
    }

    const currentAnim = boss.anims.currentAnim;

    // Telegraph phase (normal attack and thrust)
    if (boss.telegraphTimer > 0) {
        boss.telegraphTimer -= dt;
        boss.setVelocityX(0);
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
                        boss.attacked = false;
                        boss.attackCooldown = 1500;
                        boss.globalCooldown = (boss.health <= 15) ? 250 : 500;
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
                        boss.attacked = false;
                        boss.thrustCooldown = 2000;
                        boss.setVelocityX(0);
                        boss.globalCooldown = (boss.health <= 15) ? 250 : 500;
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

    // Normal AI
    if (!boss.isBlocking && boss.globalCooldown <= 0 && !boss.isAttacking && !boss.isThrusting && !boss.isCharging && boss.telegraphTimer <= 0 && !boss.isInvincible) {
        const dx = player.x - boss.x, dy = player.y - boss.y;
        const distanceX = Math.abs(dx), distanceY = Math.abs(dy);
        boss.direction = dx > 0 ? 1 : -1;
        boss.flipX = boss.direction < 0;
        updateBossHitboxes(boss);

        const inDetection = distanceX < boss.detectionRangeX && distanceY < boss.detectionRangeY;
        if (!inDetection) {
            boss.setVelocityX(0);
            if (currentAnim?.key !== "bossIdle") boss.play("bossIdle");
            return;
        }

        boss.setVelocityX(boss.speed * boss.direction);
        if (currentAnim?.key !== "bossWalk") boss.play("bossWalk");

        const canAttack = boss.attackCooldown <= 0;
        const canThrust = boss.thrustCooldown <= 0;
        const canCharge = boss.chargeCooldown <= 0;
        const canCombo = boss.comboCooldown <= 0;
        const distToPlayer = distanceX;
        const inAttackHitbox = scene.physics.overlap(player, boss.attackHitbox);

        // COMBO – instant
        if (canCombo && inAttackHitbox && Math.random() < 0.2 && boss.health > 5) {
            boss.isAttacking = true;
            boss.play("bossCombo");
            boss.setVelocityX(0);
            boss.once("animationcomplete", () => {
                if (boss && !boss.isDead) {
                    boss.isAttacking = false;
                    boss.attacked = false;
                    boss.comboCooldown = 4000;
                    boss.globalCooldown = (boss.health <= 15) ? 250 : 500;
                    applyPermanentTint(boss);
                    boss.play("bossIdle");
                }
            });
            return;
        }
        // CHARGE – instant
        if (canCharge && distToPlayer > 150 && distToPlayer <= 350 && Math.random() < 0.35) {
            boss.isCharging = true;
            boss.play("bossRun");
            boss.setVelocityX(boss.chargeSpeed * boss.direction);
            boss.isInvincible = true;
            boss.invincibleTimer = 800;
            boss.once("animationcomplete", () => {
                if (boss && !boss.isDead) {
                    boss.isCharging = false;
                    boss.attacked = false;
                    boss.chargeCooldown = 3000;
                    boss.setVelocityX(0);
                    boss.globalCooldown = (boss.health <= 15) ? 250 : 500;
                    applyPermanentTint(boss);
                    boss.play("bossIdle");
                }
            });
            return;
        }
        // THRUST – 0.6s telegraph
        if (canThrust && distToPlayer > 120 && distToPlayer <= 600 && Math.random() < 0.55) {
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
        // NORMAL ATTACK – 0.6s telegraph
        if (canAttack && inAttackHitbox && Math.random() < 0.65) {
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

    // --------------------------------------------------------------
    // DAMAGE APPLICATION – CONSISTENT EVERY FRAME WITH EXTRA MARGIN
    // --------------------------------------------------------------
    function tryDamage(hitbox, damageAmount) {
        if (!hitbox) return false;
        // Check direct overlap with hitbox
        let hit = scene.physics.overlap(player, hitbox);
        // Also check overlap with boss's own body as a fallback (for very close hits)
        if (!hit) hit = scene.physics.overlap(player, boss);
        // Extra margin: if player is within 30px of hitbox center, also consider hit
        if (!hit && hitbox) {
            const dist = Phaser.Math.Distance.Between(player.x, player.y, hitbox.x, hitbox.y);
            if (dist < 70) hit = true;
        }
        if (hit && !player.isImmune && boss.graceTimer <= 0) {
            const dmg = getDamage(boss, damageAmount);
            player.health = Math.max(0, player.health - dmg);
            if (player.health > 0) {
                player.isHurting = true; player.isImmune = true;
                player.play("hurt", true);
            } else {
                player.canMove = false; player.isDead = true;
                player.play("death", true);
            }
            scene.sound.play("hurt", { volume: 0.5 });
            return true;
        }
        return false;
    }

    if (boss.isAttacking && !boss.attacked && currentAnim?.key === "bossAttack1") {
        // Damage on every frame (any frame)
        if (tryDamage(boss.attackHitbox, 1)) {
            boss.attacked = true;
        }
    }
    if (boss.isAttacking && !boss.attacked && currentAnim?.key === "bossCombo") {
        const frame = boss.anims.currentFrame;
        const damageFrames = [2,3,4, 7,8,9, 12,13];
        if (frame && damageFrames.includes(frame.index)) {
            if (tryDamage(boss.comboHitbox, 1)) {
                boss.attacked = true;
            }
        }
    }
    if (boss.isThrusting && !boss.attacked && currentAnim?.key === "bossThrust") {
        const frame = boss.anims.currentFrame;
        if (frame && frame.index >= 2 && frame.index <= 4) {
            // Thrust also checks that player is not overlapping boss body (to avoid cheap hits)
            const overlapBody = scene.physics.overlap(player, boss);
            if (!overlapBody && tryDamage(boss.thrustHitbox, 1)) {
                boss.attacked = true;
            }
        }
    }

    if ((boss.isAttacking && currentAnim?.key !== "bossAttack1" && currentAnim?.key !== "bossCombo") ||
        (boss.isThrusting && currentAnim?.key !== "bossThrust") ||
        (boss.isCharging && currentAnim?.key !== "bossRun")) {
        boss.attacked = false;
    }

    applyPermanentTint(boss);
}

export { loadBossAssets, createBossAnimations, spawnBoss, updateBoss, bossTakeDamage };