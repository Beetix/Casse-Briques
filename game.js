"use strict";

// ---------------------------------------------------------------------------
// Casse-Briques — core engine
// HTML5 Canvas + vanilla JS, no build step.
// ---------------------------------------------------------------------------

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Logical resolution (the world is always reasoned about in these units).
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// ---------------------------------------------------------------------------
// Paddle
// ---------------------------------------------------------------------------

const paddle = {
  width: 110,
  height: 16,
  x: (WIDTH - 110) / 2,
  y: HEIGHT - 40,
  speed: 520, // px per second (keyboard)
};

// ---------------------------------------------------------------------------
// Ball
// ---------------------------------------------------------------------------

const BALL_SPEED = 360; // px per second
const ball = {
  x: WIDTH / 2,
  y: HEIGHT - 60,
  radius: 8,
  vx: 0,
  vy: 0,
  stuck: true, // resting on the paddle, waiting for launch
};

function resetBall() {
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - ball.radius - 1;
  ball.vx = 0;
  ball.vy = 0;
  ball.stuck = true;
}

// ---------------------------------------------------------------------------
// Bricks
// ---------------------------------------------------------------------------

const BRICK = {
  cols: 10,
  rows: 6,
  gap: 6,
  top: 60,
  side: 30,
  height: 26,
};

const ROW_COLORS = ["#f72585", "#b5179e", "#7209b7", "#560bad", "#3a0ca3", "#4361ee"];

let bricks = [];

function buildBricks() {
  bricks = [];
  const playWidth = WIDTH - BRICK.side * 2;
  const brickWidth = (playWidth - BRICK.gap * (BRICK.cols - 1)) / BRICK.cols;

  for (let r = 0; r < BRICK.rows; r++) {
    for (let c = 0; c < BRICK.cols; c++) {
      bricks.push({
        x: BRICK.side + c * (brickWidth + BRICK.gap),
        y: BRICK.top + r * (BRICK.height + BRICK.gap),
        width: brickWidth,
        height: BRICK.height,
        color: ROW_COLORS[r % ROW_COLORS.length],
        alive: true,
      });
    }
  }
}

buildBricks();

function launchBall() {
  if (!ball.stuck) return;
  // Launch upward with a slight random horizontal angle.
  const angle = (-Math.PI / 2) + (Math.random() * 0.6 - 0.3);
  ball.vx = Math.cos(angle) * BALL_SPEED;
  ball.vy = Math.sin(angle) * BALL_SPEED;
  ball.stuck = false;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

const input = {
  left: false,
  right: false,
  mouseX: null,
};

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") input.left = true;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") input.right = true;
  if (e.key === " " || e.key === "ArrowUp") launchBall();
  if (e.key === "r" || e.key === "R") {
    if (game.status !== "playing") resetGame();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") input.left = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") input.right = false;
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  // Map screen coordinates to logical space.
  input.mouseX = ((e.clientX - rect.left) / rect.width) * WIDTH;
});

canvas.addEventListener("mouseleave", () => {
  input.mouseX = null;
});

canvas.addEventListener("mousedown", launchBall);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Central game state.
// ---------------------------------------------------------------------------

const game = {
  lastTime: 0,
  status: "playing", // "playing" | "gameover" | "win"
  score: 0,
  lives: 3,
};

function resetGame() {
  game.status = "playing";
  game.score = 0;
  game.lives = 3;
  buildBricks();
  resetBall();
}

// ---------------------------------------------------------------------------
// Update / draw
// ---------------------------------------------------------------------------

function updatePaddle(dt) {
  if (input.mouseX !== null) {
    // Mouse takes priority: centre the paddle on the cursor.
    paddle.x = input.mouseX - paddle.width / 2;
  } else {
    if (input.left) paddle.x -= paddle.speed * dt;
    if (input.right) paddle.x += paddle.speed * dt;
  }
  paddle.x = clamp(paddle.x, 0, WIDTH - paddle.width);
}

function updateBall(dt) {
  if (ball.stuck) {
    // Sit on top of the paddle until launched.
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius - 1;
    return;
  }

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Walls.
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.radius > WIDTH) {
    ball.x = WIDTH - ball.radius;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
  }

  // Paddle collision.
  if (
    ball.vy > 0 &&
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width
  ) {
    // Bounce angle depends on where the ball hit the paddle.
    const hit = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    const angle = (-Math.PI / 2) + hit * (Math.PI / 3); // up to 60° off vertical
    ball.vx = Math.cos(angle) * BALL_SPEED;
    ball.vy = Math.sin(angle) * BALL_SPEED;
    ball.y = paddle.y - ball.radius - 1;
  }

  // Bricks.
  collideBricks();

  // Lost below the bottom edge.
  if (ball.y - ball.radius > HEIGHT) {
    game.lives -= 1;
    if (game.lives <= 0) {
      game.status = "gameover";
    } else {
      resetBall();
    }
  }
}

function collideBricks() {
  for (const brick of bricks) {
    if (!brick.alive) continue;

    // Closest point on the brick (AABB) to the ball centre.
    const nearestX = clamp(ball.x, brick.x, brick.x + brick.width);
    const nearestY = clamp(ball.y, brick.y, brick.y + brick.height);
    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;

    if (dx * dx + dy * dy > ball.radius * ball.radius) continue;

    brick.alive = false;
    game.score += 10;
    if (bricks.every((b) => !b.alive)) {
      game.status = "win";
    }

    // Resolve along the shallower axis of overlap so the bounce direction
    // matches which face was hit.
    const overlapX = ball.radius - Math.abs(dx);
    const overlapY = ball.radius - Math.abs(dy);
    if (overlapX < overlapY) {
      ball.vx = dx < 0 ? -Math.abs(ball.vx) : Math.abs(ball.vx);
    } else {
      ball.vy = dy < 0 ? -Math.abs(ball.vy) : Math.abs(ball.vy);
    }
    break; // one brick per frame keeps the bounce stable
  }
}

function update(dt) {
  if (game.status !== "playing") return;
  updatePaddle(dt);
  updateBall(dt);
}

function drawPaddle() {
  ctx.fillStyle = "#4cc9f0";
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
  ctx.fill();
}

function drawBall() {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBricks() {
  for (const brick of bricks) {
    if (!brick.alive) continue;
    ctx.fillStyle = brick.color;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 5);
    ctx.fill();
  }
}

function drawHud() {
  ctx.fillStyle = "#fff";
  ctx.font = "18px 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("Score : " + game.score, 16, 14);
  ctx.textAlign = "right";
  ctx.fillText("Vies : " + "●".repeat(game.lives), WIDTH - 16, 14);
}

function drawOverlay(title, color) {
  ctx.fillStyle = "rgba(5, 7, 15, 0.78)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = color;
  ctx.font = "48px 'Segoe UI', sans-serif";
  ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 40);

  ctx.fillStyle = "#fff";
  ctx.font = "22px 'Segoe UI', sans-serif";
  ctx.fillText("Score : " + game.score, WIDTH / 2, HEIGHT / 2 + 8);
  ctx.font = "18px 'Segoe UI', sans-serif";
  ctx.fillText("Appuie sur R pour rejouer", WIDTH / 2, HEIGHT / 2 + 48);
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBricks();
  drawPaddle();
  drawBall();
  drawHud();

  if (game.status === "gameover") drawOverlay("PERDU", "#f72585");
  else if (game.status === "win") drawOverlay("GAGNÉ !", "#4cc9f0");
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

function loop(timestamp) {
  const dt = Math.min((timestamp - game.lastTime) / 1000, 0.05);
  game.lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame((t) => {
  game.lastTime = t;
  requestAnimationFrame(loop);
});
