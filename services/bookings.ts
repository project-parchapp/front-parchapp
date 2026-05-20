import { apiFetch } from '@/lib/api/client';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export type BookingRow = {
  id: string;
  user_id: string;
  service_id: string;
  route_id: string | null;
  party_size: number;
  scheduled_start: string;
  scheduled_end: string | null;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function createEventBooking(
  serviceId: string,
  token: string,
  input: { party_size: number; notes?: string | null }
): Promise<BookingRow> {
  return apiFetch<BookingRow>(`/services/${serviceId}/bookings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    json: input,
  });
}

export async function listMyBookings(token: string): Promise<BookingRow[]> {
  return apiFetch<BookingRow[]>('/bookings/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function cancelBooking(
  bookingId: string,
  token: string
): Promise<BookingRow> {
  return apiFetch<BookingRow>(`/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}
