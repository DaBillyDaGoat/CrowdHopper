/* ═══════════════════════════════════════
   bars.js — Bar data & neighborhood list
   ═══════════════════════════════════════ */

const NEIGHBORHOODS = [
  { id: 'west_village',       name: 'West Village' },
  { id: 'murray_hill',        name: 'Murray Hill' },
  { id: 'kips_bay',           name: 'Kips Bay' },
  { id: 'greenwich_village',  name: 'Greenwich Village' },
  { id: 'lower_east_side',    name: 'Lower East Side' }
];

/*  crowd — 24-element array matching BestTime format
    index 0 = 6 AM, index 23 = 5 AM next day
    Values 0-100 (relative busyness %)
    These are static fallbacks; BestTime replaces them when available. */
const BARS = [

  // ── West Village ─────────────────────
  {
    name: "Bandits",
    addr: "44 Bedford St",
    hood: "west_village",
    lat: 40.72817, lon: -74.00413,
    venueId: null,
    crowd: [0,0,0,0,5,8,12,18,22,20,14,10,28,52,70,85,80,55,30,15,8,3,0,0]
  },
  {
    name: "Barrow's Pub",
    addr: "463 Hudson St",
    hood: "west_village",
    lat: 40.72863, lon: -74.00435,
    venueId: null,
    crowd: [0,0,0,0,6,10,16,18,16,12,8,22,45,62,78,72,50,30,18,10,5,0,0,0]
  },
  {
    name: "Barrow Street Ale House",
    addr: "15 Barrow St",
    hood: "west_village",
    lat: 40.73060, lon: -74.00270,
    venueId: null,
    crowd: [0,0,0,5,10,15,25,35,40,38,30,25,40,55,72,80,75,55,35,20,10,5,0,0]
  },
  {
    name: "WXOU Radio Bar",
    addr: "558 Hudson St",
    hood: "west_village",
    lat: 40.73180, lon: -74.00680,
    venueId: null,
    crowd: [0,0,0,0,0,0,0,5,15,12,10,18,35,55,72,88,82,60,42,25,12,5,0,0]
  },

  // ── Murray Hill ──────────────────────
  {
    name: "Paddy Reilly's",
    addr: "519 2nd Ave",
    hood: "murray_hill",
    lat: 40.74373, lon: -73.97967,
    venueId: null,
    crowd: [0,0,0,0,4,8,12,10,7,5,12,38,58,72,90,88,66,42,28,15,8,3,0,0]
  },
  {
    name: "Banc Cafe",
    addr: "431 3rd Ave",
    hood: "murray_hill",
    lat: 40.74434, lon: -73.98104,
    venueId: null,
    crowd: [0,0,0,0,5,10,20,25,22,18,30,55,72,85,92,88,70,50,32,18,8,3,0,0]
  },

  // ── Kips Bay ─────────────────────────
  {
    name: "Lucky Lyndon",
    addr: "156 E 33rd St",
    hood: "kips_bay",
    lat: 40.74653, lon: -73.98193,
    venueId: null,
    crowd: [0,0,0,0,3,5,8,7,5,4,8,20,35,50,65,60,45,30,18,10,5,2,0,0]
  },
  {
    name: "Fáilte",
    addr: "531 2nd Ave",
    hood: "kips_bay",
    lat: 40.74300, lon: -73.97900,
    venueId: null,
    crowd: [0,0,0,0,5,12,20,28,25,18,22,42,60,75,85,82,65,48,30,18,8,3,0,0]
  },

  // ── Greenwich Village ────────────────
  {
    name: "Super Burrito",
    addr: "169 Bleecker St",
    hood: "greenwich_village",
    lat: 40.72737, lon: -74.00043,
    venueId: null,
    crowd: [0,0,0,0,12,25,40,45,38,30,35,55,70,80,88,82,60,42,25,12,5,2,0,0]
  },
  {
    name: "The Red Lion",
    addr: "151 Bleecker St",
    hood: "greenwich_village",
    lat: 40.72849, lon: -73.99951,
    venueId: null,
    crowd: [0,0,0,0,5,10,15,18,15,12,15,30,48,65,82,90,85,68,50,32,18,8,3,0]
  },

  // ── Lower East Side ──────────────────
  {
    name: "The Ripple Room",
    addr: "183 Bowery",
    hood: "lower_east_side",
    lat: 40.72073, lon: -73.99327,
    venueId: null,
    crowd: [0,0,0,0,0,0,5,10,8,5,8,22,40,58,75,88,85,72,55,38,22,10,3,0]
  }
];

/** Look up display name for a hood id */
function getHoodName(hoodId) {
  const h = NEIGHBORHOODS.find(n => n.id === hoodId);
  return h ? h.name : hoodId;
}
