"use server";

// Public action: a resident types their tracking code to reopen their aspiration.
// Read-only, and it only says whether the code exists in this village.

import { redirect } from "next/navigation";
import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { lookupTrackingCode } from "./server/aspiration.service";

export interface TrackFormState {
  error: string | null;
  input: string;
}

export async function trackAspirationAction(_previous: TrackFormState, formData: FormData): Promise<TrackFormState> {
  const input = String(formData.get("code") ?? "").slice(0, 200);
  const slug = DesaSlugSchema.safeParse(formData.get("slug"));
  if (!slug.success) return { error: "Desa tidak dikenal.", input };

  const result = await lookupTrackingCode(slug.data, input);
  if (!result.ok) return { error: result.message, input };

  redirect(`/desa/${slug.data}/aspirasi/${result.code}`);
}
