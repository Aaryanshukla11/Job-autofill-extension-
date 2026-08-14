/**
 * Minimal & Editorial Learned Mappings View Component
 */

import { getLearnedStore, deleteLearnedMapping, clearAllLearnedMappings, updateLearnedMapping } from '../../storage/learning-memory.js';

export async function renderLearningView(container, { onMappingsUpdated }) {
  const store = await getLearnedStore();
  const mappings = store.mappings || [];

  container.innerHTML = `
    <div class="section">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <div class="section-title">Learned Fields</div>
          <h2 class="section-heading">Field Memory</h2>
        </div>
        ${mappings.length > 0 ? `
          <button id="btn-clear-all-mappings" class="btn-sm-danger" title="Clear all learned mappings">Clear All</button>
        ` : ''}
      </div>
      <p class="section-desc">Fields you taught the extension to recognize from previous application forms.</p>

      <div class="panel" style="margin-top: 14px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; font-size: 13px; color: var(--text-primary);">Learned Mappings</span>
          <span class="badge badge-info" style="font-size: 11px;">${mappings.length} Active</span>
        </div>
      </div>

      ${mappings.length === 0 ? `
        <div class="panel" style="margin-top: 14px; text-align: center; color: var(--text-secondary); padding: 24px 12px; font-size: 13px;">
          No learned field mappings yet. When filling out application forms, click <strong>"Remember this field"</strong> on any skipped field to teach the extension.
        </div>
      ` : `
        <div id="learned-mappings-list" style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px;">
          ${mappings.map(m => renderMappingCard(m)).join('')}
        </div>
      `}
    </div>
  `;

  // Bind Clear All
  const clearBtn = document.getElementById('btn-clear-all-mappings');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete all learned field mappings?')) {
        await clearAllLearnedMappings();
        if (onMappingsUpdated) onMappingsUpdated();
        renderLearningView(container, { onMappingsUpdated });
      }
    });
  }

  // Bind Delete & Edit buttons
  container.querySelectorAll('.btn-del-mapping').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (id) {
        await deleteLearnedMapping(id);
        if (onMappingsUpdated) onMappingsUpdated();
        renderLearningView(container, { onMappingsUpdated });
      }
    });
  });

  container.querySelectorAll('.btn-toggle-scope').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      const currentScope = e.currentTarget.dataset.scope;
      const newScope = currentScope === 'global' ? 'site' : 'global';
      if (id) {
        await updateLearnedMapping(id, { scope: newScope });
        if (onMappingsUpdated) onMappingsUpdated();
        renderLearningView(container, { onMappingsUpdated });
      }
    });
  });
}

function renderMappingCard(m) {
  const scopeBadge = m.scope === 'site' ? `Site (${escapeHtml(m.domain || 'Domain')})` : 'Global';
  const usageStr = `Used ${m.usageCount || 0} times`;
  const signatureDisplay = m.fieldSignature.replace(/_/g, ' ');

  return `
    <div class="panel" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; margin-bottom: 4px;">
      <div style="flex: 1; padding-right: 8px;">
        <div style="font-weight: 600; font-size: 13px; color: var(--text-primary); text-transform: capitalize;">
          ${escapeHtml(signatureDisplay)}
        </div>
        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
          Maps to: <code style="background: var(--bg-main); padding: 2px 4px; border-radius: 4px;">${escapeHtml(m.profilePath)}</code>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px; font-size: 10px; color: var(--text-tertiary);">
          <span class="badge ${m.scope === 'site' ? 'badge-warning' : 'badge-info'}" style="font-size: 9px; cursor: pointer;" title="Click to toggle scope">
            ${scopeBadge}
          </span>
          <span>• ${usageStr}</span>
        </div>
      </div>
      <div style="display: flex; gap: 4px;">
        <button class="btn-sm-outline btn-toggle-scope" data-id="${m.id}" data-scope="${m.scope}" title="Toggle between Global and Site scope">
          ${m.scope === 'global' ? 'Make Site' : 'Make Global'}
        </button>
        <button class="btn-sm-danger btn-del-mapping" data-id="${m.id}" title="Delete mapping">✕</button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
