/**
 * preload.js — 安全的中间桥梁
 *
 * 为什么需要这个文件？
 * 网页（lobby/games）默认不能访问文件系统（安全限制）。
 * 但我们需要读取游戏列表、页面导航等操作。
 * preload.js 提供一组安全的"API"，网页只能调用这些允许的操作。
 *
 * 简单理解：这是页面和电脑文件系统之间的"传话筒"
 */

const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给网页使用
contextBridge.exposeInMainWorld('gameCenter', {
  /**
   * 扫描 games/ 文件夹，返回所有游戏的信息列表
   * 大厅用这个来显示游戏卡片
   */
  scanGames: () => ipcRenderer.invoke('scan-games'),

  /**
   * 页面跳转（大厅 → 游戏，游戏 → 大厅）
   * 告诉主进程加载新的页面文件
   * @param {string} targetPath - 相对于项目根目录的路径，如 'games/snake/index.html'
   */
  navigate: (targetPath) => ipcRenderer.invoke('navigate', targetPath),

  /**
   * 获取窗口状态
   */
  getWindowState: () => ipcRenderer.invoke('window-state'),
});
