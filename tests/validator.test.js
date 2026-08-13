/**
 * Unit Test: Validator
 */

import { isValidEmail, isValidPhone } from '../validation/constraints.js';

function runTest() {
  console.log('--- Testing Validator Constraints ---');

  let passed = 0;
  let total = 4;

  if (isValidEmail('user@domain.com') === true) { console.log('[PASS] Valid email accepted'); passed++; }
  else console.error('[FAIL] Valid email rejected');

  if (isValidEmail('invalid-email') === false) { console.log('[PASS] Invalid email rejected'); passed++; }
  else console.error('[FAIL] Invalid email accepted');

  if (isValidPhone('+1 555 019 2834') === true) { console.log('[PASS] Valid phone accepted'); passed++; }
  else console.error('[FAIL] Valid phone rejected');

  if (isValidPhone('123') === false) { console.log('[PASS] Short phone rejected'); passed++; }
  else console.error('[FAIL] Short phone accepted');

  console.log(`Validator Result: ${passed}/${total} Passed\n`);
  return passed === total;
}

runTest();
