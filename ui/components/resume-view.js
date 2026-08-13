/**
 * Minimal & Editorial Resume View Component
 */

import { buildProfileFromResumeFile } from '../../resume/profile-builder.js';
import { saveCandidateProfile } from '../../storage/storage.js';

export function renderResumeView(container, { candidateProfile, onProfileUpdated }) {
  const currentResumeName = candidateProfile.documents?.resumeFileName || '';
  const rawText = candidateProfile.documents?.rawResumeText || '';
  const cleanedText = sanitizeDisplayRawText(rawText);

  container.innerHTML = `
    <div class="section">
      <div class="section-title">Resume</div>
      <h2 class="section-heading">Your Resume</h2>
      <p class="section-desc">Upload your PDF or DOCX resume to extract profile fields.</p>

      <div class="dropzone" id="resume-dropzone">
        <input type="file" id="resume-file-input" accept=".pdf,.docx,.doc,.txt" hidden />
        <div class="dropzone-text">Click or drop resume file here</div>
        <div class="dropzone-sub">Supports PDF, DOCX, TXT</div>
      </div>
      <div id="resume-status-msg" class="status-msg"></div>
    </div>

    ${currentResumeName ? `
      <hr class="divider" />

      <div class="section">
        <div class="section-title">Active Document</div>
        <div class="panel">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${escapeHtml(currentResumeName)}</div>
              <div style="font-size: 11px; color: var(--text-secondary);">Parsed successfully</div>
            </div>
            <button id="btn-remove-resume" class="btn-sm-danger" title="Remove current resume">Remove resume</button>
          </div>
          <div style="margin-top: 10px; max-height: 120px; overflow-y: auto; background: var(--bg-main); border: 1px solid var(--border-color); padding: 8px; border-radius: 6px; font-size: 11px; color: var(--text-secondary);">
            <pre style="white-space: pre-wrap; word-break: break-word; font-family: var(--font-sans);">${escapeHtml(cleanedText.substring(0, 400))}${cleanedText.length > 400 ? '...' : ''}</pre>
          </div>
        </div>
      </div>
    ` : ''}
  `;

  const dropzone = document.getElementById('resume-dropzone');
  const fileInput = document.getElementById('resume-file-input');
  const statusMsg = document.getElementById('resume-status-msg');

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));

  dropzone.addEventListener('drop', async e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', async e => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  });

  const btnRemove = document.getElementById('btn-remove-resume');
  if (btnRemove) {
    btnRemove.addEventListener('click', async () => {
      const updatedProfile = {
        ...candidateProfile,
        documents: {
          ...candidateProfile.documents,
          resumeFileName: '',
          rawResumeText: ''
        }
      };

      await saveCandidateProfile(updatedProfile);

      if (onProfileUpdated) onProfileUpdated(updatedProfile);
      renderResumeView(container, { candidateProfile: updatedProfile, onProfileUpdated });
    });
  }

  async function processFile(file) {
    statusMsg.className = 'status-msg info';
    statusMsg.textContent = `Parsing ${file.name}...`;

    try {
      const updatedProfile = await buildProfileFromResumeFile(file);
      await saveCandidateProfile(updatedProfile);

      statusMsg.className = 'status-msg success';
      statusMsg.textContent = `✓ Extracted profile from ${file.name}`;

      if (onProfileUpdated) onProfileUpdated(updatedProfile);
      renderResumeView(container, { candidateProfile: updatedProfile, onProfileUpdated });
    } catch (err) {
      statusMsg.className = 'status-msg error';
      statusMsg.textContent = `Error: ${err.message}`;
    }
  }
}

function sanitizeDisplayRawText(text) {
  if (!text || typeof text !== 'string') return 'No text extracted.';
  const clean = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/ +/g, ' ').trim();
  if (clean.length > 10) return clean;
  return 'Resume loaded successfully.';
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
