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

// Central game state.
const game = {
  running: true,
  lastTime: 0,
};

// ---------------------------------------------------------------------------
// Update / draw
// ---------------------------------------------------------------------------

function update(dt) {
  // Game systems will plug in here.
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Placeholder centred title until gameplay lands.
  ctx.fillStyle = "#4cc9f0";
  ctx.font = "32px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CASSE-BRIQUES", WIDTH / 2, HEIGHT / 2);
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
