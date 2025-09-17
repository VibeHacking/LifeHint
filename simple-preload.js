// 簡單文字應用的預載入腳本
const { contextBridge, ipcRenderer } = require('electron');

// 向渲染進程暴露安全的API
contextBridge.exposeInMainWorld('electronAPI', {
    updateText: (text) => ipcRenderer.invoke('update-text', text),

    // 模擬Glass的一些API結構
    glass: {
        version: '1.0.0',
        platform: process.platform
    }
});