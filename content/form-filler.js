/**
 * Form Filler Engine
 * Fills DOM input, textarea, select, checkbox, radio, contenteditable, and iframe elements safely.
 */

import { reactSetNativeValue, dispatchInputEvents } from './event-dispatcher.js';

export function fillElement(element, value) {
  if (!element || value === undefined || value === null) return false;

  const tag = element.tagName.toUpperCase();
  const type = (element.type || '').toLowerCase();
  const strVal = String(value).trim();

  // 1. Select Dropdown
  if (tag === 'SELECT') {
    return smartSelectMatch(element, strVal);
  }

  // 2. Checkbox
  if (type === 'checkbox') {
    const shouldCheck = strVal === 'true' || strVal === '1' || strVal.toLowerCase() === 'yes';
    element.checked = shouldCheck;
    dispatchInputEvents(element);
    element.setAttribute('data-ai-filled', '1');
    return true;
  }

  // 3. Radio Button
  if (type === 'radio') {
    const radioName = element.name;
    if (radioName) {
      const group = Array.from(document.querySelectorAll(`input[type=radio][name="${CSS.escape(radioName)}"]`));
      const match = group.find(r => r.value.toLowerCase() === strVal.toLowerCase() || (r.labels && r.labels[0] && r.labels[0].textContent.trim().toLowerCase() === strVal.toLowerCase()));
      if (match) {
        match.checked = true;
        dispatchInputEvents(match);
        match.setAttribute('data-ai-filled', '1');
        return true;
      }
    }
    return false;
  }

  // 4. ContentEditable / Rich Text
  if (element.isContentEditable) {
    element.innerHTML = strVal;
    dispatchInputEvents(element);
    element.setAttribute('data-ai-filled', '1');
    return true;
  }

  // 5. Standard Input / Textarea
  reactSetNativeValue(element, strVal);
  element.setAttribute('data-ai-filled', '1');
  return true;
}

export function smartSelectMatch(selectElement, candidateValue) {
  if (!selectElement || selectElement.tagName !== 'SELECT') return false;

  const options = Array.from(selectElement.options).filter(o => o.value && o.value !== '-1' && o.value !== '0');
  if (options.length === 0) return false;

  const normalizedCandidate = candidateValue.toLowerCase().trim();

  // Exact value/text match first
  let bestMatch = options.find(o => o.value.toLowerCase() === normalizedCandidate || o.text.trim().toLowerCase() === normalizedCandidate);

  // Partial match second
  if (!bestMatch) {
    bestMatch = options.find(o => o.text.toLowerCase().includes(normalizedCandidate) || normalizedCandidate.includes(o.text.toLowerCase()));
  }

  // Keyword token match third
  if (!bestMatch) {
    const candidateTokens = normalizedCandidate.split(/[\s,\/]+/).filter(t => t.length > 2);
    let highestScore = -1;

    options.forEach(opt => {
      const optText = opt.text.toLowerCase();
      let score = 0;
      candidateTokens.forEach(token => {
        if (optText.includes(token)) score += token.length;
      });
      if (score > highestScore && score > 0) {
        highestScore = score;
        bestMatch = opt;
      }
    });
  }

  if (bestMatch) {
    selectElement.value = bestMatch.value;
    dispatchInputEvents(selectElement);
    selectElement.setAttribute('data-ai-filled', '1');
    return true;
  }

  return false;
}
