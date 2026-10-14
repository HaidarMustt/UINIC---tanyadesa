// Shared helpers for API route handlers.

import { Prisma } from "@/generated/prisma/client";
import { AppError } from "./errors";

// Prisma error codes that mean "the database cannot be reached right now".
const DATABASE_UNAVAILABLE_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

export function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    DATABASE_UNAVAILABLE_CODES.has(error.code)
  );
}

// Turns any thrown error into a safe JSON response.
// Details go to the server log only, never to the user.
export function toErrorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return jsonError(error.status, error.message);
  }
  if (isDatabaseUnavailable(error)) {
    console.error("[database unavailable]", error);
    return jsonError(503, "Layanan sedang gangguan. Silakan coba lagi beberapa saat lagi.");
  }
  console.error("[unexpected error]", error);
  return jsonError(500, "Terjadi kesalahan pada server.");
}

type RouteHandler<Context> = (request: Request, context: Context) => Promise<Response>;

// Wraps a route handler so every unexpected error becomes a clean JSON response.
export function withErrorHandling<Context>(handler: RouteHandler<Context>): RouteHandler<Context> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

// Open data responses: readable from any website (CORS) and cacheable,
// because a published APBDes rarely changes.
export const OPEN_DATA_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
};

export function openDataJson(data: unknown): Response {
  return Response.json(data, { headers: OPEN_DATA_HEADERS });
}
