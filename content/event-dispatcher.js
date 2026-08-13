/**
 * Framework-Compatible Event Dispatcher
 * Triggers standard and framework-synthetic events (React, Vue, Angular).
 */

export function dispatchInputEvents(element) {
  if (!element) return;

  try {
    element.dispatchEvent(new Event('focus', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  } catch (err) {
    console.warn('[AI Job Autofill] Event dispatch warning:', err);
  }
}

export function reactSetNativeValue(element, value) {
  if (!element) return;

  const tag = element.tagName;
  let prototype = null;

  if (tag === 'INPUT') {
    prototype = window.HTMLInputElement.prototype;
  } else if (tag === 'TEXTAREA') {
    prototype = window.HTMLTextAreaElement.prototype;
  }

  if (prototype) {
    const valueDescriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (valueDescriptor && valueDescriptor.set) {
      valueDescriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  } else {
    element.value = value;
  }

  dispatchInputEvents(element);
}
