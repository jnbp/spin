const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const optionsInput = document.getElementById('options');
const multiplierInput = document.getElementById('multiplier');
const durationInput = document.getElementById('duration');
const summaryText = document.getElementById('summary');
const multiplierValue = document.getElementById('multiplierValue');
const durationValue = document.getElementById('durationValue');

// Create Winner Overlay Element
const winnerOverlay = document.createElement('div');
winnerOverlay.className = 'winner-overlay';
winnerOverlay.innerHTML = '<h2>Winner</h2><p class="winner-text"></p>';
document.body.appendChild(winnerOverlay);

// Add Easing Toggle to Controls
const easingContainer = document.createElement('div');
easingContainer.className = 'input-group';
easingContainer.innerHTML = `
    <label for="easing">Spin Physics</label>
    <select id="easing" style="padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd; background: #fafafa;">
        <option value="medium">Medium (Cubic)</option>
        <option value="heavy">Super Heavy (Quintic)</option>
        <option value="random">Random (Surprise)</option>
        <option value="linear">Linear (Constant)</option>
    </select>
`;
// Insert before Spin Button
document.querySelector('.controls').insertBefore(easingContainer, spinBtn);
const easingInput = document.getElementById('easing');
const soundToggle = document.getElementById('soundToggle');

let segments = [];
let currentRotation = 0;
let isSpinning = false;
let animationId = null;

// Audio Context for ticking sound
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTick() {
    if (!audioCtx || !soundToggle.checked) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Higher pitch, shorter duration "Tick"
    osc.type = 'sine'; // Sine wave is cleaner for high pitch tick
    osc.frequency.setValueAtTime(800, audioCtx.currentTime); // Higher start
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.02); // Quick chirp up

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
}

function playWinSound() {
    if (!audioCtx || !soundToggle.checked) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // Play a Major Triad Arpeggio (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = audioCtx.currentTime;

    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        const startTime = now + i * 0.1;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
    });
}

// Vibrant High-Contrast Colors
// Use Golden Angle approximation to spread hues widely
function getColor(index, total) {
    // Golden angle approx = 137.508 degrees
    // This ensures adjacent segments often have very different hues
    const hue = (index * 137.508) % 360;
    return `hsl(${hue}, 70%, 75%)`; // Kept lightness/saturation consistent for modern feel
}

function parseOptions() {
    const rawText = optionsInput.value.trim();
    if (!rawText) return [];
    return rawText.split('\n').filter(line => line.trim() !== '');
}

function updateSegments() {
    const options = parseOptions();
    const multiplier = parseInt(multiplierInput.value, 10);

    segments = [];
    if (options.length === 0) return;

    for (let i = 0; i < multiplier; i++) {
        segments = segments.concat(options);
    }

    // Shuffle slightly if multiple to mix them up? Or keep order? 
    // Request says: "Option 1, Option 2, Option 3... Fields: 2 -> 6 fields. Each option is 2 times."
    // Usually interleaved is better: A, B, C, A, B, C or A, A, B, B, C, C.
    // Let's create an interleaved array: A, B, C, A, B, C...
    /* Actually current concat does A, B, C, A, B, C which is good for distribution */

    summaryText.textContent = `Spinning wheel with ${segments.length} fields. Each option appears ${multiplier} times.`;
    drawWheel();
}

function drawWheel() {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 10;

    ctx.clearRect(0, 0, width, height);

    if (segments.length === 0) {
        // Draw placeholder
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#eee';
        ctx.fill();
        ctx.stroke();
        return;
    }

    const arcSize = (Math.PI * 2) / segments.length;

    // Draw Segments
    segments.forEach((segment, i) => {
        const startAngle = currentRotation + i * arcSize;
        const endAngle = currentRotation + (i + 1) * arcSize;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = getColor(i, segments.length);
        ctx.fill();
        ctx.stroke();

        // Draw Text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + arcSize / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px sans-serif';
        // Adjust text position slightly since arrow is on right now
        // Actually text logic is radial, so it's fine. 0 is Right.
        ctx.fillText(segment, radius - 20, 5);
        ctx.restore();
    });
}

// Physics Easing Functions
function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function easeOutQuint(x) { return 1 - Math.pow(1 - x, 5); }

function spin() {
    if (isSpinning || segments.length === 0) return;

    initAudio();
    isSpinning = true;

    // Disable all inputs
    spinBtn.disabled = true;
    optionsInput.disabled = true;
    multiplierInput.disabled = true;
    durationInput.disabled = true;
    easingInput.disabled = true;
    soundToggle.disabled = true;

    winnerOverlay.classList.remove('show');

    const duration = parseFloat(durationInput.value) * 1000;
    const startTimestamp = performance.now();
    const initialRotation = currentRotation;
    const extraSpins = 5 * (Math.PI * 2);
    const randomOffset = Math.random() * (Math.PI * 2);
    const targetRotation = initialRotation + extraSpins + randomOffset;

    // Determine Easing Mode
    const mode = easingInput.value;
    let selectedEasingType = mode;

    if (mode === 'random') {
        const r = Math.random();
        if (r < 0.5) selectedEasingType = 'heavy';
        else if (r < 0.8) selectedEasingType = 'medium';
        else selectedEasingType = 'fake_stop';
    }

    let lastSegmentIndex = -1;

    function animate(timestamp) {
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);

        let ease;
        if (selectedEasingType === 'linear') {
            ease = progress;
        } else if (selectedEasingType === 'medium') {
            ease = easeOutCubic(progress);
        } else if (selectedEasingType === 'fake_stop') {
            // Custom "Fake stop": 
            // x(t) = 1 - (1-t)^7 (Very heavy)
            ease = 1 - Math.pow(1 - progress, 7);
        } else {
            // Default/Heavy
            ease = easeOutQuint(progress);
        }


        currentRotation = initialRotation + (targetRotation - initialRotation) * ease;

        // Audio Logic
        const totalSegments = segments.length;
        const segmentAngle = (Math.PI * 2) / totalSegments;

        // Track integer index to trigger sound
        const currentTotalIndex = Math.floor(currentRotation / segmentAngle);

        if (currentTotalIndex !== lastSegmentIndex && lastSegmentIndex !== -1) {
            playTick();
        }
        lastSegmentIndex = currentTotalIndex;

        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            spinBtn.disabled = false;
            optionsInput.disabled = false;
            multiplierInput.disabled = false;
            durationInput.disabled = false;
            easingInput.disabled = false;
            soundToggle.disabled = false;

            // Calculate Winner
            // Pointer is at RIGHT (0 radians / 0 degrees).
            // Wheel rotates clockwise.
            // Segment at pointer is found by normalizing negative rotation.

            const normalizedRot = currentRotation % (Math.PI * 2);

            // If pointer is at 0, and wheel rotated R.
            // Angle at 0 is (0 - R) % 2PI.
            let angleAtPointer = (0 - normalizedRot) % (Math.PI * 2);
            if (angleAtPointer < 0) angleAtPointer += Math.PI * 2;

            const winningIndex = Math.floor(angleAtPointer / ((Math.PI * 2) / segments.length));
            const winner = segments[winningIndex];

            showWinner(winner);
            playWinSound();
            triggerConfetti();
        }
    }

    requestAnimationFrame(animate);
}

function showWinner(text) {
    document.querySelector('.winner-overlay .winner-text').textContent = text;
    winnerOverlay.classList.add('show');
}

function triggerConfetti() {
    // Destroy previous instance/canvas to ensure no "oval" artifacts from overlays
    const existingCanvas = document.getElementById('confetti-canvas');
    if (existingCanvas) existingCanvas.remove();

    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999'; // Below Winner Overlay (1000) but above everything else

    // AGGRESSIVE RESET to fix "oval shade" bug
    canvas.style.background = 'transparent';
    canvas.style.boxShadow = 'none';
    canvas.style.border = 'none';
    canvas.style.borderRadius = '0';
    canvas.style.outline = 'none';
    canvas.style.filter = 'none';

    document.body.appendChild(canvas);

    const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true
    });

    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        myConfetti({
            particleCount: 7,
            angle: 270, // Downwards
            spread: 120,
            origin: { x: Math.random(), y: -0.1 }, // From top
            colors: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9f43', '#5f27cd'],
            shapes: ['square'],
            gravity: 1, // Faster gravity
            scalar: 1.2,
            startVelocity: 40,
            drift: 0,
            ticks: 200
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        } else {
            // Cleanup Canvas
            setTimeout(() => {
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            }, 1000);

            // Fade out Winner Overlay after confetti finishes
            winnerOverlay.classList.remove('show');
        }
    }());
}

// Event Listeners
optionsInput.addEventListener('input', updateSegments);
multiplierInput.addEventListener('input', (e) => {
    multiplierValue.textContent = e.target.value;
    updateSegments();
});
durationInput.addEventListener('input', (e) => {
    durationValue.textContent = e.target.value + 's';
});
// Update duration max
durationInput.max = 60;
durationInput.step = 1;

spinBtn.addEventListener('click', spin);

// Close overlay on click
winnerOverlay.addEventListener('click', () => {
    winnerOverlay.classList.remove('show');
});

// Initial Render
updateSegments();
