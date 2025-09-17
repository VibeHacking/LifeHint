// 簡單的文字顯示應用程式 - 基於Glass UI
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

let mainWindow;

function createWindow() {
    // 創建瀏覽器窗口，保持Glass的視覺風格
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'simple-preload.js')
        },
        frame: false, // 無邊框，如原始Glass
        transparent: true, // 透明背景，如原始Glass
        vibrancy: 'under-window', // 開啟vibrancy霧化效果
        roundedCorners: true, // 啟用圓角
        cornerRadius: 100, // 設定較大的圓角半徑
        show: false, // 初始不顯示，等載入完成
        alwaysOnTop: true, // 保持在最上層
        skipTaskbar: true, // 不顯示在任務列
        resizable: false, // 不可調整大小
    });

    // 載入HTML文件
    mainWindow.loadFile('simple-window.html');

    // 當窗口準備好時顯示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // 添加淡入動畫，類似Glass
        mainWindow.setOpacity(0);
        let opacity = 0;
        const fadeIn = setInterval(() => {
            opacity += 0.1;
            mainWindow.setOpacity(opacity);
            if (opacity >= 1) {
                clearInterval(fadeIn);
            }
        }, 50);
    });

    // 當窗口關閉時
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 當Electron完成初始化時調用此方法
app.whenReady().then(createWindow);

// 當所有窗口關閉時退出（除了macOS）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // 在macOS上，當點擊dock圖標時重新創建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC處理程序 - 用於文字更新
ipcMain.handle('update-text', async (event, newText) => {
    // 可以在這裡處理文字更新邏輯
    return { success: true, text: newText };
});