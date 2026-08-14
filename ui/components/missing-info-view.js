/**
 * Human-Centered "Needs Your Input" Guided Missing Info Wizard Component
 * Zero technical jargon. Helps user answer missing questions once and remembers them permanently.
 */

import { saveRememberedAnswer, getUserMemory } from '../../memory/memory-store.js';

export function renderMissingInfoView(container, { missingFields = [], onComplete, onFillElement }) {
  if (!missingFields || missingFields.length === 0) {
    container.innerHTML = `
      <div class="section">
        <div class="section-title">Your Information</div>
        <h2 class="section-heading">✓ All Set</h2>
        <p class="section-desc">We have all the information required for this application form.</p>
        <button id="btn-done-missing" class="btn btn-primary" style="margin-top: 14px;">Done</button>
      </div>
    `;
    const doneBtn = document.getElementById('btn-done-missing');
    if (doneBtn) doneBtn.addEventListener('click', () => onComplete && onComplete());
    return;
  }

  let currentIndex = 0;

  function renderCurrentStep() {
    const total = missingFields.length;
    const currentField = missingFields[currentIndex];
    const labelStr = currentField.label || currentField.name || `Question #${currentIndex + 1}`;
    const suggestedVal = currentField.value || currentField.suggestedValue || '';

    container.innerHTML = `
      <div class="section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div class="section-title" style="margin: 0;">Needs Your Input</div>
          <span class="badge badge-info" style="font-size: 11px;">${currentIndex + 1} of ${total}</span>
        </div>
        
        <h2 class="section-heading" style="font-size: 16px;">${escapeHtml(labelStr)}</h2>
        <p class="section-desc">Tell us once and we'll remember this for future applications.</p>

        <form id="missing-info-form" style="margin-top: 16px;">
          <div class="form-row">
            <div class="form-col">
              <label style="font-size: 12px; font-weight: 500;">${escapeHtml(labelStr)}</label>
              ${currentField.options && currentField.options.length > 0 ? `
                <select id="user-missing-input" style="width: 100%; padding: 8px; font-size: 13px;">
                  <option value="">-- Select option --</option>
                  ${currentField.options.map(opt => `
                    <option value="${escapeVal(opt)}" ${opt.toLowerCase() === suggestedVal.toLowerCase() ? 'selected' : ''}>${escapeHtml(opt)}</option>
                  `).join('')}
                </select>
              ` : `
                <input type="text" id="user-missing-input" value="${escapeVal(suggestedVal)}" placeholder="Type your answer here..." style="width: 100%; padding: 8px; font-size: 13px;" autofocus />
              `}
            </div>
          </div>

          <div style="margin-top: 16px; display: flex; gap: 8px;">
            <button type="submit" class="btn btn-primary" id="btn-save-continue" style="flex: 2;">
              Save & continue &rarr;
            </button>
            <button type="button" class="btn btn-secondary" id="btn-skip-step" style="flex: 1;">
              Skip
            </button>
          </div>

          <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 12px; text-align: center;">
            ✓ We'll remember this answer for future applications.
          </div>
        </form>
      </div>
    `;

    const form = document.getElementById('missing-info-form');
    const inputEl = document.getElementById('user-missing-input');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const userVal = inputEl ? inputEl.value.trim() : '';

      if (userVal) {
        // Save to remembered answers & candidate profile
        await saveRememberedAnswer({
          questionText: labelStr,
          meaning: currentField.fieldPath || labelStr,
          value: userVal,
          scope: 'global'
        });

        // Fill field in active tab DOM
        if (onFillElement && currentField.index !== undefined) {
          onFillElement(currentField.index, userVal);
        }
      }

      currentIndex++;
      if (currentIndex < total) {
        renderCurrentStep();
      } else {
        renderAllDone();
      }
    });

    document.getElementById('btn-skip-step').addEventListener('click', () => {
      currentIndex++;
      if (currentIndex < total) {
        renderCurrentStep();
      } else {
        renderAllDone();
      }
    });
  }

  function renderAllDone() {
    container.innerHTML = `
      <div class="section" style="text-align: center; padding: 24px 12px;">
        <div style="font-size: 28px; margin-bottom: 8px;">✓</div>
        <h2 class="section-heading" style="margin-bottom: 6px;">You're All Set</h2>
        <p class="section-desc">Your information has been saved for future applications.</p>
        <button id="btn-finish-missing" class="btn btn-primary" style="margin-top: 16px;">
          Review Application
        </button>
      </div>
    `;

    document.getElementById('btn-finish-missing').addEventListener('click', () => {
      if (onComplete) onComplete();
    });
  }

  renderCurrentStep();
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeVal(val) {
  return String(val || '').replace(/"/g, '&quot;');
}
