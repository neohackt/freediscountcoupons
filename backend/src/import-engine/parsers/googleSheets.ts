import type { ParsedRow } from '../types';
import { parseCSV } from './csv';

export async function parseGoogleSheet(url: string): Promise<ParsedRow[]> {
  const sheetUrl = convertGoogleSheetUrl(url);
  const response = await fetch(sheetUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet: ${response.status} ${response.statusText}`);
  }

  const csvContent = await response.text();
  return parseCSV(csvContent);
}

export function convertGoogleSheetUrl(url: string): string {
  const spreadsheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)\/edit/);
  if (spreadsheetIdMatch) {
    const spreadsheetId = spreadsheetIdMatch[1];
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  }

  const directUrlMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (directUrlMatch) {
    const spreadsheetId = directUrlMatch[1];
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  }

  if (url.startsWith('https://docs.google.com/spreadsheets/d/')) {
    return `${url}/export?format=csv`;
  }

  throw new Error('Invalid Google Sheets URL format');
}

export function isGoogleSheetUrl(url: string): boolean {
  return url.includes('docs.google.com/spreadsheets');
}