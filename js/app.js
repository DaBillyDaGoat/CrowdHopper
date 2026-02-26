/* ═══════════════════════════════════
   app.js — CrowdHopper main module
   ═══════════════════════════════════ */

let currentFilter = 'all';
let currentSort   = 'hood';   // hood | az | busy | dist
let userLat       = null;
let userLon       = null;

/* ── Row builder ── */

function buildRow(bar, idx) {
  const cr     = nearestCached(bar, idx);
  const hasCam = !!cr;
  const tag    = getBusyTag(bar.crowd, bar);

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

/* ── Sort helpers ── */

function sortBars(list) {
  const copy = [...list];
  switch (currentSort) {
    case 'az':
      copy.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'busy': {
      const now = btIndex(new Date().getHours());
      copy.sort((a, b) => (b.crowd[now] || 0) - (a.crowd[now] || 0));
      break;
    }
    case 'dist':
      if (userLat !== null) {
        copy.sort((a, b) =>
          haverFt(userLat, userLon, a.lat, a.lon) - haverFt(userLat, userLon, b.lat, b.lon));
      }
      break;
    case 'closed': {
      const nowIdx = btIndex(new Date().getHours());
      copy.sort((a, b) => {
        const aOpen = (a.crowd[nowIdx] || 0) > 0 ? 0 : 1;
        const bOpen = (b.crowd[nowIdx] || 0) > 0 ? 0 : 1;
        if (aOpen !== bOpen) return aOpen - bOpen; // open first
        return a.name.localeCompare(b.name);       // then alphabetical
      });
      break;
    }
    case 'hood':
    default: {
      const hoodOrder = NEIGHBORHOODS.map(n => n.id);
      copy.sort((a, b) => hoodOrder.indexOf(a.hood) - hoodOrder.indexOf(b.hood));
      break;
    }
  }
  return copy;
}

/* ── Render ── */

function renderBars(filter) {
  currentFilter = filter || currentFilter || 'all';
  const list = document.getElementById('barList');

  let filtered = currentFilter === 'all'
    ? BARS
    : BARS.filter(b => b.hood === currentFilter);

  filtered = sortBars(filtered);

  const groups = [];
  let lastHood = null;
  filtered.forEach((bar) => {
    const idx = BARS.indexOf(bar);
    if (currentSort === 'hood' && bar.hood !== lastHood) {
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

/* ── Menus ── */

function closeAllMenus() {
  document.querySelectorAll('.menu-item.open').forEach(m => m.classList.remove('open'));
}

function updateSortChecks() {
  document.querySelectorAll('#menuBars li').forEach(li => {
    li.classList.toggle('menu-checked', li.dataset.action === 'sort-' + currentSort);
  });
}

function updateToggleLabels() {
  const dm = document.querySelector('[data-action="darkmode"]');
  const cm = document.querySelector('[data-action="compact"]');
  if (dm) dm.textContent = (document.body.classList.contains('dark-mode') ? '☑' : '☐') + ' Dark Mode';
  if (cm) cm.textContent = (document.body.classList.contains('compact') ? '☑' : '☐') + ' Compact View';
}

function handleMenuAction(action) {
  closeAllMenus();
  switch (action) {
    case 'refresh':
      clearCamCache();
      init();
      break;
    case 'darkmode':
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('ch_darkmode', document.body.classList.contains('dark-mode') ? '1' : '0');
      updateToggleLabels();
      break;
    case 'compact':
      document.body.classList.toggle('compact');
      localStorage.setItem('ch_compact', document.body.classList.contains('compact') ? '1' : '0');
      updateToggleLabels();
      break;
    case 'sort-hood':
      currentSort = 'hood'; updateSortChecks(); renderBars(); break;
    case 'sort-az':
      currentSort = 'az'; updateSortChecks(); renderBars(); break;
    case 'sort-busy':
      currentSort = 'busy'; updateSortChecks(); renderBars(); break;
    case 'sort-dist':
      requestGeolocation(() => {
        currentSort = 'dist'; updateSortChecks(); renderBars();
      });
      break;
    case 'sort-closed':
      currentSort = 'closed'; updateSortChecks(); renderBars(); break;
    case 'about':
      document.getElementById('aboutModal').classList.add('open'); break;
    case 'shortcuts':
      document.getElementById('shortcutsModal').classList.add('open'); break;
    case 'devscreen':
      window.open('dev.html', '_blank');
      break;
  }
}

/* ── Geolocation ── */

function requestGeolocation(cb) {
  if (userLat !== null) { cb(); return; }
  if (!navigator.geolocation) { cb(); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => { userLat = pos.coords.latitude; userLon = pos.coords.longitude; cb(); },
    () => cb()
  );
}

/* ── Init ── */

async function init() {
  document.getElementById('camApiStatus').textContent = '⏳ Cameras...';
  document.getElementById('camApiStatus').style.color = '#555';
  document.getElementById('statusMsg').innerHTML =
    '<span class="live-dot"></span>Connecting to NYCDOT...';

  // Restore preferences
  if (localStorage.getItem('ch_darkmode') === '1') document.body.classList.add('dark-mode');
  if (localStorage.getItem('ch_compact') === '1') document.body.classList.add('compact');
  updateToggleLabels();

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

  // Register visit (fire-and-forget)
  if (BestTime.proxyUrl) {
    fetch(BestTime.proxyUrl + '/api/visit', { method: 'POST' }).catch(() => {});
  }

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

/* ── Event delegation: bar list ── */

document.getElementById('barList').addEventListener('click', (e) => {
  const camEl = e.target.closest('[data-action="camera"]');
  if (camEl) {
    openCam(camEl.dataset.camId, camEl.dataset.barName, camEl.dataset.camName, parseInt(camEl.dataset.camFt, 10));
    return;
  }
  const trEl = e.target.closest('[data-action="transport"]');
  if (trEl) {
    openMenu(e, BARS[parseInt(trEl.dataset.barIdx, 10)]);
    return;
  }
});

// Close transport dropdown on outside click
document.addEventListener('click', (e) => {
  if (menuOpen && !e.target.closest('.transport-dropdown') && !e.target.closest('[data-action="transport"]')) closeMenu();
});

// Neighborhood filter
document.getElementById('hoodFilter').addEventListener('change', function () { renderBars(this.value); });

// Refresh button
document.getElementById('btnRefresh').addEventListener('click', () => { clearCamCache(); init(); });

// Camera modal — close on overlay click
document.getElementById('camModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('camModal')) closeCam();
});

// Camera image events
document.getElementById('camImg').addEventListener('load', onCamLoad);
document.getElementById('camImg').addEventListener('error', onCamErr);

// Close camera via buttons
document.getElementById('btnCamClose').addEventListener('click', closeCam);
document.querySelector('.cam-win .win-btn').addEventListener('click', closeCam);

// Transport dropdown close is handled inline by transport.js

/* ── Menu bar ── */

document.querySelector('.win-menubar').addEventListener('click', (e) => {
  e.stopPropagation();

  // Click on a dropdown item — fire its action
  const li = e.target.closest('.win-dropdown li');
  if (li && li.dataset.action && !li.classList.contains('menu-sep')) {
    handleMenuAction(li.dataset.action);
    return;
  }

  // Click on a menu-item label — toggle its dropdown
  const menuItem = e.target.closest('.menu-item[data-menu]');
  if (menuItem) {
    const wasOpen = menuItem.classList.contains('open');
    closeAllMenus();
    if (!wasOpen) menuItem.classList.add('open');
  }
});

document.addEventListener('click', () => closeAllMenus());

/* ── About & Shortcuts dialogs ── */

['aboutModal', 'shortcutsModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', (e) => {
    if (e.target === document.getElementById(id)) document.getElementById(id).classList.remove('open');
  });
});
document.getElementById('btnAboutClose').addEventListener('click', () => document.getElementById('aboutModal').classList.remove('open'));
document.getElementById('btnAboutOk').addEventListener('click', () => document.getElementById('aboutModal').classList.remove('open'));
document.getElementById('btnShortcutsClose').addEventListener('click', () => document.getElementById('shortcutsModal').classList.remove('open'));
document.getElementById('btnShortcutsOk').addEventListener('click', () => document.getElementById('shortcutsModal').classList.remove('open'));

/* ── Keyboard shortcuts ── */

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key === 'Escape') {
    closeCam(); closeAllMenus();
    document.getElementById('aboutModal').classList.remove('open');
    document.getElementById('shortcutsModal').classList.remove('open');
    return;
  }
  if (e.key === 'd' || e.key === 'D') { handleMenuAction('darkmode'); return; }
  if (e.key === 'c' || e.key === 'C') { handleMenuAction('compact'); return; }
  if (e.key === 'r' || e.key === 'R') { handleMenuAction('refresh'); return; }
  if (e.key === '1') { handleMenuAction('sort-hood'); return; }
  if (e.key === '2') { handleMenuAction('sort-az'); return; }
  if (e.key === '3') { handleMenuAction('sort-busy'); return; }
  if (e.key === '4') { handleMenuAction('sort-dist'); return; }
  if (e.key === '5') { handleMenuAction('sort-closed'); return; }
});

/* ── Start ── */

setInterval(tick, 1000);
tick();
setInterval(() => renderBars(), 60000);
init();
