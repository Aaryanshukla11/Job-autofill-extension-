/**
 * Storage Abstraction Layer over chrome.storage.local
 * Fallback to in-memory/localStorage for non-extension environments (e.g. unit tests).
 */

import { DEFAULT_CANDIDATE_PROFILE, DEFAULT_SETTINGS } from './schemas.js';

let mockStorage = {};

function isExtensionEnv() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

export async function getCandidateProfile() {
  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.get(['candidateProfile'], res => {
        resolve(res.candidateProfile || { ...DEFAULT_CANDIDATE_PROFILE });
      });
    });
  } else {
    return mockStorage.candidateProfile || { ...DEFAULT_CANDIDATE_PROFILE };
  }
}

export async function saveCandidateProfile(profile) {
  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.set({ candidateProfile: profile }, resolve);
    });
  } else {
    mockStorage.candidateProfile = profile;
    return true;
  }
}

export async function getSettings() {
  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.get(['settings'], res => {
        resolve(Object.assign({}, DEFAULT_SETTINGS, res.settings || {}));
      });
    });
  } else {
    return Object.assign({}, DEFAULT_SETTINGS, mockStorage.settings || {});
  }
}

export async function saveSettings(settings) {
  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.set({ settings }, resolve);
    });
  } else {
    mockStorage.settings = settings;
    return true;
  }
}

export async function getCustomSelectors() {
  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.get(['customSelectors'], res => {
        resolve(res.customSelectors || {});
      });
    });
  } else {
    return mockStorage.customSelectors || {};
  }
}

export async function saveCustomSelectors(customSelectors) {
  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.set({ customSelectors }, resolve);
    });
  } else {
    mockStorage.customSelectors = customSelectors;
    return true;
  }
}

export async function getAutofillHistory() {
  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.get(['autofillHistory'], res => {
        resolve(res.autofillHistory || []);
      });
    });
  } else {
    return mockStorage.autofillHistory || [];
  }
}

export async function addAutofillHistoryItem(item) {
  const history = await getAutofillHistory();
  history.unshift(item);
  if (history.length > 50) history.pop();
  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.set({ autofillHistory: history }, resolve);
    });
  } else {
    mockStorage.autofillHistory = history;
    return true;
  }
}
