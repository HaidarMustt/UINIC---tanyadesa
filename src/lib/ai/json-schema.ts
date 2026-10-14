// AI providers support only part of JSON Schema in strict mode.
// We remove the rules they may reject (ranges, lengths, formats) and let zod
// check those rules after the answer comes back.

const UNSUPPORTED_KEYS = new Set([
  "$schema",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "pattern",
  "format",
]);

export function toStrictJsonSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toStrictJsonSchema);
  if (schema === null || typeof schema !== "object") return schema;

  return Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => !UNSUPPORTED_KEYS.has(key))
      .map(([key, value]) => [key, toStrictJsonSchema(value)]),
  );
}
