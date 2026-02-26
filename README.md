# CrowdHopper

Windows 98-themed NYC nightlife monitor. Shows real-time bar busyness, NYCDOT street cameras, and one-tap transport links (Google Maps, Uber, Lyft).

## Bars

11 bars across 5 neighborhoods: West Village, Murray Hill, Kips Bay, Greenwich Village, Lower East Side.

## Features

- **Busyness charts** — 13-bar mini chart per venue (4 PM–4 AM) with live hour highlight
- **NYCDOT cameras** — Nearest street camera feed with 5s auto-refresh
- **Transport menu** — Google Maps directions, Uber/Lyft deep links with web fallback
- **Neighborhood filter** — Dropdown to filter by hood
- **BestTime.app integration** — Real foot-traffic data via Cloudflare Worker proxy (optional)

## Setup

Open `index.html` in a browser. No build step required.

For local dev with live reload, use the PowerShell server:

```
powershell -ExecutionPolicy Bypass -File .claude/serve.ps1
```

Then open `http://localhost:8098`.

## BestTime.app (optional)

1. Sign up at [besttime.app](https://besttime.app)
2. Deploy `worker/index.js` to Cloudflare Workers
3. Set your API key: `npx wrangler secret put BESTTIME_API_KEY_PRIVATE`
4. Update `BestTime.proxyUrl` in `js/besttime.js` to your worker URL

## Stack

- Vanilla HTML/CSS/JS (no frameworks, no build)
- NYCDOT public camera API
- BestTime.app foot-traffic API (optional)
- Cloudflare Workers (API proxy)

## License

MIT
