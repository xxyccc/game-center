/**
 * ✈️ 打飞机 (Space Shooter)
 *
 * 玩法：鼠标控制飞机左右移动，自动射击
 * 消灭敌人得分，收集道具增强火力
 * 碰到敌人或敌方子弹扣一条命，3 条命用完游戏结束
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

// ===== 游戏状态 =====
let player = { x: 210, y: 520, w: 40, h: 44 };
let bullets = [];          // 子弹：[{x, y, w, h}]
let enemies = [];          // 敌人
let enemyBullets = [];     // 敌方子弹
let powerUps = [];         // 道具
let particles = [];        // 爆炸粒子
let stars = [];            // 背景星星
let score = 0;
let lives = 3;
let firePower = 1;         // 火力等级（1=单发，2=双发，3=三发）
let fireTimer = 0;
let enemyTimer = 0;
let gameRunning = false;
let gameOverFlag = false;
let animationId = null;

// ===== 初始化 =====
function init() {
  player = { x: 210, y: 520, w: 40, h: 44 };
  bullets = []; enemies = []; enemyBullets = []; powerUps = []; particles = [];
  score = 0; lives = 3; firePower = 1; fireTimer = 0; enemyTimer = 0;
  gameRunning = true; gameOverFlag = false;
  stars = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: 1 + Math.random() * 2,
    size: 0.5 + Math.random() * 2,
  }));
  updateScore();
  gameLoop();
}

// ===== 主循环 =====
function gameLoop() {
  if (!gameRunning) return;

  update();
  draw();
  animationId = requestAnimationFrame(gameLoop);
}

function update() {
  // 背景星星
  stars.forEach(s => { s.y += s.speed; if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; } });

  // 子弹移动
  bullets.forEach(b => b.y -= 8);
  bullets = bullets.filter(b => b.y > -10);

  // 敌方子弹移动
  enemyBullets.forEach(b => b.y += 4);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height + 10);

  // 敌人移动
  enemies.forEach(e => { e.y += e.speed; e.x += Math.sin(e.y * 0.03) * 1.5; });
  enemies = enemies.filter(e => e.y < canvas.height + 50);

  // 道具移动
  powerUps.forEach(p => p.y += 2);
  powerUps = powerUps.filter(p => p.y < canvas.height + 20);

  // 粒子衰减
  particles.forEach(p => { p.life -= 0.02; p.x += p.vx; p.y += p.vy; });
  particles = particles.filter(p => p.life > 0);

  // 射击
  fireTimer++;
  if (fireTimer > Math.max(6, 18 - firePower * 4)) {
    fireTimer = 0;
    fireBullet();
  }

  // 生成敌人
  enemyTimer++;
  const enemyInterval = Math.max(25, 70 - score / 5);
  if (enemyTimer > enemyInterval) {
    enemyTimer = 0;
    spawnEnemy();
  }

  // --- 碰撞检测 ---

  // 子弹 vs 敌人
  for (const b of bullets) {
    for (const e of enemies) {
      if (rectHit(b, e)) {
        b.hit = true;
        e.hp--;
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, 5);
        if (e.hp <= 0) {
          e.dead = true;
          score += e.score;
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, 12);
          // 一定概率掉道具
          if (Math.random() < 0.15) {
            powerUps.push({ x: e.x + e.w / 2 - 10, y: e.y, w: 20, h: 20, type: Math.random() < 0.5 ? 'power' : 'life' });
          }
        }
      }
    }
  }

  bullets = bullets.filter(b => !b.hit);
  enemies = enemies.filter(e => !e.dead);

  // 敌方子弹 vs 玩家
  for (const eb of enemyBullets) {
    if (rectHit(eb, player)) {
      eb.hit = true;
      hitPlayer();
    }
  }
  enemyBullets = enemyBullets.filter(b => !b.hit);

  // 敌人 vs 玩家（碰撞）
  for (const e of enemies) {
    if (rectHit(e, player)) {
      e.dead = true;
      spawnParticles(e.x + e.w / 2, e.y + e.h / 2, 8);
      hitPlayer();
    }
  }
  enemies = enemies.filter(e => !e.dead);

  // 道具 vs 玩家
  for (const p of powerUps) {
    if (rectHit(p, player)) {
      if (p.type === 'power' && firePower < 3) firePower++;
      if (p.type === 'life' && lives < 5) lives++;
      p.collected = true;
    }
  }
  powerUps = powerUps.filter(p => !p.collected);

  updateScore();
}

function fireBullet() {
  const bx = player.x + player.w / 2;
  const by = player.y;
  if (firePower >= 1) bullets.push({ x: bx - 2, y: by, w: 4, h: 14 });
  if (firePower >= 2) {
    bullets.push({ x: bx - 12, y: by + 8, w: 4, h: 14 });
    bullets.push({ x: bx + 8,  y: by + 8, w: 4, h: 14 });
  }
  if (firePower >= 3) {
    bullets.push({ x: bx - 18, y: by + 4, w: 3, h: 10, angle: -0.2 });
    bullets.push({ x: bx + 15, y: by + 4, w: 3, h: 10, angle: 0.2 });
  }
}

function spawnEnemy() {
  const types = [
    { w: 30, h: 30, hp: 1, speed: 1.5, score: 10, color: '#FF8A80' },
    { w: 36, h: 36, hp: 2, speed: 1.2, score: 20, color: '#FF80AB' },
    { w: 44, h: 40, hp: 4, speed: 0.8, score: 50, color: '#EA80FC' },
  ];

  // 分数越高，越可能出现强敌
  let tier = 0;
  if (score > 200) tier = Math.min(2, Math.floor(Math.random() * 3));
  else if (score > 50) tier = Math.min(1, Math.floor(Math.random() * 2));

  const t = types[tier];
  enemies.push({
    x: 20 + Math.random() * (canvas.width - t.w - 40),
    y: -40,
    w: t.w, h: t.h, hp: t.hp, speed: t.speed, score: t.score, color: t.color,
    shootTimer: tier >= 1 ? Math.floor(Math.random() * 60 + 40) : 999,
  });
}

function hitPlayer() {
  lives--;
  firePower = Math.max(1, firePower - 1);
  spawnParticles(player.x + player.w / 2, player.y + player.h / 2, 20);
  if (lives <= 0) {
    gameRunning = false;
    gameOverFlag = true;
  }
}

function spawnParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 0.4 + Math.random() * 0.4,
      color: ['#FFD54F', '#FF8A65', '#FF6B6B', '#FFD740'][Math.floor(Math.random() * 4)],
    });
  }
}

function rectHit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ===== 绘制 =====
function draw() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 星空背景
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.globalAlpha = 0.3 + s.size * 0.2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // 道具
  powerUps.forEach(p => {
    ctx.fillStyle = p.type === 'power' ? '#FFD740' : '#F48FB1';
    ctx.beginPath();
    ctx.arc(p.x + 10, p.y + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '12px "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.type === 'power' ? '⚡' : '💖', p.x + 10, p.y + 10);
  });

  // 子弹
  ctx.fillStyle = '#FFEB3B';
  bullets.forEach(b => {
    ctx.shadowColor = '#FFEB3B';
    ctx.shadowBlur = 6;
    roundRect(b.x, b.y, b.w, b.h, 2);
    ctx.shadowBlur = 0;
  });

  // 敌方子弹
  ctx.fillStyle = '#FF5252';
  enemyBullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // 敌人
  enemies.forEach(e => {
    // 敌机身体
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(e.x + e.w / 2, e.y);       // 顶部尖角
    ctx.lineTo(e.x + e.w, e.y + e.h * 0.6);
    ctx.lineTo(e.x + e.w * 0.75, e.y + e.h);
    ctx.lineTo(e.x + e.w * 0.25, e.y + e.h);
    ctx.lineTo(e.x, e.y + e.h * 0.6);
    ctx.closePath();
    ctx.fill();
    // 驾驶舱
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + e.h * 0.45, e.w * 0.18, 0, Math.PI * 2);
    ctx.fill();
  });

  // 玩家
  if (!gameOverFlag) {
    const p = player;
    // 机身
    ctx.fillStyle = '#64B5F6';
    ctx.beginPath();
    ctx.moveTo(p.x + p.w / 2, p.y);        // 机头
    ctx.lineTo(p.x + p.w * 0.8, p.y + p.h * 0.7);
    ctx.lineTo(p.x + p.w / 2, p.y + p.h * 0.6);
    ctx.lineTo(p.x + p.w * 0.2, p.y + p.h * 0.7);
    ctx.closePath();
    ctx.fill();
    // 机身主体
    ctx.fillStyle = '#42A5F5';
    ctx.fillRect(p.x + p.w * 0.3, p.y + p.h * 0.5, p.w * 0.4, p.h * 0.35);
    // 尾翼
    ctx.fillStyle = '#90CAF9';
    roundRect(p.x + p.w * 0.05, p.y + p.h * 0.7, p.w * 0.2, p.h * 0.25, 3);
    roundRect(p.x + p.w * 0.75, p.y + p.h * 0.7, p.w * 0.2, p.h * 0.25, 3);
    // 驾驶舱
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(p.x + p.w / 2, p.y + p.h * 0.35, 7, 0, Math.PI * 2);
    ctx.fill();
    // 引擎火焰
    ctx.fillStyle = '#FFAB40';
    ctx.beginPath();
    ctx.moveTo(p.x + p.w * 0.35, p.y + p.h * 0.85);
    ctx.lineTo(p.x + p.w / 2, p.y + p.h + 6 + Math.random() * 4);
    ctx.lineTo(p.x + p.w * 0.65, p.y + p.h * 0.85);
    ctx.closePath();
    ctx.fill();
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

  // HUD
  ctx.fillStyle = 'white';
  ctx.font = '11px "Microsoft YaHei"';
  ctx.textAlign = 'left';
  ctx.fillText(`❤️ x${lives}`, 10, 20);
  ctx.fillText(`🔥 Lv.${firePower}`, 10, 38);
  ctx.textAlign = 'right';
  ctx.fillText(`💥 ${score}`, canvas.width - 10, 20);

  // 游戏结束
  if (gameOverFlag) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = 'bold 26px "Microsoft YaHei"'; ctx.textAlign = 'center';
    ctx.fillText('游戏结束 😢', canvas.width / 2, canvas.height / 2 - 15);
    ctx.font = '15px "Microsoft YaHei"';
    ctx.fillText(`最终得分：${score}  |  点击重新开始`, canvas.width / 2, canvas.height / 2 + 22);
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
  player.x = Math.max(0, Math.min(canvas.width - player.w, e.clientX - rect.left - player.w / 2));
});

canvas.addEventListener('click', () => {
  if (!gameRunning) init();
});

// 触摸支持
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  player.x = Math.max(0, Math.min(canvas.width - player.w, e.touches[0].clientX - rect.left - player.w / 2));
});

function goBack() {
  cancelAnimationFrame(animationId);
  window.gameCenter.navigate('lobby/lobby.html');
}

init();
