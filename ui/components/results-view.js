/**
 * Minimal & Editorial Results View Component
 */

export function renderResultsView(container, { autofillResults, onHighlightField }) {
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

  const { filledCount, reviewCount, unfilledCount, fields = [], fileInputs = [] } = autofillResults;

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

    ${fileInputs.length > 0 ? `
      <div class="section">
        <div class="section-title">Manual Requirements</div>
        <div class="panel" style="border-left: 3px solid var(--warning);">
          ${fileInputs.map(f => `<div style="font-size: 11px; color: var(--text-primary);">${f.message}</div>`).join('')}
        </div>
      </div>
    ` : ''}

    <hr class="divider" />

    <div class="section">
      <div class="section-title">Field Summary</div>

      <div class="results-field-list">
        ${fields.map(f => {
          const isOk = f.status === 'FILLED';
          const isWarn = f.status === 'REVIEW_NEEDED';
          const symbol = isOk ? '✓' : isWarn ? '•' : '!';
          const symbolClass = isOk ? 'ok' : isWarn ? 'warn' : 'miss';
          return `
            <div class="field-item" data-index="${f.index}">
              <div class="field-info">
                <span class="field-symbol ${symbolClass}">${symbol}</span>
                <span class="field-label" style="font-weight: 500; color: var(--text-primary);">${escapeHtml(f.label)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="field-val" style="font-size: 11px; color: var(--text-secondary);">${f.value ? escapeHtml(f.value) : 'Skipped'}</span>
                <button class="btn-highlight-sm" data-idx="${f.index}">Highlight</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.btn-highlight-sm').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.idx);
      if (onHighlightField) onHighlightField(idx);
    });
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
