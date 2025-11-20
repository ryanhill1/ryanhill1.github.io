const collapseAllButton = document.getElementById('collapseAllButton');
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
  console.error('Canvas element not found');
}
const ctx = canvas?.getContext('2d');
if (!ctx) {
  console.error('Could not get 2d context from canvas');
}

const MAX_WAVE_FUNCTIONS = 100;
const FIXED_TIME_STEP = 1000 / 60; // 60 FPS
const LINK_DATA = [
  {
    name: 'LinkedIn',
    link: 'https://www.linkedin.com/in/ryan-james-hill/',
    color: '#0077B5',
  },
  { name: 'GitHub', link: 'https://github.com/ryanhill1', color: '#171515' },
  {
    name: 'Stack\nExchange',
    link: 'https://quantumcomputing.stackexchange.com/users/13991/ryanhill1?tab=profile',
    color: '#F48024',
  },
  { name: 'CV', link: '/files/Ryan-Hill-CV.pdf', color: '#C0C0C0' },
  { name: 'qBraid', link: 'https://www.qbraid.com/', color: '#df0982' },
];

let waveFunctions = [];
let lastTime = 0;
let frameCount = 0;

function resizeCanvas() {
  if (!canvas) return;
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  canvas.width = width;
  canvas.height = height;
}

function combinedAreaRadius(radius1, radius2) {
  const combinedArea = Math.PI * (radius1 * radius1 + radius2 * radius2);
  return Math.sqrt(combinedArea / Math.PI);
}

class WaveFunction {
  constructor(isLink = false, label = '', url = '', color = '') {
    this.isLink = isLink;
    this.label = label;
    this.url = url;
    this.color = isLink ? color : 'rgba(100, 100, 255, 1)';
    this.initializeProperties();
  }

  initializeProperties() {
    const initialRadius = this.isLink ? 50 : 20 + Math.random() * 30;
    this.radius = initialRadius;
    this.setPosition();
    this.setSpeed();
    this.alpha = 0.7;
    this.isCollapsing = false;
    this.collapseDuration = 500;
    this.collapseStartTime = null;
    this.markedForRemoval = false;
    this.mass = this.radius;
    this.isGrowing = false;
    this.growthStartRadius = 0;
    this.growthTargetRadius = 0;
    this.growthStartTime = 0;
    this.growthDuration = 500;
    this.spawnProgress = 0;
    this.spawnDuration = 500;
    this.spawnStartTime = Date.now();
  }

  setPosition() {
    let position = null;
    const initialRadius = this.radius;
    for (let i = 1; i <= 5; i++) {
      position = this.findValidPosition();
      if (position) break;
      this.radius = initialRadius / (i + 1);
    }
    if (position) {
      this.x = position.x;
      this.y = position.y;
    } else {
      this.x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
      this.y = Math.random() * (canvas.height - 2 * this.radius) + this.radius;
    }
  }

  setSpeed() {
    const baseSpeed = (Math.random() - 0.5) * 0.5;
    // Ensure minimum speed to prevent stuck bubbles
    const minSpeed = 0.05;
    const normSpeed =
      Math.abs(baseSpeed) >= minSpeed
        ? baseSpeed
        : baseSpeed >= 0
          ? minSpeed
          : -minSpeed;
    this.speedX = this.isLink ? normSpeed : normSpeed * 2;
    this.speedY = this.isLink ? normSpeed : normSpeed * 2;
  }

  findValidPosition() {
    const radius = this.radius;
    const width = Math.max(radius * 2 + 10, canvas.width);
    const height = Math.max(radius * 2 + 10, canvas.height);
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < 100; i++) {
      let x, y;

      if (this.isLink) {
        // Generate coordinates within a circle around the center
        const angle = Math.random() * 2 * Math.PI;
        const maxDistance = Math.max(radius, width / 4 - radius);
        const distance = Math.random() * maxDistance + radius;
        x = centerX + distance * Math.cos(angle);
        y = centerY + distance * Math.sin(angle);
      } else {
        const maxX = Math.max(radius, width - 2 * radius);
        const maxY = Math.max(radius, height - 2 * radius);
        x = Math.random() * maxX + radius;
        y = Math.random() * maxY + radius;
      }

      if (
        waveFunctions.every(
          (wf) => Math.hypot(x - wf.x, y - wf.y) >= radius + wf.radius,
        )
      ) {
        return { x, y };
      }
    }
    return null;
  }

  draw() {
    if (!ctx) return;
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = this.alpha * (this.spawnProgress / 100);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15 * this.alpha * (this.spawnProgress / 100);

    const scaleFactor = this.spawnProgress / 100;
    const drawRadius = this.radius * scaleFactor;

    ctx.arc(this.x, this.y, drawRadius, 0, Math.PI * 2);
    ctx.fill();

    if (this.isLink) {
      this.drawLabel(scaleFactor);
    }

    ctx.restore();
  }

  drawLabel(scaleFactor) {
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.font = `bold ${32 * scaleFactor}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(0.5 * scaleFactor, 0.5 * scaleFactor);
    ctx.rotate(0.01);
    const lines = this.label.split('\n');
    if (lines.length === 1) {
      ctx.fillText(this.label, 0, 0);
    } else if (lines.length === 2) {
      ctx.fillText(lines[0], 0, -15);
      ctx.fillText(lines[1], 0, 15);
    } else {
      // Handle 3+ lines by showing first two
      ctx.fillText(lines[0], 0, -15);
      ctx.fillText(lines[1] || '', 0, 15);
    }
    ctx.restore();
  }

  update(deltaTime) {
    if (this.spawnProgress < 100) {
      const elapsed = Date.now() - this.spawnStartTime;
      const rawProgress = Math.min(100, (elapsed / this.spawnDuration) * 100);

      // Easing function for smooth pop-up effect
      const easeOutBack = (t) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };

      // Apply easing to raw progress (0-1 range), then scale back to 0-100
      this.spawnProgress = Math.min(100, easeOutBack(rawProgress / 100) * 100);
    }

    if (this.isCollapsing) {
      this.updateCollapse();
    } else {
      this.updatePosition(deltaTime);
      this.ensureInsideCanvas();
    }
    this.updateGrowth();
  }

  updateCollapse() {
    const elapsed = Date.now() - this.collapseStartTime;
    this.alpha = Math.max(0, 0.7 * (1 - elapsed / this.collapseDuration));
    if (this.alpha <= 0) {
      this.markedForRemoval = true;
    }
  }

  updatePosition(deltaTime) {
    this.x += this.speedX * deltaTime * 60;
    this.y += this.speedY * deltaTime * 60;
    this.bounceOffWalls();
  }

  ensureInsideCanvas() {
    // Only ensure position if not bouncing (bounceOffWalls handles it)
    // This prevents double-adjustment conflicts
    const margin = 1;
    const minX = this.radius + margin;
    const maxX = canvas.width - this.radius - margin;
    const minY = this.radius + margin;
    const maxY = canvas.height - this.radius - margin;

    // Only clamp if outside bounds (bounce should have handled it, but safety check)
    if (this.x < minX || this.x > maxX || this.y < minY || this.y > maxY) {
      this.x = Math.max(minX, Math.min(maxX, this.x));
      this.y = Math.max(minY, Math.min(maxY, this.y));
    }
  }

  bounceOffWalls() {
    const margin = 1; // Small margin to ensure the wavefunction stays inside

    if (this.x + this.radius >= canvas.width - margin) {
      this.x = canvas.width - this.radius - margin;
      this.speedX = -Math.abs(this.speedX);
    } else if (this.x - this.radius <= margin) {
      this.x = this.radius + margin;
      this.speedX = Math.abs(this.speedX);
    }

    if (this.y + this.radius >= canvas.height - margin) {
      this.y = canvas.height - this.radius - margin;
      this.speedY = -Math.abs(this.speedY);
    } else if (this.y - this.radius <= margin) {
      this.y = this.radius + margin;
      this.speedY = Math.abs(this.speedY);
    }
  }

  collapse() {
    if (!this.isLink) {
      this.isCollapsing = true;
      this.collapseStartTime = Date.now();
    }
  }

  checkCollision(other) {
    const distance = Math.hypot(this.x - other.x, this.y - other.y);
    const minDistance = this.radius + other.radius;
    // Only detect collision when actually touching or overlapping
    return distance < minDistance;
  }

  resolveCollision(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return;

    const [normalX, normalY] = [dx / distance, dy / distance];
    const [tangentX, tangentY] = [-normalY, normalX];
    const [v1n, v1t] = [
      this.speedX * normalX + this.speedY * normalY,
      this.speedX * tangentX + this.speedY * tangentY,
    ];
    const [v2n, v2t] = [
      other.speedX * normalX + other.speedY * normalY,
      other.speedX * tangentX + other.speedY * tangentY,
    ];

    const v1n_after =
      (v1n * (this.mass - other.mass) + 2 * other.mass * v2n) /
      (this.mass + other.mass);
    const v2n_after =
      (v2n * (other.mass - this.mass) + 2 * this.mass * v1n) /
      (this.mass + other.mass);

    [this.speedX, this.speedY] = [
      v1n_after * normalX + v1t * tangentX,
      v1n_after * normalY + v1t * tangentY,
    ];
    [other.speedX, other.speedY] = [
      v2n_after * normalX + v2t * tangentX,
      v2n_after * normalY + v2t * tangentY,
    ];

    this.separateOverlap(other, normalX, normalY, distance);
  }

  separateOverlap(other, normalX, normalY, distance) {
    const overlap = this.radius + other.radius - distance;
    if (overlap > 0) {
      // Add a small buffer to prevent immediate re-overlap
      const minSeparation = 0.1;
      const totalSeparation = overlap + minSeparation;
      const separationX = normalX * totalSeparation * 0.5;
      const separationY = normalY * totalSeparation * 0.5;
      this.x -= separationX;
      this.y -= separationY;
      other.x += separationX;
      other.y += separationY;
    }
  }

  startGrowth(targetRadius) {
    this.isGrowing = true;
    this.growthStartRadius = this.radius;
    this.growthTargetRadius = targetRadius;
    this.growthStartTime = Date.now();
  }

  updateGrowth() {
    if (!this.isGrowing) return;
    const progress = Math.min(
      (Date.now() - this.growthStartTime) / this.growthDuration,
      1,
    );
    const easeOutQuad = (t) => t * (2 - t);
    this.radius =
      this.growthStartRadius +
      (this.growthTargetRadius - this.growthStartRadius) *
        easeOutQuad(progress);
    // Update mass continuously during growth for accurate physics
    this.mass = this.radius;
    if (progress >= 1) {
      this.isGrowing = false;
      this.radius = this.growthTargetRadius;
      this.mass = this.radius;
    }
  }

  combine(other) {
    const newRadius = combinedAreaRadius(this.radius, other.radius);
    const [newSpeedX, newSpeedY] = [
      (this.speedX + other.speedX) / 2,
      (this.speedY + other.speedY) / 2,
    ];
    if (this.mass > other.mass) {
      this.startGrowth(newRadius);
      [this.speedX, this.speedY] = [newSpeedX, newSpeedY];
      other.collapse();
      other.markedForRemoval = true;
    } else {
      other.startGrowth(newRadius);
      [other.speedX, other.speedY] = [newSpeedX, newSpeedY];
      this.collapse();
      this.markedForRemoval = true;
    }
  }
}

function initializeWaveFunctions() {
  LINK_DATA.forEach(({ name, link, color }) => {
    waveFunctions.push(new WaveFunction(true, name, link, color));
  });
}

function addNewWaveFunction() {
  if (waveFunctions.length <= MAX_WAVE_FUNCTIONS) {
    waveFunctions.push(new WaveFunction());
  }
}

function checkAndSeparateOverlaps() {
  for (let i = 0; i < waveFunctions.length; i++) {
    for (let j = i + 1; j < waveFunctions.length; j++) {
      const [wf1, wf2] = [waveFunctions[i], waveFunctions[j]];
      const [dx, dy] = [wf2.x - wf1.x, wf2.y - wf1.y];
      const distance = Math.hypot(dx, dy);

      // Handle case where objects are exactly on top of each other
      if (distance === 0) {
        const angle = Math.random() * Math.PI * 2;
        const minSeparation = wf1.radius + wf2.radius + 1;
        wf1.x -= Math.cos(angle) * minSeparation * 0.5;
        wf1.y -= Math.sin(angle) * minSeparation * 0.5;
        wf2.x += Math.cos(angle) * minSeparation * 0.5;
        wf2.y += Math.sin(angle) * minSeparation * 0.5;
        continue;
      }

      const overlap = wf1.radius + wf2.radius - distance;
      if (overlap > 0) {
        // Add buffer to prevent immediate re-overlap
        const minSeparation = 0.1;
        const totalSeparation = overlap + minSeparation;
        const [normalX, normalY] = [dx / distance, dy / distance];
        const [separationX, separationY] = [
          normalX * totalSeparation * 0.5,
          normalY * totalSeparation * 0.5,
        ];
        wf1.x -= separationX;
        wf1.y -= separationY;
        wf2.x += separationX;
        wf2.y += separationY;
        if (!wf1.isLink) {
          wf1.speedX += (Math.random() - 0.5) * 0.5;
          wf1.speedY += (Math.random() - 0.5) * 0.5;
        }
        if (!wf2.isLink) {
          wf2.speedX += (Math.random() - 0.5) * 0.5;
          wf2.speedY += (Math.random() - 0.5) * 0.5;
        }
      }
    }
  }
}

function animate(currentTime) {
  requestAnimationFrame(animate);

  // Handle first frame - initialize lastTime to prevent huge deltaTime
  if (lastTime === 0) {
    lastTime = currentTime;
    return;
  }

  const deltaTime = (currentTime - lastTime) / 1000;
  // Cap deltaTime to prevent large jumps (e.g., tab switching)
  const cappedDeltaTime = Math.min(deltaTime, (FIXED_TIME_STEP / 1000) * 2);

  if (deltaTime >= FIXED_TIME_STEP / 1000) {
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateWaveFunctions(cappedDeltaTime);
      waveFunctions = waveFunctions.filter((wf) => !wf.markedForRemoval);
    }
    lastTime = currentTime;
  }
  if (frameCount % 10 === 0) {
    checkAndSeparateOverlaps();
  }
  frameCount++;
}

function updateWaveFunctions(deltaTime) {
  for (let i = 0; i < waveFunctions.length; i++) {
    waveFunctions[i].update(deltaTime);
    for (let j = i + 1; j < waveFunctions.length; j++) {
      if (waveFunctions[i].checkCollision(waveFunctions[j])) {
        if (
          !waveFunctions[i].isLink &&
          !waveFunctions[j].isLink &&
          (waveFunctions.length >= MAX_WAVE_FUNCTIONS || Math.random() < 0.05)
        ) {
          waveFunctions[i].combine(waveFunctions[j]);
        } else {
          waveFunctions[i].resolveCollision(waveFunctions[j]);
        }
      }
    }
    waveFunctions[i].draw();
  }
}

function handleCanvasClick(event) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  for (let wf of waveFunctions) {
    // Account for spawn progress in click detection
    const effectiveRadius = wf.radius * (wf.spawnProgress / 100);
    if (Math.hypot(wf.x - clickX, wf.y - clickY) < effectiveRadius) {
      if (wf.isLink) {
        try {
          window.open(wf.url, '_blank');
        } catch (e) {
          console.warn('Could not open link:', e);
        }
      } else if (!wf.isCollapsing) {
        wf.collapse();
      }
      break;
    }
  }

  if (waveFunctions.length <= LINK_DATA.length + 1) {
    waveFunctions.push(new WaveFunction());
  }
}

function handleCollapseAll() {
  waveFunctions.forEach((wf) => {
    wf.collapse();
  });
}

// Test function: Create two bubbles on a collision course
function createCollisionTest() {
  // Clear existing non-link wave functions
  waveFunctions = waveFunctions.filter((wf) => wf.isLink);

  const centerY = canvas.height / 2;
  const radius = 40;
  const margin = 100; // Distance from edge of canvas

  // Create first bubble on the left side, moving right
  const wf1 = new WaveFunction();
  wf1.x = margin + radius; // Position near left edge
  wf1.y = centerY;
  wf1.radius = radius;
  wf1.mass = radius;
  wf1.speedX = 2; // Moderate speed for visible collision
  wf1.speedY = 0;
  wf1.color = 'rgba(255, 100, 100, 1)'; // Red
  wf1.spawnProgress = 100; // Fully spawned
  waveFunctions.push(wf1);

  // Create second bubble on the right side, moving left
  const wf2 = new WaveFunction();
  wf2.x = canvas.width - margin - radius; // Position near right edge
  wf2.y = centerY;
  wf2.radius = radius;
  wf2.mass = radius;
  wf2.speedX = -2; // Moderate speed for visible collision
  wf2.speedY = 0;
  wf2.color = 'rgba(100, 100, 255, 1)'; // Blue
  wf2.spawnProgress = 100; // Fully spawned
  waveFunctions.push(wf2);

  console.log('Collision test created: Two bubbles heading toward each other');
  console.log('Press "t" key to create another collision test');
}

// Add keyboard shortcut for collision test
document.addEventListener('keydown', (event) => {
  if (event.key === 't' || event.key === 'T') {
    createCollisionTest();
  }
});

function init() {
  if (!canvas || !ctx) {
    console.error('Canvas or context not available. Initialization aborted.');
    return;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('click', handleCanvasClick);
  if (collapseAllButton) {
    collapseAllButton.addEventListener('click', handleCollapseAll);
  }
  initializeWaveFunctions();
  setInterval(addNewWaveFunction, 2000);
  animate(0);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
