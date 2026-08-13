/**
 * Post-Fill Validation Engine
 * Scans page form after autofill, categorizing fields into Filled, Review Needed, or Unfilled.
 */

import { isValidEmail, isValidPhone } from './constraints.js';

export function validateFormState(scannedFields = []) {
  let filledCount = 0;
  let reviewCount = 0;
  let unfilledCount = 0;

  const results = scannedFields.map(field => {
    const el = field.elementRef;
    const value = el ? (el.value || el.innerHTML || '').trim() : '';
    const isFilled = Boolean(el && (el.getAttribute('data-ai-filled') === '1' || value.length > 0));
    const isRequired = field.required;

    let status = "UNFILLED";
    let message = "";

    if (isFilled) {
      status = "FILLED";
      filledCount++;

      // Post-fill format check warnings
      if (field.fieldPath === 'contact.email' && !isValidEmail(value)) {
        status = "REVIEW_NEEDED";
        reviewCount++;
        filledCount--;
        message = "Email format check warning";
      } else if (field.fieldPath === 'contact.phone' && !isValidPhone(value)) {
        status = "REVIEW_NEEDED";
        reviewCount++;
        filledCount--;
        message = "Phone format check warning";
      }
    } else if (isRequired) {
      status = "UNFILLED_REQUIRED";
      unfilledCount++;
      message = "Required field could not be filled automatically";
    } else {
      status = "UNFILLED";
      unfilledCount++;
      message = "Field not filled";
    }

    return {
      index: field.index,
      label: field.label || field.name || field.id || `Field #${field.index + 1}`,
      fieldPath: field.fieldPath || 'Unknown',
      value: value.length > 40 ? value.substring(0, 40) + '...' : value,
      status,
      message,
      required: isRequired
    };
  });

  return {
    filledCount,
    reviewCount,
    unfilledCount,
    totalFields: scannedFields.length,
    fields: results
  };
}
