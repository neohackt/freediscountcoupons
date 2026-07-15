import type { ParsedRow } from '../types';

export async function parseJSON(content: Buffer | string | ArrayBuffer): Promise<ParsedRow[]> {
  const contentString = Buffer.isBuffer(content) ? content.toString('utf-8') : 
                       content instanceof ArrayBuffer ? Buffer.from(content).toString('utf-8') : 
                       content;
  const data = JSON.parse(contentString);

  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of objects');
  }

  return data.map((item: Record<string, unknown>, index: number) => ({
    row: index + 1,
    data: item,
    errors: [],
  }));
}

export function stringifyJSON(data: Record<string, unknown>[]): string {
  return JSON.stringify(data, null, 2);
}