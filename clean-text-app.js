const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  // 基於 PickleGlassApp 的設計風格：16px 圓角、透明背景
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'clean-preload.js')
    },
    frame: false,
    roundedCorners: true,
    transparent: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    show: false,
    roundedCorners: true
  });

  mainWindow.loadFile('clean-text-display.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for window controls
ipcMain.handle('window-close', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) focusedWindow.close();
});

ipcMain.handle('window-minimize', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) focusedWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    if (focusedWindow.isMaximized()) {
      focusedWindow.unmaximize();
    } else {
      focusedWindow.maximize();
    }
  }
});

// Handle text updates from backend
ipcMain.on('update-display-text', (event, text) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.webContents.send('text-update', text);
  }
});

// Function to update text from backend (call this from your backend)
function updateTextDisplay(text) {
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach(window => {
    window.webContents.send('text-update', text);
  });
}

// Export for external use
module.exports = { updateTextDisplay };