import { describe, expect, it } from "vitest";
import { FeedbackSchema, QuestionIdSchema } from "./schemas";

describe("feedback input", () => {
  it("accepts a real question id and a yes/no rating", () => {
    expect(QuestionIdSchema.safeParse("cmgx2k9a40001ab12cd34ef56").success).toBe(true);
    expect(FeedbackSchema.safeParse({ helpful: false }).success).toBe(true);
  });

  it("rejects odd ids and ratings that are not true/false", () => {
    expect(QuestionIdSchema.safeParse("../../users").success).toBe(false);
    expect(FeedbackSchema.safeParse({ helpful: "ya" }).success).toBe(false);
  });
});
