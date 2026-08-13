/**
 * Minimal & Editorial Autofill View Component
 */

export function renderAutofillView(container, { candidateProfile, settings, pageStatus, onTriggerAutofill }) {
  const profileFieldCount = countProfileFields(candidateProfile);
  const resumeFileName = candidateProfile.documents?.resumeFileName || "No resume uploaded";
  const candidateName = candidateProfile.personal?.fullName || candidateProfile.personal?.firstName || "Candidate";

  const isFormDetected = pageStatus?.pageType === 'APPLICATION_FORM';

  container.innerHTML = `
    <div class="section">
      <div class="section-title">Overview</div>
      <h2 class="section-heading">AI Job Autofill</h2>
      <p class="section-desc">Detects application forms and maps candidate profile data.</p>
    </div>

    <hr class="divider" />

    <div class="section">
      <div class="section-title">Current Page</div>
      <div class="status-row">
        <div class="status-info">
          <span class="status-dot ${isFormDetected ? 'active' : 'inactive'}"></span>
          <div>
            <div class="status-text-main">${isFormDetected ? 'Application detected' : 'No application form detected'}</div>
            <div class="status-text-sub">${isFormDetected ? 'Form fields ready to map' : 'Open a job application page'}</div>
          </div>
        </div>
      </div>
    </div>

    <hr class="divider" />

    <div class="section">
      <div class="section-title">Your Resume</div>
      <div class="status-row">
        <div>
          <div class="status-text-main">${escapeHtml(candidateName)}</div>
          <div class="status-text-sub">${escapeHtml(resumeFileName)}</div>
        </div>
        <div class="status-text-sub" style="font-weight: 500;">
          ${candidateProfile.documents?.rawResumeText ? '✓ Ready' : 'Empty'}
        </div>
      </div>
    </div>

    <hr class="divider" />

    <div class="section">
      <div class="section-title">Ready To Fill</div>
      <div class="status-row">
        <div>
          <div class="status-text-main">${profileFieldCount} fields available</div>
          <div class="status-text-sub">From parsed resume & profile entries</div>
        </div>
      </div>
    </div>

    <div class="section" style="margin-top: 24px;">
      <button id="btn-ai-autofill" class="btn btn-primary">
        Autofill &rarr;
      </button>
      <div class="notice-text">
        Final submission remains under your control.
      </div>
    </div>
  `;

  document.getElementById('btn-ai-autofill').addEventListener('click', () => {
    if (onTriggerAutofill) onTriggerAutofill();
  });
}

function countProfileFields(profile = {}) {
  let count = 0;
  if (profile.personal?.firstName) count++;
  if (profile.personal?.lastName) count++;
  if (profile.contact?.email) count++;
  if (profile.contact?.phone) count++;
  if (profile.contact?.address) count++;
  if (profile.links?.linkedin) count++;
  if (profile.links?.github) count++;
  if (profile.links?.portfolio) count++;
  if (profile.professional?.currentTitle) count++;
  if (profile.professional?.skills?.length) count += profile.professional.skills.length;
  if (profile.education?.length) count += profile.education.length;
  return count;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
