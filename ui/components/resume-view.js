/**
 * Human-Centered "Build Your Profile" Component
 * Clear 2-path onboarding: Upload Resume (PDF/DOCX) or Import JSON.
 */

import { buildProfileFromResumeFile } from '../../resume/profile-builder.js';
import { saveUserMemory, getUserMemory, importUserMemoryJSON } from '../../memory/memory-store.js';

export function renderResumeView(container, { candidateProfile, onProfileUpdated, onNavigateToProfile }) {
  const currentResumeName = candidateProfile.documents?.resumeFileName || '';

  container.innerHTML = `
    <div class="section">
      <div class="section-title">Build Your Profile</div>
      <h2 class="section-heading">Give us your information</h2>
      <p class="section-desc">Provide your information once via resume or JSON import. We'll remember it for future job applications.</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px;">
        <button id="btn-choice-resume" class="btn btn-primary" style="padding: 12px; text-align: center; height: auto;">
          📄 Upload Resume
        </button>
        <button id="btn-choice-json" class="btn btn-secondary" style="padding: 12px; text-align: center; height: auto;">
          📥 Import JSON
        </button>
      </div>
      <input type="file" id="resume-file-input" accept=".pdf,.docx,.doc,.txt" hidden />
      <input type="file" id="json-file-input" accept=".json" hidden />

      <div id="build-status-msg" class="status-msg" style="margin-top: 12px;"></div>
    </div>

    <div id="build-preview-container" style="display: none;"></div>

    ${currentResumeName ? `
      <hr class="divider" />
      <div class="section">
        <div class="section-title">Active Resume</div>
        <div class="panel" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${escapeHtml(currentResumeName)}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Saved in your information</div>
          </div>
          <button id="btn-remove-resume" class="btn-sm-danger" title="Remove active resume">Remove</button>
        </div>
      </div>
    ` : ''}
  `;

  const resumeInput = document.getElementById('resume-file-input');
  const jsonInput = document.getElementById('json-file-input');
  const statusMsg = document.getElementById('build-status-msg');
  const previewContainer = document.getElementById('build-preview-container');

  document.getElementById('btn-choice-resume').addEventListener('click', () => resumeInput.click());
  document.getElementById('btn-choice-json').addEventListener('click', () => {
    jsonInput.value = '';
    jsonInput.click();
  });

  // Handle Resume Upload
  resumeInput.addEventListener('change', async e => {
    if (e.target.files && e.target.files[0]) {
      await processResumeFile(e.target.files[0]);
    }
  });

  // Handle JSON Import
  jsonInput.addEventListener('change', async e => {
    if (e.target.files && e.target.files[0]) {
      await processJsonFile(e.target.files[0]);
    }
  });

  const btnRemove = document.getElementById('btn-remove-resume');
  if (btnRemove) {
    btnRemove.addEventListener('click', async () => {
      const memory = await getUserMemory();
      memory.profile.documents = { resumeFileName: '', rawResumeText: '' };
      await saveUserMemory(memory);
      if (onProfileUpdated) onProfileUpdated(memory.profile);
      renderResumeView(container, { candidateProfile: memory.profile, onProfileUpdated, onNavigateToProfile });
    });
  }

  async function processResumeFile(file) {
    statusMsg.className = 'status-msg info';
    statusMsg.textContent = `Analyzing ${file.name}...`;
    previewContainer.style.display = 'none';

    try {
      const updatedProfile = await buildProfileFromResumeFile(file, candidateProfile);
      statusMsg.className = 'status-msg success';
      statusMsg.textContent = `✓ Successfully analyzed ${file.name}. Review profile details below:`;
      renderProfilePreviewCard(updatedProfile);
    } catch (err) {
      statusMsg.className = 'status-msg error';
      statusMsg.textContent = `Error: ${err.message}`;
    }
  }

  async function processJsonFile(file) {
    statusMsg.className = 'status-msg info';
    statusMsg.textContent = `Reading ${file.name}...`;
    previewContainer.style.display = 'none';

    try {
      const text = await file.text();
      const res = await importUserMemoryJSON(text, 'merge');

      if (res.conflicts && res.conflicts.length > 0) {
        renderConflictResolutionCard(res.conflicts, res.memory.profile);
      } else {
        statusMsg.className = 'status-msg success';
        statusMsg.textContent = `✓ Successfully imported information from ${file.name}.`;
        renderProfilePreviewCard(res.memory.profile);
      }
    } catch (err) {
      statusMsg.className = 'status-msg error';
      statusMsg.textContent = `Import error: ${err.message}`;
    }
  }

  function renderProfilePreviewCard(profile) {
    const p = profile.personal || {};
    const c = profile.contact || {};
    const prof = profile.professional || {};

    previewContainer.style.display = 'block';
    previewContainer.innerHTML = `
      <hr class="divider" />
      <div class="section">
        <div class="section-title">Profile Preview</div>
        <div class="panel" style="border-left: 3px solid var(--primary-accent); margin-top: 8px;">
          <div class="status-row">
            <span class="status-label">Name</span>
            <span class="status-val">${escapeHtml(p.fullName || `${p.firstName} ${p.lastName}`.trim() || 'Not set')}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Email</span>
            <span class="status-val">${escapeHtml(c.email || 'Not set')}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Title</span>
            <span class="status-val">${escapeHtml(prof.currentTitle || 'Not set')}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Company</span>
            <span class="status-val">${escapeHtml(prof.currentCompany || 'Not set')}</span>
          </div>
          <div style="margin-top: 6px; font-size: 11px; color: var(--text-secondary);">
            <strong>Skills:</strong> ${(prof.skills || []).slice(0, 10).join(', ')}
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 14px;">
          <button id="btn-save-built-profile" class="btn btn-primary" style="flex: 2;">
            Save & View Profile &rarr;
          </button>
          <button id="btn-cancel-built-profile" class="btn btn-secondary" style="flex: 1;">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-save-built-profile').addEventListener('click', async () => {
      const memory = await getUserMemory();
      memory.profile = profile;
      await saveUserMemory(memory);
      if (onProfileUpdated) onProfileUpdated(profile);
      if (onNavigateToProfile) onNavigateToProfile();
    });

    document.getElementById('btn-cancel-built-profile').addEventListener('click', () => {
      previewContainer.style.display = 'none';
      statusMsg.className = 'status-msg info';
      statusMsg.textContent = 'Cancelled.';
    });
  }

  function renderConflictResolutionCard(conflicts, importedProfile) {
    previewContainer.style.display = 'block';
    previewContainer.innerHTML = `
      <hr class="divider" />
      <div class="section">
        <div class="section-title">Conflicting Details</div>
        <p class="section-desc">Some imported values differ from your existing profile. Choose which to keep:</p>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
          ${conflicts.map((conf, idx) => `
            <div class="panel" style="font-size: 11px;">
              <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${escapeHtml(conf.label)}</div>
              <div style="display: flex; gap: 8px;">
                <label style="flex: 1;">
                  <input type="radio" name="conflict-${idx}" value="existing" checked />
                  Keep existing: <strong>"${escapeHtml(conf.existingValue)}"</strong>
                </label>
                <label style="flex: 1;">
                  <input type="radio" name="conflict-${idx}" value="imported" />
                  Use imported: <strong>"${escapeHtml(conf.importedValue)}"</strong>
                </label>
              </div>
            </div>
          `).join('')}
        </div>

        <button id="btn-resolve-conflicts" class="btn btn-primary" style="margin-top: 14px;">
          Apply Choices & Save
        </button>
      </div>
    `;

    document.getElementById('btn-resolve-conflicts').addEventListener('click', async () => {
      const memory = await getUserMemory();
      conflicts.forEach((conf, idx) => {
        const choice = previewContainer.querySelector(`input[name="conflict-${idx}"]:checked`).value;
        if (choice === 'imported') {
          const parts = conf.field.split('.');
          memory.profile[parts[0]][parts[1]] = conf.importedValue;
        }
      });

      await saveUserMemory(memory);
      if (onProfileUpdated) onProfileUpdated(memory.profile);
      if (onNavigateToProfile) onNavigateToProfile();
    });
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
