/**
 * Unit Test: Value Resolver
 */

import { resolveProfileValue } from '../autofill/value-resolver.js';

function runTest() {
  console.log('--- Testing Value Resolver ---');

  const profile = {
    personal: { firstName: 'Alice', lastName: 'Smith' },
    contact: { email: 'alice@example.com' },
    professional: { skills: ['Python', 'Docker'] }
  };

  let passed = 0;
  let total = 3;

  if (resolveProfileValue(profile, 'personal.firstName') === 'Alice') { console.log('[PASS] personal.firstName resolved'); passed++; }
  else console.error('[FAIL] personal.firstName failed');

  if (resolveProfileValue(profile, 'contact.email') === 'alice@example.com') { console.log('[PASS] contact.email resolved'); passed++; }
  else console.error('[FAIL] contact.email failed');

  if (resolveProfileValue(profile, 'professional.skills') === 'Python, Docker') { console.log('[PASS] professional.skills resolved'); passed++; }
  else console.error('[FAIL] professional.skills failed');

  console.log(`Value Resolver Result: ${passed}/${total} Passed\n`);
  return passed === total;
}

runTest();
