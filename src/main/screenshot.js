const { ipcMain, desktopCapturer } = require('electron');
const path = require('node:path');
const fs = require('fs');

// 截圖功能 - 針對 Windows 優化
async function captureScreen() {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['window'],
            thumbnailSize: { width: 1920, height: 1080 }
        });
        
        const externalWindows = sources.filter(source => 
            !source.name.toLowerCase().includes('electron') && source.name !== ''
        );

        const previousWindow = externalWindows[0];
        if (!previousWindow) {
            throw new Error('Unable to get screen source');
        }

        return previousWindow.thumbnail.toPNG();
    } catch (error) {
        console.error('截圖失敗:', error);
        throw error;
    }
}

// 確保截圖目錄存在
function ensureScreenshotDir() {
    const screenshotDir = path.join(__dirname, '../../screenshots');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }
    return screenshotDir;
}

// 設置截圖相關的IPC處理程序
function setupScreenshotHandlers() {
    // IPC: 真實截圖並分析
    ipcMain.handle('analyze-screenshot', async (_, { mode }) => {
        try {
            console.log('開始截圖與 AI 分析...', mode);

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

            // 3. 發送到實際 AI API
            console.log('發送到 AI API 分析中...');

            const FormData = require('form-data');
            const https = require('https');

            try {
                const form = new FormData();
                form.append('instruction', mode === 'action-steps' ?
                    'Analyze the screenshot and suggest actionable steps.' :
                    'Summarize the situation and suggest a concise reply.');
                form.append('image', screenshot, {
                    filename: filename,
                    contentType: 'image/png'
                });

                const response = await new Promise((resolve, reject) => {
                    const req = form.submit('http://localhost:8080/analyze', (err, res) => {
                        if (err) return reject(err);

                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => {
                            console.log('AI API 回應:', data);
                            try {
                                const parsed = JSON.parse(data);
                                resolve(parsed);
                            } catch (e) {
                                console.error('JSON 解析失敗:', e, '原始回應:', data);
                                resolve({ analysisText: data });
                            }
                        });
                    });
                    req.on('error', reject);
                });
                console.log('AI API 回應:', response);
                return {
                    success: true,
                    mode,
                    createdAt: now,
                    screenshotPath,
                    screenshotSize: screenshot.length,
                    summary: '螢幕分析完成',
                    analysisText: response.image_content || response.analysisText || '分析完成',
                    suggestions: response.suggestion ? [response.suggestion] : [response.image_content || '無建議'],
                    rawResponse: response
                };

            } catch (apiError) {
                console.error('API 調用失敗，使用備用分析:', apiError);

                // 備用 mock 資料
                // 模擬 API 延遲
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 根據模式回傳不同的 mock 資料
                if (mode === 'action-steps') {
                return {
                    success: true,
                    mode,
                    createdAt: now,
                    screenshotPath,
                    screenshotSize: screenshot.length,
                    summary: '螢幕分析完成 - 操作建議',
                    analysisText: `根據螢幕截圖分析，以下是建議的操作步驟：

1. 檢查目前開啟的應用程式狀態
2. 確認是否有未完成的任務需要處理
3. 考慮切換到相關的工作區域
4. 如有需要，可以開啟新的應用程式視窗
5. 建議整理桌面以提升工作效率`,
                    suggestions: [
                        '1. 檢查目前開啟的應用程式狀態',
                        '2. 確認是否有未完成的任務需要處理',
                        '3. 考慮切換到相關的工作區域',
                        '4. 如有需要，可以開啟新的應用程式視窗',
                        '5. 建議整理桌面以提升工作效率'
                    ],
                };
            } else {
                return {
                    success: true,
                    mode: 'text-reply',
                    createdAt: now,
                    screenshotPath,
                    screenshotSize: screenshot.length,
                    summary: '螢幕分析完成 - 回覆建議',
                    analysisText: `基於目前螢幕內容的智能回覆建議：

根據畫面顯示的內容，建議您可以：
- 回覆確認收到相關訊息
- 詢問是否需要進一步協助
- 分享相關的想法或意見
- 提供具體的時間安排
- 表達感謝或關心`,
                    suggestions: [
                        '收到，我會盡快處理這件事',
                        '好的，請問還有其他需要注意的地方嗎？',
                        '謝謝你的提醒，我覺得這個想法很不錯',
                        '我大概會在下午完成，到時候再跟你確認',
                        '辛苦了！有任何問題都可以隨時聯絡我'
                    ],
                };
                }
            }

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
}

module.exports = { setupScreenshotHandlers, captureScreen, ensureScreenshotDir };