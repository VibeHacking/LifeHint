(() => {
    const hotkeys = {
        togglePanel: { ctrl: true, shift: false, key: 'j' },
        captureAndSend: { ctrl: true, shift: true, key: 's' },
    };

    const $ = (sel) => document.querySelector(sel);
    const panel = $('#ai-panel');
    const btnToggle = $('#btn-toggle');
    const btnCapture = $('#btn-capture');
    const btnClose = $('#btn-close');
    const modeSelect = $('#mode-select');
    const suggestionsEl = $('#suggestions');

    function isHotkey(event, spec) {
        return (
            event.ctrlKey === !!spec.ctrl &&
            event.shiftKey === !!spec.shift &&
            event.key.toLowerCase() === spec.key
        );
    }

    function togglePanel() {
        const closed = panel.classList.toggle('closed');
        btnToggle.textContent = closed ? '打開' : '收起';
    }

    function renderMock(data) {
        const items = data.suggestions || [];
        const html = items
            .map((s) => {
                return `
                <div class="suggestion">
                    <div class="meta">${data.summary} · ${new Date(data.createdAt).toLocaleTimeString()}</div>
                    <div class="text">${s}</div>
                </div>`;
            })
            .join('');
        suggestionsEl.innerHTML = html || '<div class="suggestion"><div class="text">尚無建議</div></div>';
    }

    async function captureAndAnalyze() {
        btnCapture.disabled = true;
        btnCapture.textContent = '分析中…';
        try {
            const mode = modeSelect.value;
            const result = await window.api.captureAndAnalyze(mode);
            if (result && result.success) {
                renderMock(result);
            }
        } catch (err) {
            console.error(err);
        } finally {
            btnCapture.disabled = false;
            btnCapture.textContent = '截圖並傳送';
        }
    }

    // Wire events
    btnToggle.addEventListener('click', togglePanel);
    btnCapture.addEventListener('click', captureAndAnalyze);
    btnClose.addEventListener('click', () => window.api.closeWindow());

    document.addEventListener('keydown', (e) => {
        if (isHotkey(e, hotkeys.togglePanel)) {
            e.preventDefault();
            togglePanel();
        } else if (isHotkey(e, hotkeys.captureAndSend)) {
            e.preventDefault();
            captureAndAnalyze();
        }
    });

    // Initial mock content
    renderMock({
        success: true,
        mode: 'text-reply',
        createdAt: new Date().toISOString(),
        summary: '初始化建議',
        suggestions: [
            '這裡會顯示 AI 解析後的建議回覆或操作步驟。',
            '使用右上角下拉選單切換模式，按 Ctrl+Shift+S 觸發分析。',
        ],
    });
})();


