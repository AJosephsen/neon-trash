// ============================================
// NEON SURVIVAL SHOOTER
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

// Canvas setup - scale to window
function resizeCanvas() {
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.95;
    const aspectRatio = 4 / 3;
    
    if (maxWidth / maxHeight > aspectRatio) {
        canvas.height = maxHeight;
        canvas.width = maxHeight * aspectRatio;
    } else {
        canvas.width = maxWidth;
        canvas.height = maxWidth / aspectRatio;
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Music system - Vivaldi Spring (E Major)
const music = {
    bpm: 120,
    beatsPerBar: 4,
    currentBar: 0,
    startTime: 0,
    isPlaying: false,
    loopCount: 0,
    
    // E Major key
    key: 'E Major',
    
    // Vivaldi Spring chord progression (8 bars)
    chords: ['E', 'E', 'B7', 'E', 'E', 'B7', 'E', 'E'],
    
    // Chord voicings in E major
    chordVoicings: {
        'E': [164.81, 207.65, 246.94, 329.63],   // E, G#, B, E
        'B7': [123.47, 185.00, 246.94, 293.66],  // B, D#, F#, A
        'A': [110.00, 164.81, 207.65, 220.00]    // A, C#, E, A
    },
    
    // Vivaldi Spring - Allegro (4 voices)
    // Each note: [scale degree from E (0=E, 1=F#, 2=G#...), duration in beats, octave shift]
    voices: {
        violin1: [
            // Bar 1: Famous opening motif
            [0, 0.25, 1], [0, 0.25, 1], [0, 0.25, 1], [0, 0.25, 1],
            [0, 0.25, 1], [0, 0.25, 1], [0, 0.25, 1], [0, 0.25, 1],
            // Bar 2: Ascending
            [0, 0.25, 1], [2, 0.25, 1], [4, 0.25, 1], [5, 0.25, 1],
            [7, 0.5, 1], [5, 0.25, 1], [4, 0.25, 1],
            // Bar 3: Descent with trill
            [2, 0.25, 1], [0, 0.25, 1], [7, 0.25, 0], [5, 0.25, 0],
            [4, 0.25, 0], [2, 0.25, 0], [4, 0.25, 0], [5, 0.25, 0],
            // Bar 4: Resolution to tonic
            [0, 0.5, 1], [0, 0.25, 1], [7, 0.25, 0],
            [0, 1.0, 1],
            // Bar 5-8: Variation (similar pattern)
            [0, 0.25, 1], [0, 0.25, 1], [0, 0.25, 1], [0, 0.25, 1],
            [4, 0.25, 1], [4, 0.25, 1], [4, 0.25, 1], [4, 0.25, 1],
            [5, 0.25, 1], [4, 0.25, 1], [2, 0.25, 1], [0, 0.25, 1],
            [7, 0.5, 0], [5, 0.25, 0], [4, 0.25, 0],
            [2, 0.25, 0], [4, 0.25, 0], [5, 0.25, 0], [7, 0.25, 0],
            [0, 0.5, 1], [2, 0.25, 1], [4, 0.25, 1],
            [0, 1.0, 1]
        ],
        violin2: [
            // Bar 1: Harmony (thirds below)
            [2, 0.5, 0], [2, 0.5, 0], [2, 0.5, 0], [2, 0.5, 0],
            // Bar 2: Counter melody
            [4, 0.5, 0], [5, 0.5, 0], [4, 0.5, 0], [2, 0.5, 0],
            // Bar 3: Harmony line
            [0, 0.5, 0], [7, 0.5, -1], [5, 0.5, -1], [4, 0.5, -1],
            // Bar 4: Resolution
            [2, 0.5, 0], [0, 0.5, 0], [0, 1.0, 0],
            // Bar 5-8: Variation
            [2, 0.5, 0], [2, 0.5, 0], [4, 0.5, 0], [4, 0.5, 0],
            [5, 0.5, 0], [4, 0.5, 0], [2, 0.5, 0], [0, 0.5, 0],
            [7, 0.5, -1], [5, 0.5, -1], [4, 0.5, -1], [2, 0.5, -1],
            [0, 0.5, 0], [2, 0.5, 0], [0, 1.0, 0]
        ],
        viola: [
            // Bar 1: Inner harmony
            [0, 1.0, 0], [0, 1.0, 0], [0, 1.0, 0], [0, 1.0, 0],
            // Bar 2-4: Sustained harmony
            [2, 1.0, 0], [2, 1.0, 0], [7, 1.0, -1], [0, 1.0, 0],
            [5, 1.0, -1], [4, 1.0, -1], [2, 1.0, -1], [0, 2.0, 0],
            // Bar 5-8: Variation
            [0, 1.0, 0], [2, 1.0, 0], [4, 1.0, 0], [4, 1.0, 0],
            [5, 1.0, 0], [4, 1.0, 0], [2, 1.0, 0], [0, 1.0, 0],
            [7, 1.0, -1], [5, 1.0, -1], [0, 2.0, 0]
        ],
        cello: [
            // Bar 1: Bass line (roots)
            [0, 1.0, -1], [0, 1.0, -1], [0, 1.0, -1], [0, 1.0, -1],
            // Bar 2-4: Walking bass
            [0, 1.0, -1], [2, 1.0, -1], [7, 1.0, -2], [5, 1.0, -2],
            [4, 1.0, -2], [2, 1.0, -2], [0, 2.0, -1],
            // Bar 5-8: Bass pattern
            [0, 1.0, -1], [0, 1.0, -1], [4, 1.0, -1], [4, 1.0, -1],
            [5, 1.0, -1], [4, 1.0, -1], [2, 1.0, -1], [0, 1.0, -1],
            [7, 1.0, -2], [5, 1.0, -2], [0, 2.0, -1]
        ]
    },
    
    // E major scale (3 octaves)
    scale: [
        82.41, 92.50, 103.83, 110.00, 123.47, 138.59, 155.56,      // E2-D#3
        164.81, 185.00, 207.65, 220.00, 246.94, 277.18, 311.13,    // E3-D#4
        329.63, 369.99, 415.30, 440.00, 493.88, 554.37, 622.25,    // E4-D#5
        659.25, 739.99, 830.61, 880.00, 987.77, 1108.73, 1244.51   // E5-D#6
    ]
};

function scaleDegreesToFreq(scaleDegree, octaveShift) {
    // Convert scale degree (0-6 for E major scale) to frequency
    // E major scale: E F# G# A B C# D#
    const baseIndex = 7; // Start at E3 in our scale array
    const index = baseIndex + scaleDegree + (octaveShift * 7);
    return music.scale[Math.max(0, Math.min(index, music.scale.length - 1))];
}

function playVoice(voiceName, bar, startTime) {
    const voice = music.voices[voiceName];
    if (!voice) return;
    
    const secondsPerBeat = 60 / music.bpm;
    let currentTime = startTime;
    let noteIndex = 0;
    
    // Calculate which notes to play for this bar
    let beatCount = 0;
    let barStartIndex = 0;
    
    // Find start of current bar
    for (let i = 0; i < voice.length; i++) {
        if (beatCount >= bar * 4) {
            barStartIndex = i;
            break;
        }
        beatCount += voice[i][1];
    }
    
    // Play notes for this bar (4 beats)
    beatCount = 0;
    for (let i = barStartIndex; i < voice.length && beatCount < 4; i++) {
        const [scaleDegree, duration, octaveShift] = voice[i];
        const freq = scaleDegreesToFreq(scaleDegree, octaveShift);
        const noteDuration = duration * secondsPerBeat;
        
        playMelodyNote(freq, currentTime, noteDuration);
        currentTime += noteDuration;
        beatCount += duration;
    }
}

function getCurrentChord() {
    // Calculate bar based on game time (60 fps assumed)
    const beatsPerSecond = music.bpm / 60;
    const framesPerBeat = 60 / beatsPerSecond;
    const framesPerBar = framesPerBeat * music.beatsPerBar;
    music.currentBar = Math.floor(game.time / framesPerBar) % 8;
    const chordName = music.chords[music.currentBar];
    return music.chordVoicings[chordName];
}

// Game state
const game = {
    running: false,
    score: 0,
    difficulty: 1,
    time: 0,
    shakeAmount: 0,
    lastSpawn: 0,  // Track last spawn time
    explosionRadius: 60 // Radius for chain reaction explosions
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
const powerups = [];

// Power-up types
const POWERUP_TYPES = {
    FIRERATE: { color: '#ff0', glow: '#ff0', name: 'FIRE RATE' },
    SPREAD: { color: '#0ff', glow: '#0ff', name: 'SPREAD' },
    POWER: { color: '#f0f', glow: '#f0f', name: 'POWER' }
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Resume audio context and start music on first user interaction
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    // Start Vivaldi on first keypress
    if (!music.isPlaying) {
        music.isPlaying = true;
        scheduleMusic();
        console.log('Vivaldi Spring in E Major started!');
    }
    
    if (e.key.toLowerCase() === 'r') {
        restartGame();
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ============================================
// SOUND EFFECTS
// ============================================

function playLaser() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    // Pick a random note from E major scale
    const currentScale = music.scale;
    const note = currentScale[Math.floor(Math.random() * currentScale.length)];
    
    // Quick pitch sweep down (laser sound) starting from the scale note
    osc.frequency.setValueAtTime(note * 2, audioCtx.currentTime); // Start an octave higher
    osc.frequency.exponentialRampToValueAtTime(note, audioCtx.currentTime + 0.08);
    
    // Quick fade out
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.08);
}

function playExplosion() {
    // Get current chord from progression
    const chord = getCurrentChord();
    const note = chord[Math.floor(Math.random() * chord.length)];
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine'; // Pure tone for musical pling
    osc.frequency.setValueAtTime(note, audioCtx.currentTime);
    
    // Bell-like envelope with slight pitch bend down
    osc.frequency.exponentialRampToValueAtTime(note * 0.98, audioCtx.currentTime + 0.3);
    
    // Quick attack, slower decay
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
}

function playHit() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'square';
    
    // Harsh hit sound
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
}

function playPowerup() {
    // Play ascending arpeggio of current chord
    const chord = getCurrentChord();
    
    for (let i = 0; i < chord.length; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(chord[i], audioCtx.currentTime + i * 0.08);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.08 + 0.2);
        
        osc.start(audioCtx.currentTime + i * 0.08);
        osc.stop(audioCtx.currentTime + i * 0.08 + 0.2);
    }
}

function playKick(time) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    osc.start(time);
    osc.stop(time + 0.1);
}

function playSnare(time) {
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    
    const noiseGain = audioCtx.createGain();
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    noiseGain.gain.setValueAtTime(0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    noise.start(time);
}

function playHiHat(time, open = false) {
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    
    const noiseGain = audioCtx.createGain();
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 7000;
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    const duration = open ? 0.1 : 0.05;
    noiseGain.gain.setValueAtTime(0.15, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    noise.start(time);
}

function playBassNote(freq, time, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.Q.value = 3;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    osc.start(time);
    osc.stop(time + duration);
}

function playMelodyNote(freq, time, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    osc.start(time);
    osc.stop(time + duration);
}

function scheduleMusic() {
    if (!music.isPlaying) return;
    const secondsPerBeat = 60 / music.bpm;
    const barDuration = secondsPerBeat * music.beatsPerBar;
    const totalLoopDuration = barDuration * 8;
    
    const now = audioCtx.currentTime;
    music.startTime = now;
    
    // Schedule 2 loops ahead to ensure smooth playback
    for (let loop = 0; loop < 2; loop++) {
        const loopStart = now + (loop * totalLoopDuration);
        
        // Schedule each bar in the 8-bar Vivaldi piece
        for (let bar = 0; bar < 8; bar++) {
            const barStart = loopStart + (bar * barDuration);
            const chordName = music.chords[bar];
            const chord = music.chordVoicings[chordName];
            const rootNote = chord[0]; // Bass note
            
            // Disco beat pattern (keep the drums)
            for (let beat = 0; beat < 4; beat++) {
                const beatTime = barStart + (beat * secondsPerBeat);
                
                // Kick on every beat (four on the floor)
                playKick(beatTime);
                
                // Snare on beats 2 and 4
                if (beat === 1 || beat === 3) {
                    playSnare(beatTime);
                }
                
                // Hi-hat on every eighth note
                playHiHat(beatTime, false);
                playHiHat(beatTime + secondsPerBeat / 2, true);
            }
            
            // Bass line - use Vivaldi cello part
            playVoice('cello', bar, barStart);
            
            // Play all 4 Vivaldi voices
            playVoice('violin1', bar, barStart);
            playVoice('violin2', bar, barStart);
            playVoice('viola', bar, barStart);
        }
    }
    
    // Increment loop counter
    // Increment loop counter for next generation
    music.loopCount++;
    
    // Schedule next batch before current loops end
    setTimeout(() => scheduleMusic(), totalLoopDuration * 1000 - 1000);
}

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
    powerups.length = 0;
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
    updatePowerups();
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
            playLaser();
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
        
        if (particle.type === 'ring' || particle.type === 'explosion') {
            particle.radius += particle.expandSpeed;
        }
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        
        // Fade out after time
        powerup.life--;
        powerup.alpha = Math.min(1, powerup.life / 120);
        
        // Pulse effect
        powerup.pulsePhase += 0.1;
        powerup.radius = powerup.baseRadius + Math.sin(powerup.pulsePhase) * 3;
        
        // Remove if expired
        if (powerup.life <= 0) {
            powerups.splice(i, 1);
        }
    }
}

// ============================================
// SPAWN
// ============================================

function spawnEnemies() {
    // Gradual ramp up - starts slow, gets crazy
    const baseRate = 80 - Math.floor(game.difficulty * 5);
    const spawnRate = Math.max(8, baseRate); // Spawn every 8-80 frames
    
    // Check if enough time has passed since last spawn
    if (game.time - game.lastSpawn >= spawnRate) {
        // Start with 1 enemy, ramp up to 8+ as difficulty increases
        const spawnCount = Math.min(8, Math.floor(1 + game.difficulty * 0.5));
        
        // Spawn in clusters - pick a spawn point and cluster around it
        const edge = Math.floor(Math.random() * 4);
        let baseX, baseY;
        
        switch (edge) {
            case 0: baseX = Math.random() * canvas.width; baseY = -20; break;
            case 1: baseX = canvas.width + 20; baseY = Math.random() * canvas.height; break;
            case 2: baseX = Math.random() * canvas.width; baseY = canvas.height + 20; break;
            case 3: baseX = -20; baseY = Math.random() * canvas.height; break;
        }
        
        for (let i = 0; i < spawnCount; i++) {
            // Cluster enemies within 50px of base position
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 100;
            spawnEnemy(baseX + offsetX, baseY + offsetY);
        }
        game.lastSpawn = game.time;
    }
}

function spawnEnemy(x, y) {
    // Color variety based on difficulty
    const colorChoices = ['#f0f', '#f00', '#0f0', '#00f', '#ff0', '#f80'];
    const colorIndex = Math.floor(game.difficulty / 2) % colorChoices.length;
    
    enemies.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        radius: 10,
        speed: 1 + game.difficulty * 0.2,
        hp: 1,
        color: colorChoices[colorIndex]
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

function spawnPowerup(x, y) {
    // Random power-up type
    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const powerupType = POWERUP_TYPES[type];
    
    powerups.push({
        x: x,
        y: y,
        type: type,
        color: powerupType.color,
        glow: powerupType.glow,
        baseRadius: 8,
        radius: 8,
        life: 600, // 10 seconds before fade
        alpha: 1,
        pulsePhase: 0
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
            radius: type === 'ring' ? 5 : type === 'explosion' ? 10 : 2,
            expandSpeed: type === 'ring' ? 2 : type === 'explosion' ? 4 : 0,
            life: type === 'ring' ? 30 : type === 'explosion' ? 20 : 20 + Math.random() * 20,
            maxLife: type === 'ring' ? 30 : type === 'explosion' ? 20 : 40,
            alpha: 1,
            color: type === 'ring' ? '#f0f' : type === 'explosion' ? '#f80' : '#ff0',
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
        if (!bullet) continue; // Safety check
        
        let bulletDestroyed = false;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (!enemy) continue; // Safety check
            
            if (circleCollision(bullet, enemy)) {
                // Store enemy position before removal
                const enemyX = enemy.x;
                const enemyY = enemy.y;
                
                // Destroy enemy
                enemies.splice(j, 1);
                
                // Add score and track kills
                game.score += 10;
                player.kills++;
                
                // Chance to drop power-up (30% chance)
                if (Math.random() < 0.3) {
                    spawnPowerup(enemyX, enemyY);
                }
                
                // Explosion sound
                playExplosion();
                
                // Particles
                spawnParticles(enemyX, enemyY, 3, 'ring');
                spawnParticles(enemyX, enemyY, 8, 'spark');
                
                // Chain reaction explosion!
                explodeEnemiesInRadius(enemyX, enemyY, game.explosionRadius);
                
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
        
        // Check if enemy still exists (may have been removed by chain reaction)
        if (!enemy) continue;
        
        if (circleCollision(player, enemy)) {
            // Damage player
            player.hp -= 10;
            
            // Hit sound
            playHit();
            
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
    
    // Player vs Power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        const dx = player.x - powerup.x;
        const dy = player.y - powerup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + powerup.radius) {
            // Collect power-up
            powerups.splice(i, 1);
            
            // Apply upgrade based on type
            if (powerup.type === 'FIRERATE') {
                player.fireRate = Math.max(15, player.fireRate - 3);
            } else if (powerup.type === 'SPREAD' && player.bulletCount < 9) {
                player.bulletCount++;
            } else if (powerup.type === 'POWER') {
                // Increase piercing
                // We'll apply this globally for now
            }
            
            playPowerup();
            
            // Visual feedback
            spawnParticles(powerup.x, powerup.y, 8, 'spark');
        }
    }
}

function circleCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx ** 2 + dy ** 2);
    return dist < a.radius + b.radius;
}

function explodeEnemiesInRadius(x, y, radius, depth = 0) {
    // Limit chain depth to prevent infinite loops
    if (depth > 5 || radius < 20) return;
    
    // Find and collect enemies within explosion radius
    const enemiesToExplode = [];
    
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < radius) {
            enemiesToExplode.push({
                index: i,
                x: enemy.x,
                y: enemy.y
            });
        }
    }
    
    // Process explosions (backwards to handle splicing)
    for (let i = enemiesToExplode.length - 1; i >= 0; i--) {
        const exploding = enemiesToExplode[i];
        
        // Find current index (may have shifted due to earlier splices)
        let currentIndex = -1;
        for (let j = 0; j < enemies.length; j++) {
            if (enemies[j].x === exploding.x && enemies[j].y === exploding.y) {
                currentIndex = j;
                break;
            }
        }
        
        if (currentIndex >= 0) {
            enemies.splice(currentIndex, 1);
            
            // Add score and track kills
            game.score += 10;
            player.kills++;
            
            // Chance to drop power-up (30% chance)
            if (Math.random() < 0.3) {
                spawnPowerup(exploding.x, exploding.y);
            }
            
            // Sound and particles
            playExplosion();
            spawnParticles(exploding.x, exploding.y, 2, 'ring');
            spawnParticles(exploding.x, exploding.y, 6, 'spark');
            
            // Recursive chain reaction with reduced radius
            explodeEnemiesInRadius(exploding.x, exploding.y, radius * 0.6, depth + 1);
        }
    }
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
    renderPowerups();
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
        
        if (particle.type === 'ring' || particle.type === 'explosion') {
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = particle.type === 'explosion' ? 3 : 2;
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

function renderPowerups() {
    powerups.forEach(powerup => {
        ctx.globalAlpha = powerup.alpha;
        ctx.shadowBlur = 15;
        ctx.shadowColor = powerup.glow;
        
        // Outer glow circle
        ctx.strokeStyle = powerup.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner bright core
        ctx.fillStyle = powerup.color;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, powerup.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
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
