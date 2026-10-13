import type { FAQItem } from '@/types/blog';

function isFaqItem(value: unknown): value is FAQItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.question === 'string' && typeof item.answer === 'string';
}

function isFaqPage(value: unknown): value is { mainEntity: unknown[] } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return obj['@type'] === 'FAQPage' && Array.isArray(obj.mainEntity);
}

/**
 * Normalize CMS-provided FAQ data into the `{ question, answer }` array
 * shape the article components expect. Valid arrays pass through (malformed
 * entries dropped); a verified Schema.org FAQPage object is converted via
 * `mainEntity[].name` / `mainEntity[].acceptedAnswer.text`; anything else
 * yields `[]` so the FAQ section is safely omitted. Never generates content.
 */
export function normalizeFaqItems(value: unknown): FAQItem[] {
  if (Array.isArray(value)) {
    return value.filter(isFaqItem);
  }
  if (isFaqPage(value)) {
    const items: FAQItem[] = [];
    for (const entry of value.mainEntity) {
      if (typeof entry !== 'object' || entry === null) continue;
      const record = entry as Record<string, unknown>;
      const accepted = record.acceptedAnswer;
      if (typeof record.name !== 'string') continue;
      if (typeof accepted !== 'object' || accepted === null) continue;
      const text = (accepted as Record<string, unknown>).text;
      if (typeof text !== 'string') continue;
      items.push({ question: record.name, answer: text });
    }
    return items;
  }
  return [];
}
