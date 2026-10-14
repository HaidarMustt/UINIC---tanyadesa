import { afterEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, ValidationError } from "./errors";
import { toErrorResponse, withErrorHandling } from "./http";

// Silence the expected error logs during these tests.
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
afterEach(() => consoleError.mockClear());

describe("toErrorResponse", () => {
  it("shows the message of known app errors", async () => {
    const response = toErrorResponse(new NotFoundError("Desa tidak ditemukan."));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Desa tidak ditemukan." });
  });

  it("uses 400 for validation errors", () => {
    expect(toErrorResponse(new ValidationError("Input tidak valid.")).status).toBe(400);
  });

  it("answers 503 when the database cannot be reached", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Can't reach database server", {
      code: "P1001",
      clientVersion: "7.10.0",
    });
    const response = toErrorResponse(error);

    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/gangguan/);
  });

  it("hides details of unexpected errors", async () => {
    const response = toErrorResponse(new Error("password=rahasia leaked in stack"));

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("rahasia");
    expect(consoleError).toHaveBeenCalled();
  });
});

describe("withErrorHandling", () => {
  it("passes through successful responses", async () => {
    const handler = withErrorHandling(async () => Response.json({ ok: true }));
    const response = await handler(new Request("http://test"), {});

    expect(response.status).toBe(200);
  });

  it("converts thrown errors into JSON responses", async () => {
    const handler = withErrorHandling(async () => {
      throw new NotFoundError("Tidak ada.");
    });
    const response = await handler(new Request("http://test"), {});

    expect(response.status).toBe(404);
  });
});