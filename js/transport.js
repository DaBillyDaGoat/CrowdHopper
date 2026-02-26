/* ═════════════════════════════════════════
   transport.js — Get-there menu (Maps/Uber/Lyft)
   ═════════════════════════════════════════ */

let menuOpen = false;

function openMenu(e, bar) {
  e.stopPropagation();

  const enc = encodeURIComponent(bar.addr + ', New York, NY');
  const menu = document.getElementById('transportMenu');

  document.getElementById('tmenuBarName').textContent = 'Get to ' + bar.name;

  // Google Maps
  document.getElementById('tmGmaps').href =
    `https://www.google.com/maps/dir/?api=1&destination=${enc}&travelmode=transit`;

  // Uber deep-link + web fallback
  const uberDeep = `uber://?action=setPickup&pickup=my_location`
    + `&dropoff[latitude]=${bar.lat}&dropoff[longitude]=${bar.lon}`
    + `&dropoff[nickname]=${encodeURIComponent(bar.name)}`;
  const uberWeb = `https://m.uber.com/ul/?action=setPickup&pickup=my_location`
    + `&dropoff[latitude]=${bar.lat}&dropoff[longitude]=${bar.lon}`
    + `&dropoff[nickname]=${encodeURIComponent(bar.name)}`;

  const tmUber = document.getElementById('tmUber');
  tmUber.href = uberDeep;
  tmUber.onclick = (ev) => appFallback(ev, uberWeb);

  // Lyft deep-link + web fallback
  const lyftDeep = `lyft://ridetype?id=lyft`
    + `&destination[latitude]=${bar.lat}&destination[longitude]=${bar.lon}`;
  const lyftWeb = `https://lyft.com/ride?id=lyft`
    + `&destination[lat]=${bar.lat}&destination[lng]=${bar.lon}`;

  const tmLyft = document.getElementById('tmLyft');
  tmLyft.href = lyftDeep;
  tmLyft.onclick = (ev) => appFallback(ev, lyftWeb);

  // Position near tapped element
  const rect = e.currentTarget.getBoundingClientRect();
  const menuW = 220, menuH = 170;
  let top  = rect.bottom;
  let left = rect.left - menuW + rect.width;
  if (left < 4) left = 4;
  if (top + menuH > window.innerHeight - 10) top = rect.top - menuH;

  menu.style.top  = top + 'px';
  menu.style.left = left + 'px';
  menu.classList.add('open');
  menuOpen = true;
}

function closeMenu() {
  document.getElementById('transportMenu').classList.remove('open');
  menuOpen = false;
}

/** Try native app link; if it doesn't open within 1.5 s, fall back to web URL */
function appFallback(e, webUrl) {
  const t = Date.now();
  setTimeout(() => {
    if (Date.now() - t < 2100) window.location.href = webUrl;
  }, 1500);
}
