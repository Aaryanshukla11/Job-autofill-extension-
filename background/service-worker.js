/**
 * Background Service Worker for AI Job Autofill V1
 * Handles side panel opening, isolated AI requests, content script injection, and message routing.
 */

import { callGeminiApi } from '../ai/gemini-provider.js';
import { getSettings } from '../storage/storage.js';

// Open side panel when extension action icon is clicked
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
  console.log('[AI Job Autofill] Extension installed - Background service worker active.');
});

chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open && tab.id) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  }
});

// Message listener for popup/sidepanel/content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PING') {
    sendResponse({ ok: true });
    return false;
  }

  if (msg.type === 'GET_ACTIVE_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        sendResponse({ ok: true, tab: tabs[0] });
      } else {
        sendResponse({ ok: false, error: 'No active tab found' });
      }
    });
    return true; // Async response
  }

  if (msg.type === 'GROQ_FETCH') {
    (async () => {
      const settings = await getSettings();
      const apiKey = msg.apiKey || settings.geminiApiKey;
      const model  = msg.model  || settings.aiModel || 'models/gemini-3.7-flash';

      const result = await callGeminiApi({
        apiKey,
        systemPrompt: msg.systemPrompt,
        userPrompt:   msg.userPrompt,
        model,
        maxTokens: msg.maxTokens || 1000
      });
      sendResponse(result);
    })();
    return true; // Async response
  }


  if (msg.type === 'HIGHLIGHT_FIELD') {
    // Forward highlight request to active tab content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'HIGHLIGHT_ELEMENT', index: msg.index }, (res) => {
          sendResponse(res || { ok: false });
        });
      } else {
        sendResponse({ ok: false, error: 'No tab' });
      }
    });
    return true;
  }
});
