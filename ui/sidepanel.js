/**
 * Side Panel Main Controller
 * Orchestrates tab navigation, user memory loading, autofill execution, and missing information wizard.
 */

import { getCandidateProfile, getSettings } from '../storage/storage.js';
import { getUserMemory } from '../memory/memory-store.js';
import { matchFieldToMemory } from '../memory/memory-matcher.js';
import { renderAutofillView } from './components/autofill-view.js';
import { renderResumeView } from './components/resume-view.js';
import { renderProfileView } from './components/profile-view.js';
import { renderResultsView } from './components/results-view.js';
import { renderSettingsView } from './components/settings-view.js';
import { renderMissingInfoView } from './components/missing-info-view.js';

let currentTab = 'autofill';
let candidateProfile = {};
let userMemory = {};
let settings = {};
let pageStatus = null;
let lastAutofillResults = null;

function isFillableUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://') || url.startsWith('about:')) return false;
  return true;
}

document.addEventListener('DOMContentLoaded', async () => {
  userMemory = await getUserMemory();
  candidateProfile = userMemory.profile || await getCandidateProfile();
  settings = await getSettings();

  setupNavigation();
  await checkCurrentPage();
  renderCurrentView();
});

function setupNavigation() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      renderCurrentView();
    });
  });
}

async function checkCurrentPage() {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.scripting) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id && isFillableUrl(tab.url)) {
        const res = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const inputs = Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select'));
            const bodyText = (document.body?.innerText || '').toLowerCase();
            const pageTitle = (document.title || '').toLowerCase();
            const isAts = /greenhouse\.io|lever\.co|workday\.com|naukri\.com|indeed\.com|icims\.com/i.test(window.location.href);
            const isJobForm = inputs.length >= 2 || isAts || /job application|mock job application|personal information|apply/i.test(bodyText + ' ' + pageTitle);

            if (isJobForm) {
              return { pageType: 'APPLICATION_FORM', confidence: 0.95 };
            }
            return { pageType: 'UNKNOWN', confidence: 0.40 };
          }
        });

        if (res && res[0] && res[0].result) {
          pageStatus = res[0].result;
        }
      }
    } catch (err) {
      console.warn('[AI Job Autofill] Page detection check notice:', err);
    }
  }
}

function renderCurrentView() {
  const container = document.getElementById('app-view-container');
  if (!container) return;

  switch (currentTab) {
    case 'autofill':
      renderAutofillView(container, {
        candidateProfile,
        settings,
        pageStatus,
        onTriggerAutofill: handleTriggerAutofill
      });
      break;

    case 'resume':
      renderResumeView(container, {
        candidateProfile,
        onProfileUpdated: updated => {
          candidateProfile = updated;
        },
        onNavigateToProfile: () => {
          currentTab = 'profile';
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          const profileBtn = document.querySelector('.tab-btn[data-tab="profile"]');
          if (profileBtn) profileBtn.classList.add('active');
          renderCurrentView();
        }
      });
      break;

    case 'profile':
      renderProfileView(container, {
        candidateProfile,
        onProfileUpdated: updated => {
          candidateProfile = updated;
        }
      });
      break;

    case 'missing':
      renderMissingInfoView(container, {
        missingFields: lastAutofillResults?.unfilledFields || [],
        onFillElement: handleFillElementDirect,
        onComplete: () => {
          currentTab = 'results';
          renderCurrentView();
        }
      });
      break;

    case 'results':
      renderResultsView(container, {
        autofillResults: lastAutofillResults,
        onHighlightField: handleHighlightField,
        onFillElement: handleFillElementDirect,
        onNavigateToMissing: () => {
          currentTab = 'missing';
          renderCurrentView();
        }
      });
      break;

    case 'settings':
      renderSettingsView(container, {
        settings,
        onSettingsUpdated: updated => {
          settings = updated;
        }
      });
      break;

    default:
      renderAutofillView(container, { candidateProfile, settings, pageStatus });
      break;
  }
}

async function handleTriggerAutofill() {
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
    alert('Chrome extension scripting API is required to autofill pages.');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !isFillableUrl(tab.url)) {
    alert('Please open an active web tab or local application form page.');
    return;
  }

  userMemory = await getUserMemory();
  candidateProfile = userMemory.profile || {};

  // Inject content script into active tab
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/content.js']
    });
  } catch (e) {
    console.warn('[AI Job Autofill] Script injection notice:', e);
  }

  // Execute autofill workflow in target page context
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: executeInPageContext,
      args: [userMemory, settings]
    });

    if (results && results[0] && results[0].result) {
      lastAutofillResults = results[0].result;

      // Check if missing fields exist -> prompt missing info wizard
      if (lastAutofillResults.unfilledFields && lastAutofillResults.unfilledFields.length > 0) {
        currentTab = 'missing';
      } else {
        currentTab = 'results';
      }

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.querySelector(`.tab-btn[data-tab="${currentTab}"]`) || document.querySelector('.tab-btn[data-tab="results"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderCurrentView();
    }
  } catch (err) {
    if (err.message && err.message.includes('file:///')) {
      alert('To autofill local HTML test files (file:///), Chrome requires enabling one setting:\n\n1. Go to chrome://extensions\n2. Click Details on AI Job Autofill\n3. Turn ON "Allow access to file URLs"');
    } else {
      alert('Autofill execution error: ' + err.message);
    }
  }
}

function handleHighlightField(elementIndex) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'HIGHLIGHT_ELEMENT', index: elementIndex });
    }
  });
}

function handleFillElementDirect(elementIndex, value) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (idx, val) => {
          const fields = Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select'));
          const el = fields[idx];
          if (el) {
            const tag = el.tagName;
            let proto = tag === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
            const ns = Object.getOwnPropertyDescriptor(proto, 'value');
            if (ns && ns.set) ns.set.call(el, val); else el.value = val;
            el.dispatchEvent(new Event('focus', { bubbles: true }));
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('blur', { bubbles: true }));
            el.setAttribute('data-ai-filled', '1');
          }
        },
        args: [elementIndex, value]
      });
    }
  });
}

/**
 * Functions executed inside target web page context
 */
function executeInPageContext(userMemory, settings) {
  function reactSet(el, val) {
    const tag = el.tagName;
    let proto = tag === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
    const ns = Object.getOwnPropertyDescriptor(proto, 'value');
    if (ns && ns.set) ns.set.call(el, val); else el.value = val;
    el.dispatchEvent(new Event('focus', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function smartSelectMatch(sel, val) {
    const opts = Array.from(sel.options).filter(o => o.value && o.value !== '-1');
    if (!opts.length) return false;
    const lowerVal = String(val).toLowerCase().trim();
    let best = opts.find(o => o.value.toLowerCase() === lowerVal || o.text.trim().toLowerCase() === lowerVal);
    if (!best) best = opts.find(o => o.text.toLowerCase().includes(lowerVal));
    if (best) {
      sel.value = best.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      sel.setAttribute('data-ai-filled', '1');
      return true;
    }
    return false;
  }

  const profile = userMemory.profile || {};
  const remembered = userMemory.rememberedAnswers || [];
  const currentHost = window.location.hostname.toLowerCase();

  const fields = Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select'));
  let filledCount = 0;
  let reviewCount = 0;
  const fieldSummary = [];
  const unfilledFields = [];

  fields.forEach((el, index) => {
    const rawName = (el.name || el.id || '').replace(/\[\]$/, '').toLowerCase().replace(/^(txt|drp|inp|fld|candidate_)/, '');
    
    let labelTxt = '';
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) labelTxt = lbl.textContent.trim();
    }
    if (!labelTxt && el.closest('label')) {
      labelTxt = el.closest('label').textContent.replace(el.value || '', '').trim();
    }
    if (!labelTxt && el.parentElement) {
      labelTxt = Array.from(el.parentElement.childNodes)
        .filter(n => n.nodeType === 3 || (n.nodeType === 1 && n !== el))
        .map(n => n.textContent.trim())
        .filter(Boolean)
        .join(' ');
    }

    const placeholderLower = (el.placeholder || '').toLowerCase().trim();
    const contextStr = `${rawName} ${labelTxt.toLowerCase()} ${placeholderLower}`;

    let val = null;

    // 1. Check Deterministic Profile Mappings
    if (/first\s*name|given\s*name/i.test(contextStr)) val = profile.personal?.firstName;
    else if (/last\s*name|surname|family\s*name/i.test(contextStr)) val = profile.personal?.lastName;
    else if (/full\s*name|^name$/i.test(contextStr)) val = profile.personal?.fullName;
    else if (/email/i.test(contextStr)) val = profile.contact?.email;
    else if (/phone|mobile|cell|contact\s*number/i.test(contextStr)) val = profile.contact?.phone;
    else if (/address/i.test(contextStr)) val = profile.contact?.address;
    else if (/city/i.test(contextStr)) val = profile.contact?.city;
    else if (/state|province/i.test(contextStr)) val = profile.contact?.state;
    else if (/country/i.test(contextStr)) val = profile.contact?.country;
    else if (/zip|postal/i.test(contextStr)) val = profile.contact?.postalCode;
    else if (/linkedin/i.test(contextStr)) val = profile.links?.linkedin;
    else if (/github/i.test(contextStr)) val = profile.links?.github;
    else if (/portfolio|website/i.test(contextStr)) val = profile.links?.portfolio;
    else if (/title|designation|position/i.test(contextStr)) val = profile.professional?.currentTitle;
    else if (/company|employer|organization/i.test(contextStr)) val = profile.professional?.currentCompany;
    else if (/experience|years/i.test(contextStr)) val = profile.professional?.totalExperience;
    else if (/skills/i.test(contextStr)) val = (profile.professional?.skills || []).join(', ');
    else if (/notice/i.test(contextStr)) val = profile.professional?.noticePeriod || profile.preferences?.noticePeriod;

    // 2. Check Saved Remembered Answers
    if (!val && remembered.length > 0) {
      for (const ans of remembered) {
        if (ans.scope === 'site' && ans.domain && !currentHost.includes(ans.domain.toLowerCase())) continue;
        const qLower = (ans.questionText || '').toLowerCase();
        const mLower = (ans.meaning || '').toLowerCase();
        if ((qLower && contextStr.includes(qLower)) || (mLower && contextStr.includes(mLower))) {
          val = ans.value;
          if (val) break;
        }
      }
    }

    // 3. Custom Fields Dictionary
    if (!val && profile.customFields) {
      for (const [cKey, cVal] of Object.entries(profile.customFields)) {
        if (contextStr.includes(cKey.toLowerCase()) || cKey.toLowerCase().includes(rawName)) {
          val = cVal;
          break;
        }
      }
    }

    if (val && String(val).trim() !== '') {
      let ok = false;
      if (el.tagName === 'SELECT') {
        ok = smartSelectMatch(el, val);
      } else {
        reactSet(el, String(val));
        el.setAttribute('data-ai-filled', '1');
        ok = true;
      }
      if (ok) {
        filledCount++;
        fieldSummary.push({ index, label: labelTxt || rawName || `Field #${index + 1}`, value: String(val), status: 'FILLED' });
        return;
      }
    }

    const fieldLabel = labelTxt || rawName || `Field #${index + 1}`;
    fieldSummary.push({ index, label: fieldLabel, value: null, status: 'UNFILLED' });

    // Collect missing input field for wizard
    const options = el.tagName === 'SELECT' ? Array.from(el.options).map(o => o.text.trim()).filter(Boolean) : [];
    unfilledFields.push({
      index,
      name: el.name || el.id || '',
      label: fieldLabel,
      options,
      type: el.type || 'text',
      fieldPath: rawName
    });
  });

  const fileInputs = Array.from(document.querySelectorAll('input[type=file]')).map((inp, index) => ({
    index,
    message: 'Resume / Document upload detected — please select your file manually in Chrome.'
  }));

  return {
    filledCount,
    reviewCount,
    unfilledCount: fields.length - filledCount,
    totalFields: fields.length,
    fileInputs,
    fields: fieldSummary,
    unfilledFields
  };
}
