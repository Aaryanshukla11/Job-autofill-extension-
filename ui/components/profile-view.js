/**
 * Natural & Human-Centered "Your Information" Profile View Component
 * Zero technical jargon, zero raw JSON exposed. Simple personal information manager.
 */

import { saveCandidateProfile } from '../../storage/storage.js';
import { sanitizeProfile } from '../../resume/profile-schema.js';
import { getUserMemory, saveUserMemory, saveRememberedAnswer } from '../../memory/memory-store.js';

export async function renderProfileView(container, { candidateProfile, onProfileUpdated }) {
  const memory = await getUserMemory();
  const profile = memory.profile || candidateProfile || {};

  const p = profile.personal || {};
  const c = profile.contact || {};
  const prof = profile.professional || {};
  const l = profile.links || {};
  const savedAnswers = memory.rememberedAnswers || [];

  const skillsStr = (prof.skills || []).join(', ');

  container.innerHTML = `
    <div class="section">
      <div class="section-title">Your Information</div>
      <h2 class="section-heading">${escapeHtml(p.fullName || 'Candidate Profile')}</h2>
      <p class="section-desc">Information used to automatically answer job application questions.</p>

      <form id="profile-form">
        <!-- Personal -->
        <div class="section-title" style="margin-top: 14px;">Personal Details</div>
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
        <div class="section-title" style="margin-top: 14px;">Contact Details</div>
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
        <div class="section-title" style="margin-top: 14px;">Professional Information</div>
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
        <div class="section-title" style="margin-top: 14px;">Professional Links</div>
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

        <!-- Saved Information -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
          <div class="section-title" style="margin: 0;">Saved Information (${savedAnswers.length})</div>
          <button type="button" id="btn-add-saved-answer" class="btn-sm-outline">+ Add information</button>
        </div>

        <div id="saved-answers-container" style="margin-top: 8px;">
          ${savedAnswers.map((ans, idx) => `
            <div class="form-row saved-answer-row" style="align-items: center; margin-bottom: 8px;" data-idx="${idx}">
              <div class="form-col" style="flex: 1;">
                <input type="text" class="ans-question" value="${escapeVal(ans.questionText || ans.meaning)}" placeholder="Question / Detail name" />
              </div>
              <div class="form-col" style="flex: 1.5;">
                <input type="text" class="ans-value" value="${escapeVal(ans.value)}" placeholder="Your saved answer" />
              </div>
              <button type="button" class="btn-del-answer" style="background: none; border: none; color: var(--error); cursor: pointer; padding: 4px; font-size: 13px;">✕</button>
            </div>
          `).join('')}
        </div>

        <div class="section" style="margin-top: 20px;">
          <button type="submit" class="btn btn-primary" id="btn-save-profile">
            Save Information
          </button>
          <div id="save-toast" class="toast"></div>
        </div>
      </form>
    </div>
  `;

  // Bind Add Saved Answer
  const answersContainer = document.getElementById('saved-answers-container');
  document.getElementById('btn-add-saved-answer').addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'form-row saved-answer-row';
    div.style.cssText = 'align-items: center; margin-bottom: 8px;';
    div.innerHTML = `
      <div class="form-col" style="flex: 1;">
        <input type="text" class="ans-question" value="" placeholder="Question name (e.g. Notice Period)" />
      </div>
      <div class="form-col" style="flex: 1.5;">
        <input type="text" class="ans-value" value="" placeholder="Your answer (e.g. 15 days)" />
      </div>
      <button type="button" class="btn-del-answer" style="background: none; border: none; color: var(--error); cursor: pointer; padding: 4px; font-size: 13px;">✕</button>
    `;
    answersContainer.appendChild(div);
    div.querySelector('.btn-del-answer').addEventListener('click', () => div.remove());
  });

  // Bind Delete Answer
  answersContainer.querySelectorAll('.btn-del-answer').forEach(btn => {
    btn.addEventListener('click', e => {
      const row = e.target.closest('.saved-answer-row');
      if (row) row.remove();
    });
  });

  // Save Form
  const form = document.getElementById('profile-form');
  const toast = document.getElementById('save-toast');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const newSavedAnswers = [];
    answersContainer.querySelectorAll('.saved-answer-row').forEach(row => {
      const q = row.querySelector('.ans-question').value.trim();
      const v = row.querySelector('.ans-value').value.trim();
      if (q && v) {
        newSavedAnswers.push({ questionText: q, meaning: q, value: v });
      }
    });

    const updatedProfile = sanitizeProfile({
      ...profile,
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
        github: document.getElementById('l-github').value.trim()
      }
    });

    const updatedMemory = {
      ...memory,
      profile: updatedProfile,
      rememberedAnswers: newSavedAnswers
    };

    await saveUserMemory(updatedMemory);
    toast.className = 'toast success';
    toast.textContent = '✓ Information Saved';
    setTimeout(() => toast.textContent = '', 2500);

    if (onProfileUpdated) onProfileUpdated(updatedProfile);
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeVal(val) {
  return String(val || '').replace(/"/g, '&quot;');
}
