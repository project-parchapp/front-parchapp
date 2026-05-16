import { apiFetch } from '@/lib/api/client';

export type SeedSyncResult = { ok: boolean; message?: string };

/**
 * Dispara en el backend la carga CSV → staging → CALL sp_populate_from_seed_staging().
 * Requiere el mismo valor que SEED_SYNC_SECRET en el servidor (header x-seed-secret).
 */
export async function syncSeedCatalog(seedSecret: string): Promise<SeedSyncResult> {
  return apiFetch<SeedSyncResult>('/sync/seed', {
    method: 'POST',
    headers: { 'x-seed-secret': seedSecret },
  });
}
