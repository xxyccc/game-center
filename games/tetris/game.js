/**
 * 🧱 俄罗斯方块 (Tetris)
 *
 * 玩法：移动和旋转下落方块，填满一行即可消除得分
 * ← → 移动  ↑ 旋转  ↓ 加速 空格暂停
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('previewCanvas');
const prevCtx = previewCanvas.getContext('2d');
const scoreEl = document.getElementById('score');

const COLS = 10, ROWS = 20, CELL = 30; // 10x20 格子，每格 30px

// ===== 7 种方块形状 =====
// 每个形状有 4 个旋转状态，每个状态是 4 个坐标偏移
const SHAPES = {
  I: { color: '#00BCD4', blocks: [[[0,0],[1,0],[2,0],[3,0]], [[1,0],[1,1],[1,2],[1,3]], [[0,0],[1,0],[2,0],[3,0]], [[1,0],[1,1],[1,2],[1,3]]] },
  O: { color: '#FFEB3B', blocks: [[[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[0,1],[1,1]]] },
  T: { color: '#9C27B0', blocks: [[[0,0],[1,0],[2,0],[1,1]], [[0,0],[0,1],[0,2],[1,1]], [[0,0],[1,0],[2,0],[1,-1]], [[0,0],[0,1],[0,2],[-1,1]]] },
  S: { color: '#4CAF50', blocks: [[[1,0],[2,0],[0,1],[1,1]], [[0,0],[0,1],[1,1],[1,2]], [[1,0],[2,0],[0,1],[1,1]], [[0,0],[0,1],[1,1],[1,2]]] },
  Z: { color: '#F44336', blocks: [[[0,0],[1,0],[1,1],[2,1]], [[0,1],[0,2],[1,0],[1,1]], [[0,0],[1,0],[1,1],[2,1]], [[0,1],[0,2],[1,0],[1,1]]] },
  J: { color: '#2196F3', blocks: [[[0,0],[0,1],[1,1],[2,1]], [[0,0],[1,0],[0,1],[0,2]], [[0,0],[1,0],[2,0],[2,-1]], [[0,0],[0,1],[0,2],[-1,2]]] },
  L: { color: '#FF9800', blocks: [[[2,0],[0,1],[1,1],[2,1]], [[0,0],[0,1],[0,2],[1,2]], [[0,0],[1,0],[2,0],[0,-1]], [[0,0],[1,0],[1,1],[1,2]]] },
};

// ===== 游戏状态 =====
let board = [];             // 棋盘 board[row][col] = color|null
let current = null;         // 当前方块 { type, rotation, x, y }
let nextType = null;        // 下一个方块类型
let score = 0;
let gameLoop = null;
let isRunning = false;
let isPaused = false;
let speed = 700;

// ===== 初始化 =====
function init() {
  // 创建空棋盘
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  score = 0;
  speed = 700;
  updateScore();
  isRunning = true;
  isPaused = false;
  nextType = randomType();
  spawnPiece();
  drawPreview();
}

function randomType() {
  const types = Object.keys(SHAPES);
  return types[Math.floor(Math.random() * types.length)];
}

/** 生成新方块 */
function spawnPiece() {
  const type = nextType;
  nextType = randomType();
  current = {
    type,
    rotation: 0,
    x: Math.floor(COLS / 2) - 1,
    y: 0,
  };
  // 如果新方块一出现就碰撞 → 游戏结束
  if (collides(current.type, current.rotation, current.x, current.y)) {
    gameOver();
  }
  drawPreview();
}

/** 获取方块的 4 个格子坐标 */
function getBlocks(type, rotation, x, y) {
  return SHAPES[type].blocks[rotation].map(([bx, by]) => ({ x: x + bx, y: y + by }));
}

/** 检测碰撞 */
function collides(type, rotation, x, y) {
  return getBlocks(type, rotation, x, y).some(b => {
    return b.x < 0 || b.x >= COLS || b.y >= ROWS || (b.y >= 0 && board[b.y][b.x] !== null);
  });
}

/** 把当前方块固定到棋盘上 */
function lockPiece() {
  getBlocks(current.type, current.rotation, current.x, current.y).forEach(b => {
    if (b.y >= 0) board[b.y][b.x] = SHAPES[current.type].color;
  });
  clearLines();
  spawnPiece();
}

/** 消除满行 */
function clearLines() {
  let cleared = 0;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every(cell => cell !== null)) {
      // 移除这一行，顶部插入空行
      board.splice(row, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      row++; // 重新检查当前行
    }
  }
  if (cleared > 0) {
    const bonus = [0, 100, 300, 500, 800][cleared] || 800;
    score += bonus;
    updateScore();
    if (speed > 100) { speed -= 30; restartLoop(); }
  }
}

/** 移动方块 */
function movePiece(dx, dy) {
  if (!isRunning || isPaused) return;
  if (!collides(current.type, current.rotation, current.x + dx, current.y + dy)) {
    current.x += dx;
    current.y += dy;
    draw();
  } else if (dy > 0) {
    // 向下碰撞 → 锁定
    lockPiece();
  }
}

/** 旋转方块 */
function rotatePiece() {
  if (!isRunning || isPaused) return;
  const newRot = (current.rotation + 1) % 4;
  // 尝试基本旋转
  if (!collides(current.type, newRot, current.x, current.y)) {
    current.rotation = newRot;
    return;
  }
  // 踢墙：尝试左右偏移
  for (const dx of [-1, 1, -2, 2]) {
    if (!collides(current.type, newRot, current.x + dx, current.y)) {
      current.x += dx;
      current.rotation = newRot;
      return;
    }
  }
}

/** 硬降（直接落到底部） */
function hardDrop() {
  if (!isRunning || isPaused) return;
  while (!collides(current.type, current.rotation, current.x, current.y + 1)) {
    current.y++;
    score += 2;
  }
  lockPiece();
  updateScore();
}

/** 自动下落（每帧调用） */
function tick() {
  if (!isRunning || isPaused) return;
  movePiece(0, 1);
  draw();
}

// ===== 绘制 =====
function draw() {
  ctx.fillStyle = '#FFF8F8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 网格线
  ctx.strokeStyle = '#F0E0E0';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvas.width, y * CELL); ctx.stroke();
  }

  // 已落定的方块
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        drawCell(ctx, c * CELL, r * CELL, CELL, board[r][c]);
      }
    }
  }

  // 当前下落方块
  if (current && isRunning) {
    const blocks = getBlocks(current.type, current.rotation, current.x, current.y);
    const color = SHAPES[current.type].color;
    blocks.forEach(b => {
      if (b.y >= 0) drawCell(ctx, b.x * CELL, b.y * CELL, CELL, color);
    });

    // 画幽灵（落点预览）
    let gy = current.y;
    while (!collides(current.type, current.rotation, current.x, gy + 1)) gy++;
    if (gy !== current.y) {
      const ghostBlocks = getBlocks(current.type, current.rotation, current.x, gy);
      ghostBlocks.forEach(b => {
        if (b.y >= 0) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(b.x * CELL + 2, b.y * CELL + 2, CELL - 4, CELL - 4);
          ctx.setLineDash([]);
        }
      });
    }
  }

  // 暂停
  if (isPaused) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = 'bold 24px "Microsoft YaHei"'; ctx.textAlign = 'center';
    ctx.fillText('⏸ 已暂停', canvas.width / 2, canvas.height / 2);
  }
}

function drawCell(context, x, y, size, color) {
  context.fillStyle = color;
  context.fillRect(x + 1, y + 1, size - 2, size - 2);
  // 高光（左上角亮一点）
  context.fillStyle = 'rgba(255,255,255,0.25)';
  context.fillRect(x + 1, y + 1, size - 2, 3);
  context.fillRect(x + 1, y + 1, 3, size - 2);
  // 暗边（右下角暗一点）
  context.fillStyle = 'rgba(0,0,0,0.15)';
  context.fillRect(x + 1, y + size - 4, size - 2, 3);
  context.fillRect(x + size - 4, y + 1, 3, size - 2);
}

/** 预览下一个方块 */
function drawPreview() {
  prevCtx.fillStyle = '#FFF8F8';
  prevCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  if (!nextType) return;
  const blocks = SHAPES[nextType].blocks[0];
  const color = SHAPES[nextType].color;
  const pSize = 24;
  const ox = (previewCanvas.width - 4 * pSize) / 2 + pSize / 2;
  const oy = (previewCanvas.height - 2 * pSize) / 2 + pSize / 2;
  blocks.forEach(([bx, by]) => {
    drawCell(prevCtx, ox + bx * pSize, oy + by * pSize, pSize, color);
  });
}

function gameOver() {
  isRunning = false;
  clearInterval(gameLoop);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white'; ctx.font = 'bold 28px "Microsoft YaHei"'; ctx.textAlign = 'center';
  ctx.fillText('游戏结束 😢', canvas.width / 2, canvas.height / 2 - 15);
  ctx.font = '16px "Microsoft YaHei"';
  ctx.fillText(`得分：${score} ⭐`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText('按空格键重新开始', canvas.width / 2, canvas.height / 2 + 48);
}

function updateScore() { scoreEl.textContent = score; }
function restartLoop() { clearInterval(gameLoop); gameLoop = setInterval(tick, speed); }

// ===== 键盘控制 =====
document.addEventListener('keydown', (e) => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  if (!isRunning) { if (e.key === ' ') { init(); gameLoop = setInterval(tick, speed); } return; }
  switch (e.key) {
    case 'ArrowLeft':  movePiece(-1, 0); draw(); break;
    case 'ArrowRight': movePiece(1, 0);  draw(); break;
    case 'ArrowDown':  movePiece(0, 1);  draw(); break;
    case 'ArrowUp':    rotatePiece();    draw(); break;
    case ' ': isPaused = !isPaused; draw(); break;
  }
});

function goBack() { window.gameCenter.navigate('lobby/lobby.html'); }

// 启动
init();
gameLoop = setInterval(tick, speed);
