/**
 * 💣 扫雷 (Minesweeper)
 *
 * 玩法：左键翻开格子，右键插旗标记雷区
 * 数字代表周围 8 格有几个雷，推理出所有雷即胜利
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mineCountEl = document.getElementById('mineCount');

const SIZE = 9;          // 9x9 棋盘
const MINES = 10;        // 10 个雷
const CELL = 40;         // 每格 40px

// ===== 游戏状态 =====
let board = [];           // board[row][col] = { mine, revealed, flagged, adjacentMines }
let gameOver = false;
let gameWin = false;
let remainingMines = MINES;
let firstClick = true;

// ===== 初始化 =====
function init() {
  board = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacentMines: 0,
    }))
  );
  gameOver = false;
  gameWin = false;
  remainingMines = MINES;
  firstClick = true;
  updateMineCount();
  draw();
}

/** 随机布雷（避开 firstClick 的格子） */
function placeMines(safeRow, safeCol) {
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    // 避开安全格（第一次点击的位置及其周围）
    if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
    if (board[r][c].mine) continue;
    board[r][c].mine = true;
    placed++;
  }
  // 计算每个格子的相邻雷数
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c].mine) continue;
      board[r][c].adjacentMines = countAdjacentMines(r, c);
    }
  }
}

/** 数周围 8 格有几个雷 */
function countAdjacentMines(row, col) {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc].mine) count++;
    }
  }
  return count;
}

/** 翻开格子 */
function reveal(row, col) {
  const cell = board[row][col];
  if (cell.revealed || cell.flagged || gameOver || gameWin) return;

  // 第一步：布雷（保证不炸）
  if (firstClick) {
    placeMines(row, col);
    firstClick = false;
  }

  cell.revealed = true;

  if (cell.mine) {
    // 踩雷！游戏结束
    gameOver = true;
    revealAllMines();
    draw();
    return;
  }

  // 如果周围没有雷 → 自动翻开相邻格（泛洪展开）
  if (cell.adjacentMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
          reveal(nr, nc);
        }
      }
    }
  }

  // 检查是否胜利
  checkWin();
}

/** 右键插旗 / 取消 */
function toggleFlag(row, col) {
  if (gameOver || gameWin) return;
  const cell = board[row][col];
  if (cell.revealed) return;
  cell.flagged = !cell.flagged;
  remainingMines += cell.flagged ? -1 : 1;
  updateMineCount();
  draw();
}

/** 检查是否胜利（所有非雷格都翻开） */
function checkWin() {
  const allRevealed = board.every(row =>
    row.every(cell => cell.revealed || cell.mine)
  );
  if (allRevealed) {
    gameWin = true;
    // 自动标记所有雷
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c].mine) board[r][c].flagged = true;
      }
    }
    remainingMines = 0;
    updateMineCount();
  }
}

function revealAllMines() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c].mine) board[r][c].revealed = true;
}

// ===== 绘制 =====
function draw() {
  ctx.fillStyle = '#FFF8F8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 网格线
  ctx.strokeStyle = '#DDD';
  ctx.lineWidth = 1;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const x = c * CELL, y = r * CELL;
      const cell = board[r][c];

      if (cell.revealed) {
        // 翻开的格子
        ctx.fillStyle = '#F5F0EB';
        ctx.fillRect(x, y, CELL, CELL);

        if (cell.mine) {
          // 显示雷
          ctx.fillStyle = '#F44336';
          ctx.beginPath();
          ctx.arc(x + CELL / 2, y + CELL / 2, CELL / 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font = '18px "Microsoft YaHei"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💣', x + CELL / 2, y + CELL / 2);
        } else if (cell.adjacentMines > 0) {
          // 显示数字（不同数字不同颜色）
          const colors = ['', '#2196F3', '#4CAF50', '#F44336', '#1A237E', '#800000', '#008080', '#000', '#666'];
          ctx.fillStyle = colors[cell.adjacentMines] || '#333';
          ctx.font = 'bold 18px "Microsoft YaHei"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cell.adjacentMines, x + CELL / 2, y + CELL / 2);
        }
      } else {
        // 未翻开的格子（3D 效果凸起）
        ctx.fillStyle = '#BDBDBD';
        ctx.fillRect(x, y, CELL, CELL);
        // 亮面
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(x, y, CELL - 2, CELL - 2);
        // 暗边
        ctx.fillStyle = '#9E9E9E';
        ctx.fillRect(x + CELL - 4, y + 2, 2, CELL - 4);
        ctx.fillRect(x + 2, y + CELL - 4, CELL - 4, 2);

        if (cell.flagged) {
          // 旗帜
          ctx.fillStyle = '#FF6B6B';
          ctx.font = '20px "Microsoft YaHei"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🚩', x + CELL / 2, y + CELL / 2);
        }
      }

      ctx.strokeRect(x, y, CELL, CELL);
    }
  }

  // 游戏结束 / 胜利遮罩
  if (gameOver || gameWin) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px "Microsoft YaHei"'; ctx.textAlign = 'center';
    ctx.fillText(gameWin ? '🎉 你赢了！' : '💥 踩雷了！', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '14px "Microsoft YaHei"';
    ctx.fillText('点击画面重新开始', canvas.width / 2, canvas.height / 2 + 24);
  }
}

function updateMineCount() { mineCountEl.textContent = remainingMines; }

// ===== 鼠标交互 =====
canvas.addEventListener('click', (e) => {
  if (gameOver || gameWin) { init(); return; }
  const rect = canvas.getBoundingClientRect();
  const col = Math.floor((e.clientX - rect.left) / CELL);
  const row = Math.floor((e.clientY - rect.top) / CELL);
  if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
    reveal(row, col);
    draw();
  }
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (gameOver || gameWin) return;
  const rect = canvas.getBoundingClientRect();
  const col = Math.floor((e.clientX - rect.left) / CELL);
  const row = Math.floor((e.clientY - rect.top) / CELL);
  if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
    toggleFlag(row, col);
  }
});

function goBack() { window.gameCenter.navigate('lobby/lobby.html'); }

init();
