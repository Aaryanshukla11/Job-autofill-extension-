/**
 * Confidence Engine & Sensitive Fields Safety Policy
 */

import { SENSITIVE_FIELD_PATHS } from './mapping-rules.js';

export function evaluateConfidence(fieldPath, confidence, resolvedValue, settings = {}) {
  const fillSensitive = Boolean(settings.fillSensitiveFields);
  const isSensitive = SENSITIVE_FIELD_PATHS.includes(fieldPath);

  // 1. Sensitive Field Policy Gate
  if (isSensitive) {
    if (!fillSensitive || !resolvedValue) {
      return {
        action: "DO_NOT_FILL",
        reason: "Protected sensitive field policy — manual review required",
        requiresReview: true
      };
    }
  }

  // 2. Empty / Unresolved value check
  if (!resolvedValue || String(resolvedValue).trim() === '') {
    return {
      action: "DO_NOT_FILL",
      reason: "No value present in Candidate Profile",
      requiresReview: false
    };
  }

  // 3. Threshold Decision Matrix
  if (confidence >= 0.90) {
    return {
      action: "AUTO_FILL",
      reason: "High confidence match",
      requiresReview: false
    };
  }

  if (confidence >= 0.75) {
    return {
      action: "FILL_AND_FLAG",
      reason: "Moderate confidence — review recommended",
      requiresReview: true
    };
  }

  return {
    action: "DO_NOT_FILL",
    reason: "Low confidence match (<0.75)",
    requiresReview: true
  };
}
