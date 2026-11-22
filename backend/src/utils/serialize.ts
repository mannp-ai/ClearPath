import Decimal from 'decimal.js';

export function serializeDecimalValues(value: unknown): unknown {
  if (value instanceof Decimal) return value.toString();
  if (Array.isArray(value)) return value.map(serializeDecimalValues);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeDecimalValues(nested)]),
    );
  }
  return value;
}
