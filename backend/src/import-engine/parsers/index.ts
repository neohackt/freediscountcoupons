export { parseCSV, detectDelimiter } from './csv';
export { parseXLSX, parseXLSXFromBase64 } from './xlsx';
export { parseJSON, stringifyJSON } from './json';
export { parseGoogleSheet, convertGoogleSheetUrl, isGoogleSheetUrl } from './googleSheets';

import type { ParsedRow, ImportFormat } from '../types';
import { parseCSV } from './csv';
import { parseXLSX } from './xlsx';
import { parseJSON } from './json';
import { parseGoogleSheet } from './googleSheets';

type FileContent = ArrayBuffer | string | Buffer;

function toBuffer(content: FileContent): Buffer {
  if (Buffer.isBuffer(content)) return content;
  if (typeof content === 'string') return Buffer.from(content);
  if (content instanceof ArrayBuffer) return Buffer.from(content);
  throw new Error('Unsupported content type');
}

export async function parseFile(
  content: FileContent,
  format: ImportFormat
): Promise<ParsedRow[]> {
  switch (format) {
    case 'csv':
      return parseCSV(toBuffer(content));

    case 'xlsx':
      return parseXLSX(toBuffer(content));

    case 'json':
      return parseJSON(toBuffer(content));

    case 'google_sheet':
      if (typeof content !== 'string') {
        throw new Error('Google Sheet content must be a URL string');
      }
      return parseGoogleSheet(content);

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export async function parseFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<ParsedRow[]> {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'csv':
      return parseCSV(buffer);
    case 'xlsx':
    case 'xls':
      return parseXLSX(buffer);
    case 'json':
      return parseJSON(buffer);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}