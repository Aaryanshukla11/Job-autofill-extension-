/**
 * Minimal & Editorial Profile View Component with Field Type Selector
 */

import { saveCandidateProfile } from '../../storage/storage.js';
import { sanitizeProfile } from '../../resume/profile-schema.js';

const FIELD_PRESETS = [
  { label: 'Custom Field', key: '', placeholder: 'Field Value' },
  { label: 'Job Title', key: 'Job Title', placeholder: 'e.g. Senior Software Engineer' },
  { label: 'Current Company', key: 'Current Company', placeholder: 'e.g. Google / Acme Corp' },
  { label: 'Notice Period', key: 'Notice Period', placeholder: 'e.g. 15 days / Immediate' },
  { label: 'Expected Salary', key: 'Expected Salary', placeholder: 'e.g. $120,000 / annum' },
  { label: 'Current Salary', key: 'Current Salary', placeholder: 'e.g. $100,000 / annum' },
  { label: 'Work Authorization / Visa', key: 'Work Authorization', placeholder: 'e.g. Authorized / H1B / Citizen' },
  { label: 'Middle Name', key: 'Middle Name', placeholder: 'e.g. Alexander' },
  { label: 'Date of Birth', key: 'Date of Birth', placeholder: 'e.g. YYYY-MM-DD' },
  { label: 'Postal / Zip Code', key: 'Postal Code', placeholder: 'e.g. 10001' },
  { label: 'Alternate Phone', key: 'Alternate Phone', placeholder: 'e.g. +1 (555) 987-6543' }
];

export function renderProfileView(container, { candidateProfile, onProfileUpdated }) {
  const p = candidateProfile.personal || {};
  const c = candidateProfile.contact || {};
  const prof = candidateProfile.professional || {};
  const l = candidateProfile.links || {};
  const custom = candidateProfile.customFields || {};

  const skillsStr = (prof.skills || []).join(', ');

  container.innerHTML = `
    <div class="section">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <div class="section-title">Candidate Profile</div>
          <h2 class="section-heading">Profile Details</h2>
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="btn-export-json" class="btn-sm-outline" title="Export JSON">Export JSON</button>
          <button id="btn-import-json" class="btn-sm-outline" title="Import JSON">Import JSON</button>
          <input type="file" id="import-json-file" accept=".json" hidden />
        </div>
      </div>
      <p class="section-desc">Fields used for matching and autofilling forms.</p>

      <form id="profile-form">
        <!-- Personal -->
        <div class="section-title" style="margin-top: 14px;">Personal Information</div>
        <div class="form-row">
          <div class="form-col">
            <label>First Name</label>
            <input type="text" id="p-firstName" value="${escapeVal(p.firstName)}" placeholder="John" />
          </div>
          <div class="form-col">
            <label>Last Name</label>
            <input type="text" id="p-lastName" value="${escapeVal(p.lastName)}" placeholder="Doe" />
          </div>
        </div>

        <!-- Contact -->
        <div class="section-title" style="margin-top: 14px;">Contact Information</div>
        <div class="form-row">
          <div class="form-col">
            <label>Email</label>
            <input type="email" id="c-email" value="${escapeVal(c.email)}" placeholder="john@example.com" />
          </div>
          <div class="form-col">
            <label>Phone</label>
            <input type="text" id="c-phone" value="${escapeVal(c.phone)}" placeholder="+1 (555) 019-2834" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label>Location / Address</label>
            <input type="text" id="c-address" value="${escapeVal(c.address)}" placeholder="New York, NY" />
          </div>
        </div>

        <!-- Professional -->
        <div class="section-title" style="margin-top: 14px;">Professional</div>
        <div class="form-row">
          <div class="form-col">
            <label>Current Title</label>
            <input type="text" id="prof-currentTitle" value="${escapeVal(prof.currentTitle)}" placeholder="Software Engineer" />
          </div>
          <div class="form-col">
            <label>Current Company</label>
            <input type="text" id="prof-currentCompany" value="${escapeVal(prof.currentCompany)}" placeholder="Acme Corp" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label>Total Experience</label>
            <input type="text" id="prof-totalExperience" value="${escapeVal(prof.totalExperience)}" placeholder="3.5 years" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label>Skills (comma separated)</label>
            <textarea id="prof-skills" rows="2" placeholder="JavaScript, Python, React, AWS">${escapeVal(skillsStr)}</textarea>
          </div>
        </div>

        <!-- Links -->
        <div class="section-title" style="margin-top: 14px;">Links</div>
        <div class="form-row">
          <div class="form-col">
            <label>LinkedIn URL</label>
            <input type="url" id="l-linkedin" value="${escapeVal(l.linkedin)}" placeholder="https://linkedin.com/in/johndoe" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-col">
            <label>GitHub URL</label>
            <input type="url" id="l-github" value="${escapeVal(l.github)}" placeholder="https://github.com/johndoe" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-col">
            <label>Portfolio URL</label>
            <input type="url" id="l-portfolio" value="${escapeVal(l.portfolio)}" placeholder="https://johndoe.dev" />
          </div>
        </div>

        <!-- Custom & Extra Fields -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
          <div class="section-title" style="margin: 0;">Custom & Additional Fields</div>
          <button type="button" id="btn-add-custom-field" class="btn-sm-outline">+ Add field</button>
        </div>

        <div id="custom-fields-container" style="margin-top: 8px;">
          ${Object.entries(custom).map(([key, val], idx) => renderCustomFieldRow(key, val, idx)).join('')}
        </div>

        <div class="section" style="margin-top: 20px;">
          <button type="submit" class="btn btn-primary" id="btn-save-profile">
            Save Profile
          </button>
          <div id="save-toast" class="toast"></div>
        </div>
      </form>
    </div>
  `;

  // Bind custom field select handlers
  const customContainer = document.getElementById('custom-fields-container');
  bindCustomFieldRows(customContainer);

  document.getElementById('btn-add-custom-field').addEventListener('click', () => {
    const idx = customContainer.querySelectorAll('.custom-field-row').length;
    const div = document.createElement('div');
    div.innerHTML = renderCustomFieldRow('', '', idx);
    const newRow = div.firstElementChild;
    customContainer.appendChild(newRow);
    bindCustomRowEvents(newRow);
  });

  // Export JSON
  document.getElementById('btn-export-json').addEventListener('click', (e) => {
    e.preventDefault();
    const currentData = getFormProfileData();
    const jsonStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidate-profile-${(currentData.personal.firstName || 'user').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import JSON
  const fileInput = document.getElementById('import-json-file');
  document.getElementById('btn-import-json').addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rawImported = JSON.parse(text);
      const imported = sanitizeProfile(rawImported);
      await saveCandidateProfile(imported);
      if (onProfileUpdated) onProfileUpdated(imported);
      renderProfileView(container, { candidateProfile: imported, onProfileUpdated });

      const toast = document.getElementById('save-toast');
      if (toast) {
        toast.className = 'toast success';
        toast.textContent = '✓ Profile Loaded from JSON';
        setTimeout(() => toast.textContent = '', 3000);
      }
    } catch (err) {
      alert('Failed to import JSON profile: ' + err.message);
    }
  });

  // Save Form
  const form = document.getElementById('profile-form');
  const toast = document.getElementById('save-toast');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const updated = getFormProfileData();

    await saveCandidateProfile(updated);
    toast.className = 'toast success';
    toast.textContent = '✓ Profile Saved';
    setTimeout(() => toast.textContent = '', 2500);

    if (onProfileUpdated) onProfileUpdated(updated);
  });

  function getFormProfileData() {
    const customFields = {};
    customContainer.querySelectorAll('.custom-field-row').forEach(row => {
      const k = row.querySelector('.custom-key').value.trim();
      const v = row.querySelector('.custom-val').value.trim();
      if (k) customFields[k] = v;
    });

    return sanitizeProfile({
      ...candidateProfile,
      personal: {
        ...p,
        firstName: document.getElementById('p-firstName').value.trim(),
        lastName: document.getElementById('p-lastName').value.trim(),
        fullName: `${document.getElementById('p-firstName').value.trim()} ${document.getElementById('p-lastName').value.trim()}`.trim()
      },
      contact: {
        ...c,
        email: document.getElementById('c-email').value.trim(),
        phone: document.getElementById('c-phone').value.trim(),
        address: document.getElementById('c-address').value.trim()
      },
      professional: {
        ...prof,
        currentTitle: document.getElementById('prof-currentTitle').value.trim(),
        currentCompany: document.getElementById('prof-currentCompany').value.trim(),
        totalExperience: document.getElementById('prof-totalExperience').value.trim(),
        skills: document.getElementById('prof-skills').value.split(',').map(s => s.trim()).filter(Boolean)
      },
      links: {
        ...l,
        linkedin: document.getElementById('l-linkedin').value.trim(),
        github: document.getElementById('l-github').value.trim(),
        portfolio: document.getElementById('l-portfolio').value.trim()
      },
      customFields
    });
  }
}

function renderCustomFieldRow(key = '', val = '', idx = 0) {
  const matchedPreset = FIELD_PRESETS.find(p => p.key && p.key.toLowerCase() === key.toLowerCase());
  const selectedType = matchedPreset ? matchedPreset.key : (key ? 'custom' : '');

  return `
    <div class="form-row custom-field-row" style="align-items: center; margin-bottom: 8px;" data-custom-idx="${idx}">
      <div class="form-col" style="flex: 1;">
        <select class="custom-type-select">
          ${FIELD_PRESETS.map(p => `
            <option value="${p.key}" ${p.key === selectedType ? 'selected' : ''}>${p.label}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-col" style="flex: 1;">
        <input type="text" class="custom-key" value="${escapeVal(key)}" placeholder="Field Name" />
      </div>
      <div class="form-col" style="flex: 1.5;">
        <input type="text" class="custom-val" value="${escapeVal(val)}" placeholder="${matchedPreset ? matchedPreset.placeholder : 'Field Value'}" />
      </div>
      <button type="button" class="btn-del-custom" style="background: none; border: none; color: var(--error); cursor: pointer; padding: 4px; font-size: 13px;">✕</button>
    </div>
  `;
}

function bindCustomFieldRows(container) {
  container.querySelectorAll('.custom-field-row').forEach(row => bindCustomRowEvents(row));
}

function bindCustomRowEvents(row) {
  const typeSelect = row.querySelector('.custom-type-select');
  const keyInput = row.querySelector('.custom-key');
  const valInput = row.querySelector('.custom-val');
  const delBtn = row.querySelector('.btn-del-custom');

  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      const selectedKey = typeSelect.value;
      const preset = FIELD_PRESETS.find(p => p.key === selectedKey);
      if (preset && preset.key) {
        keyInput.value = preset.key;
        valInput.placeholder = preset.placeholder;
        valInput.focus();
      } else {
        keyInput.value = '';
        keyInput.placeholder = 'Custom Field Name';
        valInput.placeholder = 'Field Value';
        keyInput.focus();
      }
    });
  }

  if (delBtn) {
    delBtn.addEventListener('click', () => row.remove());
  }
}

function escapeVal(val) {
  return String(val || '').replace(/"/g, '&quot;');
}
