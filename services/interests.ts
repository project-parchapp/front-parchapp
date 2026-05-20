import { apiFetch } from '@/lib/api/client';

export type InterestRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export async function getInterests(): Promise<InterestRow[]> {
  return apiFetch<InterestRow[]>('/interests');
}
