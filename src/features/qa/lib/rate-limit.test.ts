import { describe, expect, it } from "vitest";
import {
  checkQuestionLimits,
  QUESTIONS_PER_DESA_PER_DAY,
  QUESTIONS_PER_SESSION_PER_HOUR,
} from "./rate-limit";

describe("checkQuestionLimits", () => {
  it("allows questions under both limits", () => {
    expect(checkQuestionLimits(0, 0)).toEqual({ allowed: true });
  });

  it("blocks a session that asked too many questions this hour", () => {
    expect(checkQuestionLimits(QUESTIONS_PER_SESSION_PER_HOUR, 0).allowed).toBe(false);
  });

  it("blocks when the desa reached its daily limit", () => {
    expect(checkQuestionLimits(0, QUESTIONS_PER_DESA_PER_DAY).allowed).toBe(false);
  });
});
