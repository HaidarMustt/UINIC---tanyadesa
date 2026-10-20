"use server";

// Officer actions on Info desa. Only operators may change entries.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/features/auth/server/auth-session";
import { AppError } from "@/lib/errors";
import { InfoFormSchema } from "./schemas";
import { saveInfo, setInfoPublished } from "./server/info-panel.service";

const IdSchema = z.string().min(1).max(40);

function back(message: string, id?: string): never {
  revalidatePath("/panel/info");
  const params = new URLSearchParams({ pesan: message });
  if (id) params.set("id", id);
  redirect(`/panel/info?${params.toString()}`);
}

function failMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  console.error("[info panel]", error);
  return "Terjadi kesalahan di server. Coba lagi.";
}

export async function saveInfoAction(formData: FormData): Promise<void> {
  const officer = await requireRole("OPERATOR");
  const parsed = InfoFormSchema.safeParse(Object.fromEntries(formData));
  const id = typeof formData.get("id") === "string" ? String(formData.get("id")) : undefined;
  if (!parsed.success) back(parsed.error.issues[0].message, id || undefined);

  let message: string;
  try {
    const result = await saveInfo(officer, parsed.data);
    message = result === "created" ? "Info baru disimpan dan langsung terlihat warga." : "Perubahan info disimpan.";
  } catch (error) {
    back(failMessage(error), id || undefined);
  }
  back(message);
}

export async function toggleInfoAction(formData: FormData): Promise<void> {
  const officer = await requireRole("OPERATOR");
  const id = IdSchema.parse(formData.get("id"));
  const isPublished = formData.get("publish") === "1";
  let message = isPublished ? "Info ditampilkan lagi untuk warga." : "Info disembunyikan dari warga.";
  try {
    await setInfoPublished(officer, id, isPublished);
  } catch (error) {
    message = failMessage(error);
  }
  back(message);
}
