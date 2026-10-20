// Info desa for the open API.

import { db } from "@/lib/db";
import type { InfoCategory } from "../constants";
import { toPublicInfos } from "../lib/public";
import { findPublishedInfos } from "./info.repository";

// Returns null when the desa does not exist.
export async function getPublicInfos(desaSlug: string, category: InfoCategory | null) {
  const desa = await db.desa.findUnique({
    where: { slug: desaSlug },
    select: { id: true, slug: true, name: true, isSimulation: true },
  });
  if (!desa) return null;

  const items = toPublicInfos(await findPublishedInfos(desa.id), category);
  return { desa: { slug: desa.slug, name: desa.name, isSimulation: desa.isSimulation }, count: items.length, items };
}
