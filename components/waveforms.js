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
  constructor() {
    this.radius = 20 + Math.random() * 30; // Random radius between 20 and 50
    this.x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
    this.y = Math.random() * (canvas.height - 2 * this.radius) + this.radius;
    this.speedX = (Math.random() - 0.5) * 0.5; // Slower speed
    this.speedY = (Math.random() - 0.5) * 0.5;
    this.alpha = 0.7; // Initial transparency
    this.isCollapsing = false; // Flag to check if collapsing
    this.collapseDuration = 500; // Duration of the collapse animation in milliseconds
    this.collapseStartTime = null; // Timestamp when collapse starts
    this.markedForRemoval = false; // New flag for removal
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = 'rgba(100, 100, 255, 1)';
    ctx.shadowColor = 'rgba(100, 100, 255, 1)';
    ctx.shadowBlur = 15 * this.alpha; // Reduce shadow as it fades
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  update() {
    if (this.isCollapsing) {
      // Update alpha for fade-out effect
      const elapsed = Date.now() - this.collapseStartTime;
      this.alpha = Math.max(0, 0.7 * (1 - elapsed / this.collapseDuration));

      if (this.alpha <= 0) {
        this.markedForRemoval = true;
      }
      return; // Skip movement updates during collapse
    }

    this.x += this.speedX;
    this.y += this.speedY;

    // Bounce off the walls
    if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
      this.speedX = -this.speedX;
    }
    if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
      this.speedY = -this.speedY;
    }
  }

  collapse() {
    this.isCollapsing = true;
    this.collapseStartTime = Date.now();
  }
}

// Add a new wave function every 2 seconds
setInterval(() => {
  if (waveFunctions.length < 10) {
    // Limit the number of wave functions
    waveFunctions.push(new WaveFunction());
  }
}, 2000);

// Updated Animation loop
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  waveFunctions.forEach((wf) => {
    wf.update();
    wf.draw();
  });

  // Remove collapsed wave functions after iteration
  waveFunctions = waveFunctions.filter((wf) => !wf.markedForRemoval);

  requestAnimationFrame(animate);
}

animate();

// Updated click event listener
canvas.addEventListener('click', function (event) {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  for (let wf of waveFunctions) {
    const distance = Math.hypot(wf.x - clickX, wf.y - clickY);
    if (distance < wf.radius && !wf.isCollapsing) {
      wf.collapse();
      break; // Remove this line if you want to collapse multiple overlapping wave functions
    }
  }
});
