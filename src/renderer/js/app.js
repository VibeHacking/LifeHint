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
        
        // 根據內容量動態調整面板高度
        setTimeout(() => {
            const contentHeight = suggestionsEl.scrollHeight + 60; // 加上 header 高度
            if (contentHeight > 180) {
                panel.classList.add('expanded');
            } else {
                panel.classList.remove('expanded');
            }
        }, 10);
    }

    async function captureAndAnalyze() {
        btnCapture.disabled = true;
        btnCapture.textContent = 'Processing ...';
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
            btnCapture.textContent = 'Screenshot & Send';
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

    // Simple Glass Window functionality
    const timeElement = $('#time');
    const simpleWindow = $('.simple-window');

    // 顯示當前時間
    function updateTime() {
        if (timeElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('zh-TW');
            timeElement.textContent = timeString;
        }
    }

    // 每秒更新時間
    if (timeElement) {
        setInterval(updateTime, 1000);
        updateTime(); // 立即顯示時間
    }

    // 拖動功能
    if (simpleWindow) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // 初始化位置到螢幕中央
        function initializePosition() {
            const windowWidth = simpleWindow.offsetWidth;
            const windowHeight = simpleWindow.offsetHeight;
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            // 確保視窗不會超出螢幕邊界
            let centerX = (screenWidth - windowWidth) / 2;
            let centerY = (screenHeight - windowHeight) / 2;

            // 如果視窗比螢幕大，至少保留一部分在螢幕內
            if (windowWidth > screenWidth) {
                centerX = -(windowWidth - screenWidth) / 2;
            }
            if (windowHeight > screenHeight) {
                centerY = -(windowHeight - screenHeight) / 2;
            }

            xOffset = centerX;
            yOffset = centerY;

            setTranslate(centerX, centerY, simpleWindow);
        }

        // 視窗大小改變時重新檢查位置
        function checkBounds() {
            const windowWidth = simpleWindow.offsetWidth;
            const windowHeight = simpleWindow.offsetHeight;
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            const minX = -windowWidth + 50;
            const maxX = screenWidth - 50;
            const minY = -windowHeight + 50;
            const maxY = screenHeight - 50;

            let newX = Math.max(minX, Math.min(maxX, xOffset));
            let newY = Math.max(minY, Math.min(maxY, yOffset));

            if (newX !== xOffset || newY !== yOffset) {
                xOffset = newX;
                yOffset = newY;
                setTranslate(newX, newY, simpleWindow);
            }
        }

        function dragStart(e) {
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === simpleWindow || simpleWindow.contains(e.target)) {
                isDragging = true;
                simpleWindow.classList.add('dragging');
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;

            isDragging = false;
            simpleWindow.classList.remove('dragging');
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();

                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                // 邊界檢查，防止視窗超出螢幕範圍
                const windowWidth = simpleWindow.offsetWidth;
                const windowHeight = simpleWindow.offsetHeight;
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;

                // 限制X軸範圍 (至少保留50px在螢幕內)
                const minX = -windowWidth + 50;
                const maxX = screenWidth - 50;
                currentX = Math.max(minX, Math.min(maxX, currentX));

                // 限制Y軸範圍 (至少保留50px在螢幕內)
                const minY = -windowHeight + 50;
                const maxY = screenHeight - 50;
                currentY = Math.max(minY, Math.min(maxY, currentY));

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, simpleWindow);
            }
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }

        // 事件監聽器
        document.addEventListener("mousedown", dragStart, false);
        document.addEventListener("mouseup", dragEnd, false);
        document.addEventListener("mousemove", drag, false);

        // 觸摸事件支援
        document.addEventListener("touchstart", dragStart, false);
        document.addEventListener("touchend", dragEnd, false);
        document.addEventListener("touchmove", drag, false);

        // 頁面載入後初始化位置
        window.addEventListener('load', initializePosition);

        // 視窗大小改變時檢查邊界
        window.addEventListener('resize', checkBounds);
    }
})();