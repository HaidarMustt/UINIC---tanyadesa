import { describe, expect, it } from "vitest";
import { toStrictJsonSchema } from "./json-schema";

describe("toStrictJsonSchema", () => {
  it("removes unsupported rules at every level and keeps the rest", () => {
    const schema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        sector: { anyOf: [{ type: "integer", minimum: 1, maximum: 5 }, { type: "null" }] },
        keywords: { type: "array", items: { type: "string" }, maxItems: 8 },
      },
      required: ["sector", "keywords"],
      additionalProperties: false,
    };

    expect(toStrictJsonSchema(schema)).toEqual({
      type: "object",
      properties: {
        sector: { anyOf: [{ type: "integer" }, { type: "null" }] },
        keywords: { type: "array", items: { type: "string" } },
      },
      required: ["sector", "keywords"],
      additionalProperties: false,
    });
  });
});
