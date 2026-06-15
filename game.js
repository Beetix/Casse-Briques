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
  running: true,
  lastTime: 0,
};

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

  // Lost below the bottom edge.
  if (ball.y - ball.radius > HEIGHT) {
    resetBall();
  }
}

function update(dt) {
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

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawPaddle();
  drawBall();
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

function loop(timestamp) {
  const dt = Math.min((timestamp - game.lastTime) / 1000, 0.05);
  game.lastTime = timestamp;

  if (game.running) {
    update(dt);
  }
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame((t) => {
  game.lastTime = t;
  requestAnimationFrame(loop);
});
