import { apiFetch } from '@/lib/api/client';

export type RouteRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'saved' | 'completed' | 'archived';
  total_estimated_minutes: number | null;
  origin_latitude: string | null;
  origin_longitude: string | null;
  generation_context: unknown;
  created_at: string;
  updated_at: string;
};

export type RouteStopRow = {
  id: string;
  route_id: string;
  establishment_id: string;
  service_id: string | null;
  sort_order: number;
  estimated_travel_minutes_from_prev: number;
  estimated_stay_minutes: number | null;
  latitude: string;
  longitude: string;
  note: string | null;
};

export type RouteWithStops = RouteRow & { stops: RouteStopRow[] };

export type CreateRouteBody = {
  name: string;
  description?: string;
  status?: RouteRow['status'];
};

export type CreateRouteStopBody = {
  establishment_id: string;
  sort_order: number;
  latitude: string | number;
  longitude: string | number;
  estimated_stay_minutes?: number;
  estimated_travel_minutes_from_prev?: number;
  service_id?: string | null;
  note?: string | null;
};

export async function getRoutes(token: string): Promise<RouteRow[]> {
  return apiFetch<RouteRow[]>('/routes', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getRouteById(routeId: string, token: string): Promise<RouteWithStops> {
  return apiFetch<RouteWithStops>(`/routes/${routeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createRoute(
  token: string,
  body: { name: string; description?: string; status?: RouteRow['status']; total_estimated_minutes?: number }
): Promise<RouteRow> {
  return apiFetch<RouteRow>('/routes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    json: body,
  });
}

export async function createRouteStop(
  token: string,
  routeId: string,
  body: {
    establishment_id: string;
    sort_order: number;
    estimated_travel_minutes_from_prev: number;
    estimated_stay_minutes?: number;
    latitude: string;
    longitude: string;
    note?: string;
  }
): Promise<RouteStopRow> {
  return apiFetch<RouteStopRow>(`/routes/${routeId}/stops`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    json: body,
  });
}

export async function deleteRoute(token: string, routeId: string): Promise<void> {
  return apiFetch<void>(`/routes/${routeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
