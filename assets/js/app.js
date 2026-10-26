/*
 * Eat Freely Debrecen: interface and motion.
 *
 * Motion language (taken from the reference video):
 *  - plates ride a big invisible wheel: the old plate swings out to the top-left,
 *    the new one swings in from the top-right, spinning as it travels
 *  - the two title lines wipe away in opposite directions behind a thin caret,
 *    then wipe back in mirrored
 *  - the pastel ring, badge colour, card text and thumbnail highlight all
 *    follow the active item
 */
(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  // ?slow=4 plays every motion 4x slower (handy when fine-tuning choreography)
  const SLOW = Math.max(1, +new URLSearchParams(location.search).get("slow") || 1);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms * SLOW));
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem("ef:" + k);
        return v == null ? d : JSON.parse(v);
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("ef:" + k, JSON.stringify(v));
      } catch {
        /* private mode: nothing to do */
      }
    },
  };

  /* ------------------------------------------------------------------
     Icons (24px stroke icons)
     ------------------------------------------------------------------ */
  const ICONS = {
    utensils: '<ellipse cx="7.5" cy="6.6" rx="2.6" ry="3.6"/><path d="M7.5 10.2V21"/><path d="M14.5 3v4.6a2.3 2.3 0 0 0 4.6 0V3M16.8 3v18"/>',
    pin: '<path d="M19 10c0 5.5-7 11-7 11s-7-5.5-7-11a7 7 0 0 1 14 0z"/><circle cx="12" cy="10" r="2.6"/>',
    basket: '<path d="M3 10h18l-1.7 8.4a2 2 0 0 1-2 1.6H6.7a2 2 0 0 1-2-1.6z"/><path d="m8 10 3-6M16 10l-3-6M9.5 14v3M14.5 14v3"/>',
    book: '<path d="M3 5h6a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3z"/><path d="M21 5h-6a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21z"/>',
    chat: '<path d="M20.5 14.5a2 2 0 0 1-2 2H9l-4.5 4v-14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke-width="2.6"/>',
    swap: '<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>',
    map: '<path d="m9 4-5.4 2.2a1 1 0 0 0-.6.9v12.4a.7.7 0 0 0 1 .6L9 18l6 2.5 5.4-2.2a1 1 0 0 0 .6-.9V5a.7.7 0 0 0-1-.6L15 6.5z"/><path d="M9 4v14M15 6.5v14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    out: '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
    heart: '<path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7.2 3.8 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.4 0 5.6 3.2 4.4 6.6C19.5 15.4 12 20 12 20z"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    leaf: '<path d="M5 19c0-8.5 5.8-14 15-14 0 9.2-5.6 15-14 15z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M17 7 7 17M7 7l10 10"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.9-2.6 2.4-2.6 4.1M12 17.2h.01"/>',
    alert: '<path d="M10.3 4.2 2.6 17.6A2 2 0 0 0 4.3 20.6h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4.2M12 16.9h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
    flame: '<path d="M12 21c-3.6 0-6.2-2.5-6.2-6 0-3.7 3-5.6 3.4-9.5 2 1.2 3.4 3.3 3.6 5.2.8-.9 1.3-2 1.4-3.2 2.4 1.8 4 4.4 4 7.5 0 3.5-2.6 6-6.2 6z"/>',
    gauge: '<path d="M4.5 17a8 8 0 1 1 15 0"/><path d="m12 13 3.5-4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5"/><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>',
    tag: '<path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
    up: '<path d="M7 10.5V20H4.5a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1zM7 10.5l3.6-6.6a1.8 1.8 0 0 1 3.3 1.3L13 9.5h5.2a2 2 0 0 1 2 2.4l-1.3 6.5a2 2 0 0 1-2 1.6H7"/>',
    down: '<path d="M17 13.5V4h2.5a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1zM17 13.5l-3.6 6.6a1.8 1.8 0 0 1-3.3-1.3l.9-4.3H5.8a2 2 0 0 1-2-2.4l1.3-6.5a2 2 0 0 1 2-1.6H17"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.6 5.7 3.6 9s-1.1 6.3-3.6 9c-2.5-2.7-3.6-5.7-3.6-9S9.5 5.7 12 3z"/>',
    /* allergen glyphs */
    gluten:
      '<path d="M12 21V8.5"/><path d="M12 8.5c-1.9-1-2.3-3.6 0-5.6 2.3 2 1.9 4.6 0 5.6zM12 13c-1.2-2.1-3.3-2.9-5.2-2.4.4 2.1 2.6 3.4 5.2 2.4zM12 13c1.2-2.1 3.3-2.9 5.2-2.4-.4 2.1-2.6 3.4-5.2 2.4zM12 17.6c-1.2-2.1-3.3-2.9-5.2-2.4.4 2.1 2.6 3.4 5.2 2.4zM12 17.6c1.2-2.1 3.3-2.9 5.2-2.4-.4 2.1-2.6 3.4-5.2 2.4z"/>',
    dairy: '<path d="M9.5 2.5h5M10 2.5v3L7.5 9.2V19.5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V9.2L14 5.5v-3"/><path d="M7.5 13.2c1.6.9 3 .9 4.5 0s2.9-.9 4.5 0"/>',
    egg: '<path d="M12 21.5c-3.8 0-6.4-2.7-6.4-6.6C5.6 9.8 8.6 2.5 12 2.5s6.4 7.3 6.4 12.4c0 3.9-2.6 6.6-6.4 6.6z"/>',
    peanut:
      '<path transform="rotate(-35 12 12)" d="M12 2.6c2.4 0 4 1.8 4 4 0 1.7-1 2.6-1 4.4s1 2.7 1 4.4c0 2.2-1.6 4-4 4s-4-1.8-4-4c0-1.7 1-2.6 1-4.4s-1-2.7-1-4.4c0-2.2 1.6-4 4-4z"/><path transform="rotate(-35 12 12)" d="M10.3 6.2h.01M13.4 7.4h.01M10.6 15.2h.01M13.3 16.6h.01"/>',
    nuts: '<path d="M4.8 10.8C4.8 7.1 8 4.2 12 4.2s7.2 2.9 7.2 6.6z"/><path d="M6.4 10.8c0 5.3 2.6 9.2 5.6 10.4 3-1.2 5.6-5.1 5.6-10.4"/><path d="M12 4.2V2.3"/>',
  };
  const icon = (name, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  /* ------------------------------------------------------------------
     Easing + tween (plates run on rAF so they work in every browser)
     ------------------------------------------------------------------ */
  function bezier(p1x, p1y, p2x, p2y) {
    const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
    const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x;
        if (Math.abs(e) < 1e-5) break;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      return sy(Math.min(1, Math.max(0, t)));
    };
  }
  const EASE = {
    wheel: bezier(0.62, 0.02, 0.24, 1),
    in: bezier(0.55, 0, 0.8, 0.2),
    out: bezier(0.16, 1, 0.3, 1),
    land: bezier(0.2, 0.75, 0.25, 1),
  };
  const CSS_EASE = {
    in: "cubic-bezier(.62,0,.84,.18)",
    out: "cubic-bezier(.16,1,.3,1)",
    io: "cubic-bezier(.65,0,.35,1)",
  };

  function tween({ from, to, duration, delay = 0, ease = EASE.wheel, onUpdate }) {
    return new Promise((resolve) => {
      if (reduced.matches) duration = Math.min(duration, 1);
      duration *= SLOW;
      const start = performance.now() + delay * SLOW;
      onUpdate(from, 0);
      function frame(now) {
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        onUpdate(from + (to - from) * ease(t), t);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  /* ------------------------------------------------------------------
     Elements + state
     ------------------------------------------------------------------ */
  const app = $("#app");
  const el = {
    ringLayer: $(".ring-layer"),
    ringSvg: $(".ring-svg"),
    ring: $(".ring"),
    track: $(".ring-track"),
    topbar: $(".topbar"),
    orbit: $("#orbit"),
    slot: $("#plateSlot"),
    hero: $("#hero"),
    headline: $("#headline"),
    headInner: $(".headline-inner"),
    title: $("#title"),
    kicker: $("#kicker"),
    line1: $("#line1"),
    line2: $("#line2"),
    caret1: $(".line-light .caret"),
    caret2: $(".line-bold .caret"),
    links: $("#links"),
    card: $("#card"),
    tabs: $$("#tabs [role=tab]"),
    tabInk: $(".tab-ink"),
    panels: [$("#panel-0"), $("#panel-1")],
    scoreBadge: $(".score-badge"),
    scoreNum: $("#scoreNum"),
    scoreCap: $("#scoreCap"),
    overview: $("#overview"),
    more: $("#more"),
    strip: $("#strip"),
    stripView: $("#stripView"),
    stripTrack: $("#stripTrack"),
    prev: $("#prevBtn"),
    next: $("#nextBtn"),
    rail: $(".rail"),
    railDots: $("#railDots"),
    railNow: $("#railNow"),
    railAll: $("#railAll"),
    autoplayBtn: $("#autoplayBtn"),
    dock: $("#dock"),
    dockItems: $("#dockItems"),
    dockInk: $(".dock-ink"),
    filterBtn: $("#filterBtn"),
    filterCount: $("#filterCount"),
    footnote: $(".footnote"),
    live: $("#live"),
  };

  const scenes = EF.scenes;
  const state = {
    scene: 0,
    index: 0,
    tab: 0,
    busy: false,
    pending: null,
    filters: new Set(store.get("filters", [])),
    saved: new Set(store.get("saved", [])),
    helpful: store.get("helpful", {}),
    autoplay: !reduced.matches,
    holds: new Set(),
    arm: null,
    wheel: 0,
  };

  const scene = () => scenes[state.scene];
  const tone = (it) => EF.tones[it.tone] || EF.tones.wheat;

  /* ------------------------------------------------------------------
     Filtering
     ------------------------------------------------------------------ */
  const isFree = (v) => v === true || v === "yes";
  function passes(it) {
    for (const f of state.filters) if (!isFree(it.free?.[f])) return false;
    return true;
  }
  function emptyItem(sc) {
    return {
      id: "__empty",
      empty: true,
      light: "No matches",
      bold: "Yet",
      thumb: "No matches",
      art: "empty",
      tone: "wheat",
      summary: `None of the ${sc.label.toLowerCase()} match every filter you picked. Try turning one filter off. This guide is still growing!`,
    };
  }
  function visible(sc = scene()) {
    if (!sc.filterable || !state.filters.size) return sc.items;
    const list = sc.items.filter(passes);
    return list.length ? list : [emptyItem(sc)];
  }
  const current = () => visible()[state.index] || visible()[0];

  /* ------------------------------------------------------------------
     Card content per section
     ------------------------------------------------------------------ */
  const freeCount = (it) => EF.allergens.filter((a) => isFree(it.free?.[a.id])).length;

  function chipState(v) {
    if (v === true || v === "yes") return "free";
    if (v === "ask") return "ask";
    if (v === "may") return "may";
    return "contains";
  }
  function chipText(a, st, kind) {
    if (kind === "place")
      return {
        free: `${a.free} options`,
        contains: `No ${a.free.toLowerCase()} options`,
        ask: `${a.free}: ask staff`,
        may: `${a.free}: ask staff`,
      }[st];
    return {
      free: a.free,
      contains: `Contains ${a.name.toLowerCase()}`,
      ask: `${a.name}: ask`,
      may: `May contain ${a.name.toLowerCase()}`,
    }[st];
  }
  const MARK = { free: "check", contains: "x", ask: "help", may: "alert" };
  function chip(a, v, kind) {
    const st = chipState(v);
    const text = chipText(a, st, kind);
    return `<li class="chip is-${st}" title="${esc(text)}">${icon(a.id)}<span class="lbl" aria-hidden="true">${a.short}</span>${icon(
      MARK[st],
      "mark"
    )}<span class="sr-only">${esc(text)}</span></li>`;
  }
  const chips = (it, kind) => `<ul class="chips" aria-label="Allergen information">${EF.allergens.map((a) => chip(a, it.free?.[a.id], kind)).join("")}</ul>`;

  function saveBtn(it) {
    const on = state.saved.has(it.id);
    return `<button class="pill-btn" type="button" data-act="save" data-id="${it.id}" aria-pressed="${on}">${icon("heart")}<span>${on ? "Saved" : "Save"}</span></button>`;
  }
  const statusPill = (it) =>
    it.status === "verified"
      ? `<span class="status is-verified">${icon("check")}Checked ${esc(it.checked || "")}</span>`
      : `<span class="status">${icon("info")}Sample listing · not yet verified</span>`;

  const SECTIONS = {
    recipes: {
      score: (it) => ({ num: freeCount(it), unit: "/5", cap: "free-from<br>score", icon: "leaf" }),
      overview: (it) => `
        <h3 class="card-name">${esc(it.category)} · ${esc(it.difficulty)}</h3>
        <p class="card-sub">${it.prep} min prep · ${it.cook} min cook</p>
        <p class="card-desc">${esc(it.summary)}</p>
        ${chips(it, "recipe")}
        <div class="card-actions">${saveBtn(it)}<button class="round-btn" type="button" data-act="detail" aria-label="Open the full recipe">${icon("out")}</button></div>`,
      more: (it) => `
        <p class="mini-h">Ingredients</p><ul class="list">${it.ingredients.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <p class="mini-h">Swaps</p><ul class="list">${it.swaps.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`,
    },
    places: {
      score: (it) => ({ num: freeCount(it), unit: "/5", cap: "free-from<br>options", icon: "pin" }),
      overview: (it) => `
        <h3 class="card-name">${esc(it.type)} · ${esc(it.area)}</h3>
        <p class="card-sub">${esc(it.hours)} · ${esc(it.price)}</p>
        <p class="card-desc">${esc(it.summary)}</p>
        ${chips(it, "place")}
        <p class="warn">${icon("alert")}<span>${esc(it.crossContact)}</span></p>
        ${statusPill(it)}
        <div class="card-actions">${saveBtn(it)}<button class="round-btn" type="button" data-act="map" aria-label="Show on the map">${icon("map")}</button></div>`,
      more: (it) => `
        <p class="mini-h">What to try</p><ul class="list">${it.options.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <p class="mini-h">Address</p><p class="card-desc" style="margin:0">${esc(it.address)}</p>
        <p class="mini-h">Opening hours</p><p class="card-desc" style="margin:0">${esc(it.hours)}</p>`,
    },
    products: {
      score: (it) => ({ num: freeCount(it), unit: "/5", cap: "free-from<br>score", icon: "tag" }),
      overview: (it) => `
        <h3 class="card-name">${esc(it.category)}</h3>
        <p class="card-sub">${esc(it.where)}</p>
        <p class="card-desc">${esc(it.summary)}</p>
        ${chips(it, "product")}
        <p class="warn">${icon("alert")}<span>Recipes change. Always check the current label.</span></p>
        <div class="card-actions">${saveBtn(it)}<button class="round-btn" type="button" data-act="detail" aria-label="Product details">${icon("out")}</button></div>`,
      more: (it) => `
        <p class="mini-h">On the label, look for</p><ul class="list">${it.check.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <p class="mini-h">Where to find it</p><p class="card-desc" style="margin:0">${esc(it.where)}</p>`,
    },
    learn: {
      score: (it) => ({ num: it.read, unit: "min", cap: "minute<br>read", icon: "book" }),
      overview: (it) => `
        <h3 class="card-name">${esc(it.thumb)}</h3>
        <p class="card-sub">Simple explanation · no jargon</p>
        <p class="card-desc">${esc(it.summary)}</p>
        <div class="card-actions"><button class="pill-btn pill-dark" type="button" data-act="detail">${icon("book")}<span>Read more</span></button><button class="round-btn" type="button" data-act="next" aria-label="Next topic">${icon(
          "arrow"
        )}</button></div>`,
      more: (it) => `<p class="mini-h">Key points</p><ul class="list">${it.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`,
    },
    community: {
      score: (it, i) => ({ num: pad(i + 1), unit: "", cap: "kitchen<br>swap", icon: "swap" }),
      overview: (it) => {
        const h = state.helpful[it.id];
        return `
        <div class="swap-pair"><div><small>Instead of</small>${esc(it.from)}</div>${icon("arrow")}<div><small>Use</small>${esc(it.to)}</div></div>
        <h3 class="card-name" style="margin-top:14px;font-size:17px">Best for</h3>
        <p class="card-sub">${esc(it.bestFor)}</p>
        <p class="card-desc">${esc(it.summary)}</p>
        <div class="card-actions">
          <button class="pill-btn is-thumb" type="button" data-act="helpful" data-id="${it.id}" aria-pressed="${h === 1}">${icon("up")}<span>Helpful</span></button>
          <button class="round-btn" type="button" data-act="unhelpful" data-id="${it.id}" aria-pressed="${h === -1}" aria-label="Not helpful">${icon("down")}</button>
        </div>`;
      },
      more: (it) =>
        it.stories.map((s) => `<blockquote class="story">“${esc(s.text)}”<footer>${esc(s.who)}</footer></blockquote>`).join("") +
        `<div class="card-actions"><button class="pill-btn pill-dark" type="button" data-act="share">${icon("chat")}<span>Share your tip</span></button></div>`,
    },
  };
  const EMPTY = {
    score: () => ({ num: 0, unit: "", cap: "exact<br>matches", icon: "leaf" }),
    overview: (it) => `
      <h3 class="card-name">Nothing yet</h3>
      <p class="card-sub">${state.filters.size} filter${state.filters.size > 1 ? "s" : ""} on</p>
      <p class="card-desc">${esc(it.summary)}</p>
      <div class="card-actions"><button class="pill-btn pill-dark" type="button" data-act="clear-filters">${icon("x")}<span>Clear filters</span></button><button class="round-btn" type="button" data-act="filters" aria-label="Edit filters">${icon(
        "leaf"
      )}</button></div>`,
    more: () => `<p class="card-desc" style="margin:0">Know a good option in Debrecen? Share it and help the guide grow.</p>`,
  };
  const section = (it) => (it.empty ? EMPTY : SECTIONS[scene().id]);

  /* ------------------------------------------------------------------
     Geometry: one big wheel whose bottom point is the plate slot
     ------------------------------------------------------------------ */
  const geo = {};
  function measure() {
    const a = app.getBoundingClientRect();
    const s = el.slot.getBoundingClientRect();
    const P = s.width;
    const cx = s.left - a.left + P / 2;
    const cy = s.top - a.top + P / 2;
    const R = P * 1.6;
    // smallest swing that takes a plate fully above the top edge
    const need = cy + P / 2 + 40;
    let cos = 1 - need / R;
    cos = Math.max(-0.6, Math.min(cos, 0.55));
    Object.assign(geo, { P, cx, cy, R, wx: cx, wy: cy - R, theta: (Math.acos(cos) * 180) / Math.PI });

    el.orbit.style.setProperty("--P", P + "px");
    el.orbit.style.setProperty("--R", R + "px");
    el.orbit.style.setProperty("--wx", geo.wx + "px");
    el.orbit.style.setProperty("--wy", geo.wy + "px");

    for (const c of [el.ring, el.track]) {
      c.setAttribute("cx", geo.wx);
      c.setAttribute("cy", geo.wy);
      c.setAttribute("r", R);
    }
    el.ring.setAttribute("stroke-width", P * 0.44);
    setTrack();
  }
  const setTrack = () => el.track.setAttribute("stroke-dashoffset", f2(-((state.wheel * Math.PI) / 180) * geo.R));
  const f2 = (n) => Math.round(n * 100) / 100;

  /* ------------------------------------------------------------------
     Plates
     ------------------------------------------------------------------ */
  const plateCache = new Map();
  function plateFor(it) {
    const key = it.id + "|" + it.art;
    let arm = plateCache.get(key);
    if (!arm) {
      arm = document.createElement("div");
      arm.className = "arm";
      arm.innerHTML = `<div class="holder"><div class="plate-shadow"></div><div class="spinner">${EF.art(it.art)}</div></div>`;
      arm.querySelector(".holder").addEventListener("click", () => {
        if (arm.classList.contains("is-active") && !current().empty) openDetail();
      });
      plateCache.set(key, arm);
    }
    return arm;
  }
  const setA = (arm, deg) => arm && arm.style.setProperty("--a", deg.toFixed(3) + "deg");

  function swapPlates(toItem, dir) {
    const out = state.arm;
    const inn = plateFor(toItem);
    if (inn === out) return Promise.resolve();
    state.arm = inn;
    out?.classList.remove("is-active");
    inn.classList.add("is-active");
    el.orbit.append(inn);
    const th = geo.theta;
    const startWheel = state.wheel;
    const dur = 1080;
    const jobs = [
      tween({
        from: -dir * th,
        to: 0,
        duration: dur,
        delay: 90,
        onUpdate: (v, t) => {
          setA(inn, v);
          state.wheel = startWheel + (v + dir * th);
          setTrack();
        },
      }),
    ];
    if (out)
      jobs.push(
        tween({ from: 0, to: dir * th, duration: dur, delay: 90, onUpdate: (v) => setA(out, v) }).then(() => {
          if (state.arm !== out) out.remove();
        })
      );
    return Promise.all(jobs);
  }

  /* ------------------------------------------------------------------
     Title wipe
     ------------------------------------------------------------------ */
  const CLIP = {
    l1Shown: "inset(-30% -6% -30% 0%)",
    l1Hidden: "inset(-30% -6% -30% 100%)",
    l2Shown: "inset(-30% 0% -30% -6%)",
    l2Hidden: "inset(-30% 100% -30% -6%)",
  };
  function wipe(node, from, to, opts) {
    const prev = node.getAnimations();
    const a = node.animate([{ clipPath: from }, { clipPath: to }], { fill: "both", ...opts });
    prev.forEach((p) => p.cancel());
    return a;
  }
  function caret(node, x0, x1, opts) {
    return node.animate(
      [
        { opacity: 0, transform: `translateX(${x0}px)` },
        { opacity: 1, offset: 0.12 },
        { opacity: 1, offset: 0.82 },
        { opacity: 0, transform: `translateX(${x1}px)` },
      ],
      { fill: "both", ...opts }
    );
  }

  function exitText() {
    if (reduced.matches) return fadeAll([el.headInner], 0, 160);
    const w1 = el.line1.offsetWidth, w2 = el.line2.offsetWidth;
    const o = { duration: 340, easing: CSS_EASE.in };
    const anims = [
      wipe(el.line1, CLIP.l1Shown, CLIP.l1Hidden, o),
      wipe(el.line2, CLIP.l2Shown, CLIP.l2Hidden, { ...o, delay: 30 }),
      wipe(el.kicker, CLIP.l2Shown, CLIP.l2Hidden, { ...o, duration: 260 }),
      caret(el.caret1, 0, w1, o),
      caret(el.caret2, w2, 0, { ...o, delay: 30 }),
    ];
    return Promise.all(anims.map((a) => a.finished));
  }
  function enterText() {
    if (reduced.matches) {
      el.headInner.getAnimations().forEach((a) => a.cancel());
      return fadeAll([el.headInner], 1, 200);
    }
    const w1 = el.line1.offsetWidth, w2 = el.line2.offsetWidth;
    const o = { duration: 640, easing: CSS_EASE.out };
    const anims = [
      wipe(el.kicker, CLIP.l2Hidden, CLIP.l2Shown, { ...o, duration: 520 }),
      wipe(el.line1, CLIP.l1Hidden, CLIP.l1Shown, o),
      wipe(el.line2, CLIP.l2Hidden, CLIP.l2Shown, { ...o, delay: 70 }),
      caret(el.caret1, w1, 0, o),
      caret(el.caret2, 0, w2, { ...o, delay: 70 }),
    ];
    return Promise.all(anims.map((a) => a.finished)).then(() => anims.forEach((a) => a.cancel()));
  }
  function fadeAll(nodes, to, dur) {
    return Promise.all(
      nodes.map(
        (n) => n.animate([{ opacity: to ? 0 : 1 }, { opacity: to }], { duration: dur, fill: to ? "none" : "forwards" }).finished
      )
    );
  }

  function fitTitle() {
    el.title.style.setProperty("--fit", 1);
    const avail = el.headline.clientWidth;
    const w = Math.max(el.line1.offsetWidth, el.line2.offsetWidth, 1);
    el.title.style.setProperty("--fit", w > avail ? Math.max(0.42, (avail - 4) / w).toFixed(3) : 1);
  }

  function setText(it) {
    el.kicker.textContent = it.empty ? "Free-from filter" : scene().kicker(state.index);
    el.line1.textContent = it.light;
    el.line2.textContent = it.bold;
    fitTitle();
  }

  /* ------------------------------------------------------------------
     Card
     ------------------------------------------------------------------ */
  function setScore(it, i) {
    const s = section(it).score(it, i);
    el.scoreNum.innerHTML = `${esc(s.num)}${s.unit ? `<small>${esc(s.unit)}</small>` : ""}`;
    el.scoreCap.innerHTML = s.cap;
    el.scoreBadge.innerHTML = icon(s.icon);
    el.scoreNum.setAttribute("aria-label", `${s.num}${s.unit ? " " + s.unit : ""} ${s.cap.replace("<br>", " ")}`);
  }
  function fillCard(it) {
    const sec = section(it);
    setScore(it, state.index);
    el.overview.innerHTML = sec.overview(it);
    el.more.innerHTML = sec.more(it);
  }

  function cardOut() {
    const kids = [...activePanelSwap().children, el.scoreNum, el.scoreCap];
    return Promise.all(
      kids.map(
        (k, i) =>
          k.animate([{ opacity: 1, filter: "blur(0)", transform: "none" }, { opacity: 0, filter: "blur(4px)", transform: "translateY(-6px)" }], {
            duration: 220,
            delay: i * 12,
            easing: CSS_EASE.in,
            fill: "forwards",
          }).finished
      )
    );
  }
  function cardIn() {
    [el.scoreNum, el.scoreCap].forEach((k) => k.getAnimations().forEach((a) => a.cancel()));
    const kids = [el.scoreNum, el.scoreCap, ...activePanelSwap().children];
    kids.forEach((k, i) =>
      k.animate([{ opacity: 0, filter: "blur(4px)", transform: "translateY(10px)" }, { opacity: 1, filter: "blur(0)", transform: "none" }], {
        duration: 520,
        delay: i * 45,
        easing: CSS_EASE.out,
        fill: "backwards",
      })
    );
  }
  const activePanelSwap = () => (state.tab === 0 ? el.overview : el.more);

  /* smoothly resize the card when its content height changes */
  function morphCard(mutate) {
    const h0 = el.card.offsetHeight;
    mutate();
    const h1 = el.card.offsetHeight;
    if (Math.abs(h1 - h0) > 2 && !reduced.matches)
      el.card.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: 520, easing: CSS_EASE.out });
  }

  /* tabs */
  function selectTab(i, focus) {
    if (i === state.tab) return;
    morphCard(() => {
      state.tab = i;
      el.tabs.forEach((t, k) => {
        t.setAttribute("aria-selected", k === i);
        t.tabIndex = k === i ? 0 : -1;
      });
      el.panels.forEach((p, k) => (p.hidden = k !== i));
    });
    moveTabInk();
    [...el.panels[i].querySelectorAll(".swap > *, .score > *")].forEach((k, n) =>
      k.animate([{ opacity: 0, transform: "translateX(" + (i ? 14 : -14) + "px)" }, { opacity: 1, transform: "none" }], {
        duration: 460,
        delay: n * 35,
        easing: CSS_EASE.out,
        fill: "backwards",
      })
    );
    if (focus) el.tabs[i].focus();
  }
  function moveTabInk() {
    const t = el.tabs[state.tab];
    el.tabInk.style.width = t.offsetWidth * 0.5 + "px";
    el.tabInk.style.transform = `translateX(${t.offsetLeft + t.offsetWidth * 0.25}px)`;
  }

  /* ------------------------------------------------------------------
     Strip, rail, dock, links
     ------------------------------------------------------------------ */
  function renderStrip() {
    const items = visible();
    el.stripTrack.setAttribute("role", "group");
    el.stripTrack.setAttribute("aria-label", `Choose from ${scene().label.toLowerCase()}`);
    if (items[0].empty) {
      el.stripTrack.innerHTML = `<p class="strip-empty">No matches for your filters. <button class="text-btn" type="button" data-act="clear-filters">Clear filters</button></p>`;
    } else {
      el.stripTrack.innerHTML =
        `<span class="thumb-hl" aria-hidden="true"></span>` +
        items
          .map(
            (it, i) =>
              `<button class="thumb" type="button" data-i="${i}" aria-label="${esc(it.thumb)}"><span class="thumb-art">${EF.art(it.art)}</span><span class="thumb-label" aria-hidden="true">${esc(it.thumb)}</span></button>`
          )
          .join("");
    }
    const single = items.length < 2;
    el.prev.disabled = el.next.disabled = single;
    el.prev.style.visibility = el.next.style.visibility = single ? "hidden" : "";
  }
  function updateStrip(instant) {
    const thumbs = $$(".thumb", el.stripTrack);
    const hl = $(".thumb-hl", el.stripTrack);
    thumbs.forEach((b, i) => b.setAttribute("aria-current", i === state.index ? "true" : "false"));
    const t = thumbs[state.index];
    if (!t || !hl) return;
    if (instant) hl.style.transition = "none";
    hl.style.transform = `translateX(${t.offsetLeft}px)`;
    hl.style.width = t.offsetWidth + "px";
    if (instant) {
      void hl.offsetWidth;
      hl.style.transition = "";
    }
    const v = el.stripView;
    const l = t.offsetLeft - 24, r = t.offsetLeft + t.offsetWidth + 32;
    if (l < v.scrollLeft) v.scrollTo({ left: l, behavior: instant ? "auto" : "smooth" });
    else if (r > v.scrollLeft + v.clientWidth) v.scrollTo({ left: r - v.clientWidth, behavior: instant ? "auto" : "smooth" });
  }

  function renderRail() {
    const items = visible();
    el.railDots.innerHTML = items
      .map((it, i) => `<li><button type="button" data-i="${i}" aria-label="Show ${esc(it.thumb)}"></button></li>`)
      .join("");
    el.railAll.textContent = "/" + pad(items.length);
  }
  function updateRail() {
    $$("button", el.railDots).forEach((b, i) => b.setAttribute("aria-current", i === state.index ? "true" : "false"));
    el.railNow.textContent = pad(state.index + 1);
  }

  function renderDock() {
    const html = scenes
      .map(
        (s, i) =>
          `<button class="dock-item" type="button" data-scene="${i}" aria-label="${esc(s.label)}" data-tip="${esc(s.label)}">${icon(s.icon)}<span class="dock-label" aria-hidden="true">${esc(
            s.label.split(" ")[0].replace("Debrecen", "Guide")
          )}</span></button>`
      )
      .join("");
    el.dockItems.insertAdjacentHTML("beforeend", html);
  }
  function updateDock() {
    const btns = $$(".dock-item", el.dockItems);
    btns.forEach((b, i) => (i === state.scene ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current")));
    const b = btns[state.scene];
    el.dockInk.style.width = b.offsetWidth + "px";
    el.dockInk.style.height = b.offsetHeight + "px";
    el.dockInk.style.transform = `translate(${b.offsetLeft}px, ${b.offsetTop}px)`;
  }

  function renderLinks() {
    const it = current();
    el.links.innerHTML = it.empty
      ? `<button class="link-btn" type="button" data-act="clear-filters">${icon("play", "solid")}Clear filters</button><button class="link-btn" type="button" data-act="filters">${icon("leaf")}Edit filters</button>`
      : scene()
          .links.map((l, i) => `<button class="link-btn" type="button" data-act="${l.action}">${icon(l.icon, i === 0 ? "solid" : "")}${esc(l.label)}</button>`)
          .join("");
  }

  function renderTabs() {
    const labels = scene().tabs;
    el.tabs.forEach((t, i) => (t.textContent = labels[i]));
  }

  function applyTone(it) {
    const t = tone(it);
    app.style.setProperty("--ring", t.ring);
    app.style.setProperty("--badge", t.badge);
  }

  function announce(it) {
    const n = visible().length;
    el.live.textContent = `${it.light} ${it.bold}. ${state.index + 1} of ${n}.`;
  }

  function syncHash() {
    const it = current();
    const h = `#/${scene().id}${it.empty ? "" : "/" + it.id}`;
    if (location.hash !== h) history.replaceState(null, "", h);
  }

  /* ------------------------------------------------------------------
     Slide change (the main choreography)
     ------------------------------------------------------------------ */
  async function goTo(i, dir, { auto = false } = {}) {
    const items = visible();
    const n = items.length;
    if (n < 2) return;
    i = ((i % n) + n) % n;
    if (i === state.index) return;
    if (!auto) stopAutoplay();
    if (state.busy) {
      state.pending = [i, dir];
      return;
    }
    state.busy = true;
    dir = dir || (i > state.index ? 1 : -1);
    state.index = i;
    const it = items[i];

    updateStrip();
    updateRail();
    applyTone(it);
    if (!auto) announce(it);
    syncHash();

    const plates = swapPlates(it, dir);

    if (reduced.matches) {
      setText(it);
      morphCard(() => fillCard(it));
      renderLinks();
      [el.scoreNum, el.scoreCap].forEach((k) => k.getAnimations().forEach((a) => a.cancel()));
      await plates;
      return done();
    }

    await Promise.all([exitText(), cardOut()]);
    setText(it);
    renderLinks();
    morphCard(() => fillCard(it));
    await wait(170);
    cardIn();
    await wait(170);
    await enterText();
    await plates;
    done();

    function done() {
      state.busy = false;
      restartAutoplayTimer();
      if (state.pending) {
        const [pi, pd] = state.pending;
        state.pending = null;
        goTo(pi, pd, { auto: true });
      }
    }
  }
  const next = (opts) => goTo(state.index + 1, 1, opts);
  const prev = (opts) => goTo(state.index - 1, -1, opts);

  /* ------------------------------------------------------------------
     Intro / outro (page load + switching section)
     ------------------------------------------------------------------ */
  function intro(first) {
    const m = reduced.matches;
    const anims = [];
    const from = (node, kf, delay, duration = 900, easing = CSS_EASE.out) => {
      if (!node) return;
      anims.push(
        node.animate([{ opacity: 0, ...kf }, { opacity: 1, transform: "none", filter: "none" }], {
          duration: m ? 200 : duration,
          delay: m ? 0 : delay,
          easing,
          fill: "backwards",
        })
      );
    };

    from(el.ringLayer, { transform: "scale(.96)" }, 0, 1400);
    if (first) {
      from(el.topbar, { transform: "translateY(-14px)" }, 200, 800);
      from(el.filterBtn, { transform: "scale(.4)" }, 260, 900, "cubic-bezier(.34,1.56,.64,1)");
      $$(".dock-item", el.dockItems).forEach((b, i) => from(b, { transform: "translateY(26px)" }, 320 + i * 55, 800));
      from(el.dockInk, { transform: "scale(.6)" }, 600, 700);
      from(el.footnote, {}, 1000, 900);
    }
    from(el.headInner, { transform: "translateY(-30px)" }, 260, 1000);
    from(el.card, { transform: "translateX(48px)", filter: "blur(6px)" }, 460, 1000);
    from(el.prev, {}, 520, 700);
    from(el.next, {}, 720, 700);
    $$(".thumb, .strip-empty", el.stripTrack).forEach((t, i) => from(t, { transform: "translateX(40px)", filter: "blur(4px)" }, 540 + i * 60, 900));
    from($(".thumb-hl", el.stripTrack), { transform: "translateX(40px)" }, 540, 900);
    from(el.rail, { transform: "translateY(16px)" }, 760, 900);

    app.classList.remove("is-preload");

    const arm = state.arm;
    const plate = tween({
      from: geo.theta,
      to: 0,
      duration: 1350,
      delay: 120,
      ease: EASE.land,
      onUpdate: (v) => {
        setA(arm, v);
        state.wheel = -v;
        setTrack();
      },
    });
    return Promise.all([plate, ...anims.map((a) => a.finished)]).then(() => {
      // re-place the highlight now that the thumbs have settled
      updateStrip(true);
    });
  }

  async function outro() {
    const m = reduced.matches;
    const anims = [];
    const to = (node, kf, delay = 0, duration = 420) => {
      if (!node) return;
      anims.push(
        node.animate([{ opacity: 1, transform: "none" }, { opacity: 0, ...kf }], {
          duration: m ? 150 : duration,
          delay: m ? 0 : delay,
          easing: CSS_EASE.in,
          fill: "forwards",
        })
      );
    };
    to(el.card, { transform: "translateX(36px)", filter: "blur(4px)" });
    $$(".thumb, .strip-empty", el.stripTrack)
      .reverse()
      .forEach((t, i) => to(t, { transform: "translateX(30px)" }, i * 30, 380));
    to($(".thumb-hl", el.stripTrack), { transform: "translateX(30px)" });
    to(el.prev, {});
    to(el.next, {});
    to(el.headInner, { transform: "translateY(-26px)" }, 60, 460);
    to(el.rail, {});
    to(el.ringLayer, {}, 120, 520);

    const arm = state.arm;
    const plate = tween({
      from: 0,
      to: geo.theta,
      duration: 760,
      ease: EASE.in,
      onUpdate: (v) => setA(arm, v),
    }).then(() => arm && arm.remove());

    await Promise.all([plate, ...anims.map((a) => a.finished)]);
    return anims;
  }

  function renderScene(itemId) {
    const items = visible();
    let idx = itemId ? items.findIndex((x) => x.id === itemId) : 0;
    state.index = Math.max(0, idx);
    state.tab = 0;
    el.tabs.forEach((t, k) => {
      t.setAttribute("aria-selected", k === 0);
      t.tabIndex = k === 0 ? 0 : -1;
    });
    el.panels.forEach((p, k) => (p.hidden = k !== 0));
    const it = current();
    renderTabs();
    renderLinks();
    renderStrip();
    renderRail();
    updateRail();
    updateDock();
    applyTone(it);
    setText(it);
    fillCard(it);
    moveTabInk();
    measure();
    const arm = plateFor(it);
    el.orbit.append(arm);
    arm.classList.add("is-active");
    setA(arm, geo.theta);
    state.arm = arm;
    updateStrip(true);
    syncHash();
    document.title = `${scene().label} · Eat Freely Debrecen`;
  }

  async function switchScene(i, itemId, { force = false } = {}) {
    if (state.busy || (i === state.scene && !force && !itemId)) return;
    if (i === state.scene && itemId && !force) {
      const idx = visible().findIndex((x) => x.id === itemId);
      if (idx >= 0) return goTo(idx);
    }
    stopAutoplay();
    state.busy = true;
    state.scene = i;
    updateDock();
    const outs = await outro();
    renderScene(itemId);
    const p = intro(false);
    outs.forEach((a) => a.cancel());
    el.live.textContent = `${scene().label}. ${current().light} ${current().bold}.`;
    await p;
    state.busy = false;
  }

  /* refresh the current section in place (after filter changes) */
  async function refreshScene() {
    if (!scene().filterable) {
      updateFilterBtn();
      return;
    }
    const keepId = current().id;
    if (state.busy) await wait(1200);
    state.busy = true;
    const outs = await outro();
    renderScene(keepId);
    const p = intro(false);
    outs.forEach((a) => a.cancel());
    await p;
    state.busy = false;
  }

  /* ------------------------------------------------------------------
     Autoplay (pauses on hover/focus/overlays; stops after manual use)
     ------------------------------------------------------------------ */
  const AP = { ms: 7000, timer: 0, start: 0, left: 7000 };
  app.style.setProperty("--slide-ms", AP.ms + "ms");
  function restartAutoplayTimer() {
    clearTimeout(AP.timer);
    AP.left = AP.ms;
    AP.start = performance.now();
    if (!state.autoplay || visible().length < 2) return;
    if (!state.holds.size) AP.timer = setTimeout(tick, AP.left);
  }
  function tick() {
    if (!state.autoplay || state.holds.size) return;
    next({ auto: true });
  }
  function hold(reason, on) {
    const had = state.holds.size > 0;
    on ? state.holds.add(reason) : state.holds.delete(reason);
    const has = state.holds.size > 0;
    app.classList.toggle("is-held", has);
    if (!state.autoplay || had === has) return;
    if (has) {
      clearTimeout(AP.timer);
      AP.left -= performance.now() - AP.start;
    } else {
      AP.start = performance.now();
      AP.timer = setTimeout(tick, Math.max(600, AP.left));
    }
  }
  function setAutoplay(on) {
    state.autoplay = on;
    app.classList.toggle("is-playing", on);
    el.autoplayBtn.innerHTML = icon(on ? "pause" : "play");
    el.autoplayBtn.setAttribute("aria-label", on ? "Pause slideshow" : "Play slideshow");
    el.autoplayBtn.setAttribute("aria-pressed", String(!on));
    if (on) restartAutoplayTimer();
    else clearTimeout(AP.timer);
    // restart the progress line
    const cur = $('button[aria-current="true"]', el.railDots);
    if (cur) {
      cur.setAttribute("aria-current", "false");
      void cur.offsetWidth;
      cur.setAttribute("aria-current", "true");
    }
  }
  const stopAutoplay = () => state.autoplay && setAutoplay(false);

  /* ------------------------------------------------------------------
     Layers (dialogs) with focus return + inert background
     ------------------------------------------------------------------ */
  const stack = [];
  function openLayer(layer, opener = document.activeElement) {
    if (stack.some((s) => s.layer === layer)) return;
    stack.forEach((s) => (s.layer.inert = true));
    layer.hidden = false;
    layer.inert = false;
    stack.push({ layer, opener });
    app.inert = true;
    hold("layer", true);
    void layer.offsetWidth;
    layer.classList.add("is-open");
    const target = layer.querySelector("[data-focus]") || layer.querySelector("input, select, textarea, button:not(.layer-scrim), a[href]");
    setTimeout(() => target?.focus({ preventScroll: true }), 60);
  }
  function closeLayer(layer) {
    const i = stack.findIndex((s) => s.layer === layer);
    if (i < 0) return;
    const [{ opener }] = stack.splice(i, 1);
    layer.classList.remove("is-open");
    setTimeout(() => {
      if (!layer.classList.contains("is-open")) layer.hidden = true;
    }, 820);
    if (stack.length) stack[stack.length - 1].layer.inert = false;
    else {
      app.inert = false;
      hold("layer", false);
    }
    if (layer.id === "menuLayer") $("#openMenu").setAttribute("aria-expanded", "false");
    opener?.focus?.({ preventScroll: true });
  }
  const topLayer = () => stack[stack.length - 1]?.layer;
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-close]");
    if (c) closeLayer(c.closest(".layer"));
  });

  /* ------------------------------------------------------------------
     Detail sheet
     ------------------------------------------------------------------ */
  function atable(it, kind) {
    const label = (a, st) => {
      const t = chipText(a, st, kind);
      return `<span class="chip is-${st}">${icon(MARK[st], "mark")}${esc(
        kind === "place" ? { free: "Options", contains: "No options", ask: "Ask staff", may: "Ask staff" }[st] : { free: "Free from", contains: "Contains", ask: "Ask", may: "May contain" }[st]
      )}<span class="sr-only">: ${esc(t)}</span></span>`;
    };
    return `<table class="atable"><caption class="sr-only">Allergen information</caption><tbody>${EF.allergens
      .map((a) => `<tr><th scope="row"><span>${icon(a.id)}${esc(a.name)}</span></th><td>${label(a, chipState(it.free?.[a.id]))}</td></tr>`)
      .join("")}</tbody></table>`;
  }

  function sheetHTML(sc, it, idx) {
    const t = tone(it);
    const head = `
      <div class="sheet-hero"><div class="sheet-art">${EF.art(it.art)}</div></div>
      <header class="sheet-head"><p class="kicker">${esc(sc.kicker(idx))}</p>
        <h2 class="sheet-title" id="sheetTitle"><span class="light">${esc(it.light)}</span><span class="bold">${esc(it.bold)}</span></h2></header>`;
    let body = "";
    if (sc.id === "recipes") {
      body = `
        <ul class="meta"><li>${icon("clock")}Prep ${it.prep} min</li><li>${icon("flame")}Cook ${it.cook} min</li><li>${icon("gauge")}${esc(it.difficulty)}</li><li>${icon(
          "users"
        )}Serves ${esc(it.serves)}</li></ul>
        <p>${esc(it.summary)}</p>
        <h3>Allergens</h3>${atable(it, "recipe")}
        <h3>Ingredients</h3><ul class="ingredients">${it.ingredients
          .map((x) => `<li><label><input type="checkbox"><span>${esc(x)}</span></label></li>`)
          .join("")}</ul>
        <h3>Method</h3><ol class="steps">${it.steps.map((x) => `<li><span>${esc(x)}</span></li>`).join("")}</ol>
        <h3 id="swaps" tabindex="-1">Substitutions</h3><ul class="list">${it.swaps.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        ${it.note ? `<p class="warn">${icon("alert")}<span>${esc(it.note)}</span></p>` : ""}
        <div class="sheet-actions">${saveBtn(it)}<button class="pill-btn" type="button" data-act="print">${icon("out")}<span>Print</span></button></div>`;
    } else if (sc.id === "places") {
      body = `
        ${statusPill(it)}
        <ul class="meta" style="margin-top:14px"><li>${icon("tag")}${esc(it.type)}</li><li>${icon("pin")}${esc(it.area)}</li><li>${icon("clock")}${esc(it.hours)}</li><li>${esc(
          it.price
        )}</li></ul>
        <p>${esc(it.summary)}</p>
        <h3>Free-from options</h3>${atable(it, "place")}
        <p class="warn">${icon("alert")}<span><b>Cross-contact:</b> ${esc(it.crossContact)}</span></p>
        <h3>What to try</h3><ul class="list">${it.options.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <h3>Address</h3><p>${esc(it.address)}</p>
        <div class="sheet-actions"><button class="pill-btn pill-dark" type="button" data-act="map">${icon("map")}<span>Show on map</span></button>${saveBtn(it)}</div>`;
    } else if (sc.id === "products") {
      body = `
        ${statusPill(it)}
        <ul class="meta" style="margin-top:14px"><li>${icon("tag")}${esc(it.category)}</li></ul>
        <p>${esc(it.summary)}</p>
        <h3>Allergens</h3>${atable(it, "product")}
        <h3>Where to find it</h3><p>${esc(it.where)}</p>
        <h3>On the label, look for</h3><ul class="list">${it.check.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <p class="warn">${icon("alert")}<span>Product information can change. Always check the ingredients on the current packaging.</span></p>
        <div class="sheet-actions">${saveBtn(it)}<button class="pill-btn" type="button" data-act="goto:learn:labels">${icon("book")}<span>How to read labels</span></button></div>`;
    } else if (sc.id === "learn") {
      body = `
        <ul class="meta"><li>${icon("clock")}${it.read} min read</li></ul>
        ${it.body.map((p) => `<p>${esc(p)}</p>`).join("")}
        <h3>Key points</h3><ul class="list">${it.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <div class="sheet-actions"><button class="pill-btn pill-dark" type="button" data-act="sheet-next">${icon("arrow")}<span>Next topic</span></button></div>`;
    } else if (sc.id === "community") {
      body = `
        <div class="swap-pair" style="margin-bottom:16px"><div style="background:var(--bg)"><small>Instead of</small>${esc(it.from)}</div>${icon(
          "arrow"
        )}<div style="background:var(--bg)"><small>Use</small>${esc(it.to)}</div></div>
        <p>${esc(it.summary)}</p>
        <h3>Works well in</h3><p>${esc(it.bestFor)}</p>
        <h3>Stories</h3>${it.stories
          .map((s) => `<blockquote class="story" style="background:var(--bg)">“${esc(s.text)}”<footer>${esc(s.who)}</footer></blockquote>`)
          .join("")}
        <div class="sheet-actions"><button class="pill-btn pill-dark" type="button" data-act="share">${icon("chat")}<span>Share your tip</span></button><button class="pill-btn" type="button" data-act="rules">${icon(
          "info"
        )}<span>Community rules</span></button></div>`;
    }
    const disclaimer =
      sc.id === "learn"
        ? "This is general information, not medical advice. For diagnosis or treatment, please talk to a doctor or dietitian."
        : EF.disclaimer;
    return `<div style="--ring:${t.ring};--badge:${t.badge}">${head}<div class="sheet-content">${body}<p class="disclaimer">${esc(disclaimer)}</p></div></div>`;
  }

  let sheetItem = null;
  function openDetail(anchor) {
    const it = current();
    if (it.empty) return;
    sheetItem = { scene: state.scene, index: state.index };
    $("#sheetBody").innerHTML = sheetHTML(scene(), it, state.index);
    $("#sheetBody").scrollTop = 0;
    openLayer($("#sheetLayer"));
    if (anchor)
      setTimeout(() => {
        const a = $("#" + anchor, $("#sheetBody"));
        a?.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
        a?.focus({ preventScroll: true });
      }, 650);
  }

  /* ------------------------------------------------------------------
     Map (Leaflet loads only when the map is opened)
     ------------------------------------------------------------------ */
  let leafletP = null;
  let map = null;
  const markers = {};
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (leafletP) return leafletP;
    leafletP = new Promise((res, rej) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.append(css);
      const s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = res;
      s.onerror = rej;
      document.head.append(s);
    });
    return leafletP;
  }
  function openMap(focusId) {
    const places = scenes.find((s) => s.id === "places").items;
    $("#mapList").innerHTML = places
      .map(
        (p) =>
          `<li><button type="button" data-place="${p.id}"><span>${EF.art(p.art)}</span><span><b>${esc(p.bold)}</b><span>${esc(p.type)} · ${esc(
            p.area
          )}</span></span></button></li>`
      )
      .join("");
    openLayer($("#mapLayer"));
    loadLeaflet()
      .then(() => {
        if (!map) {
          $("#mapCanvas").innerHTML = "";
          map = L.map("mapCanvas", { zoomControl: true, scrollWheelZoom: true }).setView([47.537, 21.62], 13);
          L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map);
          places.forEach((p) => {
            const t = tone(p);
            const m = L.marker(p.coords, {
              title: p.bold,
              icon: L.divIcon({ className: "", html: `<span class="pin" style="--c:${t.badge}">${icon("pin")}</span>`, iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -36] }),
            }).addTo(map);
            m.bindPopup(
              `<div class="pop-title">${esc(p.bold)}</div>${esc(p.type)} · ${esc(p.area)}<br><small>${esc(p.hours)}</small><br><button class="pop-btn" type="button" data-guide="${p.id}">Open in guide →</button>`
            );
            markers[p.id] = m;
          });
        }
        setTimeout(() => {
          map.invalidateSize();
          if (focusId && markers[focusId]) {
            map.flyTo(markers[focusId].getLatLng(), 15, { duration: reduced.matches ? 0 : 1.1 });
            setTimeout(() => markers[focusId].openPopup(), reduced.matches ? 0 : 1100);
            $$("#mapList button").forEach((b) => b.classList.toggle("is-on", b.dataset.place === focusId));
          }
        }, 450);
      })
      .catch(() => {
        $("#mapCanvas").innerHTML = `<p class="map-loading">The map could not load (are you offline?). The places are listed here instead.</p>`;
      });
  }

  /* ------------------------------------------------------------------
     Filter panel
     ------------------------------------------------------------------ */
  function renderFilterGrid() {
    $("#filterGrid").innerHTML = EF.allergens
      .map(
        (a) =>
          `<button class="ftog" type="button" data-allergen="${a.id}" aria-pressed="${state.filters.has(a.id)}">${icon(a.id)}<span>${esc(
            a.name
          )}</span><span class="tick" aria-hidden="true">${icon("check")}</span></button>`
      )
      .join("");
  }
  function renderSearchChips() {
    $("#searchChips").innerHTML =
      `<span class="sr-only">Only show food free from:</span>` +
      EF.allergens
        .map((a) => `<button class="chip-btn" type="button" data-allergen="${a.id}" aria-pressed="${state.filters.has(a.id)}">${icon(a.id)}${esc(a.free)}</button>`)
        .join("");
  }
  function updateFilterBtn() {
    const n = state.filters.size;
    el.filterCount.hidden = !n;
    el.filterCount.textContent = n;
    el.filterBtn.classList.toggle("is-on", n > 0);
    el.filterBtn.setAttribute("aria-label", n ? `Allergen filter, ${n} on` : "Allergen filter");
  }
  let filtersDirty = false;
  function toggleFilter(id) {
    state.filters.has(id) ? state.filters.delete(id) : state.filters.add(id);
    store.set("filters", [...state.filters]);
    filtersDirty = true;
    $$(`[data-allergen="${id}"]`).forEach((b) => b.setAttribute("aria-pressed", state.filters.has(id)));
    updateFilterBtn();
  }
  function openFilter() {
    renderFilterGrid();
    const r = el.filterBtn.getBoundingClientRect();
    const panel = $(".filter-panel");
    const half = Math.min(440, innerWidth - 24) / 2;
    panel.style.setProperty("--fx", Math.min(innerWidth - half - 12, Math.max(half + 12, r.left + r.width / 2)) + "px");
    panel.style.setProperty("--fy", innerHeight - r.top + 14 + "px");
    filtersDirty = false;
    openLayer($("#filterLayer"), el.filterBtn);
  }
  function afterFilterClose() {
    if (filtersDirty) {
      filtersDirty = false;
      refreshScene();
      const n = state.filters.size;
      toast(n ? `Showing food free from ${[...state.filters].map((f) => EF.allergens.find((a) => a.id === f).name.toLowerCase()).join(", ")}` : "Filters cleared");
    }
  }

  /* ------------------------------------------------------------------
     Search
     ------------------------------------------------------------------ */
  const index = scenes.flatMap((sc, si) =>
    sc.items.map((it, ii) => ({
      si,
      ii,
      it,
      text: [it.light, it.bold, it.thumb, it.category, it.type, it.area, it.summary, ...(it.ingredients || []), ...(it.points || []), it.from, it.to, sc.label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }))
  );
  function runSearch() {
    const q = $("#searchInput").value.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    let hits = index.filter((r) => words.every((w) => r.text.includes(w)));
    if (state.filters.size) hits = hits.filter((r) => !scenes[r.si].filterable || passes(r.it));
    const box = $("#searchResults");
    if (!q && !state.filters.size) {
      hits = scenes.map((sc, si) => index.find((r) => r.si === si));
      box.innerHTML = `<div class="res-group"><h3>Start here</h3>${hits.map(resHTML).join("")}</div>`;
      return;
    }
    if (!hits.length) {
      box.innerHTML = `<p class="res-empty">Nothing found for “${esc(q)}”. Try “bread”, “café”, “gluten” or “egg”.</p>`;
      return;
    }
    box.innerHTML = scenes
      .map((sc, si) => {
        const g = hits.filter((h) => h.si === si);
        return g.length ? `<div class="res-group"><h3>${esc(sc.label)} · ${g.length}</h3>${g.map(resHTML).join("")}</div>` : "";
      })
      .join("");
  }
  let resN = 0;
  const resHTML = (r) =>
    `<button class="res" type="button" data-go="${r.si}:${r.it.id}" style="animation-delay:${Math.min(resN++, 10) * 30}ms"><span class="res-art">${EF.art(
      r.it.art
    )}</span><span><span class="res-title"><span class="light">${esc(r.it.light)}</span> <span class="bold">${esc(r.it.bold)}</span></span><br><span class="res-sub">${esc(
      scenes[r.si].label
    )}${r.it.free ? " · " + freeCount(r.it) + "/5 free-from" : ""}</span></span></button>`;

  /* ------------------------------------------------------------------
     Menu
     ------------------------------------------------------------------ */
  const MENU = {
    recipes: ["", "Recipes"],
    places: ["Debrecen", "Guide"],
    products: ["Pantry", "Products"],
    learn: ["Allergy", "Basics"],
    community: ["Swaps &", "Stories"],
  };
  function openMenu() {
    $("#menuNav").innerHTML =
      scenes
        .map((s, i) => {
          const [l, b] = MENU[s.id];
          return `<button class="menu-link" type="button" data-scene="${i}" ${i === state.scene ? 'aria-current="true"' : ""} style="animation-delay:${
            0.18 + i * 0.07
          }s"><span class="num">${pad(i + 1)}</span><span>${l ? `<span class="light">${esc(l)}</span> ` : ""}<span class="bold">${esc(b)}</span></span></button>`;
        })
        .join("") +
      `<button class="menu-link" type="button" data-act="map" style="animation-delay:${0.18 + scenes.length * 0.07}s"><span class="num">${pad(
        scenes.length + 1
      )}</span><span><span class="light">Food</span> <span class="bold">Map</span></span></button>`;
    const saved = scenes.flatMap((sc, si) => sc.items.filter((it) => state.saved.has(it.id)).map((it) => ({ si, it })));
    $("#savedList").innerHTML = saved.length
      ? saved
          .map(
            ({ si, it }) => `<li><button class="chip-btn" type="button" data-go="${si}:${it.id}">${EF.art(it.art)}${esc(it.thumb)}</button></li>`
          )
          .join("")
      : `<li style="color:var(--ink-2)">Tap the heart on any recipe, place or product to keep it here.</li>`;
    $("#openMenu").setAttribute("aria-expanded", "true");
    openLayer($("#menuLayer"), $("#openMenu"));
  }

  /* ------------------------------------------------------------------
     Modals: safety, privacy, rules, share
     ------------------------------------------------------------------ */
  const MODALS = {
    safety: () => `
      <h2 id="modalTitle"><span class="light">Safety &amp;</span><span class="bold">Accuracy</span></h2>
      <p>${esc(EF.disclaimer)}</p>
      <ul>
        <li>We never say a place or product is 100% safe unless we have checked it.</li>
        <li>Places and products marked <b>“Sample listing”</b> are examples in this first version and are not yet verified.</li>
        <li>Recipes list their allergens, but always check the labels of the ingredients you buy.</li>
        <li>This site does not give medical advice. For diagnosis or treatment, talk to a doctor or dietitian.</li>
        <li>In an emergency in Hungary, call <b>112</b>.</li>
      </ul>`,
    privacy: () => `
      <h2 id="modalTitle"><span class="light">Your</span><span class="bold">Privacy</span></h2>
      <p>This website has no accounts and no tracking. Your filters, saved items and drafts are stored only in your own browser (local storage), and you can clear them at any time.</p>
      <ul>
        <li>We collect no personal information.</li>
        <li>Community tips can be shared anonymously.</li>
        <li>We never publish anyone’s private information.</li>
      </ul>
      <button class="pill-btn" type="button" data-act="forget">${icon("x")}<span>Clear my saved data</span></button>`,
    rules: () => `
      <h2 id="modalTitle"><span class="light">Community</span><span class="bold">Rules</span></h2>
      <ul>
        <li>Be kind. Never shame anyone for what they eat or can’t eat.</li>
        <li>Share your own experience. Don’t present it as medical advice.</li>
        <li>No personal information about yourself or others.</li>
        <li>Only share recipes and photos that are yours, or that you have permission to use.</li>
        <li>Name places fairly: describe what happened, not who to blame.</li>
      </ul>`,
    share: () => `
      <h2 id="modalTitle"><span class="light">Share your</span><span class="bold">Tip</span></h2>
      <p>Know a good swap, recipe or place in Debrecen? Tell us. You can stay anonymous.</p>
      <form class="form" id="shareForm">
        <label>What kind of tip?
          <select name="kind"><option>Kitchen swap</option><option>Recipe idea</option><option>Place in Debrecen</option><option>Product</option></select>
        </label>
        <label>Your tip<textarea name="text" required minlength="10" placeholder="e.g. The bakery on … now has gluten-free bread on Fridays"></textarea></label>
        <label>Name (optional)<input name="name" placeholder="Anonymous" autocomplete="off"></label>
        <label class="check"><input type="checkbox" required> I have read the community rules and my tip contains no personal information.</label>
        <button class="pill-btn pill-dark" type="submit">${icon("check")}<span>Send tip</span></button>
      </form>`,
  };
  function openModal(name) {
    $("#modalBody").innerHTML = MODALS[name]();
    openLayer($("#modalLayer"));
  }

  /* ------------------------------------------------------------------
     Toast + notice
     ------------------------------------------------------------------ */
  let toastT = 0;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("is-on"), 2800);
  }
  function initNotice() {
    const n = $("#notice");
    if (store.get("noticeOk", false)) return;
    n.hidden = false;
    $("#noticeOk").addEventListener("click", () => {
      store.set("noticeOk", true);
      n.classList.add("is-leaving");
      setTimeout(() => (n.hidden = true), 460);
    });
  }

  /* ------------------------------------------------------------------
     Actions (event delegation)
     ------------------------------------------------------------------ */
  function goItem(si, id) {
    const sc = scenes[si];
    if (sc.filterable && state.filters.size && !sc.items.filter(passes).some((x) => x.id === id)) {
      state.filters.clear();
      store.set("filters", []);
      updateFilterBtn();
      toast("Filters cleared to show this item");
      if (si === state.scene) return refreshSceneTo(id);
    }
    if (si !== state.scene) switchScene(si, id);
    else {
      const idx = visible().findIndex((x) => x.id === id);
      if (idx >= 0) goTo(idx);
    }
  }
  async function refreshSceneTo(id) {
    state.busy = true;
    const outs = await outro();
    renderScene(id);
    const p = intro(false);
    outs.forEach((a) => a.cancel());
    await p;
    state.busy = false;
  }

  function toggleSave(id) {
    state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
    store.set("saved", [...state.saved]);
    const on = state.saved.has(id);
    $$(`[data-act="save"][data-id="${id}"]`).forEach((b) => {
      b.setAttribute("aria-pressed", on);
      b.querySelector("span").textContent = on ? "Saved" : "Save";
    });
    toast(on ? "Saved. Find it in the menu" : "Removed from saved");
  }

  function act(name, btn) {
    const [verb, a1, a2] = name.split(":");
    switch (verb) {
      case "detail":
        return openDetail(a1);
      case "map":
        if (topLayer() === $("#menuLayer")) closeLayer($("#menuLayer"));
        if (topLayer() === $("#sheetLayer")) closeLayer($("#sheetLayer"));
        return openMap(scene().id === "places" ? current().id : null);
      case "next":
        return next();
      case "sheet-next": {
        closeLayer($("#sheetLayer"));
        return setTimeout(() => next(), 350);
      }
      case "goto": {
        const si = scenes.findIndex((s) => s.id === a1);
        stack.slice().reverse().forEach((s) => closeLayer(s.layer));
        const id = a2 === "labels" ? "labels" : scenes[si].items[0].id;
        return setTimeout(() => goItem(si, id), stack.length ? 400 : 0);
      }
      case "save":
        return toggleSave(btn.dataset.id);
      case "helpful":
      case "unhelpful": {
        const v = verb === "helpful" ? 1 : -1;
        const id = btn.dataset.id;
        state.helpful[id] = state.helpful[id] === v ? 0 : v;
        store.set("helpful", state.helpful);
        $$(`[data-act="helpful"][data-id="${id}"]`).forEach((b) => b.setAttribute("aria-pressed", state.helpful[id] === 1));
        $$(`[data-act="unhelpful"][data-id="${id}"]`).forEach((b) => b.setAttribute("aria-pressed", state.helpful[id] === -1));
        if (state.helpful[id]) toast(v === 1 ? "Thanks for the feedback!" : "Thanks! We’ll try to improve this tip.");
        return;
      }
      case "share":
      case "rules":
      case "safety":
      case "privacy":
        return openModal(verb);
      case "filters":
        return openFilter();
      case "clear-filters":
        state.filters.clear();
        store.set("filters", []);
        updateFilterBtn();
        return refreshScene();
      case "print":
        return window.print();
      case "forget":
        ["filters", "saved", "helpful", "noticeOk", "tips"].forEach((k) => {
          try {
            localStorage.removeItem("ef:" + k);
          } catch {
            /* ignore */
          }
        });
        state.saved.clear();
        state.filters.clear();
        state.helpful = {};
        updateFilterBtn();
        closeLayer($("#modalLayer"));
        return toast("Your saved data was cleared");
    }
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    const actBtn = t.closest("[data-act]");
    if (actBtn) return act(actBtn.dataset.act, actBtn);
    const openBtn = t.closest("[data-open]");
    if (openBtn) return openModal(openBtn.dataset.open);
    const sceneBtn = t.closest("[data-scene]");
    if (sceneBtn) {
      const i = +sceneBtn.dataset.scene;
      if (sceneBtn.classList.contains("menu-link")) {
        closeLayer($("#menuLayer"));
        return setTimeout(() => switchScene(i), 350);
      }
      return switchScene(i);
    }
    const go = t.closest("[data-go]");
    if (go) {
      const [si, id] = go.dataset.go.split(":");
      stack.slice().reverse().forEach((s) => closeLayer(s.layer));
      return setTimeout(() => goItem(+si, id), 380);
    }
    const thumb = t.closest(".thumb, .rail-dots button");
    if (thumb) return goTo(+thumb.dataset.i);
    const allergen = t.closest("[data-allergen]");
    if (allergen) {
      toggleFilter(allergen.dataset.allergen);
      if (allergen.closest("#searchChips")) {
        resN = 0;
        runSearch();
        refreshScene();
        filtersDirty = false;
      }
      return;
    }
    const place = t.closest("[data-place]");
    if (place && map) {
      const m = markers[place.dataset.place];
      map.flyTo(m.getLatLng(), 15, { duration: reduced.matches ? 0 : 1 });
      setTimeout(() => m.openPopup(), reduced.matches ? 0 : 1000);
      $$("#mapList button").forEach((b) => b.classList.toggle("is-on", b === place));
      return;
    }
    const guide = t.closest("[data-guide]");
    if (guide) {
      closeLayer($("#mapLayer"));
      const si = scenes.findIndex((s) => s.id === "places");
      return setTimeout(() => goItem(si, guide.dataset.guide), 400);
    }
  });

  el.prev.addEventListener("click", () => prev());
  el.next.addEventListener("click", () => next());
  el.autoplayBtn.addEventListener("click", () => setAutoplay(!state.autoplay));
  el.filterBtn.addEventListener("click", openFilter);
  $("#filterClear").addEventListener("click", () => {
    [...state.filters].forEach(toggleFilter);
  });
  $("#openSearch").addEventListener("click", openSearch);
  $("#openMenu").addEventListener("click", openMenu);
  $("#searchInput").addEventListener("input", () => {
    resN = 0;
    runSearch();
  });
  function openSearch() {
    renderSearchChips();
    $("#searchInput").value = "";
    resN = 0;
    runSearch();
    openLayer($("#searchLayer"), $("#openSearch"));
  }

  /* closing the filter layer applies the change */
  new MutationObserver(() => {
    if (!$("#filterLayer").classList.contains("is-open")) afterFilterClose();
  }).observe($("#filterLayer"), { attributes: true, attributeFilter: ["class"] });

  document.addEventListener("submit", (e) => {
    if (e.target.id !== "shareForm") return;
    e.preventDefault();
    const fd = new FormData(e.target);
    const tips = store.get("tips", []);
    tips.push({ kind: fd.get("kind"), text: fd.get("text"), name: fd.get("name") || "Anonymous", at: new Date().toISOString() });
    store.set("tips", tips);
    closeLayer($("#modalLayer"));
    toast("Thank you! This first version has no server yet, so your tip is saved on this device.");
  });

  /* tabs: click + arrow keys */
  el.tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(i));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        selectTab(i ? 0 : 1, true);
      }
    });
  });

  /* keyboard */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && stack.length) return closeLayer(topLayer());
    const tag = (e.target.tagName || "").toLowerCase();
    const typing = tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;
    if (typing || stack.length || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/") {
      e.preventDefault();
      openSearch();
    } else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  });

  /* swipe on touch screens */
  let sx = 0, sy = 0, st = 0;
  el.hero.style.touchAction = "pan-y";
  el.hero.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    sx = e.clientX;
    sy = e.clientY;
    st = performance.now();
  });
  el.hero.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse" || !st) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    st = 0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) dx < 0 ? next() : prev();
  });

  /* autoplay holds */
  for (const node of [el.card, el.strip, el.hero, el.rail]) {
    node.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && hold("hover", true));
    node.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && hold("hover", false));
  }
  app.addEventListener("focusin", (e) => {
    if (e.target.matches(":focus-visible")) hold("focus", true);
  });
  app.addEventListener("focusout", () => hold("focus", false));
  document.addEventListener("visibilitychange", () => hold("hidden", document.hidden));

  /* gentle parallax that follows the pointer */
  let pTarget = [0, 0], pNow = [0, 0], pRaf = 0;
  function pLoop() {
    pNow[0] += (pTarget[0] - pNow[0]) * 0.07;
    pNow[1] += (pTarget[1] - pNow[1]) * 0.07;
    app.style.setProperty("--px", pNow[0].toFixed(4));
    app.style.setProperty("--py", pNow[1].toFixed(4));
    pRaf = Math.abs(pTarget[0] - pNow[0]) + Math.abs(pTarget[1] - pNow[1]) > 0.001 ? requestAnimationFrame(pLoop) : 0;
  }
  window.addEventListener("pointermove", (e) => {
    if (!finePointer.matches || reduced.matches || e.pointerType !== "mouse") return;
    pTarget = [(e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2];
    if (!pRaf) pRaf = requestAnimationFrame(pLoop);
  });

  /* magnetic pull on round buttons */
  for (const b of [el.filterBtn, el.prev, el.next]) {
    b.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || reduced.matches) return;
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      b.style.translate = `${(dx * 0.25).toFixed(1)}px ${(dy * 0.25).toFixed(1)}px`;
    });
    b.addEventListener("pointerleave", () => (b.style.translate = ""));
    b.style.transition = (getComputedStyle(b).transition || "") + ", translate .5s cubic-bezier(.34,1.4,.5,1)";
  }

  /* keep geometry right on resize */
  let rT = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(rT);
    rT = requestAnimationFrame(() => {
      const wasBusy = state.busy;
      fitTitle();
      measure();
      if (!wasBusy) setA(state.arm, 0);
      updateStrip(true);
      updateDock();
      moveTabInk();
    });
  }).observe(app);

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function parseHash() {
    const [, sid, iid] = location.hash.split("/");
    const si = scenes.findIndex((s) => s.id === sid);
    return si < 0 ? { si: 0 } : { si, iid };
  }

  if (SLOW > 1) {
    const origAnimate = Element.prototype.animate;
    Element.prototype.animate = function (k, o) {
      const a = origAnimate.call(this, k, o);
      a.playbackRate = 1 / SLOW;
      return a;
    };
  }

  async function boot() {
    renderDock();
    updateFilterBtn();
    const { si, iid } = parseHash();
    state.scene = si;
    if (iid && scenes[si].filterable && state.filters.size && !scenes[si].items.filter(passes).some((x) => x.id === iid)) {
      state.filters.clear();
      store.set("filters", []);
      updateFilterBtn();
    }
    await Promise.race([document.fonts?.ready, wait(1600)]);
    renderScene(iid);
    setAutoplay(state.autoplay);
    hold("intro", true);
    await wait(reduced.matches ? 0 : 250); // a beat of empty wall, like the reference
    await intro(true);
    hold("intro", false);
    restartAutoplayTimer();
    initNotice();
  }

  window.addEventListener("hashchange", () => {
    const { si, iid } = parseHash();
    if (si !== state.scene) switchScene(si, iid);
    else if (iid && iid !== current().id) goItem(si, iid);
  });

  boot();
})();
