/* ═══════════════════════════════════
   camera.js — NYCDOT camera logic
   ═══════════════════════════════════ */

let cameras      = [];
let refreshTimer  = null;
let activeCamId   = null;
let camerasLoaded = false;

/** Haversine distance in feet */
function haverFt(la1, lo1, la2, lo2) {
  const R  = 20902000; // Earth radius in feet
  const dL = (la2 - la1) * Math.PI / 180;
  const dN = (lo2 - lo1) * Math.PI / 180;
  const a  = Math.sin(dL / 2) ** 2
           + Math.cos(la1 * Math.PI / 180)
           * Math.cos(la2 * Math.PI / 180)
           * Math.sin(dN / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)));
}

/** Find the nearest NYCDOT camera within 3 200 ft of a bar */
function nearest(bar) {
  if (!cameras.length) return null;
  let best = null, bestFt = Infinity;
  for (const c of cameras) {
    const ft = haverFt(bar.lat, bar.lon, c.latitude, c.longitude);
    if (ft < bestFt) { bestFt = ft; best = c; }
  }
  return bestFt < 3200 ? { cam: best, ft: bestFt } : null;
}

/** Cache nearest-camera results per bar index */
const camCache = new Map();
function nearestCached(bar, idx) {
  if (camCache.has(idx)) return camCache.get(idx);
  const result = nearest(bar);
  camCache.set(idx, result);
  return result;
}
function clearCamCache() { camCache.clear(); }

/** Fetch all NYCDOT cameras (called once, cached in sessionStorage) */
async function loadCameras() {
  const CACHE_KEY = 'crowdhopper_cams';
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      cameras = JSON.parse(cached);
      camerasLoaded = true;
      return cameras;
    } catch (_) { /* fall through */ }
  }

  const res = await fetch('https://webcams.nyctmc.org/api/cameras');
  cameras = await res.json();
  camerasLoaded = true;

  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cameras)); }
  catch (_) { /* storage full — no problem */ }

  return cameras;
}

/** Build the camera icon HTML */
function camIcon(hasCam) {
  if (hasCam) {
    return '<div class="cam-wrap"><span style="font-size:18px">📷</span></div>';
  }
  return `<div class="cam-wrap">
    <span style="font-size:18px;opacity:.55">📷</span>
    <svg class="cam-slash" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
      <line x1="3" y1="19" x2="19" y2="3" stroke="#cc0000" stroke-width="2.5" stroke-linecap="round"/>
    </svg></div>`;
}

/* ── Modal ── */

function openCam(id, barName, camName, ft) {
  clearInterval(refreshTimer);
  activeCamId = id;

  document.getElementById('modTitle').textContent = barName + ' — ' + camName;
  document.getElementById('modDist').textContent  = '📡 ' + camName + ' · ' + ft + ' ft';
  document.getElementById('camLoader').style.display = 'flex';
  document.getElementById('camImg').style.opacity = '0';
  document.getElementById('camModal').classList.add('open');

  loadFrame();
  refreshTimer = setInterval(loadFrame, 5000);
}

function loadFrame() {
  if (!activeCamId) return;
  const t   = new Image();
  const img = document.getElementById('camImg');
  t.onload  = () => { img.src = t.src; };
  t.src = `https://webcams.nyctmc.org/api/cameras/${activeCamId}/image?t=${Date.now()}`;
}

function onCamLoad() {
  document.getElementById('camLoader').style.display = 'none';
  document.getElementById('camImg').style.opacity = '1';
}

function onCamErr() {
  document.getElementById('camLoader').innerHTML =
    '<span style="color:#f88;font-size:11px">⚠ Feed unavailable</span>';
}

function closeCam() {
  clearInterval(refreshTimer);
  activeCamId = null;
  document.getElementById('camModal').classList.remove('open');
}
