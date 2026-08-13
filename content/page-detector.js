/**
 * Page Type Detector
 * Evaluates current page DOM signals to classify the page into:
 * APPLICATION_FORM, JOB_LISTING, LOGIN, SEARCH, REGISTRATION, UNKNOWN
 */

export function detectPageType() {
  const allInputs = Array.from(document.querySelectorAll('input, textarea, select'));
  const bodyText = (document.body?.innerText || '').toLowerCase();
  const pageTitle = (document.title || '').toLowerCase();
  const pageUrl = (window.location.href || '').toLowerCase();

  let formScore = 0;
  let jobListingScore = 0;
  let loginScore = 0;

  // Signal 1: Number of input fields
  const visibleInputs = allInputs.filter(el => {
    const type = (el.type || '').toLowerCase();
    return type !== 'hidden' && type !== 'submit' && type !== 'button';
  });

  if (visibleInputs.length >= 3) formScore += 2;
  if (visibleInputs.length >= 6) formScore += 2;

  // Signal 2: Resume / File upload present
  const hasFileInput = allInputs.some(el => el.type === 'file');
  if (hasFileInput) formScore += 4;

  // Signal 3: Application & Job specific labels
  const appKeywords = [
    'apply', 'application', 'resume', 'cv', 'work authorization', 'education',
    'experience', 'linkedin', 'phone', 'address', 'cover letter', 'eeo', 'disability'
  ];

  let appKeywordCount = 0;
  appKeywords.forEach(kw => {
    if (bodyText.includes(kw) || pageTitle.includes(kw) || pageUrl.includes(kw)) {
      appKeywordCount++;
    }
  });

  if (appKeywordCount >= 3) formScore += 3;
  if (appKeywordCount >= 6) formScore += 3;

  // Signal 4: Known ATS domain patterns
  const isKnownAts = /greenhouse\.io|lever\.co|workday\.com|naukri\.com|indeed\.com|icims\.com|smartrecruiters\.com|bamboohr\.com|ashbyhq\.com/i.test(pageUrl);
  if (isKnownAts) formScore += 4;

  // Signal 5: Login signals
  const hasPassword = allInputs.some(el => el.type === 'password');
  const hasLoginBtn = Array.from(document.querySelectorAll('button, input[type=submit], a')).some(el => /sign in|log in|login/i.test(el.textContent || el.value || ''));

  if (hasPassword && hasLoginBtn && visibleInputs.length <= 3) {
    loginScore += 5;
  }

  // Signal 6: Job listing page (without form)
  const isJobDetailText = /job description|requirements|responsibilities|about the role|apply now/i.test(bodyText);
  if (isJobDetailText && visibleInputs.length < 2) {
    jobListingScore += 4;
  }

  // Classification Decision
  if (loginScore >= 5 && formScore < 4) {
    return { pageType: "LOGIN", confidence: 0.90 };
  }

  if (formScore >= 6) {
    const confidence = Math.min(0.98, 0.60 + (formScore * 0.04));
    return { pageType: "APPLICATION_FORM", confidence };
  }

  if (jobListingScore >= 4) {
    return { pageType: "JOB_LISTING", confidence: 0.85 };
  }

  return { pageType: "UNKNOWN", confidence: 0.40 };
}
