/*  CrowdHopper — BestTime.app proxy + visitor tracking
    Deploy to Cloudflare Workers.

    Environment variables (set via wrangler secret):
      BESTTIME_API_KEY_PRIVATE  — your BestTime private API key

    KV namespace binding (add in wrangler.toml or CF Dashboard):
      VISITORS  — stores visitor log

    Endpoints:
      GET  /api/forecast?venue_id=xxx           — query existing forecast
      GET  /api/forecast?name=xxx&addr=xxx      — create new forecast (costs 1 credit)
      GET  /api/live?venue_id=xxx               — get live busyness (costs 1 credit)
      POST /api/visit                           — register a visitor (returns visitor number)
      GET  /api/visits                          — list all visitors (for dev screen)
*/

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', ...extra }
  });
}

/** Parse basic browser info from User-Agent string */
function parseBrowser(ua) {
  if (!ua) return 'Unknown';
  if (ua.includes('Firefox/'))  return 'Firefox';
  if (ua.includes('Edg/'))      return 'Edge';
  if (ua.includes('OPR/'))      return 'Opera';
  if (ua.includes('Chrome/'))   return 'Chrome';
  if (ua.includes('Safari/'))   return 'Safari';
  return 'Other';
}

function parsePlatform(ua) {
  if (!ua) return '?';
  if (ua.includes('iPhone') || ua.includes('iPad'))  return 'iOS';
  if (ua.includes('Android'))   return 'Android';
  if (ua.includes('Windows'))   return 'Windows';
  if (ua.includes('Mac OS'))    return 'macOS';
  if (ua.includes('Linux'))     return 'Linux';
  return '?';
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url  = new URL(request.url);
    const path = url.pathname;

    try {
      /* ── Visit tracking ── */
      if (path === '/api/visit' && request.method === 'POST') {
        if (!env.VISITORS) return json({ error: 'KV not configured' }, 500);

        // Get and increment the visitor counter
        const countStr = await env.VISITORS.get('_count');
        const count = (parseInt(countStr, 10) || 0) + 1;
        await env.VISITORS.put('_count', String(count));

        const ua = request.headers.get('User-Agent') || '';
        const visitor = {
          num: count,
          ts: Date.now(),
          browser: parseBrowser(ua),
          platform: parsePlatform(ua),
          ref: request.headers.get('Referer') || ''
        };

        // Store visitor entry (expire after 30 days)
        await env.VISITORS.put(`v_${count}`, JSON.stringify(visitor), { expirationTtl: 2592000 });

        // Also maintain a recent-visitors list (last 200)
        let recent = [];
        try { recent = JSON.parse(await env.VISITORS.get('_recent') || '[]'); } catch {}
        recent.push(visitor);
        if (recent.length > 200) recent = recent.slice(-200);
        await env.VISITORS.put('_recent', JSON.stringify(recent));

        return json({ ok: true, visitor: count });
      }

      if (path === '/api/visits' && request.method === 'GET') {
        if (!env.VISITORS) return json({ error: 'KV not configured' }, 500);

        const countStr = await env.VISITORS.get('_count');
        const count = parseInt(countStr, 10) || 0;

        let recent = [];
        try { recent = JSON.parse(await env.VISITORS.get('_recent') || '[]'); } catch {}

        return json({ total: count, recent });
      }

      /* ── BestTime endpoints need API key ── */
      const KEY = env.BESTTIME_API_KEY_PRIVATE;

      /* ── Forecast ── */
      if (path === '/api/forecast') {
        if (!KEY) return json({ error: 'API key not configured' }, 500);
        const venueId = url.searchParams.get('venue_id');
        const name    = url.searchParams.get('name');
        const addr    = url.searchParams.get('addr');

        let btRes;
        if (venueId) {
          btRes = await fetch(
            `https://besttime.app/api/v1/forecasts?api_key_private=${KEY}&venue_id=${venueId}`
          );
        } else if (name && addr) {
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
        if (!KEY) return json({ error: 'API key not configured' }, 500);
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
