/**
 * PDF Text Extractor powered by Mozilla PDF.js with Pure Fallback
 * Primary: Mozilla PDF.js (decodes font tables, layouts, and all PDF stream types in browser)
 * Fallback: Pure stream string scanner
 */

import * as pdfjsLib from './libs/pdf.min.mjs';

try {
  if (typeof window !== 'undefined' || typeof self !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./libs/pdf.worker.min.mjs', import.meta.url).href;
  }
} catch (e) {
  console.warn('[AI Job Autofill] PDF worker setup notice:', e);
}

export async function extractTextFromPDF(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('PDF file is empty');
  }

  // 1. Primary Engine: Mozilla PDF.js
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true
    });

    const pdfDoc = await loadingTask.promise;
    const pageTextPromises = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      pageTextPromises.push(
        pdfDoc.getPage(pageNum).then(async page => {
          const textContent = await page.getTextContent();
          return textContent.items.map(item => item.str).join(' ');
        })
      );
    }

    const pagesText = await Promise.all(pageTextPromises);
    const extractedText = pagesText.join('\n')
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (extractedText && extractedText.length >= 10) {
      return cleanPdfText(extractedText);
    }
  } catch (pdfJsErr) {
    console.warn('[AI Job Autofill] PDF.js primary extraction notice:', pdfJsErr);
  }

  // 2. Pure Synchronous Fallback
  return fallbackPdfExtraction(arrayBuffer);
}

function fallbackPdfExtraction(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const textBlocks = [];

  for (let i = 0; i < bytes.length - 6; i++) {
    if (
      bytes[i] === 115 &&
      bytes[i + 1] === 116 &&
      bytes[i + 2] === 114 &&
      bytes[i + 3] === 101 &&
      bytes[i + 4] === 97 &&
      bytes[i + 5] === 109
    ) {
      let startPos = i + 6;
      if (bytes[startPos] === 13) startPos++;
      if (bytes[startPos] === 10) startPos++;

      let endPos = -1;
      for (let j = startPos; j < bytes.length - 9; j++) {
        if (
          bytes[j] === 101 &&
          bytes[j + 1] === 110 &&
          bytes[j + 2] === 100 &&
          bytes[j + 3] === 115 &&
          bytes[j + 4] === 116 &&
          bytes[j + 5] === 114 &&
          bytes[j + 6] === 101 &&
          bytes[j + 7] === 97 &&
          bytes[j + 8] === 109
        ) {
          endPos = j;
          break;
        }
      }

      if (endPos > startPos) {
        const streamBytes = bytes.subarray(startPos, endPos);
        const decompressed = new TextDecoder('latin1').decode(streamBytes);

        const tjMatches = decompressed.matchAll(/\(([^()\\]|\\[\s\S])*\)\s*Tj/g);
        for (const m of tjMatches) {
          const txt = m[0].slice(1, m[0].lastIndexOf(')'));
          if (txt && txt.length > 0) textBlocks.push(txt);
        }

        const arrayTjMatches = decompressed.matchAll(/\[(.*?)\]\s*TJ/gi);
        for (const m of arrayTjMatches) {
          const inner = m[1];
          const innerStrings = inner.matchAll(/\(([^()\\]|\\[\s\S])*\)/g);
          for (const sm of innerStrings) {
            const txt = sm[0].slice(1, -1);
            if (txt && txt.length > 0) textBlocks.push(txt);
          }
        }
      }
    }
  }

  let rawExtracted = textBlocks.join(' ')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\([()])/g, '$1')
    .replace(/\\\\/g, '\\');

  if (!rawExtracted || rawExtracted.trim().length < 10) {
    const rawStr = new TextDecoder('latin1').decode(bytes);
    rawExtracted = rawStr.replace(/<[^>]+>/g, ' ').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  }

  return cleanPdfText(rawExtracted);
}

function cleanPdfText(text) {
  let cleaned = text;

  // Fix spaced email characters
  cleaned = cleaned.replace(/([a-zA-Z0-9._%+-])\s+([a-zA-Z0-9._%+-])\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/g, '$1$2@$3.$4');
  
  // Fix spaced single letter words
  for (let i = 0; i < 4; i++) {
    cleaned = cleaned.replace(/\b([a-zA-Z0-9])\s+([a-zA-Z0-9])\b/g, '$1$2');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}
