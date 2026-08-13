/**
 * Value Resolver
 * Resolves candidate profile values from JSON path strings or custom fields dictionary.
 */

export function resolveProfileValue(candidateProfile, profilePath) {
  if (!candidateProfile || !profilePath) return null;

  const parts = profilePath.split('.');
  let current = candidateProfile;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      current = null;
      break;
    }
  }

  // Check custom fields dictionary if path was not found directly
  if ((current === null || current === undefined) && candidateProfile.customFields) {
    const keyName = parts[parts.length - 1].toLowerCase();
    for (const [cKey, cVal] of Object.entries(candidateProfile.customFields)) {
      if (cKey.toLowerCase() === keyName || cKey.toLowerCase().replace(/[-_\s]+/g, '') === keyName) {
        current = cVal;
        break;
      }
    }
  }

  if (Array.isArray(current)) {
    return current.join(', ');
  }

  if (current !== null && current !== undefined) {
    return String(current).trim();
  }

  return null;
}
