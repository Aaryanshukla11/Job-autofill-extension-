/**
 * Memory Storage Abstraction Layer
 * Interacts with chrome.storage.local with mock fallback for Node unit tests.
 */

import { createEmptyUserMemory, sanitizeUserMemory, createRememberedAnswer, MEMORY_SCHEMA_VERSION } from './memory-schema.js';
import { getCandidateProfile, saveCandidateProfile } from '../storage/storage.js';

let mockMemory = createEmptyUserMemory();

function isExtensionEnv() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

export async function getUserMemory() {
  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.get(['userMemory', 'candidateProfile', 'learnedStore'], res => {
        let memory = res.userMemory;
        if (!memory) {
          memory = createEmptyUserMemory();
          if (res.candidateProfile) memory.profile = res.candidateProfile;
        }
        memory = sanitizeUserMemory(memory);
        resolve(memory);
      });
    });
  } else {
    return mockMemory;
  }
}

export async function saveUserMemory(memoryInput) {
  const sanitized = sanitizeUserMemory(memoryInput);

  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.set({ 
        userMemory: sanitized,
        candidateProfile: sanitized.profile 
      }, () => resolve(sanitized));
    });
  } else {
    mockMemory = sanitized;
    await saveCandidateProfile(sanitized.profile);
    return mockMemory;
  }
}

export async function saveRememberedAnswer({ questionText = '', meaning = '', value = '', scope = 'global', domain = null }) {
  const memory = await getUserMemory();
  const answer = createRememberedAnswer({ questionText, meaning, value, scope, domain });

  // Update existing remembered answer if same meaning or questionText
  const existingIdx = memory.rememberedAnswers.findIndex(a => 
    (meaning && a.meaning === meaning && a.scope === scope && a.domain === domain) ||
    (questionText && a.questionText.toLowerCase() === questionText.toLowerCase() && a.scope === scope)
  );

  if (existingIdx >= 0) {
    memory.rememberedAnswers[existingIdx] = {
      ...memory.rememberedAnswers[existingIdx],
      value,
      questionText: questionText || memory.rememberedAnswers[existingIdx].questionText,
      usageCount: (memory.rememberedAnswers[existingIdx].usageCount || 0) + 1,
      updatedAt: new Date().toISOString()
    };
  } else {
    memory.rememberedAnswers.push(answer);
  }

  // Also update Candidate Profile if meaning maps to a profile path
  if (meaning) {
    updateProfilePathValue(memory.profile, meaning, value);
  }

  await saveUserMemory(memory);
  return answer;
}

export async function updateProfileFact(path, value) {
  const memory = await getUserMemory();
  updateProfilePathValue(memory.profile, path, value);
  await saveUserMemory(memory);
  return memory;
}

export async function exportUserMemoryJSON() {
  const memory = await getUserMemory();
  return JSON.stringify(memory, null, 2);
}

export async function importUserMemoryJSON(jsonString, resolutionStrategy = 'merge') {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error('Invalid JSON import string');
  }

  const raw = JSON.parse(jsonString);
  const importedMemory = sanitizeUserMemory(raw);
  const currentMemory = await getUserMemory();

  if (resolutionStrategy === 'overwrite') {
    await saveUserMemory(importedMemory);
    return { success: true, conflicts: [] };
  }

  // Strategy: merge cleanly
  const conflicts = [];
  const mergedProfile = JSON.parse(JSON.stringify(currentMemory.profile));

  // Compare profile root sections
  for (const section of ['personal', 'contact', 'professional', 'links', 'preferences', 'documents']) {
    const curSec = mergedProfile[section] || {};
    const impSec = importedMemory.profile[section] || {};

    for (const [k, impVal] of Object.entries(impSec)) {
      if (!impVal || (Array.isArray(impVal) && impVal.length === 0) || String(impVal).trim() === '') continue;
      const curVal = curSec[k];

      if (curVal && String(curVal).trim() !== '' && String(curVal).trim().toLowerCase() !== String(impVal).trim().toLowerCase()) {
        conflicts.push({
          field: `${section}.${k}`,
          label: formatFieldLabel(`${section}.${k}`),
          existingValue: String(curVal).trim(),
          importedValue: String(impVal).trim()
        });
      } else {
        curSec[k] = impVal;
      }
    }
  }

  // Merge customFields
  mergedProfile.customFields = {
    ...importedMemory.profile.customFields,
    ...mergedProfile.customFields
  };

  // Merge remembered answers
  const mergedAnswers = [...currentMemory.rememberedAnswers];
  for (const impAns of importedMemory.rememberedAnswers) {
    if (!mergedAnswers.some(a => a.meaning === impAns.meaning || a.questionText.toLowerCase() === impAns.questionText.toLowerCase())) {
      mergedAnswers.push(impAns);
    }
  }

  const finalMemory = {
    version: MEMORY_SCHEMA_VERSION,
    profile: mergedProfile,
    rememberedAnswers: mergedAnswers
  };

  await saveUserMemory(finalMemory);
  return { success: true, conflicts, memory: finalMemory };
}

function updateProfilePathValue(profileObj, pathStr, valueStr) {
  if (!profileObj || !pathStr) return;
  const parts = pathStr.split('.');
  if (parts.length === 1) {
    if (!profileObj.customFields) profileObj.customFields = {};
    profileObj.customFields[parts[0]] = valueStr;
    return;
  }

  const [section, key] = parts;
  if (profileObj[section] && typeof profileObj[section] === 'object') {
    profileObj[section][key] = valueStr;
  } else {
    if (!profileObj.customFields) profileObj.customFields = {};
    profileObj.customFields[pathStr] = valueStr;
  }
}

function formatFieldLabel(pathStr) {
  const parts = pathStr.split('.');
  const key = parts[parts.length - 1];
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}
