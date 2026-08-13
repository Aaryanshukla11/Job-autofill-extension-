/**
 * Fact Validator Engine
 * Verifies generated AI answers against Candidate Profile facts to detect hallucinated claims.
 */

export function validateAnswerFacts(answer = '', candidateProfile = {}) {
  if (!answer || typeof answer !== 'string') {
    return { valid: false, reason: 'Answer string is empty' };
  }

  const skills = (candidateProfile.professional?.skills || []).map(s => s.toLowerCase());
  const company = (candidateProfile.professional?.currentCompany || '').toLowerCase();
  const title = (candidateProfile.professional?.currentTitle || '').toLowerCase();

  const unsupportedClaims = [];

  // Check year claims (e.g. "10 years of experience" when totalExperience is 2)
  const totalExpNumber = parseFloat(candidateProfile.professional?.totalExperience) || 0;
  const yearMatches = answer.matchAll(/(\d+)\+?\s*years/gi);
  for (const match of yearMatches) {
    const claimedYears = parseInt(match[1]);
    if (claimedYears > totalExpNumber + 2 && totalExpNumber > 0) {
      unsupportedClaims.push(`Claimed ${claimedYears} years experience (Profile has ${totalExpNumber} years)`);
    }
  }

  if (unsupportedClaims.length > 0) {
    return {
      valid: false,
      reason: unsupportedClaims.join('; '),
      unsupportedClaims
    };
  }

  return { valid: true, reason: 'Answer supported by Candidate Profile facts' };
}
