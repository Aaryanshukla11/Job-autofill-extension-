/**
 * Minimal & Editorial Profile View Component
 */

import { saveCandidateProfile } from '../../storage/storage.js';

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

        <!-- Custom Fields -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
          <div class="section-title" style="margin: 0;">Custom Fields</div>
          <button type="button" id="btn-add-custom-field" class="btn-sm-outline">+ Add field</button>
        </div>

        <div id="custom-fields-container" style="margin-top: 8px;">
          ${Object.entries(custom).map(([key, val], idx) => `
            <div class="form-row custom-field-row" style="align-items: center;" data-custom-idx="${idx}">
              <div class="form-col" style="flex: 1;">
                <input type="text" class="custom-key" value="${escapeVal(key)}" placeholder="Field Name" />
              </div>
              <div class="form-col" style="flex: 1.5;">
                <input type="text" class="custom-val" value="${escapeVal(val)}" placeholder="Field Value" />
              </div>
              <button type="button" class="btn-del-custom" style="background: none; border: none; color: var(--error); cursor: pointer; padding: 4px; font-size: 13px;">✕</button>
            </div>
          `).join('')}
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

  // Custom Field Handlers
  const customContainer = document.getElementById('custom-fields-container');
  document.getElementById('btn-add-custom-field').addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'form-row custom-field-row';
    row.style.cssText = 'align-items: center; margin-bottom: 8px;';
    row.innerHTML = `
      <div class="form-col" style="flex: 1;">
        <input type="text" class="custom-key" placeholder="Field Name" />
      </div>
      <div class="form-col" style="flex: 1.5;">
        <input type="text" class="custom-val" placeholder="Field Value" />
      </div>
      <button type="button" class="btn-del-custom" style="background: none; border: none; color: var(--error); cursor: pointer; padding: 4px; font-size: 13px;">✕</button>
    `;
    customContainer.appendChild(row);
    row.querySelector('.btn-del-custom').addEventListener('click', () => row.remove());
  });

  customContainer.querySelectorAll('.btn-del-custom').forEach(btn => {
    btn.addEventListener('click', e => {
      e.target.closest('.custom-field-row').remove();
    });
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
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      await saveCandidateProfile(imported);
      if (onProfileUpdated) onProfileUpdated(imported);
      renderProfileView(container, { candidateProfile: imported, onProfileUpdated });
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

    return {
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
    };
  }
}

function escapeVal(val) {
  return String(val || '').replace(/"/g, '&quot;');
}
