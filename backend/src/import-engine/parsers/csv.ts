import { parse } from 'csv-parse';
import type { ParsedRow } from '../types';

export async function parseCSV(content: Buffer | string): Promise<ParsedRow[]> {
  const contentString = Buffer.isBuffer(content) ? content.toString('utf-8') : content;

  return new Promise((resolve, reject) => {
    const records: ParsedRow[] = [];
    const parser = parse(contentString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    let rowNum = 0;
    parser.on('readable', function () {
      let record;
      while ((record = parser.read()) !== null) {
        rowNum++;
        records.push({ row: rowNum, data: record, errors: [] });
      }
    });

    parser.on('error', reject);
    parser.on('end', () => resolve(records));
  });
}

export function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  if (semicolonCount > commaCount) return ';';
  return ',';
}