/* ═══════════════════════════════════
   app.js — CrowdHopper main module
   ═══════════════════════════════════ */

let currentFilter = 'all';

/* ── Row builder ── */

function buildRow(bar, idx) {
  const cr     = nearestCached(bar, idx);
  const hasCam = !!cr;
  const tag    = getBusyTag(bar.crowd);

  return `<div class="bar-row" data-idx="${idx}">
    <div class="name-cell">
      <div class="bar-name-txt">${bar.name}</div>
      <div class="bar-addr-txt">${bar.addr}</div>
      <div class="bar-hood-txt">${getHoodName(bar.hood)}</div>
    </div>
    <div class="busy-cell">
      <div class="mini-chart">${miniChart(bar.crowd)}</div>
      <div class="busy-tag ${tag.cls}">${tag.text}</div>
    </div>
    <div class="icon-cell${hasCam ? ' tap' : ''}"
         title="${hasCam ? 'View NYCDOT cam (' + cr.ft + ' ft)' : 'No street camera nearby'}"
         ${hasCam ? `data-action="camera" data-cam-id="${cr.cam.id}" data-cam-name="${cr.cam.name.replace(/"/g, '&quot;')}" data-cam-ft="${cr.ft}" data-bar-name="${bar.name.replace(/"/g, '&quot;')}"` : ''}>
      ${camIcon(hasCam)}
    </div>
    <div class="icon-cell tap" data-action="transport" data-bar-idx="${idx}" title="Get to ${bar.name}">
      <span style="font-size:18px">🚗</span>
    </div>
  </div>`;
}

/* ── Render ── */

function renderBars(filter) {
  currentFilter = filter || 'all';
  const list = document.getElementById('barList');

  // Determine which bars to show
  const filtered = currentFilter === 'all'
    ? BARS
    : BARS.filter(b => b.hood === currentFilter);

  // Group by neighborhood
  const groups = [];
  let lastHood = null;
  filtered.forEach((bar) => {
    const idx = BARS.indexOf(bar);
    if (bar.hood !== lastHood) {
      groups.push(`<div class="hood-header">${getHoodName(bar.hood)}</div>`);
      lastHood = bar.hood;
    }
    groups.push(buildRow(bar, idx));
  });

  list.innerHTML = groups.join('');
  document.getElementById('statusCount').textContent = filtered.length + ' bars';
}

/* ── Clock ── */

function tick() {
  const n = new Date();
  let h = n.getHours(), m = String(n.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const t = h + ':' + m + ' ' + ap;
  document.getElementById('clock').textContent = t;
  document.getElementById('tbTime').textContent = t;
}

/* ── Init ── */

async function init() {
  document.getElementById('camApiStatus').textContent = '⏳ Cameras...';
  document.getElementById('camApiStatus').style.color = '#555';
  document.getElementById('statusMsg').innerHTML =
    '<span class="live-dot"></span>Connecting to NYCDOT...';

  // Load cameras
  try {
    await loadCameras();
    clearCamCache();
    document.getElementById('camApiStatus').textContent = '✔ ' + cameras.length + ' cams';
    document.getElementById('camApiStatus').style.color = '#006400';
  } catch (err) {
    document.getElementById('camApiStatus').textContent = '✘ Cam API offline';
    document.getElementById('camApiStatus').style.color = '#800000';
  }

  // Render bar list
  renderBars(currentFilter);
  document.getElementById('statusMsg').innerHTML =
    '<span class="live-dot"></span>Ready — ' + BARS.length + ' bars loaded';

  // If BestTime proxy is configured, fetch live data
  if (BestTime.ready) {
    document.getElementById('statusMsg').innerHTML =
      '<span class="live-dot"></span>Fetching live busyness...';
    await BestTime.seedAll(BARS, (done, total) => {
      document.getElementById('statusMsg').innerHTML =
        `<span class="live-dot"></span>Loading forecasts… ${done}/${total}`;
    });
    renderBars(currentFilter);
    document.getElementById('statusMsg').innerHTML =
      '<span class="live-dot"></span>Live — ' + BARS.length + ' bars loaded';
  }
}

/* ── Event delegation ── */

document.getElementById('barList').addEventListener('click', (e) => {
  // Camera tap
  const camEl = e.target.closest('[data-action="camera"]');
  if (camEl) {
    openCam(
      camEl.dataset.camId,
      camEl.dataset.barName,
      camEl.dataset.camName,
      parseInt(camEl.dataset.camFt, 10)
    );
    return;
  }
  // Transport tap
  const trEl = e.target.closest('[data-action="transport"]');
  if (trEl) {
    const idx = parseInt(trEl.dataset.barIdx, 10);
    openMenu(e, BARS[idx]);
    return;
  }
});

// Close transport menu on outside click
document.addEventListener('click', (e) => {
  if (menuOpen && !e.target.closest('#transportMenu') && !e.target.closest('[data-action="transport"]')) {
    closeMenu();
  }
});

// Escape key closes camera modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCam();
});

// Neighborhood filter
document.getElementById('hoodFilter').addEventListener('change', function () {
  renderBars(this.value);
});

// Refresh button
document.getElementById('btnRefresh').addEventListener('click', () => {
  clearCamCache();
  init();
});

// Camera modal — close only when clicking the dark overlay, not the window
document.getElementById('camModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('camModal')) closeCam();
});

// Camera image events
document.getElementById('camImg').addEventListener('load', onCamLoad);
document.getElementById('camImg').addEventListener('error', onCamErr);

// Close camera via button
document.getElementById('btnCamClose').addEventListener('click', closeCam);
document.querySelector('.cam-win .win-btn').addEventListener('click', closeCam);

// Transport menu close button
document.getElementById('tmenuClose').addEventListener('click', closeMenu);

/* ── Start ── */

setInterval(tick, 1000);
tick();

// Re-render charts every minute to update the "now" highlight
setInterval(() => renderBars(currentFilter), 60000);

init();
