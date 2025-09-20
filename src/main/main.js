const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { createWindow } = require('./window');
const { setupScreenshotHandlers } = require('./screenshot');

let mainWindow;

// 當Electron完成初始化時調用此方法
app.whenReady().then(() => {
    mainWindow = createWindow();
    setupScreenshotHandlers();
});

// 當所有窗口關閉時退出（除了macOS）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // 在macOS上，當點擊dock圖標時重新創建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
    }
});

// IPC處理程序 - 用於文字更新
ipcMain.handle('update-text', async (_, newText) => {
    // 可以在這裡處理文字更新邏輯
    return { success: true, text: newText };
});

// IPC: 關閉視窗
ipcMain.handle('close-window', async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
        return { success: true };
    }
    const focused = BrowserWindow.getFocusedWindow();
    if (focused && !focused.isDestroyed()) {
        focused.close();
        return { success: true };
    }
    return { success: false };
});