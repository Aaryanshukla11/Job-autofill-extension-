/**
 * Content Script Entry Point for AI Job Autofill
 * Executed on demand when user clicks "AI AUTOFILL" in Chrome Side Panel.
 */

// Global highlight helper
window.__AI_JOB_AUTOFILL_HIGHLIGHT = function(elementIndex) {
  const selector = 'input:not([type=hidden]), textarea, select, [contenteditable=true]';
  const elements = Array.from(document.querySelectorAll(selector));
  const el = elements[elementIndex];
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const origBorder = el.style.border;
    const origBoxShadow = el.style.boxShadow;
    el.style.border = '2px solid #ef4444';
    el.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.8)';
    setTimeout(() => {
      el.style.border = origBorder;
      el.style.boxShadow = origBoxShadow;
    }, 3500);
    return true;
  }
  return false;
};

// Listener for highlight or trigger commands
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'HIGHLIGHT_ELEMENT') {
    const success = window.__AI_JOB_AUTOFILL_HIGHLIGHT(msg.index);
    sendResponse({ ok: success });
    return false;
  }
});
