/**
 * Validation Constraints
 * Formats, regexes, and character length constraint checks.
 */

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidLength(val, min = 0, max = Infinity) {
  if (val === null || val === undefined) return min === 0;
  const len = String(val).length;
  return len >= min && len <= max;
}
