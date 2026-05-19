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
