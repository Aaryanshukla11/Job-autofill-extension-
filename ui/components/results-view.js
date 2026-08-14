/**
 * Minimal & Editorial Results View Component with AI Semantic Suggestions & Human Approval
 */

import { saveLearnedMapping } from '../../storage/learning-memory.js';
import { generateFieldSignature } from '../../autofill/learned-mappings.js';
import { isSensitiveOrForbiddenField, isValidProfilePath } from '../../storage/learning-schema.js';

export function renderResultsView(container, { autofillResults, onHighlightField, onMappingsUpdated, onFillElement }) {
  if (!autofillResults) {
    container.innerHTML = `
      <div class="section">
        <div class="section-title">Results</div>
        <h2 class="section-heading">Autofill Complete</h2>
        <p class="section-desc">No autofill action performed yet. Open a job application page and click <strong>Autofill &rarr;</strong>.</p>
      </div>
    `;
    return;
  }

  const { filledCount, reviewCount, unfilledCount, fields = [], fileInputs = [], aiSuggestions = [] } = autofillResults;
  const validAiSuggestions = aiSuggestions.filter(s => s.confidence >= 0.80 && s.requiresApproval && s.value);

  container.innerHTML = `
    <div class="section">
      <div class="section-title">Results</div>
      <h2 class="section-heading">Autofill Summary</h2>
      
      <div class="results-summary" style="margin-top: 10px;">
        <div class="summary-stat"><strong>${filledCount}</strong> filled</div>
        <div class="summary-stat"><strong>${reviewCount}</strong> review</div>
        <div class="summary-stat"><strong>${unfilledCount}</strong> skipped</div>
      </div>
    </div>

    ${validAiSuggestions.length > 0 ? `
      <div class="section" style="margin-top: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="section-title" style="margin: 0; color: var(--primary-accent);">AI Suggestions — Approval Required</div>
          <div style="display: flex; gap: 4px;">
            <button id="btn-approve-all-ai" class="btn-sm-outline" style="background: var(--primary-accent); color: white;">Approve All (${validAiSuggestions.length})</button>
            <button id="btn-reject-all-ai" class="btn-sm-outline">Reject All</button>
          </div>
        </div>
        <p class="section-desc" style="margin-top: 4px;">Review AI semantic suggestions before inserting into form.</p>

        <div class="ai-suggestions-list" style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
          ${validAiSuggestions.map(s => {
            const targetField = fields.find(f => f.index === s.fieldId) || {};
            const labelStr = targetField.label || `Field #${s.fieldId + 1}`;
            return `
              <div class="panel ai-suggestion-card" data-field-id="${s.fieldId}" style="border-left: 3px solid var(--primary-accent); padding: 10px 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div style="flex: 1; padding-right: 8px;">
                    <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${escapeHtml(labelStr)}</div>
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                      Suggested: <code style="background: var(--bg-main); padding: 2px 4px; border-radius: 4px;">${escapeHtml(s.sourcePath)}</code> &rarr; <strong>"${escapeHtml(s.value)}"</strong>
                    </div>
                    ${s.reason ? `
                      <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 2px;"><em>"${escapeHtml(s.reason)}"</em></div>
                    ` : ''}
                  </div>
                  <span class="badge badge-info" style="font-size: 10px;">${Math.round(s.confidence * 100)}% Match</span>
                </div>

                <div style="display: flex; gap: 6px; margin-top: 8px;">
                  <button class="btn-sm-outline btn-approve-ai" data-field-id="${s.fieldId}" data-source-path="${escapeHtml(s.sourcePath)}" data-value="${escapeHtml(s.value)}" data-label="${escapeHtml(labelStr)}" style="background: var(--primary-accent); color: white;">
                    Approve & Fill &rarr;
                  </button>
                  <button class="btn-sm-outline btn-reject-ai" data-field-id="${s.fieldId}" data-label="${escapeHtml(labelStr)}">
                    Reject
                  </button>
                </div>

                <div id="remember-prompt-${s.fieldId}" class="panel" style="display: none; margin-top: 8px; background: var(--bg-main); padding: 8px;">
                  <div style="font-size: 11px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                    Field filled! Remember this mapping for future forms?
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn-sm-outline btn-remember-ai-yes" data-field-id="${s.fieldId}" data-source-path="${escapeHtml(s.sourcePath)}" data-label="${escapeHtml(labelStr)}" style="background: var(--primary-accent); color: white;">
                      Yes, Remember
                    </button>
                    <button class="btn-sm-outline btn-remember-ai-no" data-field-id="${s.fieldId}">
                      Only this time
                    </button>
                  </div>
                </div>

                <div id="correction-panel-${s.fieldId}" class="panel" style="display: none; margin-top: 8px; background: var(--bg-main); padding: 8px;">
                  <div style="font-size: 11px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                    Correct mapping for "${escapeHtml(labelStr)}":
                  </div>
                  <input type="text" id="correction-path-${s.fieldId}" value="customFields.${escapeHtml(labelStr)}" style="width: 100%; font-size: 11px; padding: 4px; margin-bottom: 6px;" />
                  <button class="btn-sm-outline btn-save-correction" data-field-id="${s.fieldId}" data-label="${escapeHtml(labelStr)}" style="background: var(--primary-accent); color: white;">
                    Save Correction
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <hr class="divider" />
    ` : ''}

    ${fileInputs.length > 0 ? `
      <div class="section">
        <div class="section-title">Manual Requirements</div>
        <div class="panel" style="border-left: 3px solid var(--warning);">
          ${fileInputs.map(f => `<div style="font-size: 11px; color: var(--text-primary);">${f.message}</div>`).join('')}
        </div>
      </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Field Summary</div>

      <div class="results-field-list">
        ${fields.map(f => {
          const isOk = f.status === 'FILLED';
          const isWarn = f.status === 'REVIEW_NEEDED';
          const isSkipped = !isOk && !isWarn;
          const symbol = isOk ? '✓' : isWarn ? '•' : '!';
          const symbolClass = isOk ? 'ok' : isWarn ? 'warn' : 'miss';
          return `
            <div class="field-item-card" data-index="${f.index}" style="margin-bottom: 6px;">
              <div class="field-item">
                <div class="field-info">
                  <span class="field-symbol ${symbolClass}">${symbol}</span>
                  <span class="field-label" style="font-weight: 500; color: var(--text-primary);">${escapeHtml(f.label)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="field-val" style="font-size: 11px; color: var(--text-secondary);">${f.value ? escapeHtml(f.value) : 'Skipped'}</span>
                  ${isSkipped ? `
                    <button class="btn-sm-outline btn-remember-field" data-idx="${f.index}" data-label="${escapeHtml(f.label)}">Remember</button>
                  ` : ''}
                  <button class="btn-highlight-sm" data-idx="${f.index}">Highlight</button>
                </div>
              </div>
              <div id="remember-modal-${f.index}" class="remember-panel" style="display: none; margin-top: 8px; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                  Remember "${escapeHtml(f.label)}"
                </div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">
                  Scope:
                  <label style="margin-right: 8px;"><input type="radio" name="scope-${f.index}" value="global" checked /> Global</label>
                  <label><input type="radio" name="scope-${f.index}" value="site" /> This website only</label>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">
                  Profile field path:
                  <input type="text" id="path-input-${f.index}" value="${suggestProfilePath(f.label)}" placeholder="e.g. professional.registrationNumber" style="width: 100%; font-size: 11px; padding: 4px 6px; margin-top: 2px;" />
                </div>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                  <button class="btn-sm-outline btn-save-learned" data-idx="${f.index}" data-label="${escapeHtml(f.label)}" style="background: var(--primary-accent); color: white;">Save Mapping</button>
                  <button class="btn-sm-outline btn-cancel-learned" data-idx="${f.index}">Cancel</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Bind Highlights
  container.querySelectorAll('.btn-highlight-sm').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.idx);
      if (onHighlightField) onHighlightField(idx);
    });
  });

  // Bind AI Approval Single Click
  container.querySelectorAll('.btn-approve-ai').forEach(btn => {
    btn.addEventListener('click', async e => {
      const fieldId = parseInt(e.currentTarget.dataset.fieldId);
      const sourcePath = e.currentTarget.dataset.sourcePath;
      const value = e.currentTarget.dataset.value;
      const labelStr = e.currentTarget.dataset.label;

      if (onFillElement) onFillElement(fieldId, value);

      // Show "Remember this mapping?" prompt
      const promptDiv = document.getElementById(`remember-prompt-${fieldId}`);
      if (promptDiv) promptDiv.style.display = 'block';
    });
  });

  // Bind AI Remember Yes / No
  container.querySelectorAll('.btn-remember-ai-yes').forEach(btn => {
    btn.addEventListener('click', async e => {
      const labelStr = e.currentTarget.dataset.label;
      const sourcePath = e.currentTarget.dataset.sourcePath;
      const sigInfo = generateFieldSignature({ label: labelStr });

      await saveLearnedMapping({
        scope: 'global',
        fieldSignature: sigInfo.fieldSignature,
        labelTokens: sigInfo.labelTokens,
        profilePath: sourcePath,
        source: 'user_confirmed_ai',
        confidence: 1.0
      });

      alert(`✓ Remembered mapping for "${labelStr}"!`);
      const card = e.currentTarget.closest('.ai-suggestion-card');
      if (card) card.remove();
      if (onMappingsUpdated) onMappingsUpdated();
    });
  });

  container.querySelectorAll('.btn-remember-ai-no').forEach(btn => {
    btn.addEventListener('click', e => {
      const card = e.currentTarget.closest('.ai-suggestion-card');
      if (card) card.remove();
    });
  });

  // Bind AI Reject & User Correction
  container.querySelectorAll('.btn-reject-ai').forEach(btn => {
    btn.addEventListener('click', e => {
      const fieldId = e.currentTarget.dataset.fieldId;
      const correctionPanel = document.getElementById(`correction-panel-${fieldId}`);
      if (correctionPanel) {
        correctionPanel.style.display = correctionPanel.style.display === 'none' ? 'block' : 'none';
      }
    });
  });

  // Save User Correction
  container.querySelectorAll('.btn-save-correction').forEach(btn => {
    btn.addEventListener('click', async e => {
      const fieldId = e.currentTarget.dataset.fieldId;
      const labelStr = e.currentTarget.dataset.label;
      const input = document.getElementById(`correction-path-${fieldId}`);
      const correctedPath = input ? input.value.trim() : '';

      if (!isValidProfilePath(correctedPath)) {
        alert('Please enter a valid candidate profile path.');
        return;
      }

      const sigInfo = generateFieldSignature({ label: labelStr });
      await saveLearnedMapping({
        scope: 'global',
        fieldSignature: sigInfo.fieldSignature,
        labelTokens: sigInfo.labelTokens,
        profilePath: correctedPath,
        source: 'user_corrected',
        confidence: 1.0
      });

      alert(`✓ User correction saved for "${labelStr}" -> ${correctedPath}`);
      const card = e.currentTarget.closest('.ai-suggestion-card');
      if (card) card.remove();
      if (onMappingsUpdated) onMappingsUpdated();
    });
  });

  // Batch Actions
  const approveAllBtn = document.getElementById('btn-approve-all-ai');
  if (approveAllBtn) {
    approveAllBtn.addEventListener('click', () => {
      container.querySelectorAll('.btn-approve-ai').forEach(btn => btn.click());
    });
  }

  const rejectAllBtn = document.getElementById('btn-reject-all-ai');
  if (rejectAllBtn) {
    rejectAllBtn.addEventListener('click', () => {
      container.querySelectorAll('.ai-suggestion-card').forEach(card => card.remove());
    });
  }

  // Bind Remember Toggle for manual skipped fields
  container.querySelectorAll('.btn-remember-field').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = e.target.dataset.idx;
      const modal = document.getElementById(`remember-modal-${idx}`);
      if (modal) {
        modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
      }
    });
  });

  // Bind Cancel Remember
  container.querySelectorAll('.btn-cancel-learned').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = e.target.dataset.idx;
      const modal = document.getElementById(`remember-modal-${idx}`);
      if (modal) modal.style.display = 'none';
    });
  });

  // Bind Save Learned Mapping for manual skipped fields
  container.querySelectorAll('.btn-save-learned').forEach(btn => {
    btn.addEventListener('click', async e => {
      const idx = e.target.dataset.idx;
      const labelText = e.target.dataset.label;
      const pathInput = document.getElementById(`path-input-${idx}`);
      const profilePath = pathInput ? pathInput.value.trim() : '';

      const scopeRadio = container.querySelector(`input[name="scope-${idx}"]:checked`);
      const scope = scopeRadio ? scopeRadio.value : 'global';

      if (isSensitiveOrForbiddenField(labelText)) {
        alert('Security Alert: Sensitive fields (passwords, credit cards, banking) cannot be saved as learned mappings.');
        return;
      }

      if (!isValidProfilePath(profilePath)) {
        alert('Please enter a valid candidate profile path (e.g. professional.registrationNumber or customFields.YourField).');
        return;
      }

      const sigInfo = generateFieldSignature({ label: labelText });

      await saveLearnedMapping({
        scope,
        fieldSignature: sigInfo.fieldSignature,
        labelTokens: sigInfo.labelTokens,
        profilePath,
        source: 'user_confirmed',
        confidence: 1.0
      });

      const modal = document.getElementById(`remember-modal-${idx}`);
      if (modal) modal.style.display = 'none';

      alert(`✓ Learned field mapping saved for "${labelText}"!`);
      if (onMappingsUpdated) onMappingsUpdated();
    });
  });
}

function suggestProfilePath(labelStr = '') {
  const clean = String(labelStr).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/registration|license|id/i.test(labelStr)) return `professional.registrationNumber`;
  if (/notice/i.test(labelStr)) return `preferences.noticePeriod`;
  if (/salary/i.test(labelStr)) return `professional.expectedSalary`;
  if (/company/i.test(labelStr)) return `professional.currentCompany`;
  if (/title/i.test(labelStr)) return `professional.currentTitle`;
  return `customFields.${labelStr.trim()}`;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
