/**
 * Slope handler utility file
 * @author Honglue Zheng
 * @note Handle 45 degree and 65 degree slope tiles colliders with player and enemies
 * There was no compatible slope API that worked with Phaser 3.x so I had to hardcode my own :(
 */

/**
 * ====================== Global Tile IDs for non-regular tiles in Collidable layer ======================
 * 45º tiles, right-side up
 * - 45º tile that looks like this "/|":        2147485410
 * - 45º tile that looks like this "|\\":        1762
 * 45º tiles, upside down
 * - 45º tile that looks like this "\\|":        3221227234
 * - 45º tile that looks like this "|/":        1073743586
 * 65º tiles, right-side up
 * - 65º tile that looks like this "/|":        2147485439
 * - 65º tile that looks like this "|\\":        1791
 * 65º tiles, upside down
 * - 65º tile that looks like this "\\|":        3221227263
 * - 65º tile that looks like this "|/":        1073743615
 * 
 * Half tiles
 * - Vertical half tile, top:                   1758
 * - Horizontal half tile, left:                1760
 * - Horizontal half tile, right:               2147485408
 * 
 * Solid tiles: 1757
 */

// Slope GID constants
const SLOPE_TYPES = {
    // 45º tiles
    UP_RIGHT_45: 2147485410,    // "/|"
    UP_LEFT_45: 1762,           // "|\\"
    DOWN_LEFT_45: 3221227234,   // "\\|"
    DOWN_RIGHT_45: 1073743586,  // "|/"

    // 65º tiles
    UP_RIGHT_65: 2147485439,    // "/|"
    UP_LEFT_65: 1791,           // "|\\"
    DOWN_LEFT_65: 3221227263,   // "\\|"
    DOWN_RIGHT_65: 1073743615,  // "|/"

    // Half tiles
    HALF_VERTICAL_TOP: 1758,
};

const SOLID_TILE = 1757;

// Get Global Tile ID
function getTileGid(tile) {
    let gid = tile.index;
    // If tile is flipped
    if (tile.flipX) gid += 2147483648; // 0x80000000 in decimal (flip flag in Tiled)
    if (tile.flipY) gid += 1073741824; // 0x40000000 in decimal (flip flag in Tiled)
    return gid;
}

// Initialize slopes — disable all collision on slope tiles so Phaser ignores them
function initSlopes(scene) {
    if (!scene.ground) return;
    const slopes = Object.values(SLOPE_TYPES);
    
    scene.ground.forEachTile(tile => {
        let gid = getTileGid(tile);

        if (gid == SOLID_TILE) return;

        if (slopes.includes(gid)) {
            // Disable ALL collision faces on slope tiles — Phaser won't touch these.
            // The custom slope engine in processEntitySlope handles them instead.
            tile.collideUp = false;
            tile.collideDown = false;
            tile.collideLeft = false;
            tile.collideRight = false;
        }
        // Solid tiles keep their default collision — Phaser's arcade physics handles them normally.
        // This prevents the clipping issue with vertical blocks because Phaser resolves those collisions
        // without interference from the slope engine.
    });

    scene.slopesInitialized = true;
    scene.slopeGroundRef = scene.ground;
}

// Process entity slope collider
function processEntitySlope(scene, entity) {
    if (!entity || !entity.body) return;

    const body = entity.body;
    const isCeiling = body.velocity.y < 0; // Negative = player jump up; positive = player fall down

    // Check multiple points to ensure the entity doesn't fall through
    const checkX = body.center.x;

    // Get tile at the bottom/top of the entity
    let tile = scene.ground.getTileAtWorldXY(checkX, isCeiling ? body.top - 2 : body.bottom - 2, true);
    let gid = tile ? getTileGid(tile) : -1;

    const slopes = Object.values(SLOPE_TYPES);

    // Fallback check — look further to catch steep slopes
    if (!tile || !slopes.includes(gid)) {
        tile = scene.ground.getTileAtWorldXY(checkX, isCeiling ? body.top + 2 : body.bottom - 12, true);
        gid = tile ? getTileGid(tile) : -1;
    }
    // Final fallback
    if (!tile || !slopes.includes(gid)) {
        tile = scene.ground.getTileAtWorldXY(checkX, isCeiling ? body.top - 8 : body.bottom + 2, true);
        gid = tile ? getTileGid(tile) : -1;
    }

    if (!tile || tile.index === -1) return;

    // Only process slope tiles — solid/regular tiles are handled by Phaser's arcade physics
    if (!slopes.includes(gid)) return;

    const tileW = tile.width * scene.ground.scaleX;
    const tileH = tile.height * scene.ground.scaleY;
    const tileX = scene.ground.tileToWorldX(tile.x);
    const tileY = scene.ground.tileToWorldY(tile.y);

    // Normalize player position within tile (0 = left, 1 = right)
    let tx = (checkX - tileX) / tileW;
    if (tx < 0) tx = 0;
    if (tx > 1) tx = 1;

    let ty = -1; // -1 means no surface found

    // Player-tile y relative position updater
    switch (gid) {
        // 45 degree slopes
        case SLOPE_TYPES.UP_RIGHT_45:
            ty = 1 - tx; 
            break;
        case SLOPE_TYPES.UP_LEFT_45:
            ty = tx;
            break;
        case SLOPE_TYPES.DOWN_LEFT_45:
            ty = 1 - tx;
            break;
        case SLOPE_TYPES.DOWN_RIGHT_45:
            ty = tx;
            break;

        // 65 degrees slope (around y=2x)
        case SLOPE_TYPES.UP_RIGHT_65:
            ty = 1 - (tx * 2);
            if (ty < 0) ty = 0;
            break;
        case SLOPE_TYPES.UP_LEFT_65:
            ty = tx * 2;
            if (ty > 1) ty = 1; 
            break;
        case SLOPE_TYPES.DOWN_LEFT_65:
            ty = 1 - (tx * 2); 
            if (ty < 0) ty = 0;
            break;
        case SLOPE_TYPES.DOWN_RIGHT_65:
            ty = tx * 2; 
            if (ty > 1) ty = 1; 
            break;
        
        // Half tile vertical top
        case SLOPE_TYPES.HALF_VERTICAL_TOP:
            ty = isCeiling ? 0.5 : 0;
            break;
    }

    if (ty !== -1) {
        // Actual world Y height of the slope surface at this X
        const slopeWorldY = tileY + (ty * tileH);
        
        // Tiles above player (ceiling slopes)
        if (isCeiling) {
            if (gid === SLOPE_TYPES.DOWN_LEFT_45 || gid === SLOPE_TYPES.DOWN_LEFT_65 || 
                gid === SLOPE_TYPES.DOWN_RIGHT_45 || gid === SLOPE_TYPES.DOWN_RIGHT_65 ||
                gid === SLOPE_TYPES.HALF_VERTICAL_TOP) {
                
                if (body.top < slopeWorldY && body.top >= slopeWorldY - 14) {
                    body.y = slopeWorldY;
                    body.velocity.y = 0;
                    body.blocked.up = true;
                } else if (body.top < slopeWorldY - 14) {
                    body.y = slopeWorldY;
                    body.velocity.y = 0;
                    body.blocked.up = true;
                }
            }
        // Tiles below player (floor slopes)
        } else {
            if (gid !== SLOPE_TYPES.DOWN_LEFT_45 && gid !== SLOPE_TYPES.DOWN_LEFT_65 && 
                gid !== SLOPE_TYPES.DOWN_RIGHT_45 && gid !== SLOPE_TYPES.DOWN_RIGHT_65) {
                
                const snapThreshold = 8;
                // Player bottom is near / in the slope surface
                if (body.bottom >= slopeWorldY - 10 && body.bottom <= slopeWorldY + snapThreshold) { 
                    body.y = slopeWorldY - body.height;
                    body.velocity.y = 0;
                    body.blocked.down = true;
                // Player body is deeply clipped into the slope surface
                } else if (body.bottom > slopeWorldY + snapThreshold) {
                    // Snap onto top of slope
                    body.y = slopeWorldY - body.height;
                    body.velocity.y = 0;
                    body.blocked.down = true;
                }
            }
        }
    }
}

function slopeHandler(scene) {
    // Reinitialize slopes if ground layer changed (happens on scene restart/retry)
    if (scene.slopesInitialized && scene.slopeGroundRef !== scene.ground) {
        scene.slopesInitialized = false;
    }

    // Intialize slopes if not already initialized
    if (!scene.slopesInitialized) {
        initSlopes(scene);
    }

    // Process player – slope collider
    if (scene.player) {
        processEntitySlope(scene, scene.player);
    }
    
    // Process enemies if any
    if (scene.enemies) {
        if (scene.enemies.children) {
            scene.enemies.children.iterate((enemy) => {
                if (enemy && enemy.active) {
                    processEntitySlope(scene, enemy);
                }
            });
        } else if (scene.enemies.body) {
            processEntitySlope(scene, scene.enemies);
        }
    }
    
    // Also process skeleton or boss if tracked differently
    if (scene.skeleton && scene.skeleton.children) {
        scene.skeleton.children.iterate((skel) => {
            if (skel && skel.active) {
                processEntitySlope(scene, skel);
            }
        });
    } else if (scene.skeleton && scene.skeleton.body) {
        processEntitySlope(scene, scene.skeleton);
    }

    if (scene.boss && scene.boss.active) {
        processEntitySlope(scene, scene.boss);
    }
}

export { slopeHandler };
