const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

const MAX_WAVE_FUNCTIONS = 20;

let waveFunctions = [];

function combinedAreaRadius(radius1, radius2) {
  const area1 = Math.PI * radius1 * radius1;
  const area2 = Math.PI * radius2 * radius2;
  const combinedArea = area1 + area2;
  const newRadius = Math.sqrt(combinedArea / Math.PI);
  return newRadius;
}

class WaveFunction {
  constructor(isLink = false, label = '', url = '', color = '') {
    const initialRadius = isLink ? 50 : 20 + Math.random() * 30;
    this.radius = initialRadius;
    let position = null;

    for (let i = 1; i <= 5; i++) {
      position = WaveFunction.findValidPosition(this.radius);
      if (position) {
        break;
      }
      this.radius = initialRadius / (i + 1);
    }

    if (position) {
      this.x = position.x;
      this.y = position.y;
    } else {
      this.radius = initialRadius / 5;
      this.x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
      this.y = Math.random() * (canvas.height - 2 * this.radius) + this.radius;
    }
    const baseSpeed = (Math.random() - 0.5) * 0.5;
    const normSpeed =
      Math.abs(baseSpeed) >= 0.05 ? baseSpeed : Math.sign(baseSpeed) * 0.05;
    this.speedX = isLink ? normSpeed : normSpeed * 2;
    this.speedY = isLink ? normSpeed : normSpeed * 2;
    this.alpha = 0.7;
    this.isCollapsing = false;
    this.collapseDuration = 500;
    this.collapseStartTime = null;
    this.markedForRemoval = false;
    this.isLink = isLink;
    this.label = label;
    this.url = url;
    this.color = isLink ? color : 'rgba(100, 100, 255, 1)';
    this.mass = this.radius;
  }

  static findValidPosition(radius) {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const x = Math.random() * (canvas.width - 2 * radius) + radius;
      const y = Math.random() * (canvas.height - 2 * radius) + radius;

      let isValid = true;
      for (let wf of waveFunctions) {
        const dx = x - wf.x;
        const dy = y - wf.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < radius + wf.radius) {
          isValid = false;
          break;
        }
      }

      if (isValid) {
        return { x, y };
      }

      attempts++;
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
    ctx.closePath();

    if (this.isLink) {
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

    ctx.restore();
  }

  update(deltaTime) {
    if (this.isCollapsing) {
      const elapsed = Date.now() - this.collapseStartTime;
      this.alpha = Math.max(0, 0.7 * (1 - elapsed / this.collapseDuration));
      if (this.alpha <= 0) {
        this.markedForRemoval = true;
      }
      return;
    }

    this.x += this.speedX * deltaTime * 60;
    this.y += this.speedY * deltaTime * 60;

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
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + other.radius;
  }

  resolveCollision(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return; // Avoid division by zero

    const normalX = dx / distance;
    const normalY = dy / distance;
    const tangentX = -normalY;
    const tangentY = normalX;

    const v1n = this.speedX * normalX + this.speedY * normalY;
    const v1t = this.speedX * tangentX + this.speedY * tangentY;
    const v2n = other.speedX * normalX + other.speedY * normalY;
    const v2t = other.speedX * tangentX + other.speedY * tangentY;

    const v1n_after =
      (v1n * (this.mass - other.mass) + 2 * other.mass * v2n) /
      (this.mass + other.mass);
    const v2n_after =
      (v2n * (other.mass - this.mass) + 2 * this.mass * v1n) /
      (this.mass + other.mass);

    this.speedX = v1n_after * normalX + v1t * tangentX;
    this.speedY = v1n_after * normalY + v1t * tangentY;
    other.speedX = v2n_after * normalX + v2t * tangentX;
    other.speedY = v2n_after * normalY + v2t * tangentY;
  }

  combine(other) {
    const newRadius = combinedAreaRadius(this.radius, other.radius);
    const newSpeedX = (this.speedX + other.speedX) / 2;
    const newSpeedY = (this.speedY + other.speedY) / 2;
    if (this.mass > other.mass) {
      this.radius = newRadius;
      this.mass = newRadius;
      this.speedX = newSpeedX;
      this.speedY = newSpeedY;
      other.collapse();
      other.markedForRemoval = true;
    } else {
      other.radius = newRadius;
      other.mass = newRadius;
      other.speedX = newSpeedX;
      other.speedY = newSpeedY;
      this.collapse();
      this.markedForRemoval = true;
    }
  }
}

const linkData = [
  {
    name: 'LinkedIn',
    link: 'https://www.linkedin.com/in/ryan-james-hill/',
    color: '#0077B5',
  },
  {
    name: 'GitHub',
    link: 'https://github.com/ryanhill1',
    color: '#171515',
  },
  {
    name: 'Stack\nExchange',
    link: 'https://quantumcomputing.stackexchange.com/users/13991/ryanhill1?tab=profile',
    color: '#F48024',
  },
  {
    name: 'CV',
    link: '/files/Ryan-Hill-CV.pdf',
    color: '#C0C0C0',
  },
];

linkData.forEach(({ name, link, color }) => {
  waveFunctions.push(new WaveFunction(true, name, link, color));
});

setInterval(() => {
  if (waveFunctions.length <= MAX_WAVE_FUNCTIONS) {
    waveFunctions.push(new WaveFunction());
  }
}, 2000);

const FIXED_TIME_STEP = 1000 / 60; // 60 FPS
let lastTime = 0;

function animate(currentTime) {
  requestAnimationFrame(animate);

  const deltaTime = (currentTime - lastTime) / 1000;

  if (deltaTime >= FIXED_TIME_STEP / 1000) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < waveFunctions.length; i++) {
      for (let j = i + 1; j < waveFunctions.length; j++) {
        if (waveFunctions[i].checkCollision(waveFunctions[j])) {
          if (
            waveFunctions.length >= MAX_WAVE_FUNCTIONS &&
            !waveFunctions[i].isLink &&
            !waveFunctions[j].isLink
          ) {
            waveFunctions[i].combine(waveFunctions[j]);
          } else {
            waveFunctions[i].resolveCollision(waveFunctions[j]);
          }
        }
      }
    }

    waveFunctions.forEach((wf) => {
      wf.update(deltaTime);
      wf.draw();
    });

    waveFunctions = waveFunctions.filter((wf) => !wf.markedForRemoval);

    lastTime = currentTime;
  }
}

animate(0);

canvas.addEventListener('click', function (event) {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  for (let wf of waveFunctions) {
    const distance = Math.hypot(wf.x - clickX, wf.y - clickY);
    if (distance < wf.radius) {
      if (wf.isLink) {
        window.open(wf.url, '_blank');
      } else if (!wf.isCollapsing) {
        wf.collapse();
      }
      break;
    }
  }

  if (waveFunctions.length <= linkData.length + 1) {
    waveFunctions.push(new WaveFunction());
  }
});
