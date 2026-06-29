/**
 * workshop.js — 创作工坊逻辑
 *
 * 功能：
 * 1. 游戏模板浏览和选择
 * 2. 素材库管理（查看、分类）
 * 3. 导入素材（本地图片上传到素材库）
 * 4. 自定义游戏（基于模板调参生成新游戏）
 */

// ===== 素材存储（浏览器本地存储） =====
const ASSETS_KEY = 'game-center-assets';
let assets = loadAssets();
let currentTemplate = null;

/** 从浏览器存储加载素材 */
function loadAssets() {
  try {
    const data = localStorage.getItem(ASSETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

/** 保存素材到浏览器存储 */
function saveAssets() {
  localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
}

// ===== 游戏模板定义 =====
const TEMPLATES = [
  {
    id: 'snake', icon: '🐍', name: '贪吃蛇型',
    desc: '方向键控制角色移动吃食物，碰墙结束。适合做冒险收集类游戏',
    params: ['speed', 'gridSize', 'growLength'],
  },
  {
    id: 'breakout', icon: '🪐', name: '弹球型',
    desc: '反弹小球击碎目标，漏接丢命。适合做打砖块、射击类游戏',
    params: ['speed', 'lives', 'brickRows'],
  },
  {
    id: 'match', icon: '🐑', name: '消除型',
    desc: '找出相同图案消除。适合做连连看、消消乐类游戏',
    params: ['speed', 'iconCount', 'layerCount'],
  },
  {
    id: 'shooter', icon: '✈️', name: '射击型',
    desc: '躲避敌人并射击得分。适合做飞机大战、跑酷类游戏',
    params: ['speed', 'lives', 'enemyRate'],
  },
  {
    id: 'tetris', icon: '🧱', name: '下落型',
    desc: '方块下落排列消除。适合做拼图、整理类游戏',
    params: ['speed', 'cols', 'dropRate'],
  },
  {
    id: 'minesweeper', icon: '💣', name: '推理型',
    desc: '用数字线索推理并标记。适合做猜谜、探宝类游戏',
    params: ['gridSize', 'mineCount'],
  },
];

// ===== 页面初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  renderTemplates();
  renderAssetTags();
  renderAssets();

  // 导航切换
  document.querySelectorAll('.ws-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ws-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.ws-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
    });
  });

  // 导入区域
  const importZone = document.getElementById('importZone');
  const fileInput = document.getElementById('fileInput');

  importZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileImport);

  importZone.addEventListener('dragover', (e) => { e.preventDefault(); importZone.style.borderColor = '#7c4dff'; });
  importZone.addEventListener('dragleave', () => { importZone.style.borderColor = '#ddd'; });
  importZone.addEventListener('drop', (e) => {
    e.preventDefault();
    importZone.style.borderColor = '#ddd';
    processFiles(e.dataTransfer.files);
  });

  // 速度滑块
  const speedSlider = document.getElementById('custSpeed');
  speedSlider.addEventListener('input', () => {
    const labels = ['很慢', '较慢', '中等', '较快', '很快'];
    document.getElementById('speedVal').textContent = labels[speedSlider.value - 1];
  });

  // 创建游戏按钮
  document.getElementById('btnCreateGame').addEventListener('click', createCustomGame);
});

// ===== 渲染模板卡片 =====
function renderTemplates() {
  const grid = document.getElementById('templateGrid');
  grid.innerHTML = TEMPLATES.map(t => `
    <div class="template-card" data-template="${t.id}">
      <span class="template-icon">${t.icon}</span>
      <div class="template-name">${t.name}</div>
      <div class="template-desc">${t.desc}</div>
    </div>
  `).join('');

  // 点击模板 → 跳转到自定义面板
  grid.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const tId = card.dataset.template;
      currentTemplate = TEMPLATES.find(t => t.id === tId);
      // 切换到自定义面板
      document.querySelectorAll('.ws-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-panel="customize"]').classList.add('active');
      document.querySelectorAll('.ws-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-customize').classList.add('active');
      // 更新模板选择
      document.getElementById('custTemplate').value = tId;
    });
  });
}

// ===== 素材库 =====
function renderAssetTags() {
  const tags = ['全部', '角色', '道具', '背景', '特效', '自定义'];
  document.getElementById('assetTags').innerHTML = tags.map((t, i) =>
    `<button class="asset-tag${i === 0 ? ' active' : ''}" data-tag="${t}">${t}</button>`
  ).join('');

  document.querySelectorAll('.asset-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.asset-tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAssets(btn.dataset.tag);
    });
  });
}

function renderAssets(tagFilter = '全部') {
  const grid = document.getElementById('assetGrid');
  const filtered = tagFilter === '全部' ? assets : assets.filter(a => a.tag === tagFilter);

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="asset-empty">这个分类还没有素材，去"导入素材"添加吧 ✨</div>';
    return;
  }

  grid.innerHTML = filtered.map((a, i) => `
    <div class="asset-item" title="${a.name}">
      ${a.data ? `<img src="${a.data}" alt="${a.name}">` : a.emoji || '🖼️'}
    </div>
  `).join('');
}

// ===== 导入素材 =====
function handleFileImport(e) {
  processFiles(e.target.files);
  fileInput.value = '';
}

function processFiles(files) {
  const preview = document.getElementById('importPreview');
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      // 保存到 assets
      assets.push({
        id: Date.now() + Math.random(),
        name: file.name,
        type: 'image',
        tag: '自定义',
        data: dataUrl,
      });
      saveAssets();

      // 预览
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.innerHTML = `
        <img src="${dataUrl}" alt="${file.name}">
        <button class="preview-remove">×</button>
      `;
      item.querySelector('.preview-remove').addEventListener('click', (ev) => {
        ev.stopPropagation();
        assets = assets.filter(a => a.data !== dataUrl);
        saveAssets();
        item.remove();
        renderAssets();
      });
      preview.appendChild(item);

      // 刷新素材库
      renderAssets();
    };
    reader.readAsDataURL(file);
  }
}

// ===== 自定义游戏（创建新游戏文件夹） =====
function createCustomGame() {
  const name = document.getElementById('custName').value.trim() || '我的游戏';
  const icon = document.getElementById('custIcon').value.trim() || '🎮';
  const desc = document.getElementById('custDesc').value.trim() || '一款自定义游戏';
  const templateId = document.getElementById('custTemplate').value;
  const speed = parseInt(document.getElementById('custSpeed').value);
  const difficulty = document.getElementById('custDifficulty').value;
  const resultEl = document.getElementById('createResult');

  if (!name) {
    resultEl.className = 'create-result error';
    resultEl.textContent = '请输入游戏名称';
    return;
  }

  const template = TEMPLATES.find(t => t.id === templateId);

  // 生成游戏配置
  const gameConfig = {
    id: 'custom-' + Date.now(),
    name: name,
    icon: icon,
    description: desc,
    tags: ['自定义', template?.name || '通用'],
    version: '1.0.0',
    mainFile: 'index.html',
    params: {
      template: templateId,
      speed: speed,
      difficulty: difficulty,
      createdAt: new Date().toISOString(),
    },
  };

  // 保存到浏览器存储
  const customGames = JSON.parse(localStorage.getItem('custom-games') || '[]');
  customGames.push(gameConfig);
  localStorage.setItem('custom-games', JSON.stringify(customGames));

  resultEl.className = 'create-result success';
  resultEl.textContent = `✅ 游戏 "${name}" 创建成功！基于「${template?.name}」模板，难度：${difficulty === 'easy' ? '简单' : difficulty === 'normal' ? '普通' : '困难'}。返回大厅后在"游戏列表"中可以看到。`;
}

function goBack() {
  window.gameCenter.navigate('lobby/lobby.html');
}
