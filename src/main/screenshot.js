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
            !source.name.includes('LifeHint') && source.name !== ''
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
                    'Analyze the screenshot and suggest actionable steps. Return exactly three concise answers separated by §§§. Do not include numbering or extra text.' :
                    'Summarize the situation and suggest concise replies. Return exactly three concise answers separated by §§§. Do not include numbering or extra text.');
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
                                // Check if response is JSON
                                if (data.trim().startsWith('{')) {
                                    const parsed = JSON.parse(data);
                                    resolve(parsed);
                                } else {
                                    // Handle structured text response with XML-like tags
                                    const resultMatch = data.match(/<result>([\s\S]*?)<\/result>/);
                                    if (resultMatch) {
                                        const resultText = resultMatch[1].trim();
                                        // Extract the three options separated by §§§
                                        // resultText = resultText.split('<|channel|>final<|message|>').slice(1).trim();
                                        const suggestions = resultText.split('§§§')
                                            .map(s => s.trim())
                                            .filter(s => s && !s.startsWith('Option'))
                                            .slice(0, 3);

                                        resolve({
                                            analysisText: suggestions.join('§§§'),
                                            suggestions: suggestions
                                        });
                                    } else {
                                        // Fallback: try to extract any text that looks like suggestions
                                        const cleanText = data.replace(/<[^>]+>/g, '').trim();
                                        resolve({ analysisText: cleanText });
                                    }
                                }
                            } catch (e) {
                                console.error('Response 解析失敗:', e, '原始回應:', data);
                                resolve({ analysisText: data });
                            }
                        });
                    });
                    req.on('error', reject);
                });
                console.log('AI API 回應:', response);

                // Process suggestions from response
                let suggestions = [];
                let analysisText = '';

                if (response.suggestions && Array.isArray(response.suggestions)) {
                    suggestions = response.suggestions;
                    analysisText = suggestions.join('§§§');
                } else if (response.analysisText) {
                    analysisText = response.analysisText;
                    // Split by §§§ if present
                    if (analysisText.includes('§§§')) {
                        suggestions = analysisText.split('§§§').map(s => s.trim()).filter(s => s);
                    } else {
                        suggestions = [analysisText];
                    }
                } else if (response.image_content) {
                    analysisText = response.image_content;
                    suggestions = [response.image_content];
                } else if (response.suggestion) {
                    suggestions = [response.suggestion];
                    analysisText = response.suggestion;
                } else {
                    suggestions = ['無建議'];
                    analysisText = '分析完成';
                }
                // suggestions = analysisText.split('<result>')[1].split('§§§').map(s => s.trim()).filter(s => s);
                suggestions = analysisText.split('<result>')[1].split('§§§').map(s => s.trim()).filter(s => s);
                return {
                    success: true,
                    mode,
                    createdAt: now,
                    screenshotPath,
                    screenshotSize: screenshot.length,
                    summary: '螢幕分析完成',
                    analysisText,
                    suggestions,
                    rawResponse: response
                };

            } catch (apiError) {
                console.error('API 調用失敗，使用備用分析:', apiError);

                // 備用 mock 資料
                // 模擬 API 延遲
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 根據模式回傳不同的 mock 資料
                if (mode === 'action-steps') {
                const answers = [
                    '檢查目前開啟的應用程式狀態',
                    '確認是否有未完成的任務需要處理',
                    '整理桌面以提升工作效率'
                ];
                return {
                    success: true,
                    mode,
                    createdAt: now,
                    screenshotPath,
                    screenshotSize: screenshot.length,
                    summary: '螢幕分析完成 - 操作建議',
                    analysisText: answers.join('§§§'),
                    suggestions: answers,
                };
            } else {
                const answers = [
                    '收到，我會盡快處理這件事',
                    '好的，請問還有其他需要注意的地方嗎？',
                    '辛苦了！有任何問題都可以隨時聯絡我'
                ];
                return {
                    success: true,
                    mode: 'text-reply',
                    createdAt: now,
                    screenshotPath,
                    screenshotSize: screenshot.length,
                    summary: '螢幕分析完成 - 回覆建議',
                    analysisText: answers.join('§§§'),
                    suggestions: answers,
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