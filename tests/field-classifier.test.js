/**
 * Unit Test: Field Classifier
 */

import { classifyField } from '../autofill/field-classifier.js';

function runTest() {
  console.log('--- Testing Field Classifier ---');

  const testCases = [
    { field: { name: 'email' }, expectedPath: 'contact.email' },
    { field: { name: 'candidate_email_address' }, expectedPath: 'contact.email' },
    { field: { name: 'fname' }, expectedPath: 'personal.firstName' },
    { field: { name: 'phoneNumber' }, expectedPath: 'contact.phone' },
    { field: { name: 'linkedin_url' }, expectedPath: 'links.linkedin' },
    { field: { label: 'Your Mobile Number' }, expectedPath: 'contact.phone' }
  ];

  let passed = 0;
  testCases.forEach((tc, idx) => {
    const res = classifyField(tc.field);
    const ok = res.fieldPath === tc.expectedPath;
    if (ok) {
      console.log(`[PASS] Case #${idx + 1}: ${JSON.stringify(tc.field)} -> ${res.fieldPath}`);
      passed++;
    } else {
      console.error(`[FAIL] Case #${idx + 1}: Expected ${tc.expectedPath}, got ${res.fieldPath}`);
    }
  });

  console.log(`Field Classifier Result: ${passed}/${testCases.length} Passed\n`);
  return passed === testCases.length;
}

runTest();
