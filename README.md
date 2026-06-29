# 🎮 游戏乐园 (Game Center)

> 一个可爱的桌面小游戏集合 — 双击即玩，6 款经典休闲游戏等你来！

<p align="center">
  <img src="shared-assets/images/icon.png" width="128" alt="异瞳猫猫">
</p>

---

## ✨ 特性

- 🏠 **游戏大厅** — 可爱卡片网格，一键进入游戏
- 🐍 **贪吃蛇** — 经典贪吃蛇，吃食物变长，挑战高分
- 🧱 **俄罗斯方块** — 七种方块旋转消除，带幽灵落点预览
- 💣 **扫雷** — 数字推理 + 右键插旗，考验逻辑
- 🐑 **羊了个羊** — 三层叠消除，3 张相同图案自动匹配
- ✈️ **打飞机** — 鼠标操控战机，收集道具增强火力
- 🪐 **弹球消消乐** — 反弹小球击碎砖块，弹板精准接球
- 🎨 **创作工坊** — 游戏模板 + 素材库 + 参数调整 = 你的专属游戏
- 🐱 **异瞳猫猫** — Q 版可爱图标，蓝眼+金眼

---

## 🚀 快速开始

### 1. 下载 & 运行（玩家）

从 [Releases](../../releases) 下载 `GameCenter-v1.0.zip`，解压后双击 `GameCenter.exe` 即可游玩！

### 2. 开发者运行

```bash
# 克隆仓库
git clone https://github.com/xxyccc/game-center.git
cd game-center

# 安装依赖
npm install

# 启动应用
npm start
```

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Electron](https://www.electronjs.org/) | 桌面应用框架 |
| HTML5 Canvas | 游戏画面渲染 |
| CSS3 | 可爱扁平矢量风界面 |
| JavaScript (Vanilla) | 游戏逻辑 & 大厅交互 |

---

## 📂 项目结构

```
game-center/
├── main.js                 # Electron 主进程
├── preload.js              # 安全 IPC 桥梁
├── lobby/                  # 游戏大厅
├── games/                  # 游戏仓库
│   ├── snake/              #   🐍 贪吃蛇
│   ├── tetris/             #   🧱 俄罗斯方块
│   ├── minesweeper/        #   💣 扫雷
│   ├── sheep/              #   🐑 羊了个羊
│   ├── shooter/            #   ✈️ 打飞机
│   └── pinball/            #   🪐 弹球消消乐
├── workshop/               # 创作工坊
└── shared-assets/          # 共享素材库
```

---

## 🧩 添加新游戏

在 `games/` 下新建文件夹，创建两个文件即可：

**`config.json`** — 游戏身份信息：
```json
{
  "id": "my-game",
  "name": "我的游戏",
  "icon": "🎯",
  "description": "一款好玩的游戏",
  "tags": ["自定义", "休闲"],
  "version": "1.0.0",
  "mainFile": "index.html"
}
```

**`index.html`** — 游戏页面（参考现有游戏结构），大厅会自动扫描并显示！

---

## 📦 打包为 exe

```bash
npm run build
```

打包产物在 `dist/` 目录。

---

## 📝 License

MIT © [xxyccc](https://github.com/xxyccc)

---

<p align="center">
  <sub>Made with 💖 and ☕</sub>
</p>
