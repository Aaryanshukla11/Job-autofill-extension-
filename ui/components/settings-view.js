/**
 * Minimal & Editorial Settings View Component
 */

import { saveSettings } from '../../storage/storage.js';

export function renderSettingsView(container, { settings, onSettingsUpdated }) {
  container.innerHTML = `
    <div class="section">
      <div class="section-title">Settings</div>
      <h2 class="section-heading">Extension Settings</h2>
      <p class="section-desc">Manage API credentials and safety policies.</p>

      <form id="settings-form">
        <div class="section-title" style="margin-top: 14px;">AI Provider</div>
        <div class="form-row">
          <div class="form-col">
            <label>Provider</label>
            <input type="text" value="Groq Cloud API" disabled />
          </div>
        </div>
        <div class="form-row">
          <div class="form-col">
            <label>Groq API Key</label>
            <input type="password" id="s-groqKey" value="${escapeVal(settings.groqApiKey)}" placeholder="gsk_..." />
          </div>
        </div>
        <div class="form-row">
          <div class="form-col">
            <label>AI Model</label>
            <select id="s-aiModel">
              <option value="llama-3.3-70b-versatile" ${settings.aiModel === 'llama-3.3-70b-versatile' ? 'selected' : ''}>llama-3.3-70b-versatile (Recommended)</option>
              <option value="llama-3.1-8b-instant" ${settings.aiModel === 'llama-3.1-8b-instant' ? 'selected' : ''}>llama-3.1-8b-instant</option>
            </select>
          </div>
        </div>

        <div class="section-title" style="margin-top: 14px;">Autofill Safety</div>
        <div class="form-row">
          <div class="form-col">
            <label>Confidence Threshold: <span id="thresh-val">${Math.round((settings.confidenceThreshold || 0.90) * 100)}%</span></label>
            <input type="range" id="s-confidenceThreshold" min="0.50" max="0.95" step="0.05" value="${settings.confidenceThreshold || 0.90}" style="margin-top: 4px;" />
          </div>
        </div>

        <div class="toggle-row">
          <label for="s-fillSensitiveFields">Fill sensitive fields (Salary, Visa, Gender)</label>
          <input type="checkbox" id="s-fillSensitiveFields" ${settings.fillSensitiveFields ? 'checked' : ''} />
        </div>

        <div class="toggle-row">
          <label for="s-autoGenerateAnswers">Generate free-text answers</label>
          <input type="checkbox" id="s-autoGenerateAnswers" ${settings.autoGenerateAnswers ? 'checked' : ''} />
        </div>

        <div class="toggle-row">
          <label for="s-debugMode">Debug logging</label>
          <input type="checkbox" id="s-debugMode" ${settings.debugMode ? 'checked' : ''} />
        </div>

        <div class="section" style="margin-top: 20px;">
          <button type="submit" class="btn btn-primary" id="btn-save-settings">
            Save Settings
          </button>
          <div id="settings-toast" class="toast"></div>
        </div>
      </form>
    </div>
  `;

  const slider = document.getElementById('s-confidenceThreshold');
  const threshVal = document.getElementById('thresh-val');
  slider.addEventListener('input', () => {
    threshVal.textContent = `${Math.round(parseFloat(slider.value) * 100)}%`;
  });

  const form = document.getElementById('settings-form');
  const toast = document.getElementById('settings-toast');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const updated = {
      ...settings,
      groqApiKey: document.getElementById('s-groqKey').value.trim(),
      aiModel: document.getElementById('s-aiModel').value,
      confidenceThreshold: parseFloat(document.getElementById('s-confidenceThreshold').value),
      fillSensitiveFields: document.getElementById('s-fillSensitiveFields').checked,
      autoGenerateAnswers: document.getElementById('s-autoGenerateAnswers').checked,
      debugMode: document.getElementById('s-debugMode').checked
    };

    await saveSettings(updated);
    toast.className = 'toast success';
    toast.textContent = '✓ Settings Saved';
    setTimeout(() => toast.textContent = '', 2500);

    if (onSettingsUpdated) onSettingsUpdated(updated);
  });
}

function escapeVal(val) {
  return String(val || '').replace(/"/g, '&quot;');
}
