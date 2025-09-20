(() => {
  const hotkeys = {
    togglePanel: { ctrl: true, shift: false, key: "j" },
    captureAndSend: { ctrl: true, shift: true, key: "s" },
  };

  const $ = (sel) => document.querySelector(sel);
  const panel = $("#ai-panel");
  const btnToggle = $("#btn-toggle");
  const btnCapture = $("#btn-capture");
  const btnClose = $("#btn-close");
  const modeSelect = $("#mode-select");
  const suggestionsEl = $("#suggestions");
  const DELIMITER = '§§§';

  function isHotkey(event, spec) {
    return (
      event.ctrlKey === !!spec.ctrl &&
      event.shiftKey === !!spec.shift &&
      event.key.toLowerCase() === spec.key
    );
  }

  function togglePanel() {
    if (panel.classList.contains("closed")) {
      panel.classList.remove("closed");
      panel.classList.add("expanded");
      btnToggle.textContent = "Minimize";
      window.api.resizeWindow(800, 400);
    } else {
      panel.classList.remove("expanded");
      panel.classList.add("closed");
      btnToggle.textContent = "Expand";
      setTimeout(() => {
        window.api.resizeWindow(800, 64);
      }, 300);
    }
  }

  btnToggle.addEventListener("click", togglePanel);

  function renderMock(data) {
    const items = (data.analysisText && data.analysisText.includes(DELIMITER))
      ? data.analysisText.split(DELIMITER).map((s) => s.trim()).filter(Boolean)
      : (data.suggestions || []);
    const html = items
      .map((s) => {
        return `
                <div class="suggestion">
                    <div class="meta">${data.summary} · ${new Date(data.createdAt).toLocaleTimeString()}</div>
                    <div class="text">${s}</div>
                </div>`;
      })
      .join("");
    suggestionsEl.innerHTML =
      html || '<div class="suggestion"><div class="text">尚無建議</div></div>';

    // 根據內容量動態調整面板高度
    setTimeout(() => {
      const contentHeight = suggestionsEl.scrollHeight + 60; // 加上 header 高度
      if (contentHeight > 180) {
        panel.classList.add("expanded");
      } else {
        panel.classList.remove("expanded");
      }
    }, 10);
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  // Click-to-copy on suggestion blocks
  suggestionsEl.addEventListener('click', (e) => {
    const suggestionEl = e.target.closest('.suggestion');
    if (!suggestionEl) return;
    const textEl = suggestionEl.querySelector('.text');
    if (!textEl) return;
    const text = textEl.textContent;
    
    // Add copied visual feedback
    suggestionEl.classList.add('copied');
    setTimeout(() => {
      suggestionEl.classList.remove('copied');
    }, 600);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  });

  async function captureAndAnalyze() {
    btnCapture.disabled = true;
    btnCapture.textContent = "Processing ...";
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
      btnCapture.textContent = "Screenshot & Send";
    }
  }

  // Wire events
  btnToggle.addEventListener("click", togglePanel);
  btnCapture.addEventListener("click", captureAndAnalyze);
  btnClose.addEventListener("click", () => window.api.closeWindow());

  document.addEventListener("keydown", (e) => {
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
    mode: "text-reply",
    createdAt: new Date().toISOString(),
    summary: "初始化建議",
    suggestions: [
      "這裡會顯示 AI 解析後的建議回覆或操作步驟。",
      "使用右上角下拉選單切換模式，按 Ctrl+Shift+S 觸發分析。",
    ],
  });

})();
