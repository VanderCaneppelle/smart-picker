import mammoth from 'mammoth';

const MIN_EXTRACTED_LENGTH = 50;

/**
 * Fetches a .docx from URL and extracts raw text. Never throws: on fetch failure
 * or parse error returns empty string so scoring can continue using application answers.
 */
export async function fetchAndParseDocx(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch DOCX: ${response.status} ${url}`);
      return '';
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value || '').trim();
    if (text.length < MIN_EXTRACTED_LENGTH) {
      console.warn(`DOCX returned very little text (${text.length} chars).`);
      return '';
    }
    return text;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error fetching and parsing DOCX:', msg);
    return '';
  }
}
