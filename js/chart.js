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

/** Compute a dynamic busy-tag from crowd data and current hour */
function getBusyTag(crowd) {
  const idx = btIndex(new Date().getHours());
  const val = crowd[idx] || 0;

  // Average of non-zero hours only
  const active = crowd.filter(v => v > 0);
  const avg = active.length ? active.reduce((a, b) => a + b, 0) / active.length : 1;

  if (val === 0)         return { text: 'Closed',              cls: 'tag-quiet'   };
  if (val > avg * 1.3)   return { text: 'Busier than usual',   cls: 'tag-busier'  };
  if (val > avg * 0.8)   return { text: 'As busy as usual',    cls: 'tag-usual'   };
  if (val > avg * 0.4)   return { text: 'A little busy',       cls: 'tag-popular' };
  return                         { text: 'Not too busy',        cls: 'tag-quiet'   };
}
