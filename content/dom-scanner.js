/**
 * DOM Scanner
 * Collects form field elements and metadata from active webpage DOM.
 */

export function scanDOMFields() {
  const selector = 'input:not([type=hidden]):not([type=reset]), textarea, select, [contenteditable=true]';
  const elements = Array.from(document.querySelectorAll(selector));

  const scannedFields = [];

  elements.forEach((el, index) => {
    const tag = el.tagName.toUpperCase();
    const type = (el.type || (tag === 'TEXTAREA' ? 'textarea' : tag === 'SELECT' ? 'select' : 'text')).toLowerCase();

    // Skip submit/button types from form scanner field list
    if (type === 'submit' || type === 'button' || type === 'image') return;

    // 1. Associated Label text
    let labelText = '';
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) labelText = lbl.textContent.trim();
    }
    if (!labelText && el.closest('label')) {
      labelText = el.closest('label').textContent.replace(el.value || '', '').trim();
    }

    // 2. Nearby Text (parent/sibling context)
    let nearbyText = '';
    let parent = el.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      const txt = (parent.textContent || '').replace(el.value || '', '').trim();
      if (txt.length > 2 && txt.length < 120) {
        nearbyText = txt;
        break;
      }
      parent = parent.parentElement;
    }

    // 3. Select Options
    let options = [];
    if (tag === 'SELECT') {
      options = Array.from(el.options)
        .map(o => ({ value: o.value, text: o.text.trim() }))
        .filter(o => o.text && o.value !== '-1');
    }

    // 4. Required attribute/aria check
    const isRequired = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true' || /required|\*/i.test(labelText || nearbyText);

    scannedFields.push({
      index,
      tag,
      type,
      name: el.name || '',
      id: el.id || '',
      placeholder: el.placeholder || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      label: labelText,
      nearbyText: nearbyText.substring(0, 150),
      required: Boolean(isRequired),
      options,
      elementRef: el // Weak DOM reference for local filling
    });
  });

  return scannedFields;
}
