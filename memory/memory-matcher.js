/**
 * Multi-Tier Memory Matcher Pipeline
 * Order: 1. Deterministic rules -> 2. Remembered answers -> 3. Profile fields -> 4. Context rules -> 5. AI fallback
 */

import { isSensitiveOrForbiddenField } from '../storage/learning-schema.js';

export function matchFieldToMemory(scannedField = {}, userMemory = {}, currentDomain = '') {
  const profile = userMemory.profile || {};
  const rememberedAnswers = userMemory.rememberedAnswers || [];

  const rawName = (scannedField.name || scannedField.id || '').replace(/\[\]$/, '').toLowerCase().replace(/^(txt|drp|inp|fld|candidate_)/, '');
  const labelTxt = scannedField.label || scannedField.ariaLabel || '';
  const placeholderLower = (scannedField.placeholder || '').toLowerCase().trim();
  const contextStr = `${rawName} ${labelTxt.toLowerCase()} ${placeholderLower}`;

  // Safety check: Never match passwords, payment, auth, or sensitive demographic fields
  if (isSensitiveOrForbiddenField(contextStr)) {
    return { status: 'SENSITIVE_BLOCKED', val: null, source: null };
  }

  // Tier 1: Exact Deterministic Standard Mappings
  let val = null;

  if (/first\s*name|given\s*name|forename/i.test(contextStr)) val = profile.personal?.firstName;
  else if (/last\s*name|surname|family\s*name/i.test(contextStr)) val = profile.personal?.lastName;
  else if (/full\s*name|^name$|applicant\s*name|candidate\s*name/i.test(contextStr)) val = profile.personal?.fullName;
  else if (/email/i.test(contextStr)) val = profile.contact?.email;
  else if (/phone|mobile|cell|contact\s*number/i.test(contextStr)) val = profile.contact?.phone;
  else if (/address/i.test(contextStr)) val = profile.contact?.address;
  else if (/city/i.test(contextStr)) val = profile.contact?.city;
  else if (/state|province/i.test(contextStr)) val = profile.contact?.state;
  else if (/country/i.test(contextStr)) val = profile.contact?.country;
  else if (/zip|postal/i.test(contextStr)) val = profile.contact?.postalCode;
  else if (/linkedin/i.test(contextStr)) val = profile.links?.linkedin;
  else if (/github/i.test(contextStr)) val = profile.links?.github;
  else if (/portfolio|website/i.test(contextStr)) val = profile.links?.portfolio;
  else if (/title|designation|position|role/i.test(contextStr)) val = profile.professional?.currentTitle;
  else if (/company|employer|organization|workplace|work\s*place/i.test(contextStr)) val = profile.professional?.currentCompany;
  else if (/experience|years/i.test(contextStr)) val = profile.professional?.totalExperience;
  else if (/skills|technology\s*stack|tech\s*stack|competencies/i.test(contextStr)) val = (profile.professional?.skills || []).join(', ');
  else if (/notice|availability|joining/i.test(contextStr)) val = profile.professional?.noticePeriod || profile.preferences?.noticePeriod;
  else if (/summary|background|overview|about/i.test(contextStr)) val = profile.professional?.summary;

  if (val && String(val).trim() !== '') {
    return { status: 'MATCHED', val: String(val).trim(), source: 'deterministic' };
  }

  // Tier 2: Previously Saved Remembered Answers
  if (rememberedAnswers.length > 0) {
    const hostDomain = String(currentDomain || '').toLowerCase().trim().replace(/^www\./, '');

    for (const ans of rememberedAnswers) {
      if (ans.scope === 'site' && ans.domain && !hostDomain.includes(ans.domain.toLowerCase())) {
        continue;
      }
      const qLower = (ans.questionText || '').toLowerCase();
      const mLower = (ans.meaning || '').toLowerCase();

      if ((qLower && contextStr.includes(qLower)) || (mLower && contextStr.includes(mLower))) {
        if (ans.value && String(ans.value).trim() !== '') {
          return { status: 'MATCHED', val: String(ans.value).trim(), source: 'remembered' };
        }
      }
    }
  }

  // Tier 3: Custom Fields & Direct Profile Paths
  if (profile.customFields) {
    for (const [cKey, cVal] of Object.entries(profile.customFields)) {
      if (contextStr.includes(cKey.toLowerCase()) || cKey.toLowerCase().includes(rawName)) {
        if (cVal && String(cVal).trim() !== '') {
          return { status: 'MATCHED', val: String(cVal).trim(), source: 'custom_field' };
        }
      }
    }
  }

  return { status: 'UNFILLED', val: null, source: null };
}
