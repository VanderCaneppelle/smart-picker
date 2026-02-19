import pdf from 'pdf-parse';

const MIN_EXTRACTED_LENGTH = 50; // PDFs só com imagem retornam texto vazio ou quase nada

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    const text = (data.text || '').trim();
    if (text.length < MIN_EXTRACTED_LENGTH) {
      console.warn(
        `PDF returned very little text (${text.length} chars). Likely image-based or scanned.`
      );
      throw new Error('PDF has no extractable text (may be image-only)');
    }
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function fetchAndParsePdf(url: string): Promise<string> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return extractTextFromPdf(buffer);
  } catch (error) {
    console.error('Error fetching and parsing PDF:', error);
    throw error;
  }
}
