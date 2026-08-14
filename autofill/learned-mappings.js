/**
 * Learned Mappings Engine
 * Signature generator, matcher, and Candidate Profile value resolver for persistent learned fields.
 */

import { isSensitiveOrForbiddenField, isValidProfilePath } from '../storage/learning-schema.js';
import { resolveProfileValue } from './value-resolver.js';

/**
 * Generates a stable field signature and label token array from available DOM field signals.
 * Strips dynamic numeric suffixes (e.g., fld_9182 -> fld) to ensure cross-page stability.
 */
export function generateFieldSignature(fieldInfo = {}) {
  const labelText = fieldInfo.label || fieldInfo.ariaLabel || fieldInfo.title || '';
  const placeholder = fieldInfo.placeholder || '';
  const nameAttr = fieldInfo.name || fieldInfo.id || '';
  const contextText = fieldInfo.contextStr || fieldInfo.context || `${nameAttr} ${labelText} ${placeholder}`;

  // Strip dynamic numeric IDs/suffixes (e.g. fld_9182 -> fld, input-8271 -> input)
  const normalizedName = String(nameAttr)
    .toLowerCase()
    .replace(/^candidate_/i, '')
    .replace(/^(fld|txt|inp|drp|sel)[_-]?\d+$/i, '$1')
    .replace(/([a-zA-Z])[_-]?\d{3,}$/g, '$1')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();

  const normalizedLabel = String(labelText)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim();

  const normalizedPlaceholder = String(placeholder)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim();

  // Combine signals to form signature string
  const primarySignal = normalizedLabel || normalizedName || normalizedPlaceholder;
  const fieldSignature = primarySignal.replace(/\s+/g, '_');

  // Tokenize label words
  const stopWords = new Set(['a', 'an', 'the', 'of', 'for', 'in', 'to', 'your', 'please', 'enter', 'select', 'choose', 'field', 'input']);
  const rawTokens = `${normalizedLabel} ${normalizedName}`
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !stopWords.has(t));

  const labelTokens = Array.from(new Set(rawTokens));

  return {
    fieldSignature,
    labelTokens,
    contextStr: `${normalizedLabel} ${normalizedName} ${normalizedPlaceholder} ${contextText}`.toLowerCase().trim()
  };
}

/**
 * Matches a scanned field against active learned mappings in memory.
 * Enforces sensitive field safety, scope/domain constraints, and confidence thresholds.
 */
export function findMatchingLearnedMapping(scannedField = {}, learnedStore = {}, currentDomain = '') {
  const mappings = Array.isArray(learnedStore.mappings) ? learnedStore.mappings : [];
  if (mappings.length === 0) return null;

  const { fieldSignature, labelTokens, contextStr } = generateFieldSignature(scannedField);

  // Safety check: Never match passwords, payment, auth, or sensitive demographic fields
  if (isSensitiveOrForbiddenField(contextStr)) {
    return null;
  }

  const hostDomain = String(currentDomain || '').toLowerCase().trim().replace(/^www\./, '');

  let bestMatch = null;
  let highestScore = 0;

  for (const m of mappings) {
    if (!m.profilePath || !isValidProfilePath(m.profilePath)) continue;

    // Scope & Domain Filtering
    if (m.scope === 'site') {
      const targetDomain = String(m.domain || '').toLowerCase().trim().replace(/^www\./, '');
      if (!targetDomain || (!hostDomain.includes(targetDomain) && !targetDomain.includes(hostDomain))) {
        continue; // Domain mismatch for site-scoped mapping
      }
    }

    let score = 0;

    // 1. Signature exact match
    if (m.fieldSignature && m.fieldSignature === fieldSignature) {
      score = 0.95;
    } 
    // 2. Signature sub-string / normalized match
    else if (m.fieldSignature && (fieldSignature.includes(m.fieldSignature) || m.fieldSignature.includes(fieldSignature))) {
      score = 0.85;
    }

    // 3. Label token overlap match
    if (Array.isArray(m.labelTokens) && m.labelTokens.length > 0 && labelTokens.length > 0) {
      const matchCount = m.labelTokens.filter(token => labelTokens.includes(token)).length;
      const tokenScore = matchCount / m.labelTokens.length;

      if (tokenScore >= 0.75) {
        score = Math.max(score, tokenScore * 0.90);
      }
    }

    // Input type compatibility bonus/penalty
    const fieldTag = (scannedField.tagName || scannedField.type || '').toLowerCase();
    if (m.valueType === 'select' && fieldTag !== 'select' && !fieldTag.includes('select')) {
      score -= 0.20;
    }

    if (score >= 0.70 && score > highestScore) {
      highestScore = score;
      bestMatch = {
        mapping: m,
        confidence: Math.min(1.0, score * (m.confidence || 1.0))
      };
    }
  }

  return bestMatch;
}

/**
 * Resolves value for a matched learned mapping dynamically from Candidate Profile.
 */
export function resolveLearnedMappingValue(candidateProfile, mapping) {
  if (!candidateProfile || !mapping || !mapping.profilePath) return null;
  return resolveProfileValue(candidateProfile, mapping.profilePath);
}
