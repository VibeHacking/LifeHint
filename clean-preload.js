const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  closeWindow: () => ipcRenderer.invoke('window-close'),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),

  // 文字更新
  onTextUpdate: (callback) => {
    ipcRenderer.on('text-update', (event, text) => callback(text));
  },

  // 模擬更新文字（用於測試）
  updateText: (text) => {
    ipcRenderer.send('update-display-text', text);
  }
});