// 簡單的文字顯示應用程式 - 基於Glass UI
const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('node:path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    // 創建瀏覽器窗口，保持Glass的視覺風格
    mainWindow = new BrowserWindow({
        width: 800,
        height: 400,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'simple-preload.js')
        },
        frame: false, // 無邊框，如原始Glass
        transparent: true, // 透明背景，如原始Glass
        vibrancy: 'under-window', // 開啟vibrancy霧化效果
        roundedCorners: true, // 啟用圓角（注意：Electron不支援自定義圓角半徑）
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

// 截圖功能 - 針對 Windows 優化
async function captureScreen() {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1920, height: 1080 }
        });
        
        // 取得主螢幕 (Windows 通常是第一個)
        const primarySource = sources[0];
        if (!primarySource) {
            throw new Error('無法獲取螢幕來源');
        }
        
        return primarySource.thumbnail.toPNG();
    } catch (error) {
        console.error('截圖失敗:', error);
        throw error;
    }
}

// 確保截圖目錄存在
function ensureScreenshotDir() {
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }
    return screenshotDir;
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

// IPC: 真實截圖並分析
ipcMain.handle('analyze-screenshot', async (_, { mode }) => {
    try {
        console.log('開始截圖...', mode);
        
        // 1. 執行截圖
        const screenshot = await captureScreen();
        
        // 2. 保存截圖
        const screenshotDir = ensureScreenshotDir();
        const timestamp = Date.now();
        const filename = `screenshot_${timestamp}.png`;
        const screenshotPath = path.join(screenshotDir, filename);
        
        fs.writeFileSync(screenshotPath, screenshot);
        console.log('截圖已保存:', screenshotPath);
        
        const now = new Date().toISOString();
        
        // 3. 分析結果 (目前先回傳基本資訊，之後可串接 AI API)
        if (mode === 'action-steps') {
            return {
                success: true,
                mode,
                createdAt: now,
                screenshotPath,
                screenshotSize: screenshot.length,
                summary: '已成功截圖 - 操作建議',
                suggestions: [
                    `已截取螢幕並保存到: ${filename}`,
                    `圖片大小: ${Math.round(screenshot.length / 1024)}KB`,
                    '可在此基礎上進行進一步的 AI 分析',
                ],
            };
        }
        
        // 預設為文字回覆建議
        return {
            success: true,
            mode: 'text-reply',
            createdAt: now,
            screenshotPath,
            screenshotSize: screenshot.length,
            summary: '已成功截圖 - 回覆建議',
            suggestions: [
                `已截取螢幕並保存到: ${filename}`,
                `圖片大小: ${Math.round(screenshot.length / 1024)}KB`,
                '可基於此截圖內容進行分析和回覆',
            ],
        };
        
    } catch (error) {
        console.error('截圖分析失敗:', error);
        return {
            success: false,
            error: error.message,
            mode,
            createdAt: new Date().toISOString(),
            summary: '截圖失敗',
            suggestions: [
                `錯誤訊息: ${error.message}`,
                '請檢查螢幕錄製權限',
                '或稍後再試一次',
            ],
        };
    }
});