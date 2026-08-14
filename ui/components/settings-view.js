/**
 * Natural & Human-Centered Settings View Component
 * Includes Custom AI Model configuration and portable data management.
 */

import { saveSettings } from '../../storage/storage.js';
import { exportUserMemoryJSON, importUserMemoryJSON, saveUserMemory } from '../../memory/memory-store.js';
import { createEmptyUserMemory } from '../../memory/memory-schema.js';

export function renderSettingsView(container, { settings, onSettingsUpdated }) {
  const currentModel = settings.aiModel || 'models/gemini-2.5-flash-lite';
  const standardModels = [
    'models/gemini-2.5-flash-lite',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro'
  ];
  const isCustomModel = !standardModels.includes(currentModel);

  container.innerHTML = `
    <div class="section">
      <div class="section-title">Settings</div>
      <h2 class="section-heading">Extension Settings</h2>
      <p class="section-desc">Manage API credentials, AI models, safety policies, and saved information data.</p>

      <form id="settings-form">
        <div class="section-title" style="margin-top: 14px;">AI Provider & Model</div>
        <div class="form-row">
          <div class="form-col">
            <label>Provider</label>
            <input type="text" value="Google Gemini" disabled />
          </div>
        </div>
        <div class="form-row">
          <div class="form-col">
            <label>Google AI API Key</label>
            <input type="password" id="s-geminiKey" value="${escapeVal(settings.geminiApiKey)}" placeholder="AIza..." />
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label>AI Model</label>
            <select id="s-aiModel">
              <option value="models/gemini-2.5-flash-lite" ${currentModel === 'models/gemini-2.5-flash-lite' ? 'selected' : ''}>gemini-2.5-flash-lite (Default)</option>
              <option value="models/gemini-2.0-flash" ${currentModel === 'models/gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash (Fallback)</option>
              <option value="models/gemini-2.0-flash-lite" ${currentModel === 'models/gemini-2.0-flash-lite' ? 'selected' : ''}>gemini-2.0-flash-lite</option>
              <option value="models/gemini-1.5-flash" ${currentModel === 'models/gemini-1.5-flash' ? 'selected' : ''}>gemini-1.5-flash</option>
              <option value="models/gemini-1.5-pro" ${currentModel === 'models/gemini-1.5-pro' ? 'selected' : ''}>gemini-1.5-pro</option>
              <option value="custom" ${isCustomModel ? 'selected' : ''}>+ Add Custom Model String...</option>
            </select>
          </div>
        </div>

        <div id="custom-model-container" class="form-row" style="display: ${isCustomModel ? 'flex' : 'none'}; margin-top: 6px;">
          <div class="form-col">
            <label style="font-size: 11px; font-weight: 500;">Custom Model ID / String</label>
            <input type="text" id="s-customAiModel" value="${isCustomModel ? escapeVal(currentModel) : ''}" placeholder="e.g. qwen-2.5-coder-32b" />
          </div>
        </div>

        <div class="section-title" style="margin-top: 14px;">Autofill Safety</div>
        <div class="toggle-row">
          <label for="s-fillSensitiveFields">Fill sensitive fields (Salary, Visa, Gender)</label>
          <input type="checkbox" id="s-fillSensitiveFields" ${settings.fillSensitiveFields ? 'checked' : ''} />
        </div>

        <div class="toggle-row">
          <label for="s-autoGenerateAnswers">Generate free-text answers</label>
          <input type="checkbox" id="s-autoGenerateAnswers" ${settings.autoGenerateAnswers ? 'checked' : ''} />
        </div>

        <div class="section" style="margin-top: 16px;">
          <button type="submit" class="btn btn-primary" id="btn-save-settings">
            Save Settings
          </button>
          <div id="settings-toast" class="toast"></div>
          <div id="connection-indicator" class="conn-indicator conn-indicator--idle">
            <span class="conn-indicator__dot"></span>
            <span class="conn-indicator__text">Not tested yet — save settings to verify connection</span>
          </div>
        </div>
      </form>

      <hr class="divider" style="margin-top: 20px;" />

      <div class="section">
        <div class="section-title">Your Data</div>
        <h3 style="font-size: 14px; margin-bottom: 6px; font-family: var(--font-serif); font-weight: 600;">Data Management</h3>
        <p class="section-desc">Export or import your saved information as a backup.</p>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
          <button id="btn-export-data" class="btn btn-secondary">
            📥 Export my information
          </button>
          <button id="btn-import-data" class="btn btn-secondary">
            📤 Import information
          </button>
          <button id="btn-clear-data" class="btn-sm-danger" style="margin-top: 8px;">
            Clear all saved information
          </button>
          <input type="file" id="settings-import-file" accept=".json" hidden />
        </div>
      </div>
    </div>
  `;

  // Toggle Custom Model Input
  const modelSelect = document.getElementById('s-aiModel');
  const customModelContainer = document.getElementById('custom-model-container');
  const customModelInput = document.getElementById('s-customAiModel');

  modelSelect.addEventListener('change', () => {
    if (modelSelect.value === 'custom') {
      customModelContainer.style.display = 'flex';
      customModelInput.focus();
    } else {
      customModelContainer.style.display = 'none';
    }
  });

  // Export Data
  document.getElementById('btn-export-data').addEventListener('click', async () => {
    const jsonStr = await exportUserMemoryJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-saved-information.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import Data
  const fileInput = document.getElementById('settings-import-file');
  document.getElementById('btn-import-data').addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importUserMemoryJSON(text, 'merge');
      alert('✓ Successfully imported your saved information.');
    } catch (err) {
      alert('Import error: ' + err.message);
    }
  });

  // Clear Data
  document.getElementById('btn-clear-data').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all saved information?')) {
      await saveUserMemory(createEmptyUserMemory());
      alert('✓ Saved information cleared.');
    }
  });

  // Save Settings
  const form = document.getElementById('settings-form');
  const toast = document.getElementById('settings-toast');
  const indicator = document.getElementById('connection-indicator');

  function setIndicator(state, text) {
    indicator.className = `conn-indicator conn-indicator--${state}`;
    indicator.querySelector('.conn-indicator__text').textContent = text;
  }

  async function testConnection(apiKey, model) {
    setIndicator('testing', 'Testing connection…');
    const t0 = Date.now();
    return new Promise(resolve => {
      chrome.runtime.sendMessage({
        type: 'GROQ_FETCH',
        apiKey,
        model,
        systemPrompt: 'You are a test assistant. Reply with valid JSON only.',
        userPrompt: 'Reply with exactly: {"ok":true}',
        maxTokens: 16
      }, res => {
        const ms = Date.now() - t0;
        if (chrome.runtime.lastError) {
          setIndicator('error', `Extension error: ${chrome.runtime.lastError.message}`);
        } else if (res && res.ok) {
          const usedModel = res.modelUsed || model;
          setIndicator('success', `Connected · ${usedModel} · ${ms}ms`);
        } else {
          const errMsg = (res && res.error) ? res.error : 'Unknown error';
          setIndicator('error', `Failed: ${errMsg}`);
        }
        resolve();
      });
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    let chosenModel = modelSelect.value;
    if (chosenModel === 'custom') {
      chosenModel = customModelInput.value.trim() || 'models/gemini-2.5-flash-lite';
    }

    const apiKey = document.getElementById('s-geminiKey').value.trim();
    const updated = {
      ...settings,
      geminiApiKey: apiKey,
      aiModel: chosenModel,
      fillSensitiveFields: document.getElementById('s-fillSensitiveFields').checked,
      autoGenerateAnswers: document.getElementById('s-autoGenerateAnswers').checked
    };

    await saveSettings(updated);
    toast.className = 'toast success';
    toast.textContent = `✓ Settings Saved`;
    setTimeout(() => toast.textContent = '', 2500);

    if (onSettingsUpdated) onSettingsUpdated(updated);

    if (!apiKey) {
      setIndicator('error', 'No API key provided — enter your Groq API key above');
      return;
    }
    await testConnection(apiKey, chosenModel);
  });
}

function escapeVal(val) {
  return String(val || '').replace(/"/g, '&quot;');
}
