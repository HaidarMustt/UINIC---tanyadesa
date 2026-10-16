// Aspiration flow for residents: check limits, let AI suggest a category, save, return a tracking code.
// If the AI fails, the aspiration is still saved; an officer sorts it by hand.

import { getPublishedDataset } from "@/features/apbdes/server/apbdes.service";
import { NotFoundError, RateLimitError, ValidationError } from "@/lib/errors";
import { checkCategorization, EMPTY_CATEGORIZATION, type Categorization } from "../lib/categorize";
import { checkAspirationLimits } from "../lib/rate-limit";
import { generateTrackingCode } from "../lib/tracking-code";
import type { SubmitAspirationInput } from "../schemas";
import { suggestCategory } from "./aspiration-ai";
import {
  countDesaAspirationsSince,
  countIpAspirationsSince,
  countSessionAspirationsSince,
  createAspiration,
  findAspirationForResident,
  findDesaForAspirations,
} from "./aspiration.repository";

const ONE_HOUR_MS = 60 * 60 * 1000;

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export async function getAspirationFormData(desaSlug: string) {
  const desa = await findDesaForAspirations(desaSlug);
  if (!desa) return null;
  return { slug: desa.slug, name: desa.name, isSimulation: desa.isSimulation, dusuns: desa.dusuns };
}

export interface Sender {
  sessionId: string;
  ipHash: string | null;
}

export async function submitAspiration(desaSlug: string, input: SubmitAspirationInput, sender: Sender) {
  const desa = await findDesaForAspirations(desaSlug);
  if (!desa) throw new NotFoundError("Desa tidak ditemukan.");

  const hourAgo = new Date(Date.now() - ONE_HOUR_MS);
  const [sessionLastHour, ipLastHour, desaToday] = await Promise.all([
    countSessionAspirationsSince(sender.sessionId, hourAgo),
    sender.ipHash ? countIpAspirationsSince(sender.ipHash, hourAgo) : Promise.resolve(0),
    countDesaAspirationsSince(desa.id, startOfToday()),
  ]);
  const limit = checkAspirationLimits({ sessionLastHour, ipLastHour, desaToday });
  if (!limit.allowed) throw new RateLimitError(limit.message);

  const dusun = input.dusun ? desa.dusuns.find((item) => item.name === input.dusun) : null;
  if (input.dusun && !dusun) throw new ValidationError("Dusun tidak dikenal.");

  // Published activities let the AI link the aspiration to a real APBDes row.
  const dataset = await getPublishedDataset(desaSlug);
  const activities = (dataset?.items ?? [])
    .filter((item) => item.entryType === "EXPENDITURE")
    .map((item) => ({ accountCode: item.accountCode, description: item.description, dusun: item.dusun }));
  const context = { desaName: desa.name, categories: desa.categories.map((category) => category.name), activities };

  let suggestion: Categorization = EMPTY_CATEGORIZATION;
  if (context.categories.length > 0) {
    try {
      suggestion = checkCategorization(await suggestCategory(input.content, context), context);
    } catch (error) {
      console.error("[aspiration] AI categorizing failed, saved without category", error);
    }
  }

  return createAspiration({
    desaId: desa.id,
    dusunId: dusun?.id ?? null,
    rt: dusun ? input.rt : null,
    content: input.content,
    senderName: input.senderName,
    contact: input.contact,
    categoryId: desa.categories.find((category) => category.name === suggestion.categoryName)?.id ?? null,
    aiConfidence: suggestion.confidence,
    relatedBudgetItemId: suggestion.relatedAccountCode
      ? (dataset?.itemIdByAccountCode.get(suggestion.relatedAccountCode) ?? null)
      : null,
    trackingCode: generateTrackingCode(),
    sessionId: sender.sessionId,
    ipHash: sender.ipHash,
    aiFlag: suggestion.flag,
  });
}

export async function getAspirationForResident(desaSlug: string, trackingCode: string) {
  const aspiration = await findAspirationForResident(desaSlug, trackingCode);
  if (!aspiration) return null;

  const item = aspiration.relatedBudgetItem;
  return {
    ...aspiration,
    // BigInt cannot cross into JSON or client components.
    relatedBudgetItem: item ? { ...item, budget: Number(item.budget), realized: Number(item.realized) } : null,
  };
}
