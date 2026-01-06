// ============================================
// NEON SURVIVAL SHOOTER
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

// Canvas setup
canvas.width = 800;
canvas.height = 600;

// Game state
const game = {
    running: false,
    score: 0,
    difficulty: 1,
    time: 0,
    shakeAmount: 0,
    lastSpawn: 0  // Track last spawn time
};

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    radius: 12,
    hp: 100,
    maxHp: 100,
    speed: 0.5,
    friction: 0.92,
    color: '#0ff',
    lastShot: 0,
    fireRate: 40, // Very fast shooting
    spreadAngle: 0.3,
    bulletCount: 3, // Number of bullets per shot (upgrades with score)
    kills: 0 // Track kills for upgrades
};

// Arrays for game objects
const enemies = [];
const bullets = [];
const particles = [];

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'r') {
        restartGame();
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ============================================
// INITIALIZATION
// ============================================

function init() {
    restartGame();
    gameLoop();
}

function restartGame() {
    game.running = true;
    game.score = 0;
    game.difficulty = 1;
    game.time = 0;
    game.shakeAmount = 0;
    game.lastSpawn = 0;
    
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.vx = 0;
    player.vy = 0;
    player.hp = player.maxHp;
    player.kills = 0;
    player.bulletCount = 3;
    player.fireRate = 40;
    
    enemies.length = 0;
    bullets.length = 0;
    particles.length = 0;
}

// ============================================
// GAME LOOP
// ============================================

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// ============================================
// UPDATE
// ============================================

function update() {
    if (!game.running) return;
    
    game.time++;
    game.difficulty = 1 + game.time / 3600; // Difficulty ramps over time
    
    // Camera shake decay
    game.shakeAmount *= 0.9;
    if (game.shakeAmount < 0.1) game.shakeAmount = 0;
    
    updatePlayer();
    updateEnemies();
    updateBullets();
    updateParticles();
    spawnEnemies();
    checkCollisions();
}

function updatePlayer() {
    // WASD movement with acceleration
    let ax = 0, ay = 0;
    
    if (keys['w']) ay -= player.speed;
    if (keys['s']) ay += player.speed;
    if (keys['a']) ax -= player.speed;
    if (keys['d']) ax += player.speed;
    
    // Apply acceleration
    player.vx += ax;
    player.vy += ay;
    
    // Apply friction
    player.vx *= player.friction;
    player.vy *= player.friction;
    
    // Update position
    player.x += player.vx;
    player.y += player.vy;
    
    // Boundary collision
    if (player.x - player.radius < 0) {
        player.x = player.radius;
        player.vx = 0;
    }
    if (player.x + player.radius > canvas.width) {
        player.x = canvas.width - player.radius;
        player.vx = 0;
    }
    if (player.y - player.radius < 0) {
        player.y = player.radius;
        player.vy = 0;
    }
    if (player.y + player.radius > canvas.height) {
        player.y = canvas.height - player.radius;
        player.vy = 0;
    }
    
    // Auto-aim and auto-fire at nearest enemy
    if (game.time - player.lastShot > player.fireRate) {
        // Find nearest enemy for auto-aim
        let nearestEnemy = null;
        let minDist = Infinity;
        
        for (const enemy of enemies) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearestEnemy = enemy;
            }
        }
        
        // Fire if enemy exists
        if (nearestEnemy) {
            const angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
            
            // Spread shot with upgradeable bullet count
            const bulletCount = player.bulletCount;
            for (let i = 0; i < bulletCount; i++) {
                const spread = (i - (bulletCount - 1) / 2) * player.spreadAngle;
                spawnBullet(player.x, player.y, angle + spread);
            }
            player.lastShot = game.time;
        }
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Home toward player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx ** 2 + dy ** 2);
        
        if (dist > 0) {
            enemy.vx = (dx / dist) * enemy.speed;
            enemy.vy = (dy / dist) * enemy.speed;
        }
        
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        
        // Remove if too far off screen
        if (enemy.x < -100 || enemy.x > canvas.width + 100 ||
            enemy.y < -100 || enemy.y > canvas.height + 100) {
            enemies.splice(i, 1);
        }
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;
        
        // Remove if off screen or expired
        if (bullet.life <= 0 ||
            bullet.x < 0 || bullet.x > canvas.width ||
            bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.life--;
        particle.alpha = particle.life / particle.maxLife;
        
        if (particle.type === 'ring') {
            particle.radius += particle.expandSpeed;
        }
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// ============================================
// SPAWN
// ============================================

function spawnEnemies() {
    // FLOOD MODE - extremely aggressive spawning
    const baseRate = 25 - Math.floor(game.difficulty * 2);
    const spawnRate = Math.max(5, baseRate); // Spawn every 5-25 frames
    
    // Check if enough time has passed since last spawn
    if (game.time - game.lastSpawn >= spawnRate) {
        // Start with 3 enemies, ramp up to 10+ quickly
        const spawnCount = Math.min(10, Math.floor(3 + game.difficulty));
        console.log(`Spawning ${spawnCount} enemies at time ${game.time}, difficulty ${game.difficulty.toFixed(2)}, rate ${spawnRate}`);
        for (let i = 0; i < spawnCount; i++) {
            spawnEnemy();
        }
        game.lastSpawn = game.time;
        console.log(`Total enemies: ${enemies.length}`);
    }
}

function spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (edge) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -20;
            break;
        case 1: // Right
            x = canvas.width + 20;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 20;
            break;
        case 3: // Left
            x = -20;
            y = Math.random() * canvas.height;
            break;
    }
    
    enemies.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        radius: 10,
        speed: 1 + game.difficulty * 0.2,
        hp: 1,
        color: '#f0f'
    });
}

function spawnBullet(x, y, angle) {
    const speed = 10; // Faster bullets
    bullets.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 5, // Bigger bullets
        life: 120,
        color: '#ff0',
        piercing: 3 // Can hit 3 enemies before disappearing
    });
}

function spawnParticles(x, y, count, type) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = type === 'ring' ? 0 : 2 + Math.random() * 3;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: type === 'ring' ? 5 : 2,
            expandSpeed: type === 'ring' ? 2 : 0,
            life: type === 'ring' ? 30 : 20 + Math.random() * 20,
            maxLife: type === 'ring' ? 30 : 40,
            alpha: 1,
            color: type === 'ring' ? '#f0f' : '#ff0',
            type: type
        });
    }
}

// ============================================
// COLLISIONS
// ============================================

function checkCollisions() {
    // Bullet vs Enemy (with piercing)
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        let bulletDestroyed = false;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (circleCollision(bullet, enemy)) {
                // Destroy enemy
                enemies.splice(j, 1);
                
                // Add score and track kills
                game.score += 10;
                player.kills++;
                
                // Score-based upgrades
                if (player.kills % 10 === 0) {
                    // Every 10 kills: faster fire rate
                    player.fireRate = Math.max(15, player.fireRate - 2);
                }
                if (player.kills % 25 === 0 && player.bulletCount < 7) {
                    // Every 25 kills: add another bullet
                    player.bulletCount++;
                }
                
                // Particles
                spawnParticles(enemy.x, enemy.y, 3, 'ring');
                spawnParticles(enemy.x, enemy.y, 8, 'spark');
                
                // Piercing bullets can hit multiple enemies
                bullet.piercing--;
                if (bullet.piercing <= 0) {
                    bullets.splice(i, 1);
                    bulletDestroyed = true;
                    break;
                }
            }
        }
    }
    
    // Enemy vs Player
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        if (circleCollision(player, enemy)) {
            // Damage player
            player.hp -= 10;
            
            // Camera shake
            game.shakeAmount = 10;
            
            // Remove enemy
            enemies.splice(i, 1);
            
            // Particles
            spawnParticles(enemy.x, enemy.y, 3, 'ring');
            spawnParticles(player.x, player.y, 12, 'spark');
            
            // Game over
            if (player.hp <= 0) {
                player.hp = 0;
                game.running = false;
            }
        }
    }
}

function circleCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx ** 2 + dy ** 2);
    return dist < a.radius + b.radius;
}

// ============================================
// RENDER
// ============================================

function render() {
    // Translucent frame clearing for trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply camera shake
    ctx.save();
    if (game.shakeAmount > 0) {
        const shakeX = (Math.random() - 0.5) * game.shakeAmount;
        const shakeY = (Math.random() - 0.5) * game.shakeAmount;
        ctx.translate(shakeX, shakeY);
    }
    
    // Set additive blending
    ctx.globalCompositeOperation = 'lighter';
    
    // Background grid
    renderGrid();
    
    // Render game objects
    renderParticles();
    renderBullets();
    renderEnemies();
    renderPlayer();
    
    ctx.restore();
    
    // Reset blending for UI
    ctx.globalCompositeOperation = 'source-over';
    
    // Render UI
    renderUI();
}

function renderGrid() {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    const gridSize = 40;
    const offset = game.time * 0.5;
    
    for (let x = (offset % gridSize) - gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = (offset % gridSize) - gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function renderPlayer() {
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Core glow
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function renderEnemies() {
    enemies.forEach(enemy => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = enemy.color;
        ctx.fillStyle = enemy.color;
        
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.shadowBlur = 0;
}

function renderBullets() {
    bullets.forEach(bullet => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.color;
        ctx.fillStyle = bullet.color;
        
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.shadowBlur = 0;
}

function renderParticles() {
    particles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = particle.color;
        
        if (particle.type === 'ring') {
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function renderUI() {
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'left';
    
    // Score
    ctx.fillStyle = '#0ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#0ff';
    ctx.fillText(`SCORE: ${game.score}`, 20, 40);
    
    // Firepower stats
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.fillText(`KILLS: ${player.kills}`, 20, canvas.height - 60);
    ctx.fillText(`BULLETS: ${player.bulletCount}`, 20, canvas.height - 35);
    ctx.fillText(`FIRE RATE: ${(1000 / player.fireRate).toFixed(1)}/s`, 20, canvas.height - 10);
    
    // HP bar
    const barWidth = 200;
    const barHeight = 20;
    const barX = 20;
    const barY = 60;
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // HP
    const hpPercent = player.hp / player.maxHp;
    const hpColor = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
    ctx.fillStyle = hpColor;
    ctx.shadowColor = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    
    // HP text
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}`, barX + barWidth / 2, barY + 15);
    
    ctx.shadowBlur = 0;
    
    // Game over
    if (!game.running) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 48px Courier New';
        ctx.fillStyle = '#f00';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f00';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        
        ctx.font = 'bold 24px Courier New';
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.fillText(`Final Score: ${game.score}`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 90);
        
        ctx.shadowBlur = 0;
    }
}

// ============================================
// START GAME
// ============================================

init();
