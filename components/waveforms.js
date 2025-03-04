// DOM elements
const collapseAllButton = document.getElementById('collapseAllButton');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const MAX_WAVE_FUNCTIONS = 100;
const FIXED_TIME_STEP = 1000 / 60; // 60 FPS

// State
let waveFunctions = [];
let lastTime = 0;
let frameCount = 0;
let linkDataLength = 0;

// Canvas sizing
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Utility functions
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
    // Core properties
    this.radius = this.isLink ? 50 : 20 + Math.random() * 30;
    this.mass = this.radius;
    this.alpha = 0.7;

    // Position and movement
    this.setPosition();
    this.setSpeed();

    // State flags
    this.isCollapsing = false;
    this.markedForRemoval = false;
    this.isGrowing = false;

    // Animation properties
    this.collapseDuration = 500;
    this.collapseStartTime = null;
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

    // Try to find valid position with decreasing radius
    for (let i = 1; i <= 5; i++) {
      position = this.findValidPosition();
      if (position) break;
      this.radius = initialRadius / (i + 1);
    }

    if (position) {
      [this.x, this.y] = [position.x, position.y];
    } else {
      // Fallback position if no valid spot found
      this.x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
      this.y = Math.random() * (canvas.height - 2 * this.radius) + this.radius;
    }
  }

  setSpeed() {
    const baseSpeed = (Math.random() - 0.5) * 0.5;
    const normSpeed =
      Math.abs(baseSpeed) >= 0.05 ? baseSpeed : Math.sign(baseSpeed) * 0.05;
    const speedMultiplier = this.isLink ? 1 : 2;

    this.speedX = normSpeed * speedMultiplier;
    this.speedY = normSpeed * speedMultiplier;
  }

  findValidPosition() {
    const { radius } = this;
    const { width, height } = canvas;
    const [centerX, centerY] = [width / 2, height / 2];

    for (let i = 0; i < 100; i++) {
      let x, y;

      if (this.isLink) {
        // Position links in circle around center
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * (width / 4 - radius) + radius;
        x = centerX + distance * Math.cos(angle);
        y = centerY + distance * Math.sin(angle);
      } else {
        // Random position for non-links
        x = Math.random() * (width - 2 * radius) + radius;
        y = Math.random() * (height - 2 * radius) + radius;
      }

      // Check if position is valid
      const noOverlap = waveFunctions.every(
        (wf) => Math.hypot(x - wf.x, y - wf.y) >= radius + wf.radius,
      );

      if (noOverlap) return { x, y };
    }
    return null;
  }

  draw() {
    ctx.save();
    this.drawCircle();
    if (this.isLink) {
      this.drawLabel(this.spawnProgress / 100);
    }
    ctx.restore();
  }

  drawCircle() {
    const alpha = this.alpha * (this.spawnProgress / 100);
    const scaleFactor = this.spawnProgress / 100;
    const drawRadius = this.radius * scaleFactor;

    ctx.beginPath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15 * alpha;
    ctx.arc(this.x, this.y, drawRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLabel(scaleFactor) {
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
    } else {
      ctx.fillText(lines[0], 0, -15);
      ctx.fillText(lines[1], 0, 15);
    }
    ctx.restore();
  }

  update(deltaTime) {
    this.updateSpawnAnimation();

    if (this.isCollapsing) {
      this.updateCollapse();
    } else {
      this.updatePosition(deltaTime);
      this.ensureInsideCanvas();
    }

    this.updateGrowth();
  }

  updateSpawnAnimation() {
    if (this.spawnProgress >= 100) return;

    const elapsed = Date.now() - this.spawnStartTime;
    const progress = Math.min(100, (elapsed / this.spawnDuration) * 100);

    // Smooth pop-up effect
    const easeOutBack = (t) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    this.spawnProgress = easeOutBack(progress / 100) * 100;
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
    const margin = 1;
    const minX = this.radius + margin;
    const maxX = canvas.width - this.radius - margin;
    const minY = this.radius + margin;
    const maxY = canvas.height - this.radius - margin;

    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));
  }

  bounceOffWalls() {
    const margin = 1;

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
    return (
      Math.hypot(this.x - other.x, this.y - other.y) <=
      this.radius + other.radius - 1
    );
  }

  resolveCollision(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return;

    // Calculate collision vectors
    const [normalX, normalY] = [dx / distance, dy / distance];
    const [tangentX, tangentY] = [-normalY, normalX];

    // Calculate velocities along normal and tangent
    const [v1n, v1t] = [
      this.speedX * normalX + this.speedY * normalY,
      this.speedX * tangentX + this.speedY * tangentY,
    ];
    const [v2n, v2t] = [
      other.speedX * normalX + other.speedY * normalY,
      other.speedX * tangentX + other.speedY * tangentY,
    ];

    // Calculate new normal velocities
    const v1n_after =
      (v1n * (this.mass - other.mass) + 2 * other.mass * v2n) /
      (this.mass + other.mass);
    const v2n_after =
      (v2n * (other.mass - this.mass) + 2 * this.mass * v1n) /
      (this.mass + other.mass);

    // Update velocities
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
      const separationX = normalX * overlap * 0.51;
      const separationY = normalY * overlap * 0.51;
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

// Game initialization and loop
async function initializeWaveFunctions() {
  try {
    const response = await fetch('components/data/links.yaml');
    const yamlText = await response.text();
    const data = jsyaml.load(yamlText);
    linkDataLength = data.links.length;
    data.links.forEach(({ name, link, color }) => {
      waveFunctions.push(new WaveFunction(true, name, link, color));
    });
  } catch (error) {
    console.error('Error loading link data:', error);
  }
}

function addNewWaveFunction() {
  if (waveFunctions.length < MAX_WAVE_FUNCTIONS) {
    waveFunctions.push(new WaveFunction());
  }
}

function checkAndSeparateOverlaps() {
  for (let i = 0; i < waveFunctions.length; i++) {
    for (let j = i + 1; j < waveFunctions.length; j++) {
      const [wf1, wf2] = [waveFunctions[i], waveFunctions[j]];
      const [dx, dy] = [wf2.x - wf1.x, wf2.y - wf1.y];
      const distance = Math.hypot(dx, dy);
      const overlap = wf1.radius + wf2.radius - distance;

      if (overlap > 0) {
        // Separate overlapping wave functions
        const [separationX, separationY] = [
          (dx / distance) * overlap * 0.5,
          (dy / distance) * overlap * 0.5,
        ];

        wf1.x -= separationX;
        wf1.y -= separationY;
        wf2.x += separationX;
        wf2.y += separationY;

        // Add random movement for non-link wave functions
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
  const deltaTime = (currentTime - lastTime) / 1000;

  if (deltaTime >= FIXED_TIME_STEP / 1000) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateWaveFunctions(deltaTime);
    waveFunctions = waveFunctions.filter((wf) => !wf.markedForRemoval);
    lastTime = currentTime;
  }

  if (frameCount % 10 === 0) {
    checkAndSeparateOverlaps();
  }
  frameCount++;
}

function updateWaveFunctions(deltaTime) {
  for (let i = 0; i < waveFunctions.length; i++) {
    const wf1 = waveFunctions[i];
    wf1.update(deltaTime);

    // Check collisions with other wave functions
    for (let j = i + 1; j < waveFunctions.length; j++) {
      const wf2 = waveFunctions[j];
      if (wf1.checkCollision(wf2)) {
        const shouldCombine =
          !wf1.isLink &&
          !wf2.isLink &&
          (waveFunctions.length >= MAX_WAVE_FUNCTIONS || Math.random() < 0.05);

        if (shouldCombine) {
          wf1.combine(wf2);
        } else {
          wf1.resolveCollision(wf2);
        }
      }
    }

    wf1.draw();
  }
}

// Event handlers
function handleCanvasClick(event) {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  for (let wf of waveFunctions) {
    if (Math.hypot(wf.x - clickX, wf.y - clickY) < wf.radius) {
      if (wf.isLink) {
        window.open(wf.url, '_blank');
      } else if (!wf.isCollapsing) {
        wf.collapse();
      }
      break;
    }
  }

  if (waveFunctions.length <= linkDataLength + 1) {
    waveFunctions.push(new WaveFunction());
  }
}

function handleCollapseAll() {
  waveFunctions.forEach((wf) => wf.collapse());
}

// Initialization
async function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('click', handleCanvasClick);
  collapseAllButton.addEventListener('click', handleCollapseAll);
  await initializeWaveFunctions();
  setInterval(addNewWaveFunction, 2000);
  animate(0);
}

init();
