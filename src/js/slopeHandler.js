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
 * - 45º tile that looks like this "|\":        1762
 * 45º tiles, upside down
 * - 45º tile that looks like this "\|":        3221227234
 * - 45º tile that looks like this "|/":        1073743586
 * 65º tiles, right-side up
 * - 65º tile that looks like this "/|":        2147485439
 * - 65º tile that looks like this "|\":        1791
 * 65º tiles, upside down
 * - 65º tile that looks like this "\|":        3221227263
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
    UP_LEFT_45: 1762,           // "|\"
    DOWN_LEFT_45: 3221227234,   // "\|"
    DOWN_RIGHT_45: 1073743586,  // "|/"

    // 65º tiles
    UP_RIGHT_65: 2147485439,    // "/|"
    UP_LEFT_65: 1791,           // "|\"
    DOWN_LEFT_65: 3221227263,   // "\|"
    DOWN_RIGHT_65: 1073743615,  // "|/"

    // Half tiles
    HALF_VERTICAL_TOP: 1758,
    HALF_HORIZONTAL_LEFT: 1760,
    HALF_HORIZONTAL_RIGHT: 2147485408
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

// Initialize slopes
function initSlopes(scene) {
    if (!scene.ground) return;                  // If no ground (collidable) layer, exit
    const slopes = Object.values(SLOPE_TYPES);  // Return all GID constants const
    
    // Enable/disable specific collisions depending on slope shape
    scene.ground.forEachTile(tile => {
        let gid = getTileGid(tile); // Get GID of tile
        switch (gid) {
            //              /|
            case SLOPE_TYPES.UP_RIGHT_45:
            case SLOPE_TYPES.UP_RIGHT_65:
                tile.collideUp = false;        // Disable upper face collision to calculate in the new way
                tile.collideLeft = false;      // Disable left face to calculate in the new way
                break;
            //              |\
            case SLOPE_TYPES.UP_LEFT_45:
            case SLOPE_TYPES.UP_LEFT_65:
                tile.collideUp = false;
                tile.collideRight = false;
                break;
            //              \|
            case SLOPE_TYPES.DOWN_LEFT_45:
            case SLOPE_TYPES.DOWN_LEFT_65:
                tile.collideDown = false;
                tile.collideRight = false;
                break;
            //              |/
            case SLOPE_TYPES.DOWN_RIGHT_45:
            case SLOPE_TYPES.DOWN_RIGHT_65:
                tile.collideDown = false;
                tile.collideLeft = false;
                break;
            // Half tiles
            case SLOPE_TYPES.HALF_VERTICAL_TOP:
                tile.collideDown = false;
                tile.collideUp = false;
                break;
            case SLOPE_TYPES.HALF_HORIZONTAL_LEFT:
            case SLOPE_TYPES.HALF_HORIZONTAL_RIGHT:
                tile.collideLeft = false;
                tile.collideRight = false;
                break;
            // Solid tiles
            case SOLID_TILE:
                // Renable all faces default collision methods
                tile.collideUp = true;
                tile.collideDown = true;
                tile.collideLeft = true;
                tile.collideRight = true;
                break;
        }
    });

    scene._slopesInitialized = true; // Set flag to prevent re-initialization
}

// Process entity slope collider
function processEntitySlope(scene, entity) {
    if (!entity || !entity.body) return;    // Entity does not have a physics body

    const body = entity.body;
    const isCeiling = body.velocity.y < 0; // Negative = player jump up (hitting ceiling); positive = player fall down (hitting floor)

    // Check multiple points to ensure the entity doesn't fall through
    const checkX = body.center.x;

    // Get tile at the bottom of the entity
    let tile = scene.ground.getTileAtWorldXY(checkX, isCeiling ? body.top - 2 : body.bottom - 2, true);
    let gid = tile ? getTileGid(tile) : -1;

    const slopes = Object.values(SLOPE_TYPES);

    // If no slope tile is overlapping the top 2 pixels while jumping up,
    // check up to 12 pixels up to catch steep slopes
    if (!tile || !slopes.includes(gid)) {
        tile = scene.ground.getTileAtWorldXY(checkX, isCeiling ? body.top + 2 : body.bottom - 12, true); // If player is hitting the ceiling, check up to 2 pixels above, otherwise, check down to 12 pixels below
        gid = tile ? getTileGid(tile) : -1; // Get GID of tile
    }
    // Final fallback check below the feet if falling onto the slope
    if (!tile || !slopes.includes(gid)) {
        tile = scene.ground.getTileAtWorldXY(checkX, isCeiling ? body.top - 8 : body.bottom + 2, true);
        gid = tile ? getTileGid(tile) : -1;
    }

    if (!tile || tile.index === -1) return; // No tile

    // If slope tile
    if (slopes.includes(gid)) {
        const tileW = tile.width * scene.ground.scaleX;
        const tileH = tile.height * scene.ground.scaleY;
        const tileX = scene.ground.tileToWorldX(tile.x);
        const tileY = scene.ground.tileToWorldY(tile.y);

        // Normalize player position within tile 0 = left 1 = right
        let tx = (checkX - tileX) / tileW; // 
        if (tx < 0) tx = 0; // Player on left side
        if (tx > 1) tx = 1; // Player on right side

        let ty = -1; // -1 means no surface found, 0 = top, 1 = bottom

        // Player-tile y relative position updater
        switch (gid) {
            // 45 degree slopes
            case SLOPE_TYPES.UP_RIGHT_45: // |\
                ty = 1 - tx; 
                break;
            case SLOPE_TYPES.UP_LEFT_45: // /|
                ty = tx;
                break;
            case SLOPE_TYPES.DOWN_LEFT_45: // \|
                ty = 1 - tx;
                break;
            case SLOPE_TYPES.DOWN_RIGHT_45: // |/
                ty = tx;
                break;

            // 65 degrees slope (around y=2x)
            case SLOPE_TYPES.UP_RIGHT_65: // |\
                ty = 1 - (tx * 2); // Rises twice as fast
                if (ty < 0) ty = 0; // Limit
                break;
            case SLOPE_TYPES.UP_LEFT_65: // /|
                ty = tx * 2; // Drops twice as fast
                if (ty > 1) ty = 1; 
                break;
            case SLOPE_TYPES.DOWN_LEFT_65: // \|
                ty = 1 - (tx * 2); 
                if (ty < 0) ty = 0;
                break;
            case SLOPE_TYPES.DOWN_RIGHT_65: // |/
                ty = tx * 2; 
                if (ty > 1) ty = 1; 
                break;
            
            // Half tile vertical top
            case SLOPE_TYPES.HALF_VERTICAL_TOP:
                ty = isCeiling ? 0.5 : 0; // Ceiling is at middle, Floor is at top
                break;
            // Half tile horizontal left
            case SLOPE_TYPES.HALF_HORIZONTAL_LEFT:
            case SLOPE_TYPES.HALF_HORIZONTAL_RIGHT:
                ty = isCeiling ? 1.0 : 0.5; // Ceiling is at bottom edge, Floor is at middle
                break;
        }


        if (ty !== -1) {
            // Actual world Y height of the slope surface at this X
            const slopeWorldY = tileY + (ty * tileH);
            
            // Tiles above player
            if (isCeiling) {
                // Upside down slopes and half slabs
                if (gid === SLOPE_TYPES.DOWN_LEFT_45 || gid === SLOPE_TYPES.DOWN_LEFT_65 || 
                    gid === SLOPE_TYPES.DOWN_RIGHT_45 || gid === SLOPE_TYPES.DOWN_RIGHT_65 ||
                    gid === SLOPE_TYPES.HALF_VERTICAL_TOP || gid === SLOPE_TYPES.HALF_HORIZONTAL_LEFT || 
                    gid === SLOPE_TYPES.HALF_HORIZONTAL_RIGHT) {
                    
                    // If top of player has already reached beyond the surface but not largely penetrated into the tile
                    if (body.top < slopeWorldY && body.top >= slopeWorldY - 14) {
                        body.y = slopeWorldY;       // Stop player y movement
                        body.velocity.y = 0;
                        body.blocked.up = true;
                    // If top of player has reached beyond the surface but is largely penetrated into the tile
                    } else if (body.top < slopeWorldY - 14) {
                        body.y = slopeWorldY;
                        // Stop player when clipping horizontally from the left side
                        if (body.velocity.x > 0 || (body.velocity.x === 0 && checkX < tileX + tileW / 2)) {
                            body.x = tileX - body.width;    // Stop player x movement 
                            body.velocity.x = 0;
                            body.blocked.right = true;
                        } else {    // Clipping from right side
                            body.x = tileX + tileW;
                            body.velocity.x = 0;
                            body.blocked.left = true;
                        }
                        // Also stop vertical movement and mark ceiling collision
                        body.y = slopeWorldY;
                        body.velocity.y = 0;
                        body.blocked.up = true;
                    }
                }
            // Tiles below player
            } else {
                // Regular slopes and slabs
                if (gid !== SLOPE_TYPES.DOWN_LEFT_45 && gid !== SLOPE_TYPES.DOWN_LEFT_65 && 
                    gid !== SLOPE_TYPES.DOWN_RIGHT_45 && gid !== SLOPE_TYPES.DOWN_RIGHT_65) {
                    
                    const snapThreshold = 14;
                    // Player bottom is near / in the slope surface
                    if (body.bottom >= slopeWorldY - 10 && body.bottom <= slopeWorldY + snapThreshold) { 
                        // pull down slightly if going down slope, or stand natively on slope
                        body.y = slopeWorldY - body.height;
                        body.velocity.y = 0;
                        body.blocked.down = true;
                    // Player body is deeply clipped into the slope surface
                    } else if (body.bottom > slopeWorldY + snapThreshold) {
                        // Hitting a steep wall inside the tile
                        if (body.velocity.x > 0 || (body.velocity.x === 0 && checkX < tileX + tileW / 2)) {
                            body.x = tileX - body.width;
                            body.velocity.x = 0;
                            body.blocked.right = true;
                        } else {
                            body.x = tileX + tileW;
                            body.velocity.x = 0;
                            body.blocked.left = true;
                        }
                        // After lateral ejection, snap onto top of slope and stop vertical movement
                        body.y = slopeWorldY - body.height;
                        body.velocity.y = 0;
                        body.blocked.down = true;
                    }
                }
            }
        }
    }
}

function slopeHandler(scene) {
    // Intialize slopes if not already initialized
    if (!scene._slopesInitialized) {
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
                // Process enemy if alive and active
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
