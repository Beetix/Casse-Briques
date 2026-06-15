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

function update(dt) {
  updatePaddle(dt);
}

function drawPaddle() {
  ctx.fillStyle = "#4cc9f0";
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawPaddle();
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
