import { apiFetch } from '@/lib/api/client';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export type ReservationRow = {
  id: string;
  establishment_id: string;
  tourist_user_id: string;
  reservation_date: string;
  party_size: number;
  status: ReservationStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export async function getReservationsByEstablishment(
  establishmentId: string,
  token: string
): Promise<ReservationRow[]> {
  return apiFetch<ReservationRow[]>(
    `/reservations?establishment_id=${establishmentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function getMyReservations(token: string): Promise<ReservationRow[]> {
  return apiFetch<ReservationRow[]>('/reservations/my', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateReservationStatus(
  id: string,
  status: 'confirmed' | 'cancelled',
  token: string
): Promise<ReservationRow> {
  return apiFetch<ReservationRow>(`/reservations/${id}`, {
    method: 'PATCH',
    json: { status },
    headers: { Authorization: `Bearer ${token}` },
  });
}
