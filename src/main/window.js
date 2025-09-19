const { BrowserWindow } = require('electron');
const path = require('node:path');

function createWindow() {
    // 創建瀏覽器窗口，保持Glass的視覺風格
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 400,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../renderer/js/preload.js')
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
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

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
        // 窗口已關閉，不需要設置為null，因為mainWindow是const
    });

    return mainWindow;
}

module.exports = { createWindow };