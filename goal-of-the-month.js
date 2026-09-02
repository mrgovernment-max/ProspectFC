/* =====================================================================
   THE PROSPECT THREE — Goal of the Month campaign
   Shared config, data and rendering logic. Loaded on every page: pages
   with a matching container render the full/teaser cards; every other
   page just gets the floating campaign CTA (self-suppressed where a
   container already exists, so the campaign isn't advertised twice).

   EDIT HERE when real details arrive — nothing else in the site needs
   to change. Leave a field null/placeholder and the UI shows a clear
   "coming soon" state instead of guessing at it.
   ===================================================================== */

// ---- Official voting -------------------------------------------------
// The EBFL Goal of the Month (August) poll. Voting itself never happens
// on prospectfc.com — every vote CTA sends supporters here.
const GOAL_OF_MONTH_VOTE_URL = "https://take.quiz-maker.com/poll5853433xB029416c-169";

// ISO timestamp, e.g. "2026-09-30T23:59:00+01:00". Leave null until a
// deadline is confirmed — the countdown stays hidden rather than showing
// invented numbers.
const GOAL_OF_MONTH_DEADLINE_ISO = null;

const GOAL_OF_MONTH_CAMPAIGN_URL = "https://prospectfc.com/goal-of-the-month.html";

function voteUrlConfirmed() {
  return !!GOAL_OF_MONTH_VOTE_URL && !/^REPLACE_ME/.test(GOAL_OF_MONTH_VOTE_URL);
}

// Neutral player silhouette shown until a real photo is supplied —
// mirrors the crest fallback pattern already used in fixtures-data.js.
const GOTM_PHOTO_FALLBACK =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">' +
      '<rect width="300" height="300" fill="#0d1526" />' +
      '<circle cx="150" cy="112" r="52" fill="#1a2740" />' +
      '<path d="M150 178c-62 0-96 34-96 86v36h192v-36c0-52-34-86-96-86z" fill="#1a2740" />' +
      '</svg>',
  );

// ---- Nominees ----------------------------------------------------------
// Player names and official EBFL poll goal numbers are confirmed. Match
// opponent/date, goal description and video are not yet supplied — those
// stay null (rendered as "coming soon") rather than being guessed.
// Video files are served locally from images/. The originals supplied were
// .mov containers — already H.264 (no HEVC re-encode needed this time),
// but Chromium's canPlayType('video/quicktime') came back empty even
// though a bare <video src> happened to play them, an inconsistent signal
// not worth trusting in production. Each was losslessly remuxed
// (ffmpeg -c copy, no re-encode, identical quality) into a plain .mp4
// alongside the untouched original — see images/Dawid.mov etc.
const GOAL_OF_MONTH_NOMINEES = [
  {
    number: "01",
    pollLabel: "Goal 1",
    playerName: "Dawid Jarzebowski",
    squadNumber: 9,
    photo: "https://res.cloudinary.com/dazhskqcc/image/upload/v1754089788/dawid_pp_pjed19.jpg",
    opponent: null,
    matchDate: null,
    competition: null,
    description: null,
    videoUrl: "images/Dawid.mp4",
  },
  {
    number: "02",
    pollLabel: "Goal 2",
    playerName: "Kacper Sek",
    squadNumber: 7,
    photo: "https://res.cloudinary.com/dazhskqcc/image/upload/v1753960978/kasper_igylby.jpg",
    opponent: null,
    matchDate: null,
    competition: null,
    description: null,
    videoUrl: "images/Sek.mp4",
  },
  {
    number: "03",
    pollLabel: "Goal 8",
    playerName: "Harrison Lucas-Brind",
    squadNumber: null,
    photo: null,
    opponent: null,
    matchDate: null,
    competition: null,
    description: null,
    videoUrl: "images/Lucas.mp4",
  },
];

// True dimensions of the supplied clips (2532x1170, ≈2.164:1). Setting the
// exact ratio on the player wrapper reserves its height before the video
// loads, so the page doesn't jump once metadata arrives.
const GOTM_VIDEO_ASPECT = "2532 / 1170";

function gotmHasDetails(n) {
  return !!n.playerName;
}

function gotmFormatDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function gotmEscape(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function gotmVideoEmbed(url, playerName) {
  if (!url) {
    return `<div class="gotm-video-wrap gotm-video-wrap--pending" style="aspect-ratio:${GOTM_VIDEO_ASPECT};">
      <p class="gotm-video-pending">Goal clip coming soon.</p>
    </div>`;
  }

  const label = playerName ? `${gotmEscape(playerName)}'s nominated goal` : "Nominated goal";
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  if (yt) {
    return `<div class="gotm-video-wrap" style="aspect-ratio:${GOTM_VIDEO_ASPECT};">
      <iframe loading="lazy" src="https://www.youtube.com/embed/${yt[1]}" title="${label}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>`;
  }

  // A plain video src has no fallback for browsers that can't play it; a
  // <source> + inner text does — the text/link only renders when nothing
  // in the element is playable.
  return `<div class="gotm-video-wrap" style="aspect-ratio:${GOTM_VIDEO_ASPECT};">
      <video controls playsinline preload="metadata" aria-label="${label}">
        <source src="${gotmEscape(url)}" type="video/mp4" />
        Your browser can't play this video.
        <a href="${gotmEscape(url)}" target="_blank" rel="noopener noreferrer">Watch it directly instead</a>.
      </video>
    </div>`;
}

function gotmVoteButtonMarkup(label) {
  if (voteUrlConfirmed()) {
    return `<a class="btn gotm-vote-btn" href="${gotmEscape(GOAL_OF_MONTH_VOTE_URL)}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">→</span></a>`;
  }
  return `<button type="button" class="btn gotm-vote-btn" disabled aria-disabled="true" title="Official voting link is not live yet">Vote link coming soon</button>`;
}

// ---- Nominee cards -------------------------------------------------------

function gotmRenderCard(n, variant) {
  const has = gotmHasDetails(n);
  const hasPhoto = !!n.photo;
  const photo = n.photo || GOTM_PHOTO_FALLBACK;
  const name = has ? gotmEscape(n.playerName) : "Nominee details coming soon";
  const meta = [];
  if (n.opponent) meta.push(`vs ${gotmEscape(n.opponent)}`);
  const date = gotmFormatDate(n.matchDate);
  if (date) meta.push(date);
  if (n.competition) meta.push(gotmEscape(n.competition));

  // The nominees all sit inside one shared external poll, so a card CTA
  // never implies a click pre-selects that player — every button lands
  // on the same official vote.
  const voteLabel = "CAST YOUR OFFICIAL VOTE";

  if (variant === "teaser") {
    return `
      <article class="gotm-card gotm-card--teaser${hasPhoto ? "" : " gotm-card--pending"}">
        <div class="gotm-card-number">NOMINEE ${n.number}</div>
        <div class="gotm-card-photo">
          <img src="${gotmEscape(photo)}" alt="${has ? gotmEscape(n.playerName) + " goal nomination" : "Nominee photo coming soon"}" loading="lazy" />
        </div>
        <h3 class="gotm-card-name">${name}</h3>
        ${n.pollLabel ? `<p class="gotm-card-poll">EBFL Poll &middot; ${gotmEscape(n.pollLabel)}</p>` : ""}
        ${meta.length ? `<p class="gotm-card-meta">${meta.join(" &middot; ")}</p>` : `<p class="gotm-card-meta gotm-card-meta--pending">Match details to be confirmed</p>`}
      </article>`;
  }

  // The dedicated page is now built around the actual goal footage, so
  // each nominee is a large stacked feature (video first) rather than a
  // boxed card — the player photo drops to a small byline avatar, shown
  // only where a real one exists (never invented for Harrison).
  const avatar = hasPhoto
    ? `<img class="gotm-feature-avatar" src="${gotmEscape(n.photo)}" alt="${gotmEscape(n.playerName)}" loading="lazy" />`
    : "";

  return `
    <article class="gotm-feature" id="nominee-${n.number}">
      <div class="gotm-feature-tag">
        <span class="gotm-feature-number">NOMINEE ${n.number}</span>
        ${n.pollLabel ? `<span class="gotm-feature-poll">${gotmEscape(n.pollLabel)}</span>` : ""}
      </div>
      <div class="gotm-feature-byline">
        ${avatar}
        <div>
          <h3 class="gotm-feature-name">${name}</h3>
          ${n.squadNumber ? `<p class="gotm-feature-squad">Squad No. ${gotmEscape(n.squadNumber)}</p>` : ""}
        </div>
      </div>
      ${gotmVideoEmbed(n.videoUrl, n.playerName)}
      <div class="gotm-feature-actions">
        ${gotmVoteButtonMarkup(voteLabel)}
        <button type="button" class="gotm-fave-btn" data-fave="${n.number}" aria-pressed="false">
          <span class="gotm-fave-icon" aria-hidden="true">★</span> Prospect Fan Favourite
        </button>
      </div>
    </article>`;
}

function gotmRenderInto(containerId, variant) {
  const el = document.getElementById(containerId);
  if (!el) return false;
  el.innerHTML = GOAL_OF_MONTH_NOMINEES.map((n) => gotmRenderCard(n, variant)).join("");
  return true;
}

// ---- Countdown ------------------------------------------------------------

function gotmInitCountdown() {
  const el = document.getElementById("gotm-countdown");
  if (!el) return;

  if (!GOAL_OF_MONTH_DEADLINE_ISO) {
    el.hidden = true;
    return;
  }

  const deadline = new Date(GOAL_OF_MONTH_DEADLINE_ISO);
  if (isNaN(deadline.getTime())) {
    el.hidden = true;
    return;
  }

  function tick() {
    const diff = deadline.getTime() - Date.now();
    if (diff <= 0) {
      el.innerHTML = `<p class="gotm-countdown-label">Voting has closed</p>`;
      clearInterval(timer);
      document.querySelectorAll(".gotm-vote-btn").forEach((btn) => {
        btn.setAttribute("aria-disabled", "true");
        btn.classList.add("is-closed");
        if (btn.tagName === "A") {
          btn.removeAttribute("href");
          btn.setAttribute("role", "button");
        } else {
          btn.disabled = true;
        }
        btn.textContent = "Voting closed";
      });
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    el.innerHTML = `
      <p class="gotm-countdown-label">Voting closes in</p>
      <p class="gotm-countdown-clock">
        <span>${String(d).padStart(2, "0")}<small>D</small></span> :
        <span>${String(h).padStart(2, "0")}<small>H</small></span> :
        <span>${String(m).padStart(2, "0")}<small>M</small></span>
      </p>`;
  }

  tick();
  const timer = setInterval(tick, 60000);
}

// ---- Fan Favourite (local only, never the official vote) -----------------

function gotmInitFanFavourite() {
  let saved = null;
  try {
    saved = localStorage.getItem("pfcGotmFavourite");
  } catch {
    /* private browsing / storage blocked — toggle still works, just won't persist */
  }

  document.querySelectorAll(".gotm-fave-btn").forEach((btn) => {
    const num = btn.getAttribute("data-fave");
    if (num === saved) {
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
    }
    btn.addEventListener("click", () => {
      const active = btn.classList.toggle("is-active");
      btn.setAttribute("aria-pressed", String(active));
      document.querySelectorAll(".gotm-fave-btn").forEach((other) => {
        if (other !== btn) {
          other.classList.remove("is-active");
          other.setAttribute("aria-pressed", "false");
        }
      });
      try {
        if (active) localStorage.setItem("pfcGotmFavourite", num);
        else localStorage.removeItem("pfcGotmFavourite");
      } catch {
        /* ignore */
      }
    });
  });
}

// ---- Share bar -------------------------------------------------------------

function gotmInitShare() {
  const bar = document.getElementById("gotm-share");
  if (!bar) return;
  const url = GOAL_OF_MONTH_CAMPAIGN_URL;
  const text = "Prospect FC has three Goal of the Month nominees — watch the nominees and cast your vote!";

  bar.querySelectorAll("[data-share]").forEach((btn) => {
    const kind = btn.getAttribute("data-share");
    if (kind === "copy") {
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(url);
          const original = btn.textContent;
          btn.textContent = "Link copied!";
          setTimeout(() => (btn.textContent = original), 1800);
        } catch {
          window.prompt("Copy this link:", url);
        }
      });
    } else {
      const links = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
        x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      };
      if (links[kind]) btn.setAttribute("href", links[kind]);
    }
  });
}

// ---- Floating campaign CTA --------------------------------------------

function gotmInjectFloatingCTA() {
  if (document.body.hasAttribute("data-no-gotm-widget")) return;
  if (document.getElementById("gotm-float-cta")) return;

  const style = document.createElement("style");
  style.textContent = `
    #gotm-float-cta {
      position: fixed;
      left: 50%;
      bottom: 1.1rem;
      transform: translateX(-50%);
      z-index: 950;
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.75rem 1.3rem;
      background: linear-gradient(135deg, #1668e0 0%, #0043a8 55%, #00204f 100%);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 999px;
      box-shadow: 0 12px 30px rgba(3,9,22,0.35);
      font-family: "Montserrat", sans-serif;
      font-weight: 600;
      font-size: 0.85rem;
      letter-spacing: 0.2px;
      text-decoration: none;
      cursor: pointer;
      max-width: calc(100vw - 1.5rem);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    #gotm-float-cta:hover { transform: translateX(-50%) translateY(-3px); box-shadow: 0 16px 36px rgba(3,9,22,0.45); }
    #gotm-float-cta .gotm-float-close {
      background: rgba(255,255,255,0.14);
      border: none;
      color: #fff;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      line-height: 1;
      font-size: 0.75rem;
      cursor: pointer;
      flex-shrink: 0;
    }
    @media (max-width: 480px) {
      #gotm-float-cta { font-size: 0.78rem; padding: 0.65rem 1.05rem; bottom: 0.85rem; }
    }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.id = "gotm-float-cta";
  wrap.setAttribute("role", "link");
  wrap.innerHTML = `
    <a href="goal-of-the-month.html" style="color:inherit;text-decoration:none;display:flex;align-items:center;gap:0.55rem;">
      🏆 3 Prospect goals nominated — Vote now
    </a>
    <button type="button" class="gotm-float-close" aria-label="Dismiss">✕</button>`;
  document.body.appendChild(wrap);

  wrap.querySelector(".gotm-float-close").addEventListener("click", (e) => {
    e.preventDefault();
    wrap.remove();
    try {
      sessionStorage.setItem("pfcGotmDismissed", "1");
    } catch {
      /* ignore */
    }
  });

  try {
    if (sessionStorage.getItem("pfcGotmDismissed")) wrap.remove();
  } catch {
    /* ignore */
  }
}

// ---- Boot ------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const renderedTeaser = gotmRenderInto("gotm-teaser", "teaser");
  const renderedFull = gotmRenderInto("gotm-nominees", "full");

  gotmInitCountdown();
  gotmInitFanFavourite();
  gotmInitShare();

  // Generic "cast your official vote" buttons outside the nominee cards
  // (e.g. the hero CTA) get the real URL wired up here — never a bare "#".
  document.querySelectorAll(".gotm-vote-cta").forEach((btn) => {
    if (voteUrlConfirmed()) {
      btn.setAttribute("href", GOAL_OF_MONTH_VOTE_URL);
      btn.setAttribute("target", "_blank");
      btn.setAttribute("rel", "noopener noreferrer");
    } else {
      btn.removeAttribute("href");
      btn.setAttribute("role", "button");
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("tabindex", "-1");
      btn.classList.add("is-pending");
      btn.title = "Official voting link is not live yet";
      btn.textContent = "Vote link coming soon";
    }
  });

  // Only the homepage teaser and the dedicated campaign page already make
  // the campaign obvious; every other page gets the floating reminder.
  if (!renderedTeaser && !renderedFull) gotmInjectFloatingCTA();
});
