/* ═════════════════════════════════════════════
   besttime.js — BestTime.app API client
   Fetches foot-traffic data through a CF Worker
   proxy to keep the API key server-side.
   ═════════════════════════════════════════════ */

const BestTime = {
  /** Set this to your Cloudflare Worker URL once deployed, e.g.
      'https://crowdhopper-api.yourname.workers.dev'              */
  proxyUrl: null,

  /** Whether the API is available */
  get ready() { return !!this.proxyUrl; },

  /**
   * Fetch (or create) a forecast for a bar.
   * Returns the BestTime response or null on failure.
   */
  async fetchForecast(bar) {
    if (!this.proxyUrl) return null;
    try {
      const params = bar.venueId
        ? `venue_id=${bar.venueId}`
        : `name=${encodeURIComponent(bar.name)}&addr=${encodeURIComponent(bar.addr + ', New York, NY')}`;

      const res = await fetch(`${this.proxyUrl}/api/forecast?${params}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 'OK') return null;

      // Map today's forecast into the bar's crowd array
      const jsDay = new Date().getDay();          // 0 = Sun
      const btDay = jsDay === 0 ? 6 : jsDay - 1;  // BestTime: 0 = Mon … 6 = Sun

      if (data.analysis && data.analysis[btDay] && data.analysis[btDay].day_raw) {
        bar.crowd   = data.analysis[btDay].day_raw;
        bar.venueId = data.venue_info?.venue_id || bar.venueId;
      }
      return data;
    } catch (e) {
      console.warn('[BestTime] forecast failed:', bar.name, e);
      return null;
    }
  },

  /**
   * Fetch live busyness for a bar (requires venueId from a prior forecast).
   * Returns { live, forecasted, delta, open } or null.
   */
  async fetchLive(bar) {
    if (!this.proxyUrl || !bar.venueId) return null;
    try {
      const res = await fetch(`${this.proxyUrl}/api/live?venue_id=${bar.venueId}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 'OK') return null;
      return {
        live:       data.analysis?.venue_live_busyness ?? null,
        forecasted: data.analysis?.venue_forecasted_busyness ?? null,
        delta:      data.analysis?.venue_live_forecasted_delta ?? 0,
        open:       data.venue_info?.venue_open === 'Open'
      };
    } catch (e) {
      console.warn('[BestTime] live failed:', bar.name, e);
      return null;
    }
  },

  /**
   * Seed forecasts for all bars, updating their crowd arrays.
   * Call once on first deploy or weekly to refresh data.
   */
  async seedAll(bars, onProgress) {
    let done = 0;
    for (const bar of bars) {
      await this.fetchForecast(bar);
      done++;
      if (onProgress) onProgress(done, bars.length);
    }
  }
};
