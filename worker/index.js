/*  CrowdHopper — BestTime.app proxy worker
    Deploy to Cloudflare Workers.

    Environment variables (set via wrangler secret):
      BESTTIME_API_KEY_PRIVATE  — your BestTime private API key

    Endpoints:
      GET /api/forecast?venue_id=xxx           — query existing forecast
      GET /api/forecast?name=xxx&addr=xxx      — create new forecast (costs 1 credit)
      GET /api/live?venue_id=xxx               — get live busyness (costs 1 credit)
*/

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', ...extra }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url  = new URL(request.url);
    const path = url.pathname;
    const KEY  = env.BESTTIME_API_KEY_PRIVATE;

    if (!KEY) return json({ error: 'API key not configured' }, 500);

    try {
      /* ── Forecast ── */
      if (path === '/api/forecast') {
        const venueId = url.searchParams.get('venue_id');
        const name    = url.searchParams.get('name');
        const addr    = url.searchParams.get('addr');

        let btRes;
        if (venueId) {
          // Query existing forecast (uses public key, but private works too)
          btRes = await fetch(
            `https://besttime.app/api/v1/forecasts?api_key_private=${KEY}&venue_id=${venueId}`
          );
        } else if (name && addr) {
          // Create new forecast
          btRes = await fetch('https://besttime.app/api/v1/forecasts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key_private: KEY,
              venue_name: name,
              venue_address: addr
            })
          });
        } else {
          return json({ error: 'Provide venue_id, or name + addr' }, 400);
        }

        const data = await btRes.json();
        return json(data, 200, { 'Cache-Control': 'public, max-age=86400' });
      }

      /* ── Live ── */
      if (path === '/api/live') {
        const venueId = url.searchParams.get('venue_id');
        if (!venueId) return json({ error: 'Missing venue_id' }, 400);

        const btRes = await fetch('https://besttime.app/api/v1/forecasts/live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key_private: KEY, venue_id: venueId })
        });

        const data = await btRes.json();
        return json(data);
      }

      return json({ error: 'Not found' }, 404);

    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};
