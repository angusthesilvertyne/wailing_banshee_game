// Grab the canvas and its drawing context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state
let state = "launch";      // can be "launch", "playing", or "gameover"
let score = 0;
let health = 10;           // Banshee breaks in 10 hits

// Load images
const launchImg    = new Image();
const playerImg    = new Image();
const enemyImg     = new Image();
launchImg.src      = "images/launch_screen.png";
playerImg.src      = "images/player_ship.png";
enemyImg.src       = "images/enemy_ship.png";

// Player setup
const player = {
  x: canvas.width/2 - 128/2,
  y: canvas.height/2 - 128/2,
  width: 128,
  height: 128,
  speed: 4
};

// Arrays to hold bullets and enemies
const bullets = [];
const enemies = [];

// Key handling
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key] = true;
  // From launch screen, hit Enter to start
  if (state === "launch" && e.key === "Enter") {
    state = "playing";
    spawnLoop();
  }
});
window.addEventListener("keyup", e => keys[e.key] = false);
window.addEventListener("keypress", e => {
  if (state === "playing" && e.code === "Space") {
    // Fire two cannonballs, one leftward and one rightward
    bullets.push({ x: player.x, y: player.y + player.height/2, vx: -6 });
    bullets.push({ x: player.x + player.width, y: player.y + player.height/2, vx: 6 });
  }
});

// Enemy spawn every 1.5s
function spawnLoop() {
  if (state !== "playing") return;
  const fromLeft = Math.random() < 0.5;
  enemies.push({
    x: fromLeft ? -64 : canvas.width + 64,
    y: Math.random() * (canvas.height - 64),
    vx: fromLeft ? 2 : -2,
    width: 64,
    height: 64
  });
  setTimeout(spawnLoop, 1500);
}

// Main update/draw loop
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state === "launch") {
    // Draw the launch screen
    ctx.drawImage(launchImg, 0, 0, canvas.width, canvas.height);
  } 
  else if (state === "playing") {
    // Draw water background
    ctx.fillStyle = "#1e90ff";              // ocean blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Move player
    if (keys.ArrowUp)    player.y -= player.speed;
    if (keys.ArrowDown)  player.y += player.speed;
    if (keys.ArrowLeft)  player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Constrain to canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    // Draw player
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // Update & draw bullets (cannonballs)
    ctx.fillStyle = "black";
    bullets.forEach((b, i) => {
      b.x += b.vx;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      // Remove offscreen bullets
      if (b.x < 0 || b.x > canvas.width) bullets.splice(i, 1);
    });

    // Update & draw enemies
    enemies.forEach((e, i) => {
      e.x += e.vx;
      ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);

      // Collision: bullet → enemy
      bullets.forEach((b, bi) => {
        if (
          b.x < e.x + e.width && b.x > e.x &&
          b.y > e.y && b.y < e.y + e.height
        ) {
          // kill enemy & bullet
          enemies.splice(i, 1);
          bullets.splice(bi, 1);
          score += 100;
        }
      });

      // Collision: enemy → player
      if (
        player.x < e.x + e.width && player.x + player.width > e.x &&
        player.y < e.y + e.height && player.y + player.height > e.y
      ) {
        enemies.splice(i, 1);
        health -= 1;
        if (health <= 0) {
          state = "gameover";
          showHighScores();
        }
      }
    });

    // Draw HUD
    ctx.fillStyle = "white";
    ctx.font = "20px monospace";
    ctx.fillText("Score: " + score, 10, 30);
    ctx.fillText("Health: " + health, 10, 60);
  } 
  
  requestAnimationFrame(loop);
}

// High‐score logic using localStorage
function showHighScores() {
  const stored = JSON.parse(localStorage.getItem("wbg_scores") || "[]");
  stored.push({ score, initials: "" });
  stored.sort((a,b) => b.score - a.score);
  const top10 = stored.slice(0,10);
  if (top10.find(s => s.score === score && !s.initials)) {
    const i = prompt("You made the Top Ten! Enter your initials (3 chars):", "").substring(0,3).toUpperCase();
    top10.find(s => s.score === score).initials = i;
  }
  localStorage.setItem("wbg_scores", JSON.stringify(top10));

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "30px monospace";
  ctx.fillText("=== GAME OVER ===", 280, 100);
  ctx.fillText("HIGH SCORES", 300, 150);
  top10.forEach((s, idx) => {
    ctx.fillText(`${idx+1}. ${s.initials || "---"}   ${s.score}`, 300, 200 + idx*30);
  });
}

// Start the loop
loop();
