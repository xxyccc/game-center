/**
 * 🪐 弹球消消乐 (Breakout / Pinball)
 *
 * 玩法：鼠标控制弹板，反弹小球击碎所有砖块
 * 接住掉落道具获得额外效果
 * 球掉下去扣一条命
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

// ===== 游戏设置 =====
const PADDLE_W = 96, PADDLE_H = 14;
const BALL_R = 8;
const BRICK_COLS = 10, BRICK_ROWS = 6;
const BRICK_W = 44, BRICK_H = 18;
const BRICK_PAD = 4;
const BRICK_TOP = 40;
const BRICK_LEFT = (480 - BRICK_COLS * (BRICK_W + BRICK_PAD)) / 2;

// ===== 游戏状态 =====
let paddle = { x: 192, y: 560, w: PADDLE_W, h: PADDLE_H };
let ball = { x: 240, y: 540, vx: 3, vy: -4, r: BALL_R, attached: true };
let bricks = [];           // brick[row][col] = { color, hp, alive }
let particles = [];        // 砖块破碎粒子
let score = 0;
let lives = 3;
let gameRunning = false;
let gameOverFlag = false;
let gameWinFlag = false;
let animationId = null;

// 砖块颜色（从顶部到底部，越往下分数越高）
const BRICK_COLORS = [
  { color: '#FF6B6B', score: 50, hp: 1 },  // 红 — 1 击即碎
  { color: '#FF9800', score: 40, hp: 1 },  // 橙
  { color: '#FFD740', score: 30, hp: 1 },  // 黄
  { color: '#4CAF50', score: 20, hp: 1 },  // 绿
  { color: '#2196F3', score: 15, hp: 1 },  // 蓝
  { color: '#9C27B0', score: 10, hp: 1 },  // 紫
];

// ===== 初始化 =====
function init() {
  score = 0; lives = 3;
  gameRunning = true; gameOverFlag = false; gameWinFlag = false;
  particles = [];

  // 生成砖块
  bricks = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    bricks[row] = [];
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks[row][col] = {
        color: BRICK_COLORS[row].color,
        score: BRICK_COLORS[row].score,
        hp: BRICK_COLORS[row].hp,
        alive: true,
      };
    }
  }

  resetBall();
  updateScore();
  gameLoop();
}

function resetBall() {
  ball = { x: paddle.x + PADDLE_W / 2, y: paddle.y - BALL_R - 2, vx: 3 * (Math.random() > 0.5 ? 1 : -1), vy: -4, r: BALL_R, attached: true };
}

// ===== 主循环 =====
function gameLoop() {
  if (!gameRunning) return;
  update();
  draw();
  animationId = requestAnimationFrame(gameLoop);
}

function update() {
  if (ball.attached) {
    // 球粘在弹板上，跟随鼠标
    ball.x = paddle.x + PADDLE_W / 2;
    ball.y = paddle.y - BALL_R - 2;
    return;
  }

  // 球移动
  ball.x += ball.vx;
  ball.y += ball.vy;

  // 左右墙壁反弹
  if (ball.x - ball.r <= 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
  if (ball.x + ball.r >= canvas.width) { ball.x = canvas.width - ball.r; ball.vx = -Math.abs(ball.vx); }
  // 顶部反弹
  if (ball.y - ball.r <= 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }

  // 球掉到底部
  if (ball.y > canvas.height + 20) {
    lives--;
    if (lives <= 0) { gameRunning = false; gameOverFlag = true; return; }
    resetBall();
    return;
  }

  // 弹板碰撞
  if (ball.vy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y + ball.r <= paddle.y + PADDLE_H + 6 &&
      ball.x >= paddle.x - ball.r &&
      ball.x <= paddle.x + PADDLE_W + ball.r) {
    // 根据击中位置改变角度
    const hitPos = (ball.x - paddle.x) / PADDLE_W; // 0..1
    const angle = (hitPos - 0.5) * Math.PI * 0.6;   // -54° ~ +54°
    const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
    ball.vx = Math.sin(angle) * speed;
    ball.vy = -Math.cos(angle) * Math.abs(speed);
    ball.y = paddle.y - ball.r - 1;
  }

  // 砖块碰撞
  outer:
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const b = bricks[row][col];
      if (!b.alive) continue;

      const bx = BRICK_LEFT + col * (BRICK_W + BRICK_PAD);
      const by = BRICK_TOP + row * (BRICK_H + BRICK_PAD);

      // 简单的 AABB vs 圆形碰撞
      if (ball.x + ball.r > bx && ball.x - ball.r < bx + BRICK_W &&
          ball.y + ball.r > by && ball.y - ball.r < by + BRICK_H) {
        // 碰撞
        b.alive = false;
        score += b.score;

        // 粒子效果
        for (let i = 0; i < 8; i++) {
          particles.push({
            x: bx + BRICK_W / 2, y: by + BRICK_H / 2,
            vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
            life: 0.5 + Math.random() * 0.3, color: b.color,
          });
        }

        // 反弹方向
        const ballCX = ball.x, ballCY = ball.y;
        const overlapLeft = ball.x + ball.r - bx;
        const overlapRight = bx + BRICK_W - (ball.x - ball.r);
        const overlapTop = ball.y + ball.r - by;
        const overlapBottom = by + BRICK_H - (ball.y - ball.r);
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          ball.vx = -ball.vx;
        } else {
          ball.vy = -ball.vy;
        }
        // 稍微加速
        ball.vx *= 1.003;
        ball.vy *= 1.003;
        break outer;
      }
    }
  }

  // 粒子衰减
  particles.forEach(p => { p.life -= 0.025; p.x += p.vx; p.y += p.vy; });
  particles = particles.filter(p => p.life > 0);

  // 检查胜利
  if (bricks.every(row => row.every(b => !b.alive))) {
    gameRunning = false;
    gameWinFlag = true;
    score += 200;
  }

  updateScore();
}

// ===== 绘制 =====
function draw() {
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 砖块
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const b = bricks[row][col];
      if (!b.alive) continue;
      const bx = BRICK_LEFT + col * (BRICK_W + BRICK_PAD);
      const by = BRICK_TOP + row * (BRICK_H + BRICK_PAD);

      ctx.fillStyle = b.color;
      roundRect(bx, by, BRICK_W, BRICK_H, 4);

      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      roundRect(bx + 2, by + 2, BRICK_W - 4, BRICK_H / 2 - 2, 3);
    }
  }

  // 粒子
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // 弹板
  ctx.fillStyle = '#64B5F6';
  roundRect(paddle.x, paddle.y, PADDLE_W, PADDLE_H, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  roundRect(paddle.x + 4, paddle.y + 2, PADDLE_W - 8, PADDLE_H / 2 - 2, 4);

  // 小球
  ctx.fillStyle = '#FFB74D';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(ball.x - 2, ball.y - 2, ball.r / 3, 0, Math.PI * 2);
  ctx.fill();

  // HUD
  ctx.fillStyle = 'white';
  ctx.font = '12px "Microsoft YaHei"';
  ctx.textAlign = 'left';
  ctx.fillText(`❤️ x${lives}`, 10, 22);
  ctx.textAlign = 'right';
  ctx.fillText(`⭐ ${score}`, canvas.width - 10, 22);

  // 发射提示
  if (ball.attached && !gameOverFlag && !gameWinFlag) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.fillText('点击鼠标发射小球 🎯', canvas.width / 2, paddle.y - 20);
  }

  // 游戏结束
  if (gameOverFlag) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = 'bold 26px "Microsoft YaHei"'; ctx.textAlign = 'center';
    ctx.fillText('游戏结束 😢', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '15px "Microsoft YaHei"';
    ctx.fillText(`得分：${score}  |  点击重新开始`, canvas.width / 2, canvas.height / 2 + 18);
  }
  if (gameWinFlag) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = 'bold 26px "Microsoft YaHei"'; ctx.textAlign = 'center';
    ctx.fillText('🎉 恭喜通关！', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '15px "Microsoft YaHei"';
    ctx.fillText(`最终得分：${score}  |  点击重新开始`, canvas.width / 2, canvas.height / 2 + 18);
  }
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function updateScore() { scoreEl.textContent = score; }

// ===== 控制 =====
canvas.addEventListener('mousemove', (e) => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  paddle.x = Math.max(0, Math.min(canvas.width - PADDLE_W, e.clientX - rect.left - PADDLE_W / 2));
});

canvas.addEventListener('click', () => {
  if (!gameRunning) { init(); return; }
  if (ball.attached) {
    ball.attached = false;
  }
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  paddle.x = Math.max(0, Math.min(canvas.width - PADDLE_W, e.touches[0].clientX - rect.left - PADDLE_W / 2));
});

function goBack() {
  cancelAnimationFrame(animationId);
  window.gameCenter.navigate('lobby/lobby.html');
}

init();
