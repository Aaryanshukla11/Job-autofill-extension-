/**
 * Authoritative Memory Schema Definitions (v1)
 * Persistent user information store for candidate profile & remembered answers.
 */

import { createEmptyProfile, sanitizeProfile } from '../resume/profile-schema.js';

export const MEMORY_SCHEMA_VERSION = 1;

export function createEmptyUserMemory() {
  return {
    version: MEMORY_SCHEMA_VERSION,
    profile: createEmptyProfile(),
    rememberedAnswers: []
  };
}

export function createRememberedAnswer({
  id,
  questionText = '',
  meaning = '',
  value = '',
  scope = 'global',
  domain = null,
  usageCount = 0,
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString()
} = {}) {
  const generatedId = id || `ans_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  return {
    id: generatedId,
    questionText: String(questionText || '').trim(),
    meaning: String(meaning || '').trim(), // e.g. "professional.registrationNumber" or "customFields.Notice Period"
    value: String(value || '').trim(),
    scope: scope === 'site' ? 'site' : 'global',
    domain: scope === 'site' ? String(domain || '').toLowerCase().trim() : null,
    usageCount: typeof usageCount === 'number' ? usageCount : 0,
    createdAt,
    updatedAt
  };
}

export function sanitizeUserMemory(input = {}) {
  const memory = createEmptyUserMemory();
  if (!input || typeof input !== 'object') return memory;

  memory.version = typeof input.version === 'number' ? input.version : MEMORY_SCHEMA_VERSION;
  memory.profile = sanitizeProfile(input.profile || input);
  
  if (Array.isArray(input.rememberedAnswers)) {
    memory.rememberedAnswers = input.rememberedAnswers
      .filter(a => a && typeof a === 'object' && a.meaning && a.value !== undefined)
      .map(a => createRememberedAnswer(a));
  }

  return memory;
}
