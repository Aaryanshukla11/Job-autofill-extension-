/**
 * File Input Handler
 * Detects file inputs (Resume, CV, Cover Letter) and returns metadata for manual user selection.
 */

export function handleFileInputs() {
  const fileInputs = Array.from(document.querySelectorAll('input[type=file]'));
  const results = [];

  fileInputs.forEach((input, index) => {
    let labelText = '';
    if (input.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
      if (lbl) labelText = lbl.textContent.trim();
    }
    if (!labelText && input.parentElement) {
      labelText = input.parentElement.textContent.trim();
    }

    const context = `${input.name} ${input.id} ${labelText}`.toLowerCase();

    let docType = 'Document';
    if (/resume|cv|curriculum/i.test(context)) {
      docType = 'Resume / CV';
    } else if (/cover\s*letter/i.test(context)) {
      docType = 'Cover Letter';
    } else if (/portfolio|transcript|cert/i.test(context)) {
      docType = 'Portfolio / Additional Document';
    }

    results.push({
      index,
      element: input,
      docType,
      message: `${docType} field detected — please select your file manually in Chrome.`
    });
  });

  return results;
}
