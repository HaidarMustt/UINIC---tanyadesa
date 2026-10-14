import { listOpenDesa } from "@/features/apbdes/server/apbdes.service";
import { openDataJson, withErrorHandling } from "@/lib/http";

// GET /api/v1/desa
// Lists every desa that has published APBDes data.
export const GET = withErrorHandling(async () => {
  const desa = await listOpenDesa();
  return openDataJson({ count: desa.length, data: desa });
});
