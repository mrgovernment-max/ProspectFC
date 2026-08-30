/* =====================================================================
   Shared fixture helpers.

   The two season feeds disagree on shape: 2025-26 sends ISO dates and real
   times, 2026-27 sends day/month with no year, "KO TBC" instead of a time,
   and 0 rather than null for matches that have not been played. Everything
   here normalises that so the fixtures page and the home page agree.
   ===================================================================== */

const SEASON_ENDPOINTS = {
  "2025-26": "https://api.fenteng.dev/fixtures",
  "2026-27": "https://api.fenteng.dev/fixtures2627",
};

// The two season feeds disagree on shape. 2025-26 sends ISO dates
// ("2026-05-16") and real times ("14:00:00"); 2026-27 sends day/month
// with no year ("22/08") and "KO TBC" in place of a time. Everything
// below normalises both into one presentation.
const SEASON_START_YEAR = { "2025-26": 2025, "2026-27": 2026 };

// Neutral shield for opponents the feed has no crest for (it sends null
// for "Opponent TBC", which used to render as a broken <img src="null">).
const CREST_FALLBACK =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<circle cx="32" cy="32" r="32" fill="#0a1128" />' +
      '<path d="M32 15l13 4.6v13c0 9.4-5.6 14-13 16.8-7.4-2.8-13-7.4-13-16.8v-13z" ' +
      'fill="none" stroke="#e8b923" stroke-width="3" stroke-linejoin="round" />' +
      "</svg>",
  );

function crestFor(url) {
  return url && url !== "null" ? url : CREST_FALLBACK;
}

function crestFallback(img) {
  img.onerror = null;
  img.src = CREST_FALLBACK;
}

function parseMatchDate(raw, season) {
  if (!raw) return null;
  const text = String(raw).trim();

  let m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  m = text.match(/^(\d{1,2})\/(\d{1,2})$/); // "22/08" — day/month, year implied
  if (m) {
    const startYear = SEASON_START_YEAR[season] || new Date().getFullYear();
    const month = +m[2];
    // An EBFL season runs Aug-May, so Jan-Jul falls in the next calendar year.
    return new Date(month >= 8 ? startYear : startYear + 1, month - 1, +m[1]);
  }

  const d = new Date(text);
  return isNaN(d.getTime()) ? null : d;
}

function formatMatchDate(raw, season) {
  const d = parseMatchDate(raw, season);
  if (!d) return raw || "TBC";
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMatchTime(raw) {
  if (!raw) return "TBC";
  const m = String(raw).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(raw); // e.g. "KO TBC" — show it as written
  const hours = +m[1];
  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return hour12 + ":" + m[2] + suffix;
}

// The feed spells our own club five ways ("Prospect Football Club",
// "FC PROSPECT", "Prospect Fc"...). Show one name.
function displayTeamName(name) {
  if (!name) return "TBC";
  return /prospect/i.test(name) ? "Prospect FC" : name;
}

function isOurClub(name) {
  return /prospect/i.test(name || "");
}

function matchStatus(element, season) {
  const kickoff = parseMatchDate(element.match_date, season);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // The 2026-27 feed stores 0 rather than null for unplayed matches, so a
  // future kick-off date has to outrank whatever is in the score columns.
  if (kickoff && kickoff.getTime() > today.getTime()) return "Upcoming";
  if (element.home_score === null || element.away_score === null)
    return "Upcoming";
  return "Completed";
}

// ISO timestamp for the "Remind Me" Google Calendar link. Returns "" when
// the feed has no usable date, so the button can be left off entirely.
function calendarStamp(element, season) {
  const d = parseMatchDate(element.match_date, season);
  if (!d) return "";
  const t = String(element.match_time || "").match(/^(\d{1,2}):(\d{2})/);
  d.setHours(t ? +t[1] : 14, t ? +t[2] : 0, 0, 0); // default 2pm kick-off
  return d.toISOString();
}
