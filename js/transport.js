/* ═════════════════════════════════════════
   transport.js — Inline get-there dropdown
   Expands below the tapped bar row instead
   of a floating popup (mobile-friendly).
   ═════════════════════════════════════════ */

let menuOpen = false;
let activeDropdown = null;

function openMenu(e, bar) {
  e.stopPropagation();

  // Close any existing dropdown first
  closeMenu();

  const enc = encodeURIComponent(bar.addr + ', New York, NY');

  // Uber deep-link + web fallback
  const uberDeep = `uber://?action=setPickup&pickup=my_location`
    + `&dropoff[latitude]=${bar.lat}&dropoff[longitude]=${bar.lon}`
    + `&dropoff[nickname]=${encodeURIComponent(bar.name)}`;
  const uberWeb = `https://m.uber.com/ul/?action=setPickup&pickup=my_location`
    + `&dropoff[latitude]=${bar.lat}&dropoff[longitude]=${bar.lon}`
    + `&dropoff[nickname]=${encodeURIComponent(bar.name)}`;

  // Lyft deep-link + web fallback
  const lyftDeep = `lyft://ridetype?id=lyft`
    + `&destination[latitude]=${bar.lat}&destination[longitude]=${bar.lon}`;
  const lyftWeb = `https://lyft.com/ride?id=lyft`
    + `&destination[lat]=${bar.lat}&destination[lng]=${bar.lon}`;

  // Build inline dropdown HTML
  const gmapsHref = `https://www.google.com/maps/dir/?api=1&destination=${enc}&travelmode=transit`;

  const dropdown = document.createElement('div');
  dropdown.className = 'transport-dropdown open';
  dropdown.innerHTML = `
    <div class="td-header">
      <span>Get to ${bar.name.replace(/</g, '&lt;')}</span>
      <div class="td-close" data-td-close>✕</div>
    </div>
    <div class="td-links">
      <a class="td-link" href="${gmapsHref}" target="_blank" rel="noopener">
        <span class="td-icon">🗺️</span>
        <span class="td-label">Maps</span>
      </a>
      <a class="td-link" href="${uberDeep}" data-web="${uberWeb}">
        <span class="td-icon" style="font-weight:900;font-family:sans-serif;color:#000">U</span>
        <span class="td-label">Uber</span>
      </a>
      <a class="td-link" href="${lyftDeep}" data-web="${lyftWeb}">
        <span class="td-icon" style="font-weight:900;font-family:sans-serif;color:#ff00bf">L</span>
        <span class="td-label">Lyft</span>
      </a>
    </div>`;

  // Insert after the bar row
  const barRow = e.target.closest('.bar-row');
  if (barRow) {
    barRow.after(dropdown);
    // Scroll into view on mobile
    setTimeout(() => dropdown.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  activeDropdown = dropdown;
  menuOpen = true;

  // Close button
  dropdown.querySelector('[data-td-close]').addEventListener('click', (ev) => {
    ev.stopPropagation();
    closeMenu();
  });

  // App fallback for Uber/Lyft
  dropdown.querySelectorAll('[data-web]').forEach(link => {
    link.addEventListener('click', (ev) => {
      const webUrl = link.dataset.web;
      const t = Date.now();
      setTimeout(() => {
        if (Date.now() - t < 2100) window.location.href = webUrl;
      }, 1500);
    });
  });
}

function closeMenu() {
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
  }
  menuOpen = false;
}
