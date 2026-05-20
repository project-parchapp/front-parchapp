import { apiFetch } from '@/lib/api/client';
import type { BookingRow } from '@/services/bookings';

export type EstablishmentEventRow = {
  service_id: string;
  establishment_id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  max_party_size: number | null;
  is_active: boolean;
  service_created_at: string;
  establishment_trade_name: string;
  establishment_status: string;
  anchor_booking_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  booked_party_size: number;
  spots_available: number;
};

export type ServiceRow = {
  id: string;
  establishment_id: string;
  title: string;
  description: string | null;
  service_kind: string;
  duration_minutes: number | null;
  max_party_size: number | null;
  is_bookable: boolean;
  is_active: boolean;
};

export type CreateEventInput = {
  title: string;
  description?: string | null;
  scheduled_start: string;
  duration_minutes: number;
  party_size?: number;
  max_party_size?: number | null;
  notes?: string | null;
};

export type CreateEventResult = {
  service_id: string;
  booking_id: string;
  service: ServiceRow;
  booking: BookingRow;
};

export async function listBookableEvents(
  limit = 50,
  offset = 0
): Promise<EstablishmentEventRow[]> {
  return apiFetch<EstablishmentEventRow[]>(
    `/events?limit=${limit}&offset=${offset}`
  );
}

export async function listEstablishmentEvents(
  establishmentId: string
): Promise<EstablishmentEventRow[]> {
  return apiFetch<EstablishmentEventRow[]>(
    `/establishments/${establishmentId}/events`
  );
}

export async function getEvent(serviceId: string): Promise<EstablishmentEventRow> {
  return apiFetch<EstablishmentEventRow>(`/events/${serviceId}`);
}

export async function createEstablishmentEvent(
  establishmentId: string,
  token: string,
  input: CreateEventInput
): Promise<CreateEventResult> {
  return apiFetch<CreateEventResult>(`/establishments/${establishmentId}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    json: input,
  });
}
