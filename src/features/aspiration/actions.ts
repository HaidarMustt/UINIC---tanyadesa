"use server";

// Officer actions on aspirations. Each one checks the role on the server.
// Operators sort, route and close. BPD members (and operators) can respond.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/features/auth/server/auth-session";
import { AppError } from "@/lib/errors";
import { respond, setFinalStatus, triage } from "./server/aspiration-panel.service";

const IdSchema = z.string().min(1).max(40);
const ResponseSchema = z.string().trim().min(5, "Tanggapan terlalu pendek.").max(2000, "Tanggapan maksimal 2000 karakter.");

function back(id: string, message: string): never {
  revalidatePath("/panel/aspirasi");
  redirect(`/panel/aspirasi?id=${encodeURIComponent(id)}&pesan=${encodeURIComponent(message)}`);
}

function failMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  console.error("[aspiration panel]", error);
  return "Terjadi kesalahan di server. Coba lagi.";
}

const nullable = (value: FormDataEntryValue | null) => (typeof value === "string" && value !== "" ? value : null);

export async function triageAction(formData: FormData): Promise<void> {
  const officer = await requireRole("OPERATOR");
  const id = IdSchema.parse(formData.get("id"));
  let message = "Kategori dan tujuan disimpan.";
  try {
    await triage(officer, id, nullable(formData.get("categoryId")), nullable(formData.get("forwardedTo")));
  } catch (error) {
    message = failMessage(error);
  }
  back(id, message);
}

export async function respondAction(formData: FormData): Promise<void> {
  const officer = await requireRole("OPERATOR", "BPD");
  const id = IdSchema.parse(formData.get("id"));
  const content = ResponseSchema.safeParse(formData.get("content"));
  if (!content.success) back(id, content.error.issues[0].message);

  const isPublic = formData.get("internal") !== "on";
  let message = isPublic ? "Tanggapan terkirim dan bisa dilihat warga." : "Catatan internal disimpan.";
  try {
    await respond(officer, id, content.data, isPublic);
  } catch (error) {
    message = failMessage(error);
  }
  back(id, message);
}

export async function finalStatusAction(formData: FormData): Promise<void> {
  const officer = await requireRole("OPERATOR");
  const id = IdSchema.parse(formData.get("id"));
  const status = formData.get("status") === "REJECTED" ? "REJECTED" : "RESOLVED";
  let message = status === "RESOLVED" ? "Aspirasi ditandai selesai." : "Aspirasi ditandai tidak diproses.";
  try {
    await setFinalStatus(officer, id, status);
  } catch (error) {
    message = failMessage(error);
  }
  back(id, message);
}
