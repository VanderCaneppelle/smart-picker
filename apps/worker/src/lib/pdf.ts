// Usamos @cyber2024/pdf-parse-fixed: o pdf-parse original embute uma versão antiga do
// pdf.js (v1.10.100) que falha com "bad XRef entry" em muitos PDFs válidos (Word, Google
// Docs, alguns exportadores). O fork corrige tratamento de XRef e evita esse erro em PDFs simples.
import pdf from '@cyber2024/pdf-parse-fixed';

const MIN_EXTRACTED_LENGTH = 50; // PDFs só com imagem retornam texto vazio ou quase nada

/**
 * Extracts text from a PDF buffer. Never throws: on malformed PDF (e.g. bad XRef),
 * image-only, or parse errors returns empty string so the caller can continue with fallback.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    const text = (data.text || '').trim();
    if (text.length < MIN_EXTRACTED_LENGTH) {
      console.warn(
        `PDF returned very little text (${text.length} chars). Likely image-based or scanned.`
      );
      return '';
    }
    return text;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error extracting text from PDF:', msg);
    return '';
  }
}

/**
 * Fetches a PDF from URL and extracts text. Never throws: on fetch failure or parse
 * error (malformed PDF, bad XRef, etc.) returns empty string so scoring can continue
 * using application answers.
 */
export async function fetchAndParsePdf(url: string): Promise<string> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch PDF: ${response.status} ${url}`);
      return '';
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return extractTextFromPdf(buffer);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error fetching and parsing PDF:', msg);
    return '';
  }
}
