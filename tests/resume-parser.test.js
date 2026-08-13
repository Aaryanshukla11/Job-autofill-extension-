/**
 * Unit Test: Resume Parser
 */

import { parseResumeText } from '../resume/resume-parser.js';

function runTest() {
  console.log('--- Testing Resume Parser ---');

  const sampleResume = `
  John Doe
  Software Engineer | Backend Developer
  john.doe@example.com | +1 555 019 2834 | New York, NY
  https://linkedin.com/in/johndoe | https://github.com/johndoe

  SUMMARY
  Experienced Software Engineer with 4 years experience in Python, JavaScript, React, Node.js, AWS, and Docker.

  EDUCATION
  Bachelor of Technology in Computer Science - NYU
  `;

  const profile = parseResumeText(sampleResume, 'john_resume.pdf');

  let passed = 0;
  let total = 5;

  if (profile.contact.email === 'john.doe@example.com') { console.log('[PASS] Email extracted correctly'); passed++; }
  else console.error('[FAIL] Email extraction mismatch:', profile.contact.email);

  if (profile.contact.phone && profile.contact.phone.includes('555')) { console.log('[PASS] Phone extracted correctly'); passed++; }
  else console.error('[FAIL] Phone extraction mismatch:', profile.contact.phone);

  if (profile.links.linkedin && profile.links.linkedin.includes('linkedin.com/in/johndoe')) { console.log('[PASS] LinkedIn URL extracted correctly'); passed++; }
  else console.error('[FAIL] LinkedIn URL extraction mismatch:', profile.links.linkedin);

  if (profile.professional.skills.includes('Python') && profile.professional.skills.includes('React')) { console.log('[PASS] Skills extracted correctly'); passed++; }
  else console.error('[FAIL] Skills extraction mismatch:', profile.professional.skills);

  if (profile.personal.firstName === 'John' && profile.personal.lastName === 'Doe') { console.log('[PASS] Name extracted correctly'); passed++; }
  else console.error('[FAIL] Name extraction mismatch:', profile.personal);

  console.log(`Resume Parser Result: ${passed}/${total} Passed\n`);
  return passed === total;
}

runTest();
