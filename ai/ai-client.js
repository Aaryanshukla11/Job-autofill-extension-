/**
 * AI Client
 * Background message router for AI classification & answer generation.
 */

export async function requestAICompletion({ systemPrompt, userPrompt, maxTokens = 800 }) {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({
        type: 'GROQ_FETCH',
        systemPrompt,
        userPrompt,
        maxTokens
      }, res => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(res || { ok: false, error: 'No response from background worker' });
        }
      });
    });
  } else {
    return { ok: false, error: 'Chrome extension runtime unavailable (e.g. unit test mode)' };
  }
}
