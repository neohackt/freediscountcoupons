import * as XLSX from 'xlsx';
import type { ParsedRow } from '../types';

export async function parseXLSX(buffer: Buffer | ArrayBuffer): Promise<ParsedRow[]> {
  const buf = buffer instanceof ArrayBuffer ? buffer : buffer;
  const workbook = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return jsonData.map((row: Record<string, unknown>, index: number) => ({
    row: index + 1,
    data: row,
    errors: [],
  }));
}

export async function parseXLSXFromBase64(base64: string): Promise<ParsedRow[]> {
  const binaryString = Buffer.from(base64, 'base64').toString('binary');
  const buffer = new ArrayBuffer(binaryString.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binaryString.length; i++) {
    view[i] = binaryString.charCodeAt(i);
  }
  return parseXLSX(buffer);
}