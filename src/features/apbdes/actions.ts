"use server";

// Server Actions for the APBDes panel. Each one checks the role itself:
// the page hiding a button for BPD members is NOT what protects these.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/server/auth-session";
import { AppError } from "@/lib/errors";
import { checkUploadedFile } from "./lib/upload-rules";
import { UploadFormSchema } from "./schemas";
import { discardDraft, publishDraft, uploadDraft } from "./server/apbdes-panel.service";

export interface UploadFormState {
  error: string | null;
}

function toMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  console.error("[apbdes panel]", error);
  return "Terjadi kesalahan di server. Coba lagi beberapa saat lagi.";
}

export async function uploadApbdesAction(
  _previous: UploadFormState,
  formData: FormData,
): Promise<UploadFormState> {
  const user = await requireRole("OPERATOR");

  const file = formData.get("file");
  const fileProblem = checkUploadedFile(file instanceof File ? file : null);
  if (fileProblem) return { error: fileProblem };

  const fields = UploadFormSchema.safeParse({
    fiscalYear: formData.get("fiscalYear"),
    realizedAsOf: formData.get("realizedAsOf") ?? "",
  });
  if (!fields.success) return { error: fields.error.issues[0].message };

  const upload = file as File;
  try {
    await uploadDraft(user, {
      fiscalYear: fields.data.fiscalYear,
      title: `APBDes ${fields.data.fiscalYear}`,
      realizedAsOf: fields.data.realizedAsOf,
      fileName: upload.name,
      file: Buffer.from(await upload.arrayBuffer()),
    });
  } catch (error) {
    return { error: toMessage(error) };
  }

  revalidatePath("/panel/apbdes");
  redirect("/panel/apbdes");
}

export async function publishApbdesAction(formData: FormData): Promise<void> {
  const user = await requireRole("OPERATOR");
  try {
    await publishDraft(user, String(formData.get("documentId")));
  } catch (error) {
    toMessage(error); // logs unexpected errors
    redirect("/panel/apbdes?status=gagal");
  }

  // Residents should see the new version right away.
  if (user.desa) {
    revalidatePath(`/desa/${user.desa.slug}`);
    revalidatePath(`/desa/${user.desa.slug}/tanya`);
    revalidatePath(`/desa/${user.desa.slug}/ringkasan`);
  }
  revalidatePath("/panel", "layout");
  redirect("/panel/apbdes?status=terbit");
}

export async function discardApbdesAction(formData: FormData): Promise<void> {
  const user = await requireRole("OPERATOR");
  try {
    await discardDraft(user, String(formData.get("documentId")));
  } catch (error) {
    toMessage(error);
    redirect("/panel/apbdes?status=gagal");
  }
  revalidatePath("/panel/apbdes");
  redirect("/panel/apbdes?status=dibatalkan");
}
