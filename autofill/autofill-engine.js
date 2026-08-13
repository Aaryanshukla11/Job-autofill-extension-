/**
 * Main Autofill Orchestration Engine
 * Coordinates page detection, DOM scanning, layered field classification, value resolution,
 * confidence policy evaluation, element filling, and post-fill validation.
 */

import { detectPageType } from '../content/page-detector.js';
import { scanDOMFields } from '../content/dom-scanner.js';
import { classifyField } from './field-classifier.js';
import { resolveProfileValue } from './value-resolver.js';
import { evaluateConfidence } from './confidence.js';
import { fillElement } from '../content/form-filler.js';
import { handleFileInputs } from '../content/file-handler.js';
import { validateFormState } from '../validation/validator.js';

export async function executeAutofillWorkflow(candidateProfile, settings = {}) {
  // Step 1: Page Detection Gate
  const pageDetection = detectPageType();
  if (pageDetection.pageType !== 'APPLICATION_FORM' || pageDetection.confidence < 0.60) {
    return {
      success: false,
      reason: `Page classified as ${pageDetection.pageType} (confidence ${Math.round(pageDetection.confidence * 100)}%). Autofill requires an active job application form.`,
      pageDetection
    };
  }

  // Step 2: DOM Scanning
  const fields = scanDOMFields();
  if (!fields || fields.length === 0) {
    return {
      success: false,
      reason: "No fillable form fields detected on the current webpage.",
      pageDetection
    };
  }

  // Step 3: Classification & Value Resolution
  let filledCount = 0;
  let reviewCount = 0;
  const fieldResults = [];

  for (const field of fields) {
    const classification = classifyField(field);
    field.fieldPath = classification.fieldPath;

    if (classification.fieldPath) {
      const resolvedValue = resolveProfileValue(candidateProfile, classification.fieldPath);
      const confidenceEval = evaluateConfidence(classification.fieldPath, classification.confidence, resolvedValue, settings);

      if (confidenceEval.action === 'AUTO_FILL' || confidenceEval.action === 'FILL_AND_FLAG') {
        const filled = fillElement(field.elementRef, resolvedValue);
        if (filled) {
          filledCount++;
          if (confidenceEval.requiresReview) reviewCount++;

          fieldResults.push({
            label: field.label || field.name || field.id,
            fieldPath: classification.fieldPath,
            status: confidenceEval.requiresReview ? 'REVIEW_NEEDED' : 'FILLED',
            value: resolvedValue
          });
          continue;
        }
      }
    }

    fieldResults.push({
      label: field.label || field.name || field.id,
      fieldPath: classification.fieldPath || 'Unknown',
      status: 'UNFILLED',
      value: null
    });
  }

  // Step 4: File Input Check
  const fileInputs = handleFileInputs();

  // Step 5: Post-fill Validation
  const validationSummary = validateFormState(fields);

  return {
    success: true,
    pageDetection,
    filledCount,
    reviewCount,
    unfilledCount: fields.length - filledCount,
    totalFields: fields.length,
    fileInputs,
    validationSummary
  };
}
