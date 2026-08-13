/**
 * Minimal & Editorial Resume View Component
 * Workflow: Upload -> Analyze Resume -> Preview Extracted Fields -> Save to Profile
 */

import { buildProfileFromResumeFile } from '../../resume/profile-builder.js';
import { saveCandidateProfile } from '../../storage/storage.js';

export function renderResumeView(container, { candidateProfile, onProfileUpdated, onNavigateToProfile }) {
  const currentResumeName = candidateProfile.documents?.resumeFileName || '';
  const rawText = candidateProfile.documents?.rawResumeText || '';
  const cleanedText = sanitizeDisplayRawText(rawText);

  let pendingParsedProfile = null;

  container.innerHTML = `
    <div class="section">
      <div class="section-title">Resume</div>
      <h2 class="section-heading">Analyze Resume</h2>
      <p class="section-desc">Upload your PDF or DOCX resume. The extension will analyze it and extract your profile details for review.</p>

      <div class="dropzone" id="resume-dropzone">
        <input type="file" id="resume-file-input" accept=".pdf,.docx,.doc,.txt" hidden />
        <div class="dropzone-text">Click or drop resume file here to analyze</div>
        <div class="dropzone-sub">Supports PDF, DOCX, TXT</div>
      </div>
      <div id="resume-status-msg" class="status-msg"></div>
    </div>

    <div id="analysis-preview-container" style="display: none;"></div>

    ${currentResumeName ? `
      <hr class="divider" />

      <div class="section">
        <div class="section-title">Active Document</div>
        <div class="panel">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${escapeHtml(currentResumeName)}</div>
              <div style="font-size: 11px; color: var(--text-secondary);">Saved in Candidate Profile</div>
            </div>
            <button id="btn-remove-resume" class="btn-sm-danger" title="Remove current resume">Remove resume</button>
          </div>
          <div style="margin-top: 10px; max-height: 100px; overflow-y: auto; background: var(--bg-main); border: 1px solid var(--border-color); padding: 8px; border-radius: 6px; font-size: 11px; color: var(--text-secondary);">
            <pre style="white-space: pre-wrap; word-break: break-word; font-family: var(--font-sans);">${escapeHtml(cleanedText.substring(0, 300))}${cleanedText.length > 300 ? '...' : ''}</pre>
          </div>
        </div>
      </div>
    ` : ''}
  `;

  const dropzone = document.getElementById('resume-dropzone');
  const fileInput = document.getElementById('resume-file-input');
  const statusMsg = document.getElementById('resume-status-msg');
  const previewContainer = document.getElementById('analysis-preview-container');

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
      renderResumeView(container, { candidateProfile: updatedProfile, onProfileUpdated, onNavigateToProfile });
    });
  }

  async function processFile(file) {
    statusMsg.className = 'status-msg info';
    statusMsg.textContent = `Analyzing ${file.name}...`;
    previewContainer.style.display = 'none';

    try {
      // Step 1: Analyze Resume File
      pendingParsedProfile = await buildProfileFromResumeFile(file, candidateProfile);

      statusMsg.className = 'status-msg success';
      statusMsg.textContent = `✓ Successfully analyzed ${file.name}. Review extracted details below:`;

      // Step 2: Render Extraction Preview Card
      renderExtractionPreview(pendingParsedProfile, file.name);
    } catch (err) {
      statusMsg.className = 'status-msg error';
      statusMsg.textContent = `Error analyzing resume: ${err.message}`;
    }
  }

  function renderExtractionPreview(parsed, filename) {
    const p = parsed.personal || {};
    const c = parsed.contact || {};
    const prof = parsed.professional || {};
    const l = parsed.links || {};

    const nameStr = p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Not found';
    const emailStr = c.email || 'Not found';
    const phoneStr = c.phone || 'Not found';
    const titleStr = prof.currentTitle || 'Not found';
    const locationStr = c.address || c.city || 'Not found';
    const skillsList = (prof.skills || []).join(', ') || 'Not found';
    const linkedinStr = l.linkedin || 'Not found';

    previewContainer.style.display = 'block';
    previewContainer.innerHTML = `
      <hr class="divider" />
      <div class="section">
        <div class="section-title">Analysis Results</div>
        <h3 style="font-family: var(--font-serif); font-size: 15px; margin-bottom: 8px; color: var(--text-primary);">Extracted Profile Details</h3>
        
        <div class="panel" style="border-left: 3px solid var(--primary-accent);">
          <div class="status-row">
            <span class="status-label">Candidate Name</span>
            <span class="status-val">${escapeHtml(nameStr)}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Email</span>
            <span class="status-val">${escapeHtml(emailStr)}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Phone</span>
            <span class="status-val">${escapeHtml(phoneStr)}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Current Title</span>
            <span class="status-val">${escapeHtml(titleStr)}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Location</span>
            <span class="status-val">${escapeHtml(locationStr)}</span>
          </div>
          <div class="status-row">
            <span class="status-label">LinkedIn</span>
            <span class="status-val" style="font-size: 11px;">${escapeHtml(linkedinStr)}</span>
          </div>
          <div style="padding-top: 8px;">
            <div class="status-label" style="margin-bottom: 4px;">Extracted Skills (${(prof.skills || []).length})</div>
            <div style="font-size: 11px; color: var(--text-primary); line-height: 1.4;">${escapeHtml(skillsList)}</div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 14px;">
          <button id="btn-save-analyzed-profile" class="btn btn-primary" style="flex: 2;">
            Save to Profile &rarr;
          </button>
          <button id="btn-cancel-analyzed-profile" class="btn btn-secondary" style="flex: 1;">
            Cancel
          </button>
        </div>
      </div>
    `;

    // Step 3: Save to Candidate Profile Action
    document.getElementById('btn-save-analyzed-profile').addEventListener('click', async () => {
      if (pendingParsedProfile) {
        await saveCandidateProfile(pendingParsedProfile);
        if (onProfileUpdated) onProfileUpdated(pendingParsedProfile);
        if (onNavigateToProfile) onNavigateToProfile();
      }
    });

    document.getElementById('btn-cancel-analyzed-profile').addEventListener('click', () => {
      previewContainer.style.display = 'none';
      statusMsg.className = 'status-msg info';
      statusMsg.textContent = 'Analysis cancelled.';
    });
  }
}

function sanitizeDisplayRawText(text) {
  if (!text || typeof text !== 'string') return 'No text extracted.';
  const clean = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/ +/g, ' ').trim();
  if (clean.length > 10) return clean;
  return 'Resume loaded successfully.';
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
