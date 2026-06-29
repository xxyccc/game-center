/**
 * lobby.js — 游戏大厅逻辑
 *
 * 负责：
 * 1. 读取 games/ 下的所有游戏（通过 preload.js 安全调用）
 * 2. 动态创建游戏卡片
 * 3. 处理卡片点击（进入游戏）
 * 4. 创作工坊按钮
 */

// 游戏卡片配色方案（每种颜色代表一种"氛围"）
const CARD_COLORS = [
  '#FF6B6B', // 珊瑚红 — 贪吃蛇
  '#4ECDC4', // 薄荷绿 — 俄罗斯方块
  '#FFD93D', // 明亮黄 — 扫雷
  '#A18CD1', // 柔和紫 — 羊了个羊
  '#6BC5D9', // 天空蓝 — 打飞机
  '#FF8A65', // 暖橙色 — 弹球
];

/**
 * 页面加载完成后执行
 * 这是网页开发的惯例：等 HTML 准备好后再操作
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. 加载游戏列表
  await loadGameList();

  // 2. 绑定按钮事件
  document.getElementById('btnWorkshop').addEventListener('click', openWorkshop);
});

/**
 * 加载游戏列表并生成卡片
 */
async function loadGameList() {
  const grid = document.getElementById('gamesGrid');

  // 先显示加载提示
  grid.innerHTML = '<div class="loading-hint">🔍 正在发现游戏...</div>';

  try {
    // 调用 preload.js 提供的 scanGames API
    // 这会触发 main.js 里的 'scan-games' 处理器，读取 games/ 文件夹
    const games = await window.gameCenter.scanGames();

    // 清空加载提示
    grid.innerHTML = '';

    if (games.length === 0) {
      grid.innerHTML = '<div class="loading-hint">😴 还没有游戏，去创作工坊做一个吧！</div>';
      return;
    }

    // 为每个游戏创建一张卡片
    games.forEach((game, index) => {
      const card = createGameCard(game, index);
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = '<div class="loading-hint">😢 加载失败，请重启应用</div>';
    console.error('加载游戏列表出错:', err);
  }
}

/**
 * 创建一张游戏卡片
 * @param {Object} game - 游戏信息（来自 config.json）
 * @param {number} index - 第几张卡片（用于配色）
 * @returns {HTMLElement} 卡片 DOM 元素
 */
function createGameCard(game, index) {
  const card = document.createElement('div');
  card.className = 'game-card';

  // 设置卡片顶部装饰条颜色
  const color = CARD_COLORS[index % CARD_COLORS.length];
  card.style.setProperty('--card-color', color);

  // 卡片内容：图标 + 名字 + 简介
  card.innerHTML = `
    <span class="game-icon">${game.icon || '🎯'}</span>
    <div class="game-name">${game.name}</div>
    <div class="game-desc">${game.description || '一款好玩的游戏'}</div>
    ${game.tags ? `
      <div class="game-tags">
        ${game.tags.map(tag => `<span class="game-tag">#${tag}</span>`).join('')}
      </div>
    ` : ''}
  `;

  // 点击卡片 → 进入游戏
  card.addEventListener('click', () => {
    launchGame(game);
  });

  return card;
}

/**
 * 进入游戏
 * 在新窗口中打开游戏页面
 * @param {Object} game - 游戏信息
 */
function launchGame(game) {
  // 通过 Electron IPC 安全地跳转到游戏页面
  const gamePath = `games/${game.folder}/${game.mainFile || 'index.html'}`;
  window.gameCenter.navigate(gamePath);
}

/**
 * 打开创作工坊
 */
function openWorkshop() {
  window.gameCenter.navigate('workshop/workshop.html');
}
