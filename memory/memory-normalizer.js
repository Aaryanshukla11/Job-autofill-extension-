/**
 * Memory Normalizer & Merge Utilities
 * Cleanly merges user input, resume data, or imported JSON into Candidate Profile without creating duplicate fields.
 */

import { sanitizeProfile } from '../resume/profile-schema.js';

export function normalizeAndMergeProfile(existingProfile = {}, newProfileInput = {}) {
  const sanitizedNew = sanitizeProfile(newProfileInput);
  const sanitizedExisting = sanitizeProfile(existingProfile);

  const merged = JSON.parse(JSON.stringify(sanitizedExisting));

  // Merge Personal
  merged.personal = mergeSection(sanitizedExisting.personal, sanitizedNew.personal);
  if (!merged.personal.fullName && (merged.personal.firstName || merged.personal.lastName)) {
    merged.personal.fullName = [merged.personal.firstName, merged.personal.middleName, merged.personal.lastName]
      .filter(Boolean)
      .join(' ');
  }

  // Merge Contact
  merged.contact = mergeSection(sanitizedExisting.contact, sanitizedNew.contact);

  // Merge Professional
  merged.professional = mergeSection(sanitizedExisting.professional, sanitizedNew.professional);
  const existingSkills = new Set((sanitizedExisting.professional.skills || []).map(s => String(s).trim().toLowerCase()));
  const newSkills = (sanitizedNew.professional.skills || []).map(s => String(s).trim());
  const combinedSkills = [...(sanitizedExisting.professional.skills || [])];

  for (const skill of newSkills) {
    if (skill && !existingSkills.has(skill.toLowerCase())) {
      combinedSkills.push(skill);
      existingSkills.add(skill.toLowerCase());
    }
  }
  merged.professional.skills = combinedSkills;

  // Merge Links
  merged.links = mergeSection(sanitizedExisting.links, sanitizedNew.links);

  // Merge Preferences
  merged.preferences = mergeSection(sanitizedExisting.preferences, sanitizedNew.preferences);

  // Merge Custom Fields
  merged.customFields = {
    ...(sanitizedNew.customFields || {}),
    ...(sanitizedExisting.customFields || {})
  };

  return sanitizeProfile(merged);
}

function mergeSection(existingSec = {}, newSec = {}) {
  const result = { ...existingSec };
  for (const [k, newVal] of Object.entries(newSec)) {
    if (newVal !== undefined && newVal !== null && String(newVal).trim() !== '') {
      if (!result[k] || String(result[k]).trim() === '') {
        result[k] = newVal;
      }
    }
  }
  return result;
}
