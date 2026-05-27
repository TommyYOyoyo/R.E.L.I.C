// =========================
// MagmaBoss (Final Boss)
// =========================
// Notes:
// - Source sprite frame size: 288x166
// - Real visible body can be smaller because of heavy transparent padding

class MagmaBoss {
	constructor({ x = 0, y = 0, target = null } = {}) {
		// --- Position / movement ---
		this.x = x;
		this.y = y;
		this.vx = 0;
		this.vy = 0;
		this.gravity = 1700;
		this.groundY = y;
		this.isGrounded = true;

		// --- Target (usually player) ---
		this.target = target;

		// --- Boss tuning (reasonably hard) ---
		this.maxHp = 3200;
		this.hp = this.maxHp;
		this.baseDamage = 28;
		this.jumpAttackDamage = 52; // stronger burst hit
		this.moveSpeed = 180;
		this.dead = false;

		// --- Sprite info (with explicit padding-aware hitbox) ---
		this.spriteWidth = 288;
		this.spriteHeight = 166;
		this.spriteImage = new Image();
		this.spriteImage.src = "magmaBoss.png";

		this.animations = {
			idle: { row: 0, frames: 6, frameDuration: 0.11, loop: true },
			move: { row: 1, frames: 8, frameDuration: 0.09, loop: true },
			melee: { row: 2, frames: 8, frameDuration: 0.08, loop: false },
			hurt: { row: 3, frames: 4, frameDuration: 0.09, loop: false },
			death: { row: 4, frames: 10, frameDuration: 0.12, loop: false },
		};
		this.animTime = 0;
		this.animFrame = 0;

		// Hitbox is reduced from full sprite because of possible huge padding
		this.hitbox = {
			offsetX: 90,
			offsetY: 40,
			width: 108,
			height: 116,
		};

		// --- States ---
		this.state = "idle"; // idle | move | melee | hurt | death
		this.facing = 1;

		// --- Ability timers/cooldowns ---
		this.cooldowns = {
			melee: 1.2,
			teleportAttack: 5.5,
			dodge: 3.2,
			jumpAttack: 6.0,
			summonProjectiles: 7.8,
			hurtRecover: 0.35,
		};

		this.timers = {
			melee: 0,
			teleportAttack: 2.5,
			dodge: 1.0,
			jumpAttack: 3.5,
			summonProjectiles: 4.0,
			hurtRecover: 0,
			stateLock: 0,
			death: 2.0,
		};

		// --- Combat helpers ---
		this.phase = 1;
		this.enrageThreshold = 0.45; // under 45% HP -> more aggressive
		this.pendingDamageWindows = [];
		this.spawnedProjectiles = [];
	}

	// --- Main update loop ---
	update(dt, world = {}) {
		if (this.dead) {
			this.timers.death = Math.max(0, this.timers.death - dt);
			return;
		}

		// Tick timers
		Object.keys(this.timers).forEach((k) => {
			this.timers[k] = Math.max(0, this.timers[k] - dt);
		});

		// Enrage phase when low hp
		if (this.hp / this.maxHp <= this.enrageThreshold) {
			this.phase = 2;
		}

		// Resolve gravity
		this.vy += this.gravity * dt;
		this.x += this.vx * dt;
		this.y += this.vy * dt;

		if (this.y >= this.groundY) {
			this.y = this.groundY;
			this.vy = 0;
			this.isGrounded = true;
		} else {
			this.isGrounded = false;
		}

		// State lock (during attacks/hurt anim windows)
		if (this.timers.stateLock > 0) {
			this._updateDamageWindows(dt, world);
			this._updateProjectiles(dt, world);
			return;
		}

		// Dead check
		if (this.hp <= 0) {
			this._enterDeath();
			return;
		}

		// Need a target to run AI
		if (!this.target) {
			this._setState("idle");
			this.vx = 0;
			this._updateDamageWindows(dt, world);
			this._updateProjectiles(dt, world);
			return;
		}

		const dx = this.target.x - this.x;
		const absDx = Math.abs(dx);
		this.facing = dx >= 0 ? 1 : -1;

		// Priority ability chain (hard behavior)
		if (this._canUse("teleportAttack") && absDx > 210) {
			this._teleportAttack(world);
		} else if (this._canUse("jumpAttack") && absDx >= 100 && absDx <= 420 && this.isGrounded) {
			this._jumpAttack(world);
		} else if (this._canUse("summonProjectiles")) {
			this._summonProjectiles(world);
		} else if (this._canUse("dodge") && this._shouldDodge(world)) {
			this._dodge();
		} else if (this._canUse("melee") && absDx < 110) {
			this._meleeAttack();
		} else {
			this._chaseTarget(dx);
		}

		this._updateDamageWindows(dt, world);
		this._updateProjectiles(dt, world);
		this._updateAnimation(dt);
	}

	// --- Receive damage ---
	takeDamage(amount = 0) {
		if (this.dead || this.state === "death") return;

		this.hp = Math.max(0, this.hp - amount);
		if (this.hp <= 0) {
			this._enterDeath();
			return;
		}

		this._setState("hurt");
		this.timers.hurtRecover = this.cooldowns.hurtRecover;
		this.timers.stateLock = this.cooldowns.hurtRecover;
		this.vx = -this.facing * 120;
	}

	// --- External collision/hitbox accessor ---
	getHitbox() {
		return {
			x: this.x + this.hitbox.offsetX,
			y: this.y + this.hitbox.offsetY,
			width: this.hitbox.width,
			height: this.hitbox.height,
		};
	}

	// --- Optional animation key getter ---
	getAnimationKey() {
		return this.state;
	}

	// =========================
	// Internal AI / abilities
	// =========================
	_canUse(name) {
		const c = this.cooldowns[name] ?? 0;
		return (this.timers[name] ?? 0) <= 0 && c >= 0;
	}

	_setState(next) {
		if (this.state === "death") return;
		if (this.state !== next) {
			this.animTime = 0;
			this.animFrame = 0;
		}
		this.state = next;
	}

	_updateAnimation(dt) {
		const anim = this.animations[this.state] || this.animations.idle;
		if (!anim) return;

		this.animTime += dt;
		while (this.animTime >= anim.frameDuration) {
			this.animTime -= anim.frameDuration;
			this.animFrame += 1;

			if (anim.loop) {
				this.animFrame %= anim.frames;
			} else if (this.animFrame >= anim.frames) {
				this.animFrame = anim.frames - 1;
			}
		}
	}

	getCurrentFrame() {
		const anim = this.animations[this.state] || this.animations.idle;
		return {
			sx: this.animFrame * this.spriteWidth,
			sy: anim.row * this.spriteHeight,
			sw: this.spriteWidth,
			sh: this.spriteHeight,
		};
	}

	draw(ctx) {
		if (!ctx || !this.spriteImage || !this.spriteImage.complete) return;

		const { sx, sy, sw, sh } = this.getCurrentFrame();
		ctx.save();
		if (this.facing < 0) {
			ctx.translate(this.x + this.spriteWidth, this.y);
			ctx.scale(-1, 1);
			ctx.drawImage(this.spriteImage, sx, sy, sw, sh, 0, 0, this.spriteWidth, this.spriteHeight);
		} else {
			ctx.drawImage(this.spriteImage, sx, sy, sw, sh, this.x, this.y, this.spriteWidth, this.spriteHeight);
		}
		ctx.restore();
	}

	_chaseTarget(dx) {
		this._setState("move");
		const speedMul = this.phase === 2 ? 1.2 : 1;
		this.vx = Math.sign(dx) * this.moveSpeed * speedMul;
	}

	_meleeAttack() {
		this._setState("melee");
		this.vx = 0;
		this.timers.melee = this.cooldowns.melee * (this.phase === 2 ? 0.8 : 1);
		this.timers.stateLock = 0.35;

		// Small active hit window in front of boss
		this.pendingDamageWindows.push({
			delay: 0.12,
			duration: 0.1,
			damage: this.baseDamage,
			rect: {
				x: this.x + (this.facing > 0 ? 155 : 20),
				y: this.y + 50,
				width: 105,
				height: 70,
			},
			consumed: false,
		});
	}

	_teleportAttack(world) {
		this._setState("move");
		this.timers.teleportAttack = this.cooldowns.teleportAttack * (this.phase === 2 ? 0.7 : 1);
		this.timers.stateLock = 0.4;

		if (!this.target) return;

		// Teleport behind player, then immediate melee burst
		const behindOffset = this.target.facing && this.target.facing < 0 ? 90 : -90;
		this.x = this.target.x + behindOffset;
		this.y = this.groundY;
		this.vx = 0;

		this.pendingDamageWindows.push({
			delay: 0.08,
			duration: 0.15,
			damage: this.baseDamage + 8,
			rect: {
				x: this.x + 70,
				y: this.y + 40,
				width: 140,
				height: 90,
			},
			consumed: false,
		});
	}

	_dodge() {
		this._setState("move");
		this.timers.dodge = this.cooldowns.dodge * (this.phase === 2 ? 0.75 : 1);
		this.timers.stateLock = 0.2;

		// Quick side-step opposite to facing (evade style)
		const dodgeDir = -this.facing;
		this.x += dodgeDir * (this.phase === 2 ? 145 : 120);
		this.vx = dodgeDir * 320;
	}

	_jumpAttack(world) {
		this._setState("melee");
		this.timers.jumpAttack = this.cooldowns.jumpAttack * (this.phase === 2 ? 0.8 : 1);
		this.timers.stateLock = 0.7;

		// Leap toward player and slam on landing
		const dir = this.target ? Math.sign(this.target.x - this.x) || this.facing : this.facing;
		this.vx = dir * 260;
		this.vy = -780;

		// Delayed landing damage zone
		this.pendingDamageWindows.push({
			delay: 0.55,
			duration: 0.22,
			damage: this.jumpAttackDamage,
			rect: {
				x: this.x + 40,
				y: this.groundY + 62,
				width: 200,
				height: 60,
			},
			consumed: false,
			followsBossXUntilActive: true,
		});
	}

	_summonProjectiles(world) {
		this._setState("idle");
		this.vx = 0;
		this.timers.summonProjectiles = this.cooldowns.summonProjectiles * (this.phase === 2 ? 0.75 : 1);
		this.timers.stateLock = 0.5;

		if (!this.target) return;

		// Summon magma bolts above the player (multiple waves)
		const count = this.phase === 2 ? 5 : 3;
		for (let i = 0; i < count; i++) {
			this.spawnedProjectiles.push({
				x: this.target.x + (Math.random() * 140 - 70),
				y: this.target.y - 260 - i * 40,
				vx: Math.random() * 40 - 20,
				vy: 240 + i * 35,
				radius: 12,
				damage: this.baseDamage - 4,
				ttl: 2.1,
				activeAfter: i * 0.08,
			});
		}
	}

	_shouldDodge(world) {
		if (!this.target) return false;
		const tx = this.target.x ?? 0;
		const ty = this.target.y ?? 0;
		const near = Math.abs(tx - this.x) < 180 && Math.abs(ty - this.y) < 80;
		const chance = this.phase === 2 ? 0.45 : 0.28;
		return near && Math.random() < chance;
	}

	_updateDamageWindows(dt, world) {
		if (!this.pendingDamageWindows.length) return;
		const target = this.target;
		if (!target) return;

		this.pendingDamageWindows = this.pendingDamageWindows.filter((w) => {
			w.delay -= dt;
			if (w.followsBossXUntilActive && w.delay > 0) {
				w.rect.x = this.x + 40;
			}

			if (w.delay <= 0 && !w.consumed) {
				const hit = this._rectIntersects(
					w.rect,
					target.getHitbox ? target.getHitbox() : { x: target.x, y: target.y, width: 50, height: 80 }
				);
				if (hit) {
					if (typeof target.takeDamage === "function") {
						target.takeDamage(w.damage);
					} else if (typeof target.hp === "number") {
						target.hp = Math.max(0, target.hp - w.damage);
					}
					w.consumed = true;
				}
			}

			w.duration -= dt;
			return w.duration > 0;
		});
	}

	_updateProjectiles(dt, world) {
		if (!this.spawnedProjectiles.length) return;
		const target = this.target;

		this.spawnedProjectiles = this.spawnedProjectiles.filter((p) => {
			p.activeAfter -= dt;
			p.ttl -= dt;
			if (p.ttl <= 0) return false;
			if (p.activeAfter > 0) return true;

			p.x += p.vx * dt;
			p.y += p.vy * dt;

			if (target) {
				const tbox = target.getHitbox ? target.getHitbox() : { x: target.x, y: target.y, width: 50, height: 80 };
				const hit = this._circleRectIntersects(p.x, p.y, p.radius, tbox);
				if (hit) {
					if (typeof target.takeDamage === "function") {
						target.takeDamage(p.damage);
					} else if (typeof target.hp === "number") {
						target.hp = Math.max(0, target.hp - p.damage);
					}
					return false;
				}
			}

			if (p.y > this.groundY + 120) return false;
			return true;
		});
	}

	_enterDeath() {
		this.hp = 0;
		this.dead = true;
		this.vx = 0;
		this.vy = 0;
		this._setState("death");
		this.timers.stateLock = 999;
	}

	_rectIntersects(a, b) {
		return (
			a.x < b.x + b.width &&
			a.x + a.width > b.x &&
			a.y < b.y + b.height &&
			a.y + a.height > b.y
		);
	}

	_circleRectIntersects(cx, cy, r, rect) {
		const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
		const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
		const dx = cx - nearestX;
		const dy = cy - nearestY;
		return dx * dx + dy * dy <= r * r;
	}
}

export default MagmaBoss;

