const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

let waveFunctions = [];

class WaveFunction {
  constructor(isSpecial = false, label = '', url = '', color = '') {
    this.radius = isSpecial ? 50 : 20 + Math.random() * 30;
    this.x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
    this.y = Math.random() * (canvas.height - 2 * this.radius) + this.radius;
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5;
    this.alpha = 0.7;
    this.isCollapsing = false;
    this.collapseDuration = 500;
    this.collapseStartTime = null;
    this.markedForRemoval = false;
    this.isSpecial = isSpecial;
    this.label = label;
    this.url = url;
    this.color = isSpecial ? color : 'rgba(100, 100, 255, 1)';
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

    if (this.isSpecial) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(0.5, 0.5);
      ctx.rotate(0.01);
      ctx.fillText(this.label, 0, 0);
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

    if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
      this.speedX = -this.speedX;
    }
    if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
      this.speedY = -this.speedY;
    }
  }

  collapse() {
    if (!this.isSpecial) {
      this.isCollapsing = true;
      this.collapseStartTime = Date.now();
    }
  }
}

// Add the special waveforms
waveFunctions.push(
  new WaveFunction(
    true,
    'LinkedIn',
    'https://www.linkedin.com/in/ryan-james-hill/',
    '#0077B5',
  ),
);
waveFunctions.push(
  new WaveFunction(true, 'GitHub', 'https://github.com/ryanhill1', '#171515'),
);
waveFunctions.push(
  new WaveFunction(
    true,
    'QCSE',
    'https://quantumcomputing.stackexchange.com/users/13991/ryanhill1?tab=profile',
    '#F48024',
  ),
);

// Add a new wave function every 2 seconds
setInterval(() => {
  if (waveFunctions.filter((wf) => !wf.isSpecial).length < 10) {
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
      if (wf.isSpecial) {
        window.open(wf.url, '_blank');
      } else if (!wf.isCollapsing) {
        wf.collapse();
      }
      break;
    }
  }
});
