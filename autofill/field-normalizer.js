/**
 * Field Normalizer
 * Normalizes camelCase, snake_case, kebab-case, brackets, and prefixes.
 */

export function normalizeFieldName(rawName = '') {
  if (!rawName || typeof rawName !== 'string') return '';

  let name = rawName.trim();

  // Strip brackets, array markers, and prefixes
  name = name.replace(/\[\]$/, '');
  name = name.replace(/^(txt|drp|inp|fld|frm|candidate_|user_|applicant_)/i, '');

  // Convert camelCase / kebab-case / snake_case to lowercase words
  name = name
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-_\s]+/g, '_')
    .toLowerCase();

  return name;
}
