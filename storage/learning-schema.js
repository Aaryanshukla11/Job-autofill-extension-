/**
 * Authoritative Learned Mapping Schema & Safety Guard Definitions (v1)
 */

export const LEARNED_SCHEMA_VERSION = 1;

export function createEmptyLearnedStore() {
  return {
    version: LEARNED_SCHEMA_VERSION,
    mappings: []
  };
}

export function createLearnedMapping({
  id,
  scope = 'global',
  domain = null,
  fieldSignature = '',
  selectors = [],
  labelTokens = [],
  profilePath = '',
  valueType = 'text',
  confidence = 1.0,
  source = 'user_confirmed',
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString(),
  usageCount = 0
} = {}) {
  const generatedId = id || `map_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  return {
    id: generatedId,
    scope: scope === 'site' ? 'site' : 'global',
    domain: scope === 'site' ? String(domain || '').toLowerCase().trim() : null,
    fieldSignature: String(fieldSignature).toLowerCase().trim(),
    selectors: Array.isArray(selectors) ? selectors : [],
    labelTokens: Array.isArray(labelTokens) ? labelTokens.map(t => String(t).toLowerCase().trim()).filter(Boolean) : [],
    profilePath: String(profilePath).trim(),
    valueType: ['text', 'email', 'tel', 'number', 'select', 'checkbox', 'radio'].includes(valueType) ? valueType : 'text',
    confidence: typeof confidence === 'number' ? confidence : 1.0,
    source: source || 'user_confirmed',
    createdAt,
    updatedAt,
    usageCount: typeof usageCount === 'number' ? usageCount : 0
  };
}

/**
 * Safety Guard: Detects passwords, authentication tokens, payment details, and sensitive demographics.
 */
export function isSensitiveOrForbiddenField(contextStr = '') {
  if (!contextStr || typeof contextStr !== 'string') return false;
  const str = contextStr.toLowerCase().trim();

  const forbiddenPatterns = [
    /pass(word|phrase|code)/i,
    /\b(pin|otp|2fa|verification\s*code|auth\s*token)\b/i,
    /credit\s*card|debit\s*card|card\s*number|cvv|cvc|expir(y|ation)/i,
    /bank|routing|account\s*number|iban|swift/i,
    /ssn|social\s*security|tax\s*id|national\s*id/i,
    /race|ethnicity|sexual\s*orientation|religion|medical|disability|veteran/i,
    /convicted|felony|background\s*check\s*consent/i
  ];

  return forbiddenPatterns.some(pattern => pattern.test(str));
}

/**
 * Validates candidate profile path string format.
 */
export function isValidProfilePath(profilePath = '') {
  if (!profilePath || typeof profilePath !== 'string') return false;
  const trimmed = profilePath.trim();
  if (trimmed.length < 2) return false;
  
  // Valid profile roots or custom fields
  const validRoots = ['personal', 'contact', 'professional', 'education', 'experience', 'projects', 'certifications', 'links', 'preferences', 'documents', 'customFields'];
  const firstSegment = trimmed.split('.')[0];
  
  return validRoots.includes(firstSegment) || /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*$/.test(trimmed);
}
