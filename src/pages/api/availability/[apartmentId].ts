import type { APIRoute } from 'astro';
import { getBlockedDates } from '../../../lib/availability';

export const GET: APIRoute = async ({ params, url }) => {
  const apartmentId = params.apartmentId;
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!apartmentId || !from || !to) {
    return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 });
  }

  const blocked = await getBlockedDates(apartmentId, new Date(from), new Date(to));
  return new Response(JSON.stringify({ blocked }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
