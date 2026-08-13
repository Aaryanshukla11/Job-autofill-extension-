/**
 * Client-Side DOCX Text Extractor
 * Extracts text from DOCX files by scanning XML text nodes (<w:t>).
 */

export async function extractTextFromDOCX(arrayBuffer) {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const textDecoder = new TextDecoder('utf-8');
    const rawString = textDecoder.decode(bytes);

    const textNodes = [];

    // Extract text inside <w:t>...</w:t> tags
    const wtMatches = rawString.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/gi);
    for (const match of wtMatches) {
      if (match[1]) {
        // Decode basic XML entities
        const cleanText = match[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
        textNodes.push(cleanText);
      }
    }

    if (textNodes.length > 0) {
      return textNodes.join(' ').replace(/\s+/g, ' ').trim();
    }

    // Fallback: search for any printable XML text content between > and <
    const xmlTextMatches = rawString.match(/>([^<]{2,})</g);
    if (xmlTextMatches) {
      const fallbackNodes = xmlTextMatches
        .map(m => m.slice(1, -1).trim())
        .filter(t => t.length > 1 && !/^w:|\/w:|\{|\}/.test(t));
      return fallbackNodes.join(' ').replace(/\s+/g, ' ').trim();
    }

    return rawString.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  } catch (err) {
    console.error('DOCX text extraction error:', err);
    throw new Error('Failed to extract text from DOCX file: ' + err.message);
  }
}
