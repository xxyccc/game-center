/**
 * 🐍 贪吃蛇 (Snake Game)
 *
 * 玩法：方向键/WASD 控制蛇移动，吃食物变长，撞墙或撞到自己则游戏结束
 *
 * 核心概念：
 * - 蛇由一段段"身体格子"组成，存在数组里
 * - 每帧蛇头朝当前方向移动一格，身体跟着头走
 * - 吃到食物 → 身体加一格，分数+10
 * - 撞墙或撞自己 → 游戏结束
 */

// ============ 游戏设置 ============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

const GRID = 20;          // 每个格子的像素大小（20x20）
const COLS = canvas.width / GRID;   // 列数 = 400/20 = 20
const ROWS = canvas.height / GRID;  // 行数 = 400/20 = 20

// ============ 游戏状态 ============
let snake = [];         // 蛇的身体：[{x, y}, {x, y}, ...] 第一个是头
let food = {};          // 食物位置：{x, y}
let direction = { x: 1, y: 0 };  // 当前移动方向（默认向右）
let nextDirection = { x: 1, y: 0 }; // 下一帧的方向（防止一帧内反转）
let score = 0;
let gameLoop = null;    // 定时器 ID
let isRunning = false;
let isPaused = false;
let speed = 120;        // 游戏速度（毫秒/帧），越小越快

// ============ 核心逻辑 ============

/** 初始化 / 重置游戏 */
function init() {
  // 蛇初始位置：从中间开始，初始长度 3
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  snake = [
    { x: startX,     y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  speed = 120;
  updateScore();
  spawnFood();
  isRunning = true;
  isPaused = false;
}

/** 生成随机食物（避开蛇身） */
function spawnFood() {
  // 收集所有空格子
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
  const free = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) {
    // 没有空格了 → 玩家赢了！但贪吃蛇通常不会填满，保留
    return;
  }
  // 随机选一个空格子
  food = free[Math.floor(Math.random() * free.length)];
}

/** 每帧更新（游戏主循环） */
function update() {
  if (!isRunning || isPaused) return;

  // 1. 应用新方向（不能 180 度反转）
  if (!(nextDirection.x === -direction.x && nextDirection.y === -direction.y)) {
    direction = nextDirection;
  }

  // 2. 计算新蛇头位置
  const head = snake[0];
  const newHead = { x: head.x + direction.x, y: head.y + direction.y };

  // 3. 检查撞墙
  if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
    gameOver();
    return;
  }

  // 4. 检查撞自己
  if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
    gameOver();
    return;
  }

  // 5. 蛇头前进（把新头插入数组最前面）
  snake.unshift(newHead);

  // 6. 检查是否吃到食物
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 10;
    updateScore();
    spawnFood();
    // 每吃 3 个食物加速一点
    if (score % 30 === 0 && speed > 50) {
      speed -= 10;
      restartLoop();
    }
  } else {
    // 没吃到 → 去掉尾巴（相当于整体移动）
    snake.pop();
  }
}

/** 绘制画面 */
function draw() {
  // 清空画布（淡粉色背景）
  ctx.fillStyle = '#FFF8F8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 画网格线（淡淡的）
  ctx.strokeStyle = '#F0E0E0';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * GRID, 0);
    ctx.lineTo(x * GRID, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * GRID);
    ctx.lineTo(canvas.width, y * GRID);
    ctx.stroke();
  }

  // 画食物（一个可爱的圆形）
  const fx = food.x * GRID + GRID / 2;
  const fy = food.y * GRID + GRID / 2;
  ctx.fillStyle = '#FF6B6B';
  ctx.beginPath();
  ctx.arc(fx, fy, GRID / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  // 食物高光
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(fx - 2, fy - 2, GRID / 6, 0, Math.PI * 2);
  ctx.fill();

  // 画蛇
  snake.forEach((seg, i) => {
    const sx = seg.x * GRID;
    const sy = seg.y * GRID;

    if (i === 0) {
      // 蛇头：圆角矩形 + 眼睛
      ctx.fillStyle = '#4CAF50';
      roundRect(sx + 1, sy + 1, GRID - 2, GRID - 2, 6);
      // 眼睛
      ctx.fillStyle = 'white';
      const ex = direction.x === 1 ? sx + 13 : direction.x === -1 ? sx + 5 : sx + 5;
      const ey = direction.y === 1 ? sy + 13 : direction.y === -1 ? sy + 5 : sy + 5;
      ctx.beginPath();
      ctx.arc(ex, ey - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + 2, ey + 2, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 身体：渐变绿色
      const alpha = 1 - (i / snake.length) * 0.3;
      ctx.fillStyle = `rgba(76, 175, 80, ${alpha})`;
      roundRect(sx + 2, sy + 2, GRID - 4, GRID - 4, 4);
    }
  });

  // 暂停遮罩
  if (isPaused) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ 已暂停', canvas.width / 2, canvas.height / 2);
  }
}

/** 辅助：画圆角矩形 */
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

/** 游戏结束 */
function gameOver() {
  isRunning = false;
  clearInterval(gameLoop);
  // 画游戏结束画面
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px "Microsoft YaHei"';
  ctx.textAlign = 'center';
  ctx.fillText('游戏结束 😢', canvas.width / 2, canvas.height / 2 - 15);
  ctx.font = '16px "Microsoft YaHei"';
  ctx.fillText(`得分：${score} 🍎`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText('按空格键重新开始', canvas.width / 2, canvas.height / 2 + 48);
}

/** 主循环：更新 + 绘制 */
function tick() {
  update();
  draw();
}

/** 更新分数显示 */
function updateScore() {
  scoreEl.textContent = score;
}

/** 重启定时器（调速用） */
function restartLoop() {
  clearInterval(gameLoop);
  gameLoop = setInterval(tick, speed);
}

// ============ 键盘控制 ============
document.addEventListener('keydown', (e) => {
  // 阻止方向键滚动页面
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
    e.preventDefault();
  }

  if (!isRunning) {
    // 游戏结束后，按空格重新开始
    if (e.key === ' ') {
      init();
      clearInterval(gameLoop);
      gameLoop = setInterval(tick, speed);
    }
    return;
  }

  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W':
      nextDirection = { x: 0, y: -1 }; break;
    case 'ArrowDown':  case 's': case 'S':
      nextDirection = { x: 0, y: 1 };  break;
    case 'ArrowLeft':  case 'a': case 'A':
      nextDirection = { x: -1, y: 0 }; break;
    case 'ArrowRight': case 'd': case 'D':
      nextDirection = { x: 1, y: 0 };  break;
    case ' ':
      // 空格暂停/继续
      isPaused = !isPaused;
      draw();
      break;
  }
});

// ============ 返回大厅 ============
function goBack() {
  window.gameCenter.navigate('lobby/lobby.html');
}

// ============ 启动游戏 ============
init();
gameLoop = setInterval(tick, speed);
