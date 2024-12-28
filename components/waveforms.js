const collapseAllButton = document.getElementById('collapseAllButton');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
];

let waveFunctions = [];
let lastTime = 0;
let frameCount = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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
    const normSpeed =
      Math.abs(baseSpeed) >= 0.05 ? baseSpeed : Math.sign(baseSpeed) * 0.05;
    this.speedX = this.isLink ? normSpeed : normSpeed * 2;
    this.speedY = this.isLink ? normSpeed : normSpeed * 2;
  }

  findValidPosition() {
    const radius = this.radius;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < 100; i++) {
      let x, y;

      if (this.isLink) {
        // Generate coordinates within a circle around the center
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * (width / 4 - radius) + radius;
        x = centerX + distance * Math.cos(angle);
        y = centerY + distance * Math.sin(angle);
      } else {
        x = Math.random() * (width - 2 * radius) + radius;
        y = Math.random() * (height - 2 * radius) + radius;
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
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15 * this.alpha;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    if (this.isLink) {
      this.drawLabel();
    }

    ctx.restore();
  }

  drawLabel() {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(0.5, 0.5);
    ctx.rotate(0.01);

    const lines = this.label.split('\n');
    if (lines.length === 1) {
      ctx.fillText(this.label, 0, 0);
    } else if (lines.length === 2) {
      ctx.fillText(lines[0], 0, -15);
      ctx.fillText(lines[1], 0, 15);
    } else {
      throw new Error('Too many lines in label');
    }
    ctx.restore();
  }

  update(deltaTime) {
    if (this.isCollapsing) {
      this.updateCollapse();
    } else {
      this.updatePosition(deltaTime);
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

  bounceOffWalls() {
    if (this.x + this.radius >= canvas.width || this.x - this.radius <= 0) {
      this.speedX = -this.speedX;
    }
    if (this.y + this.radius >= canvas.height || this.y - this.radius <= 0) {
      this.speedY = -this.speedY;
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
      Math.hypot(this.x - other.x, this.y - other.y) <
      this.radius + other.radius
    );
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
      const separationX = normalX * overlap * 0.5;
      const separationY = normalY * overlap * 0.5;
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
      const overlap = wf1.radius + wf2.radius - distance;
      if (overlap > 0) {
        const [separationX, separationY] = [
          (dx / distance) * overlap * 0.5,
          (dy / distance) * overlap * 0.5,
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
  const deltaTime = (currentTime - lastTime) / 1000;
  if (deltaTime >= FIXED_TIME_STEP / 1000) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateWaveFunctions(deltaTime);
    waveFunctions = waveFunctions.filter((wf) => !wf.markedForRemoval);
    lastTime = currentTime;
  }
  if (frameCount % 60 === 0) {
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

  if (waveFunctions.length <= LINK_DATA.length + 1) {
    waveFunctions.push(new WaveFunction());
  }
}

function handleCollapseAll() {
  waveFunctions.forEach((wf) => {
    wf.collapse();
  });
}

function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('click', handleCanvasClick);
  collapseAllButton.addEventListener('click', handleCollapseAll);
  initializeWaveFunctions();
  setInterval(addNewWaveFunction, 2000);
  animate(0);
}

init();
