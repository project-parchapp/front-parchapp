import { apiFetch } from '@/lib/api/client';

export type EstablishmentRow = {
  id: string;
  owner_user_id: string;
  legal_name: string;
  trade_name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  address_line: string | null;
  city: string;
  country_code: string;
  latitude: string;
  longitude: string;
  status: 'pending_review' | 'active' | 'suspended' | 'closed';
  created_at: string;
  updated_at: string;
};

export async function getEstablishments(
  limit = 50,
  offset = 0
): Promise<EstablishmentRow[]> {
  return apiFetch<EstablishmentRow[]>(
    `/establishments?limit=${limit}&offset=${offset}`
  );
}

export async function getEstablishmentById(id: string): Promise<EstablishmentRow> {
  return apiFetch<EstablishmentRow>(`/establishments/${id}`);
}
