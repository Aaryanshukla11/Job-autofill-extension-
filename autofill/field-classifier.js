/**
 * Layered Field Classifier
 * 8-Tier Priority Pipeline for deterministic & AI field classification.
 */

import { normalizeFieldName } from './field-normalizer.js';
import { FIELD_MAPPING_DICTIONARY } from './mapping-rules.js';

export function classifyField(fieldMeta, customSelectors = {}) {
  const { name, id, placeholder, label, nearbyText } = fieldMeta;

  // Tier 1: Exact Name/ID Dictionary Match
  if (name && name in FIELD_MAPPING_DICTIONARY) {
    return { fieldPath: FIELD_MAPPING_DICTIONARY[name], confidence: 0.98, tier: "Exact Mapping" };
  }
  if (id && id in FIELD_MAPPING_DICTIONARY) {
    return { fieldPath: FIELD_MAPPING_DICTIONARY[id], confidence: 0.98, tier: "Exact Mapping" };
  }

  // Tier 2: Normalized Name/ID Match
  const normalizedName = normalizeFieldName(name);
  if (normalizedName && normalizedName in FIELD_MAPPING_DICTIONARY) {
    return { fieldPath: FIELD_MAPPING_DICTIONARY[normalizedName], confidence: 0.95, tier: "Normalized Mapping" };
  }
  const normalizedId = normalizeFieldName(id);
  if (normalizedId && normalizedId in FIELD_MAPPING_DICTIONARY) {
    return { fieldPath: FIELD_MAPPING_DICTIONARY[normalizedId], confidence: 0.95, tier: "Normalized Mapping" };
  }

  // Tier 3: Custom Selectors Match
  if (name && customSelectors[name]) {
    return { fieldPath: customSelectors[name], confidence: 0.96, tier: "Custom Selectors" };
  }

  // Tier 4: Label Heuristic Match
  if (label) {
    const normLabel = normalizeFieldName(label);
    if (normLabel && normLabel in FIELD_MAPPING_DICTIONARY) {
      return { fieldPath: FIELD_MAPPING_DICTIONARY[normLabel], confidence: 0.90, tier: "Label Mapping" };
    }
    // Partial label match
    for (const [key, path] of Object.entries(FIELD_MAPPING_DICTIONARY)) {
      if (normLabel.includes(key) || key.includes(normLabel)) {
        return { fieldPath: path, confidence: 0.88, tier: "Label Heuristic" };
      }
    }
  }

  // Tier 5: Placeholder Match
  if (placeholder) {
    const normPlaceholder = normalizeFieldName(placeholder);
    for (const [key, path] of Object.entries(FIELD_MAPPING_DICTIONARY)) {
      if (normPlaceholder.includes(key)) {
        return { fieldPath: path, confidence: 0.85, tier: "Placeholder Mapping" };
      }
    }
  }

  // Tier 6: Context / Nearby Text Match
  if (nearbyText) {
    const normNearby = normalizeFieldName(nearbyText);
    for (const [key, path] of Object.entries(FIELD_MAPPING_DICTIONARY)) {
      if (normNearby.includes(key)) {
        return { fieldPath: path, confidence: 0.80, tier: "Context Mapping" };
      }
    }
  }

  // Tier 7 & 8: Unclassified / Needs AI Fallback
  return { fieldPath: null, confidence: 0.0, tier: "Unclassified" };
}
