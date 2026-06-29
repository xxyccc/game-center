/**
 * main.js — 游戏乐园 主程序
 *
 * 这是 Electron 的"遥控器"，负责：
 * 1. 创建应用窗口
 * 2. 设置窗口大小（1000x700，适合游戏大厅）
 * 3. 加载游戏大厅页面
 *
 * 简单理解：这个文件就是"打开游戏乐园这个软件"的入口
 */

// app：控制整个应用的生命周期（启动、退出等）
// BrowserWindow：创建桌面窗口
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 保存窗口引用，防止被垃圾回收关闭
let mainWindow = null;

/**
 * 创建主窗口
 * 这个函数在应用启动时被调用
 */
function createMainWindow() {
  // 创建一个新窗口，设置大小和最小尺寸
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,         // 最小宽度
    minHeight: 600,        // 最小高度
    title: '🎮 游戏乐园',
    icon: path.join(__dirname, 'shared-assets', 'images', 'icon.ico'),
    // 网页渲染设置，让 Canvas 画游戏更流畅
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),  // 安全的中间桥梁
      contextIsolation: true,   // 安全：隔离网页和 Node.js
      nodeIntegration: false,   // 安全：不让网页直接访问 Node.js
    },
    // 窗口外观：无边框但保留标题栏
    autoHideMenuBar: true,      // 隐藏菜单栏（让窗口更简洁）
    backgroundColor: '#FFF5F5', // 背景色（柔和粉色，加载时显示）
  });

  // 加载游戏大厅页面
  mainWindow.loadFile(path.join(__dirname, 'lobby', 'lobby.html'));

  // 窗口关闭时，清空引用
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * IPC 通信：大厅需要读取游戏列表
 * 网页不能直接读文件（安全限制），所以通过这里来读
 */
ipcMain.handle('scan-games', async () => {
  const gamesDir = path.join(__dirname, 'games');
  const gameFolders = fs.readdirSync(gamesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory());

  const games = [];
  for (const folder of gameFolders) {
    const configPath = path.join(gamesDir, folder.name, 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        config.folder = folder.name;  // 记录文件夹名
        games.push(config);
      } catch (e) {
        // 如果配置文件格式错误，跳过这个游戏
        console.error(`读取 ${folder.name} 配置失败:`, e.message);
      }
    }
  }
  return games;
});

// 当 Electron 准备好时，创建窗口
app.whenReady().then(createMainWindow);

// ===== 页面导航（游戏大厅 ↔ 游戏页面） =====
// 网页端调用 gameCenter.launchGame() → 这里收到并加载对应游戏页面
ipcMain.handle('navigate', async (_event, targetPath) => {
  const fullPath = path.join(__dirname, targetPath);
  if (fs.existsSync(fullPath)) {
    mainWindow.loadFile(fullPath);
    return true;
  }
  return false;
});

// 获取当前窗口是否最大化（用于 UI 判断）
ipcMain.handle('window-state', async () => {
  return {
    isMaximized: mainWindow.isMaximized(),
    width: mainWindow.getSize()[0],
    height: mainWindow.getSize()[1],
  };
});

// 所有窗口关闭时退出应用（Windows 惯例）
app.on('window-all-closed', () => {
  app.quit();
});

// macOS 特殊处理：点击 Dock 图标重新创建窗口
app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});
