// knightBoss.js – attacks always deal damage, increased damage values

function loadBossAssets(scene) {
    const folder = "assets/enemySheet/Skeleton/Sprite Sheets/Knight_1/";
    scene.load.spritesheet("bossAttack", folder + "Attack 1.png", { frameWidth: 86, frameHeight: 86 });
    scene.load.spritesheet("bossWalk", folder + "Walk.png", { frameWidth: 72, frameHeight: 86 });
    scene.load.spritesheet("bossIdle", folder + "Idle.png", { frameWidth: 72, frameHeight: 86 });
    scene.load.spritesheet("bossThrust", folder + "Run+Attack.png", { frameWidth: 76, frameHeight: 86 });
    scene.load.spritesheet("bossHurt", folder + "Hurt.png", { frameWidth: 70, frameHeight: 86 });
    scene.load.spritesheet("bossDead", folder + "Dead.png", { frameWidth: 80, frameHeight: 86 });
    scene.load.spritesheet("bossRun", folder + "Run.png", { frameWidth: 71, frameHeight: 86 });
    scene.load.spritesheet("bossDefend", folder + "Defend.png", { frameWidth: 80, frameHeight: 86 });
}

function createBossAnimations(scene) {
    if (scene.textures.get("bossAttack")) {
        scene.anims.create({ key: "bossAttack", frames: scene.anims.generateFrameNumbers("bossAttack", { start: 0, end: 4 }), frameRate: 8, repeat: 0 });
    }
    if (scene.textures.get("bossWalk")) {
        scene.anims.create({ key: "bossWalk", frames: scene.anims.generateFrameNumbers("bossWalk", { start: 0, end: 7 }), frameRate: 6, repeat: -1 });
    }
    if (scene.textures.get("bossIdle")) {
        scene.anims.create({ key: "bossIdle", frames: scene.anims.generateFrameNumbers("bossIdle", { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
    }
    if (scene.textures.get("bossThrust")) {
        scene.anims.create({ key: "bossThrust", frames: scene.anims.generateFrameNumbers("bossThrust", { start: 0, end: 5 }), frameRate: 8, repeat: 0 });
    }
    if (scene.textures.get("bossHurt")) {
        scene.anims.create({ key: "bossHit", frames: scene.anims.generateFrameNumbers("bossHurt", { start: 0, end: 1 }), frameRate: 6, repeat: 0 });
    }
    if (scene.textures.get("bossDead")) {
        scene.anims.create({ key: "bossDead", frames: scene.anims.generateFrameNumbers("bossDead", { start: 0, end: 5 }), frameRate: 6, repeat: 0 });
    }
    if (scene.textures.get("bossRun")) {
        scene.anims.create({ key: "bossRun", frames: scene.anims.generateFrameNumbers("bossRun", { start: 0, end: 6 }), frameRate: 10, repeat: 0 });
    }
    if (scene.textures.get("bossDefend")) {
        scene.anims.create({ key: "bossDefend", frames: scene.anims.generateFrameNumbers("bossDefend", { start: 0, end: 4 }), frameRate: 10, repeat: 0 });
    }
}

function spawnBoss(scene) {
    let spawnPoint = scene.enemySpawns?.find(sp => sp.name === "knightSpawn");
    if (!spawnPoint) {
        console.error("❌ knightSpawn not found in enemySpawns");
        return null;
    }

    const x = spawnPoint.x;
    const groundY = spawnPoint.y;
    const bodyWidth = 80;
    const bodyHeight = 80;
    let y = groundY - bodyHeight / 2 + 140;

    const boss = scene.physics.add.sprite(x, y, "bossIdle")
        .setOrigin(0.5, 0.5)
        .setScale(2)
        .setDepth(20);

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
    boss.isRetreating = false;
    boss.retreatTimer = 0;
    boss.detectionRangeX = 1000;
    boss.detectionRangeY = 500;
    boss.attackRange = 100;
    boss.thrustRange = 600;
    boss.projectileRange = 500;
    boss.speed = 80;
    boss.thrustSpeed = 450;
    boss.chargeSpeed = 500;
    boss.direction = 1;
    
    boss.attackCooldown = 0;
    boss.thrustCooldown = 0;
    boss.projectileCooldown = 0;
    boss.chargeCooldown = 0;
    boss.blockCooldown = 0;
    boss.hitStreak = 0;
    boss.lastHitTime = 0;
    boss.graceTimer = 0;
    
    boss.telegraphTimer = 0;
    boss.pendingAttack = null;

    // Healthbar
    const barWidth = 400;
    const barHeight = 30;
    const barX = scene.cameras.main.width / 2;
    const barY = scene.cameras.main.height - 50;
    boss.healthbarBg = scene.add.rectangle(barX, barY, barWidth, barHeight, 0x000000, 0.8)
        .setOrigin(0.5, 0.5).setDepth(100).setScrollFactor(0);
    boss.healthbarFill = scene.add.rectangle(barX, barY, barWidth, barHeight, 0xff0000, 1)
        .setOrigin(0.5, 0.5).setDepth(101).setScrollFactor(0);
    boss.healthbarText = scene.add.text(barX, barY, `${boss.health}/${boss.maxHealth}`, {
        fontSize: "20px", fontFamily: "monospace", color: "#ffffff"
    }).setOrigin(0.5, 0.5).setDepth(102).setScrollFactor(0);
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
        }
    };

    // Hitboxes – even wider
    boss.attackHitbox = scene.add.rectangle(0, 0, 250, 140, 0xff0000, 0.3).setOrigin(0.5, 0.5);
    scene.physics.add.existing(boss.attackHitbox);
    boss.attackHitbox.body.setAllowGravity(false);
    boss.attackHitbox.body.setImmovable(true);

    boss.thrustHitbox = scene.add.rectangle(0, 0, 550, 100, 0x00ff00, 0.3).setOrigin(0.5, 0.5);
    scene.physics.add.existing(boss.thrustHitbox);
    boss.thrustHitbox.body.setAllowGravity(false);
    boss.thrustHitbox.body.setImmovable(true);

    boss.chargeHitbox = scene.add.rectangle(0, 0, 260, 150, 0xffff00, 0.3).setOrigin(0.5, 0.5);
    scene.physics.add.existing(boss.chargeHitbox);
    boss.chargeHitbox.body.setAllowGravity(false);
    boss.chargeHitbox.body.setImmovable(true);
    boss.chargeHitbox.setVisible(false);

    scene.physics.add.overlap(scene.player, boss, () => {
        boss.graceTimer = 1500;
    });

    scene.boss = boss;
    return boss;
}

function updateBossHitboxes(boss) {
    if (boss.isDead) return;
    const centerY = boss.y;
    const attackOffset = 100;
    const thrustOffset = 240;
    const chargeOffset = 110;

    if (boss.flipX) {
        boss.attackHitbox.x = boss.x - attackOffset;
        boss.thrustHitbox.x = boss.x - thrustOffset;
        boss.chargeHitbox.x = boss.x - chargeOffset;
    } else {
        boss.attackHitbox.x = boss.x + attackOffset;
        boss.thrustHitbox.x = boss.x + thrustOffset;
        boss.chargeHitbox.x = boss.x + chargeOffset;
    }
    boss.attackHitbox.y = boss.thrustHitbox.y = boss.chargeHitbox.y = centerY;
}

function shootProjectile(boss, scene) {
    const direction = boss.flipX ? -1 : 1;
    const startX = boss.x + (direction * 60);
    const startY = boss.y - 30;
    const projectile = scene.add.circle(startX, startY, 14, 0xff6600);
    projectile.setStrokeStyle(2, 0xffaa00);
    scene.physics.add.existing(projectile);
    projectile.body.setVelocityX(400 * direction);
    projectile.body.setVelocityY(-100);
    projectile.body.setAllowGravity(true);
    projectile.body.setBounce(0.2);
    scene.time.delayedCall(2500, () => { if (projectile) projectile.destroy(); });
    scene.physics.add.overlap(projectile, scene.player, (p, player) => {
        if (!player.isImmune && boss.graceTimer <= 0) {
            player.health = Math.max(0, player.health - 1);
            if (player.health > 0) {
                player.isHurting = true; player.isImmune = true;
                player.play("hurt", true);
            } else {
                player.canMove = false; player.isDead = true;
                player.play("death", true);
            }
            scene.sound.play("hurt", { volume: 0.5 });
            projectile.destroy();
        }
    });
}

function bossTakeDamage(boss, scene, damage = 1, fromBack = false) {
    if (boss.isDead) return;
    if (boss.isRetreating) return;

    const now = Date.now();
    if (now - boss.lastHitTime < 3000) {
        boss.hitStreak++;
    } else {
        boss.hitStreak = 1;
    }
    boss.lastHitTime = now;

    let actualDamage = damage;
    if (boss.isBlocking) {
        actualDamage = Math.max(1, Math.floor(damage / 2));
        boss.isBlocking = false;
        boss.blockTimer = 0;
        boss.clearTint();
        boss.setTint(0x888888);
        scene.time.delayedCall(150, () => { if (boss && !boss.isDead) boss.clearTint(); });
    }
    boss.health -= actualDamage;

    if (boss.hitStreak >= 3 && !boss.isRetreating && !boss.isDead) {
        boss.isRetreating = true;
        boss.retreatTimer = 1000;
        boss.setTint(0xffffff);
        const retreatDir = boss.flipX ? -1 : 1;
        boss.setVelocityX(-1500 * retreatDir);
        boss.setVelocityY(-200);
        if (scene.anims.exists("bossDefend")) boss.play("bossDefend");
        console.log("Boss retreats!");
    }

    if (boss.health <= 0) {
        boss.isDead = true;
        boss.setVelocity(0, 0);
        if (scene.anims.exists("bossDead")) boss.play("bossDead");
        boss.attackHitbox.destroy();
        boss.thrustHitbox.destroy();
        boss.chargeHitbox.destroy();
        boss.healthbarBg.destroy();
        boss.healthbarFill.destroy();
        boss.healthbarText.destroy();
        boss.once("animationcomplete", () => { boss.destroy(); scene.boss = null; });
        return;
    } else {
        if (scene.anims.exists("bossHit")) boss.play("bossHit");
        boss.setVelocityX(0);
        boss.setVelocityX((boss.flipX ? 1 : -1) * 200);
        boss.setVelocityY(-200);
        boss.once("animationcomplete", () => {
            if (boss && !boss.isDead && !boss.isAttacking && !boss.isThrusting && !boss.isCharging) boss.play("bossIdle");
        });
    }

    if (boss.healthbarBg.visible) {
        const percent = boss.health / boss.maxHealth;
        boss.healthbarFill.width = 400 * percent;
        boss.healthbarText.setText(`${boss.health}/${boss.maxHealth}`);
    }
}

function updateBoss(scene) {
    const boss = scene.boss;
    if (!boss || boss.isDead) return;
    const player = scene.player;
    if (!player || player.isDead) { boss.setVelocityX(0); return; }

    if (boss.graceTimer > 0) boss.graceTimer -= scene.game.loop.delta;

    if (boss.healthbarBg.visible && !boss.isDead) {
        const barX = scene.cameras.main.width / 2;
        const barY = scene.cameras.main.height - 50;
        boss.healthbarBg.setPosition(barX, barY);
        boss.healthbarFill.setPosition(barX, barY);
        boss.healthbarText.setPosition(barX, barY);
    }

    const dt = scene.game.loop.delta;
    if (boss.attackCooldown > 0) boss.attackCooldown -= dt;
    if (boss.thrustCooldown > 0) boss.thrustCooldown -= dt;
    if (boss.projectileCooldown > 0) boss.projectileCooldown -= dt;
    if (boss.chargeCooldown > 0) boss.chargeCooldown -= dt;
    if (boss.blockCooldown > 0) boss.blockCooldown -= dt;
    if (boss.retreatTimer > 0) {
        boss.retreatTimer -= dt;
        if (boss.retreatTimer <= 0) {
            boss.isRetreating = false;
            boss.clearTint();
            boss.hitStreak = 0;
            console.log("Retreat ends");
        } else {
            boss.setVelocityX(boss.body.velocity.x * 0.95);
            return;
        }
    }

    if (boss.blockTimer > 0) {
        boss.blockTimer -= dt;
        if (boss.blockTimer <= 0) {
            boss.isBlocking = false;
            boss.clearTint();
        }
    }

    const currentAnim = boss.anims.currentAnim;
    if (currentAnim?.key === "bossHit" && boss.anims.isPlaying) {
        boss.setVelocityX(0);
        return;
    }

    // Telegraph
    if (boss.telegraphTimer > 0) {
        boss.telegraphTimer -= dt;
        boss.setVelocityX(0);
        boss.setTint(0xffffff);
        if (boss.telegraphTimer <= 0) {
            boss.clearTint();
            if (boss.pendingAttack === "attack") {
                boss.isAttacking = true;
                boss.play("bossAttack");
                boss.setVelocityX(0);
                boss.once("animationcomplete", () => {
                    if (boss && !boss.isDead) {
                        boss.isAttacking = false;
                        boss.attacked = false;
                        boss.attackCooldown = 1200;
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
                        boss.play("bossIdle");
                    }
                });
            } else if (boss.pendingAttack === "projectile") {
                shootProjectile(boss, scene);
                boss.projectileCooldown = 2500;
                boss.play("bossIdle");
            } else if (boss.pendingAttack === "charge") {
                boss.isCharging = true;
                boss.play("bossRun");
                boss.setVelocityX(boss.chargeSpeed * boss.direction);
                boss.once("animationcomplete", () => {
                    if (boss && !boss.isDead) {
                        boss.isCharging = false;
                        boss.attacked = false;
                        boss.chargeCooldown = 3000;
                        boss.setVelocityX(0);
                        boss.play("bossIdle");
                    }
                });
            }
            boss.pendingAttack = null;
        }
        return;
    }

    // Normal AI
    if (!boss.isRetreating && !boss.isAttacking && !boss.isThrusting && !boss.isCharging && boss.telegraphTimer <= 0) {
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        const distanceX = Math.abs(dx);
        const distanceY = Math.abs(dy);
        boss.direction = dx > 0 ? 1 : -1;
        boss.flipX = boss.direction < 0;
        updateBossHitboxes(boss);

        const inDetection = distanceX < boss.detectionRangeX && distanceY < boss.detectionRangeY;
        if (!inDetection) {
            boss.setVelocityX(0);
            if (currentAnim?.key !== "bossIdle") boss.play("bossIdle");
            return;
        }

        if (distanceX < 100 && boss.retreatTimer <= 0) {
            boss.retreatTimer = 800;
            const retreatDir = boss.direction === 1 ? -1 : 1;
            boss.setVelocityX(300 * retreatDir);
            boss.play("bossWalk");
            return;
        }

        boss.setVelocityX(boss.speed * boss.direction);
        if (currentAnim?.key !== "bossWalk") boss.play("bossWalk");

        const canAttack = boss.attackCooldown <= 0;
        const canThrust = boss.thrustCooldown <= 0;
        const canProjectile = boss.projectileCooldown <= 0;
        const canCharge = boss.chargeCooldown <= 0;
        const distToPlayer = distanceX;
        const inAttackHitbox = scene.physics.overlap(player, boss.attackHitbox);

        if (canProjectile && distToPlayer > 150 && distToPlayer <= boss.projectileRange && Math.random() < 0.4) {
            boss.telegraphTimer = 800;
            boss.pendingAttack = "projectile";
            boss.setVelocityX(0);
            return;
        }
        if (canCharge && distToPlayer > 130 && distToPlayer <= 320 && Math.random() < 0.35) {
            boss.telegraphTimer = 900;
            boss.pendingAttack = "charge";
            boss.setVelocityX(0);
            return;
        }
        if (canThrust && distToPlayer > 120 && distToPlayer <= boss.thrustRange && Math.random() < 0.55) {
            boss.telegraphTimer = 800;
            boss.pendingAttack = "thrust";
            boss.setVelocityX(0);
            return;
        }
        if (canAttack && inAttackHitbox && Math.random() < 0.65) {
            boss.telegraphTimer = 700;
            boss.pendingAttack = "attack";
            boss.setVelocityX(0);
            return;
        }

        if (!boss.isBlocking && boss.blockCooldown <= 0 && boss.health > 5 && Math.random() < 0.18 && distToPlayer < 160) {
            boss.isBlocking = true;
            boss.blockTimer = 1200;
            boss.blockCooldown = 4000;
            boss.setTint(0x44aaff);
            boss.setVelocityX(0);
            boss.play("bossIdle");
        }
    } else {
        updateBossHitboxes(boss);
    }

    // -------------------------
    // DAMAGE APPLICATION – ALWAYS DEAL DAMAGE ON ANY FRAME
    // -------------------------
    if (boss.isAttacking && !boss.attacked && currentAnim?.key === "bossAttack") {
        // Damage on any frame (instantly when attack starts, but only once per attack)
        if (!boss.attacked) {
            if (scene.physics.overlap(player, boss.attackHitbox) && !player.isImmune && boss.graceTimer <= 0) {
                boss.attacked = true;
                const dmg = 2; // attack deals 2 damage
                player.health = Math.max(0, player.health - dmg);
                if (player.health > 0) {
                    player.isHurting = true; player.isImmune = true;
                    player.play("hurt", true);
                } else {
                    player.canMove = false; player.isDead = true;
                    player.play("death", true);
                }
                scene.sound.play("hurt", { volume: 0.5 });
            }
        }
    }
    if (boss.isThrusting && !boss.attacked && currentAnim?.key === "bossThrust") {
        if (!boss.attacked) {
            if (scene.physics.overlap(player, boss.thrustHitbox) && !player.isImmune && boss.graceTimer <= 0) {
                boss.attacked = true;
                const dmg = 2;
                player.health = Math.max(0, player.health - dmg);
                if (player.health > 0) {
                    player.isHurting = true; player.isImmune = true;
                    player.play("hurt", true);
                } else {
                    player.canMove = false; player.isDead = true;
                    player.play("death", true);
                }
                scene.sound.play("hurt", { volume: 0.5 });
            }
        }
    }
    if (boss.isCharging && !boss.attacked && currentAnim?.key === "bossRun") {
        if (!boss.attacked) {
            if (scene.physics.overlap(player, boss.chargeHitbox) && !player.isImmune && boss.graceTimer <= 0) {
                boss.attacked = true;
                const dmg = 3; // charge deals 3 damage
                player.health = Math.max(0, player.health - dmg);
                if (player.health > 0) {
                    player.isHurting = true; player.isImmune = true;
                    player.play("hurt", true);
                } else {
                    player.canMove = false; player.isDead = true;
                    player.play("death", true);
                }
                scene.sound.play("hurt", { volume: 0.5 });
            }
        }
    }

    // Reset attacked flag when animation ends or changes
    if ((boss.isAttacking && currentAnim?.key !== "bossAttack") ||
        (boss.isThrusting && currentAnim?.key !== "bossThrust") ||
        (boss.isCharging && currentAnim?.key !== "bossRun")) {
        boss.attacked = false;
    }

    if (boss.isBlocking && boss.blockTimer <= 0) {
        boss.isBlocking = false;
        boss.clearTint();
    }
}

export { loadBossAssets, createBossAnimations, spawnBoss, updateBoss, bossTakeDamage };