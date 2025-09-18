const { contextBridge, ipcRenderer } = require('electron');

// 向渲染進程暴露安全的API
contextBridge.exposeInMainWorld('api', {
    closeWindow: () => ipcRenderer.invoke('close-window'),
    captureAndAnalyze: (mode) => ipcRenderer.invoke('analyze-screenshot', { mode }),
    updateText: (text) => ipcRenderer.invoke('update-text', text),
    
    // 模擬Glass的一些API結構
    glass: {
        version: '1.0.0',
        platform: process.platform
    }
});