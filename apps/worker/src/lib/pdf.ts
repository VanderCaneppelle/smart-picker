// Usamos @cyber2024/pdf-parse-fixed: o pdf-parse original embute uma versão antiga do
// pdf.js (v1.10.100) que falha com "bad XRef entry" em muitos PDFs válidos (Word, Google
// Docs, alguns exportadores). O fork corrige tratamento de XRef e evita esse erro em PDFs simples.
import pdf from '@cyber2024/pdf-parse-fixed';
import { debugLog } from './debugLog.js';

const MIN_EXTRACTED_LENGTH = 50; // PDFs só com imagem retornam texto vazio ou quase nada

/**
 * Extracts text from a PDF buffer. Never throws: on malformed PDF (e.g. bad XRef),
 * image-only, or parse errors returns empty string so the caller can continue with fallback.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    const text = (data.text || '').trim();
    // #region agent log
    const pl = { location: 'pdf.ts:extractTextFromPdf', message: 'Extract result', data: { bufferBytes: buffer.length, rawTextLength: text.length, belowMin: text.length < MIN_EXTRACTED_LENGTH }, hypothesisId: 'H4' };
    debugLog(pl);
    fetch('http://127.0.0.1:7243/ingest/4b01b58f-b193-4b12-b52e-e57203e7d60a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pl)}).catch(()=>{});
    // #endregion
    if (text.length < MIN_EXTRACTED_LENGTH) {
      console.warn(
        `PDF returned very little text (${text.length} chars). Likely image-based or scanned.`
      );
      return '';
    }
    return text;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // #region agent log
    const plCatch = { location: 'pdf.ts:extractTextFromPdf-catch', message: 'Extract error', data: { error: msg }, hypothesisId: 'H4' };
    debugLog(plCatch);
    fetch('http://127.0.0.1:7243/ingest/4b01b58f-b193-4b12-b52e-e57203e7d60a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(plCatch)}).catch(()=>{});
    // #endregion
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
    // #region agent log
    const plFetch = { location: 'pdf.ts:fetchAndParsePdf', message: 'PDF fetch response', data: { ok: response.ok, status: response.status, urlLength: url.length }, hypothesisId: 'H3-H5' };
    debugLog(plFetch);
    fetch('http://127.0.0.1:7243/ingest/4b01b58f-b193-4b12-b52e-e57203e7d60a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(plFetch)}).catch(()=>{});
    // #endregion
    if (!response.ok) {
      console.error(`Failed to fetch PDF: ${response.status} ${url}`);
      return '';
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extracted = await extractTextFromPdf(buffer);
    // #region agent log
    const plAfter = { location: 'pdf.ts:after-extract', message: 'After extractTextFromPdf', data: { bufferBytes: buffer.length, extractedLength: extracted?.length ?? 0 }, hypothesisId: 'H4' };
    debugLog(plAfter);
    fetch('http://127.0.0.1:7243/ingest/4b01b58f-b193-4b12-b52e-e57203e7d60a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(plAfter)}).catch(()=>{});
    // #endregion
    return extracted;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // #region agent log
    const plFetchCatch = { location: 'pdf.ts:fetchAndParsePdf-catch', message: 'Fetch/parse error', data: { error: msg }, hypothesisId: 'H3-H5' };
    debugLog(plFetchCatch);
    fetch('http://127.0.0.1:7243/ingest/4b01b58f-b193-4b12-b52e-e57203e7d60a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(plFetchCatch)}).catch(()=>{});
    // #endregion
    console.error('Error fetching and parsing PDF:', msg);
    return '';
  }
}
