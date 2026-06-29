# 🎮 游戏乐园

<p align="center">
  <img src="shared-assets/images/icon.png" width="128" alt="异瞳猫猫">
  <br>
  <sub>一个可爱的桌面小游戏集合 — LGTM 👍 在我电脑上能跑 🤷</sub>
</p>

---

## 这是个啥

某天心血来潮想做个游戏合集，于是就有了它。代码写得很开心，bug 修得也很开心 🔥🐶
反正在我电脑上能跑，你的应该也行。

## 有啥好玩的

> 点开大厅卡片就能玩，支持摸鱼、消磨时间、假装在工作

- 🏠 **游戏大厅** — 可爱卡片网格，一眼看到所有游戏
- 🐍 **贪吃蛇** — 经典，但蛇头有眼睛👀
- 🧱 **俄罗斯方块** — 带幽灵落点预览，不会瞎放了
- 💣 **扫雷** — 别点第一颗就炸 🙏
- 🐑 **羊了个羊** — 三层叠消除，最后一层永远找不到
- ✈️ **打飞机** — 捡到 ⚡ 道具火力翻倍
- 🪐 **弹球消消乐** — 物理引擎？手写的，凑合用
- 🎨 **创作工坊** — Fork 一个模板，换皮+调参 = 你的新游戏 🍴
- 🐱 **异瞳猫猫** — 蓝眼+金眼，比这项目可爱

## 怎么跑

### 我是来玩的

下个 [zip 包](../../releases)，解压，双击 `GameCenter.exe`。没有 Friday deploy，放心 😈

### 我想改代码

```bash
# 先 Fork 🍴 再 clone
git clone https://github.com/xxyccc/game-center.git
cd game-center
npm install
npm start          # 启动！This is fine 🔥🐶
```

## 用的啥

纯前端三件套 + Electron 包了一层。没有框架，没有魔法，就是硬写。

| 东西 | 干嘛的 |
|------|--------|
| Electron | 把网页变成桌面 .exe |
| Canvas | 画蛇、画方块、画飞机 |
| CSS | 粉色渐变，猛男最爱 |
| JavaScript | 几乎所有逻辑（屎山建设中） |

## 里面长这样

```
game-center/
├── main.js              # 遥控器：开窗口、关窗口
├── preload.js           # 传话筒：网页 ↔ 电脑
├── lobby/               # 大厅 — 自动扫描游戏
├── games/
│   ├── snake/           # 🐍 贪吃蛇
│   ├── tetris/          # 🧱 俄罗斯方块
│   ├── minesweeper/     # 💣 扫雷
│   ├── sheep/           # 🐑 羊了个羊
│   ├── shooter/         # ✈️ 打飞机
│   └── pinball/         # 🪐 弹球
├── workshop/            # 创作工坊
└── shared-assets/       # 猫猫图标住这里
```

## 想加新游戏？

在 `games/` 下新建文件夹，丢两个文件进去，大厅自己会发现它。

**`config.json`**
```json
{
  "id": "my-game",
  "name": "我的游戏",
  "icon": "🎯",
  "description": "我也不知道好不好玩",
  "tags": ["自定义"],
  "version": "1.0.0",
  "mainFile": "index.html"
}
```

**`index.html`** — 抄一个现有游戏的架子，改 Canvas 内容就行。LGTM 👍

## 打包成 exe

```bash
npm run build        # 记得先关梯子，不然下载工具卡半天
```

## 想贡献？

Fork → 改 → PR，或者直接开 Issue 喷我 🍴
觉得还行的话点个 **Star** ⭐，给为爱发电的人一点动力。

---

<p align="center">
  <sub>为爱发电 ⚡ · 没有经费 · 全是感情 · Works on my machine 🤷</sub>
</p>
