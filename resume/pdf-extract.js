/**
 * Pure Browser Native PDF Text Extractor
 * Uses Chrome native DecompressionStream ('deflate') to decode compressed PDF streams
 * without canvas or DOMMatrix errors.
 */

export async function extractTextFromPDF(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('PDF file is empty');
  }

  const bytes = new Uint8Array(arrayBuffer);
  let rawStr = '';

  // Decode ascii/latin1 string for stream scanning
  for (let i = 0; i < bytes.length; i++) {
    rawStr += String.fromCharCode(bytes[i]);
  }

  const textBlocks = [];
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;

  while ((match = streamRegex.exec(rawStr)) !== null) {
    const streamRaw = match[1];
    let decompressed = '';

    // Convert raw stream string back to Uint8Array
    const streamBytes = new Uint8Array(streamRaw.length);
    for (let i = 0; i < streamRaw.length; i++) {
      streamBytes[i] = streamRaw.charCodeAt(i) & 0xff;
    }

    try {
      if (typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        writer.write(streamBytes);
        writer.close();
        const decompressedBuffer = await new Response(ds.readable).arrayBuffer();
        const textDecoder = new TextDecoder('utf-8');
        decompressed = textDecoder.decode(decompressedBuffer);
      } else {
        decompressed = streamRaw;
      }
    } catch (e) {
      decompressed = streamRaw;
    }

    // Extract text in (string) Tj or [(string)] TJ
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

  let rawExtracted = textBlocks.join(' ')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\([()])/g, '$1')
    .replace(/\\\\/g, '\\');

  if (!rawExtracted || rawExtracted.trim().length < 10) {
    // Fallback printable text extraction
    rawExtracted = rawStr.replace(/<[^>]+>/g, ' ').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  }

  return cleanPdfText(rawExtracted);
}

function cleanPdfText(text) {
  let cleaned = text;

  // 1. Fix spaced email characters: "a r y a n s h u k l a 1 1 5 5 @ g m a i l . c o m"
  cleaned = cleaned.replace(/([a-zA-Z0-9._%+-])\s+([a-zA-Z0-9._%+-])\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/g, '$1$2@$3.$4');
  
  // 2. Fix spaced single letter words: "A r y a n K u m a r" -> "Aryan Kumar"
  for (let i = 0; i < 4; i++) {
    cleaned = cleaned.replace(/\b([a-zA-Z0-9])\s+([a-zA-Z0-9])\b/g, '$1$2');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}
