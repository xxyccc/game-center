/**
 * 🐑 羊了个羊 (Sheep Match Game)
 *
 * 玩法：点击卡片移到暂存栏，3 张相同图案自动消除
 * 暂存栏最多放 7 张，满了就输
 * 上层卡片会遮挡下层，被遮挡的卡片不能点击
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const holderBar = document.getElementById('holderBar');
const scoreEl = document.getElementById('score');

// ===== 卡片设置 =====
const CARD_W = 52, CARD_H = 60;
// 12 种可爱图标
const ICONS = ['🐑', '🐮', '🐷', '🐔', '🐶', '🐱', '🐰', '🐸', '🦊', '🐼', '🐨', '🐯'];

// ===== 游戏状态 =====
let cards = [];            // 所有卡片：[{x, y, layer, iconIndex, removed, blockedBy count}]
let holder = [];           // 暂存栏（最多 7 张）
let score = 0;
let gameOver = false;
let gameWin = false;

// ===== 初始化 =====
function init() {
  cards = [];
  holder = [];
  score = 0;
  gameOver = false;
  gameWin = false;
  updateScore();
  generateCards();
  updateBlocked();
  draw();
  drawHolder();
}

/** 生成 3 层卡片 */
function generateCards() {
  // 每层卡片位置配置（层越大越靠上，卡片越少）
  const configs = [
    { layer: 0, cols: 5, rows: 4, startX: 30, startY: 50, gapX: 15, gapY: 12 },
    { layer: 1, cols: 4, rows: 3, startX: 50, startY: 70, gapX: 15, gapY: 12 },
    { layer: 2, cols: 3, rows: 2, startX: 80, startY: 100, gapX: 15, gapY: 12 },
  ];

  // 总共位置数：20 + 12 + 6 = 38 → 用 36 张（12 种 × 3）
  // 每种图标出现 3 次
  let iconPool = [];
  for (let i = 0; i < ICONS.length; i++) {
    for (let j = 0; j < 3; j++) iconPool.push(i);
  }
  // 打乱
  shuffle(iconPool);

  let idx = 0;
  for (const cfg of configs) {
    for (let row = 0; row < cfg.rows; row++) {
      for (let col = 0; col < cfg.cols; col++) {
        if (idx >= iconPool.length) break;
        cards.push({
          id: cards.length,
          x: cfg.startX + col * (CARD_W + cfg.gapX),
          y: cfg.startY + row * (CARD_H + cfg.gapY),
          layer: cfg.layer,
          iconIndex: iconPool[idx],
          removed: false,
          blockedBy: 0,  // 被几个上层卡片遮挡
        });
        idx++;
      }
    }
  }
}

// Fisher-Yates 洗牌
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** 更新遮挡关系：每个卡片检查被几个上层卡片遮挡 */
function updateBlocked() {
  cards.forEach(c => c.blockedBy = 0);
  for (const c1 of cards) {
    if (c1.removed) continue;
    for (const c2 of cards) {
      if (c2.removed || c2.id === c1.id) continue;
      if (c2.layer <= c1.layer) continue; // 只有上层能遮挡下层
      // 检查重叠
      if (rectsOverlap(c1, c2)) {
        c1.blockedBy++;
      }
    }
  }
}

function rectsOverlap(a, b) {
  return !(a.x + CARD_W <= b.x || b.x + CARD_W <= a.x ||
           a.y + CARD_H <= b.y || b.y + CARD_H <= a.y);
}

/** 点击卡片 → 选入暂存栏 */
function clickCard(card) {
  if (gameOver || gameWin) return;
  if (card.removed || card.blockedBy > 0) return;

  // 加入暂存栏
  card.removed = true;
  holder.push(card);

  // 检查是否有 3 张相同
  checkMatch();
  // 更新遮挡
  updateBlocked();
  draw();
  drawHolder();

  // 检查失败（暂存栏满了）
  if (holder.length >= 7) {
    failGame();
  }
  // 检查胜利
  if (cards.every(c => c.removed)) {
    winGame();
  }
}

/** 检查暂存栏是否有 3 张相同 */
function checkMatch() {
  // 按图标分组
  const groups = {};
  holder.forEach(c => {
    if (!groups[c.iconIndex]) groups[c.iconIndex] = [];
    groups[c.iconIndex].push(c);
  });

  for (const [iconIdx, group] of Object.entries(groups)) {
    if (group.length >= 3) {
      // 移除这 3 张
      let removed = 0;
      holder = holder.filter(c => {
        if (c.iconIndex === parseInt(iconIdx) && removed < 3) { removed++; return false; }
        return true;
      });
      score += 10;
      updateScore();
    }
  }
}

function failGame() {
  gameOver = true;
  draw();
  drawHolder();
}

function winGame() {
  gameWin = true;
  score += 50;
  updateScore();
  draw();
  drawHolder();
}

// ===== 绘制 =====
function draw() {
  ctx.fillStyle = '#FFF8F8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 按层顺序画卡片（低层先画，高层后画）
  for (let layer = 0; layer < 3; layer++) {
    cards.filter(c => c.layer === layer && !c.removed).forEach(c => drawCard(c));
  }

  // 游戏结束 / 胜利
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = 'bold 24px "Microsoft YaHei"'; ctx.textAlign = 'center';
    ctx.fillText('暂存栏满了 😢', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '14px "Microsoft YaHei"';
    ctx.fillText('点击画面重新开始', canvas.width / 2, canvas.height / 2 + 20);
  } else if (gameWin) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = 'bold 24px "Microsoft YaHei"'; ctx.textAlign = 'center';
    ctx.fillText('🎉 太厉害了！', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '14px "Microsoft YaHei"';
    ctx.fillText(`得分：${score}  |  点击画面重新开始`, canvas.width / 2, canvas.height / 2 + 20);
  }
}

function drawCard(c) {
  const x = c.x, y = c.y;

  // 阴影效果（层越高阴影越大）
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 4 + c.layer * 2;
  ctx.shadowOffsetY = 1 + c.layer;

  // 卡片背景
  const bgColors = ['#FFF', '#FFFDE7', '#FCE4EC'];
  ctx.fillStyle = c.blockedBy > 0 ? '#CFD8DC' : bgColors[c.layer];
  roundRect(x, y, CARD_W, CARD_H, 8);

  // 重置阴影（只用在背景）
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 图标
  ctx.font = '28px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (c.blockedBy > 0) {
    ctx.fillStyle = '#BDBDBD';
  }
  ctx.fillText(ICONS[c.iconIndex], x + CARD_W / 2, y + CARD_H / 2);

  // 边框
  ctx.strokeStyle = c.blockedBy > 0 ? '#CFD8DC' : '#E0E0E0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 遮挡标记
  if (c.blockedBy > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    roundRect(x, y, CARD_W, CARD_H, 8);
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
  if (ctx.strokeStyle) ctx.stroke();
}

/** 绘制暂存栏 */
function drawHolder() {
  holderBar.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const slot = document.createElement('div');
    slot.style.cssText = 'width:44px;height:54px;border-radius:10px;border:2px dashed #ddd;display:flex;align-items:center;justify-content:center;font-size:24px;transition:all 0.2s;';
    if (i < holder.length) {
      const c = holder[i];
      slot.style.border = '2px solid #FFB74D';
      slot.style.background = '#FFF8E1';
      slot.textContent = ICONS[c.iconIndex];
      slot.style.animation = 'popIn 0.2s ease';
    }
    if (i === 6 && holder.length >= 7 && !gameWin) {
      slot.style.borderColor = '#F44336';
      slot.style.background = '#FFEBEE';
    }
    holderBar.appendChild(slot);
  }
}

function updateScore() { scoreEl.textContent = score; }

// ===== 鼠标交互 =====
canvas.addEventListener('click', (e) => {
  if (gameOver || gameWin) { init(); return; }

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // 从上到下检查（高层的先被点到）
  const clickable = cards
    .filter(c => !c.removed && c.blockedBy === 0)
    .filter(c => mx >= c.x && mx < c.x + CARD_W && my >= c.y && my < c.y + CARD_H);

  if (clickable.length > 0) {
    // 选层级最高的那张
    clickable.sort((a, b) => b.layer - a.layer);
    clickCard(clickable[0]);
  }
});

function goBack() { window.gameCenter.navigate('lobby/lobby.html'); }

// CSS 动画注入
const style = document.createElement('style');
style.textContent = '@keyframes popIn { from { transform:scale(0.5);opacity:0; } to { transform:scale(1);opacity:1; } }';
document.head.appendChild(style);

init();
