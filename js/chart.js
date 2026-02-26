/* ═══════════════════════════════════
   chart.js — Mini busyness charts
   ═══════════════════════════════════ */

/*  Chart shows a 13-bar slice of the 24-hour crowd array:
    indices 10–22 → 4 PM through 4 AM (the nightlife window).
    BestTime index formula: (realHour - 6 + 24) % 24        */

const CHART_START = 10;   // BestTime index for 4 PM
const CHART_END   = 22;   // BestTime index for 4 AM
const CHART_HOURS = CHART_END - CHART_START + 1; // 13

/** Convert a real 24h clock hour to BestTime array index */
function btIndex(hour) {
  return ((hour - 6) + 24) % 24;
}

/** Get the current chart-bar index (0-12) or -1 if outside the chart window */
function currentChartIdx() {
  const idx = btIndex(new Date().getHours()) - CHART_START;
  return (idx >= 0 && idx < CHART_HOURS) ? idx : -1;
}

/** Render the 13-bar mini chart HTML */
function miniChart(crowd) {
  const slice = crowd.slice(CHART_START, CHART_END + 1);
  const peak  = Math.max(...slice, 1);
  const now   = currentChartIdx();

  return slice.map((v, i) => {
    const isNow = (i === now);
    const h  = Math.max(2, Math.round((v / peak) * 26));
    const bg = isNow ? ''
      : v > 65 ? 'background:#b05010'
      : v > 35 ? 'background:#3050a0'
      :          'background:#aaaacc';
    return `<div class="cc-bar${isNow ? ' now' : ''}" style="height:${h}px;${bg}"></div>`;
  }).join('');
}

/** Format an hour (0-23) as "4PM", "11AM", etc. */
function formatHour(h) {
  const hr = ((h % 24) + 24) % 24;
  const ap = hr >= 12 ? 'PM' : 'AM';
  const h12 = hr % 12 || 12;
  return h12 + ap;
}

/**
 * Check if the current hour is within 1 hour before closing.
 * Handles overnight spans (e.g. open 17, close 4 → span is 17–4 next day).
 */
function isClosingSoon(bar) {
  if (bar.open == null || bar.close == null) return false;
  const now = new Date().getHours();

  // Normalize close to be after open
  let closeN = bar.close;
  let nowN   = now;
  if (bar.close <= bar.open) closeN += 24;            // e.g. 4→28
  if (now < bar.open) nowN += 24;                      // e.g. 2→26

  // Within operating window and 1 hour to close
  const diff = closeN - nowN;
  return diff > 0 && diff <= 1;
}

/**
 * Compute a dynamic busy-tag from crowd data and (optionally) bar hours.
 * @param {number[]} crowd  24-element busyness array
 * @param {object}   [bar]  bar object with open/close fields
 */
function getBusyTag(crowd, bar) {
  const idx = btIndex(new Date().getHours());
  const val = crowd[idx] || 0;

  // Average of non-zero hours only
  const active = crowd.filter(v => v > 0);
  const avg = active.length ? active.reduce((a, b) => a + b, 0) / active.length : 1;

  // ── Closed — show when it opens ──
  if (val === 0) {
    if (bar && bar.open != null) {
      return { text: 'Closed · Opens ' + formatHour(bar.open), cls: 'tag-quiet' };
    }
    return { text: 'Closed', cls: 'tag-quiet' };
  }

  // ── Closing soon — within 1 hour of close ──
  if (bar && isClosingSoon(bar)) {
    return { text: 'Closing ' + formatHour(bar.close), cls: 'tag-closing' };
  }

  // ── Normal busyness tiers ──
  if (val > avg * 1.3)   return { text: 'Busier than usual',   cls: 'tag-busier'  };
  if (val > avg * 0.8)   return { text: 'As busy as usual',    cls: 'tag-usual'   };
  if (val > avg * 0.4)   return { text: 'A little busy',       cls: 'tag-popular' };
  return                         { text: 'Not too busy',        cls: 'tag-quiet'   };
}
