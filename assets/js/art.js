/*
 * Hand-built, top-down food illustrations (SVG).
 * Original artwork, so no photo licensing worries (README §13).
 *
 * EF.art(key) -> "<svg …>" string. Every call gets its own id prefix so
 * gradients never clash when the same dish is drawn several times.
 */
window.EF = window.EF || {};

(function () {
  let uidCounter = 0;
  const f = (v) => Math.round(v * 10) / 10;

  /* deterministic random, so drawings look the same on every visit */
  function rng(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* closed Catmull-Rom spline through points */
  function smooth(pts) {
    const n = pts.length;
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(
        p2[1] - (p3[1] - p1[1]) / 6
      )} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + "Z";
  }

  /* organic round shape; r may be a number or [rx, ry] */
  function blob(cx, cy, r, jit, n, R, rot = 0) {
    const [rx, ry] = Array.isArray(r) ? r : [r, r];
    const pts = [];
    const cr = Math.cos(rot), sr = Math.sin(rot);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + (R() * 2 - 1) * jit;
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
    }
    return smooth(pts);
  }

  const pol = (cx, cy, r, deg) => [cx + Math.cos((deg * Math.PI) / 180) * r, cy + Math.sin((deg * Math.PI) / 180) * r];

  /* scatter n points inside a circle */
  function scatter(R, n, cx, cy, rMax, rMin = 0) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2;
      const r = rMin + Math.sqrt(R()) * (rMax - rMin);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, R()]);
    }
    return out;
  }

  /* ---------------- gradients ---------------- */
  const stops = (list) =>
    list.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("");
  const rad = (list, cx = "50%", cy = "50%", r = "50%") => (id) =>
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(list)}</radialGradient>`;
  const lin = (list, x2 = "0", y2 = "1") => (id) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`;

  const DEFS = {
    plateW: rad([[0, "#ffffff"], [0.78, "#f7f5f1"], [1, "#e6e1d9"]], "42%", "38%", "62%"),
    plateWell: rad([[0, "#fdfcfa"], [0.86, "#f8f6f2"], [1, "#e9e4dc"]]),
    stone: rad([[0, "#ecebe8"], [0.8, "#dddad5"], [1, "#c6c1ba"]], "42%", "38%", "62%"),
    stoneWell: rad([[0, "#e9e7e3"], [0.9, "#e2dfda"], [1, "#cfcac3"]]),
    clay: rad([[0, "#958d84"], [0.85, "#7c746c"], [1, "#655e57"]], "42%", "38%", "62%"),
    clayWell: rad([[0, "#8c847b"], [0.9, "#837b72"], [1, "#6e675f"]]),
    slate: rad([[0, "#4a4744"], [1, "#2f2d2b"]], "42%", "38%", "62%"),
    wood: rad([[0, "#dcb27f"], [0.7, "#cf9f68"], [1, "#b07a45"]], "40%", "36%", "64%"),
    bowlIn: rad([[0, "#ffffff", 0], [0.82, "#000000", 0], [1, "#3a2a1a", 0.22]]),
    shade: rad([[0.55, "#000", 0], [1, "#000", 0.18]]),
    gloss: lin([[0, "#ffffff", 0.55], [1, "#ffffff", 0]]),
    bb: rad([[0, "#7e8fc4"], [0.45, "#3e4a82"], [1, "#1f2448"]], "35%", "32%", "70%"),
    rasp: rad([[0, "#ff8094"], [0.5, "#e03a57"], [1, "#a3172f"]], "35%", "32%", "70%"),
    tomato: rad([[0, "#ff8a6a"], [0.55, "#ee4630"], [1, "#b8241a"]], "38%", "34%", "70%"),
    tomatoIn: rad([[0, "#ffb08f"], [1, "#f0583b"]]),
    banana: rad([[0, "#fff7d6"], [0.75, "#f8e9ae"], [1, "#e9d18a"]]),
    pancake: rad([[0, "#f6cf8c"], [0.55, "#e9ad5f"], [0.88, "#cf8a3e"], [1, "#a8642a"]], "46%", "44%", "56%"),
    pancakeLow: rad([[0, "#d99a51"], [1, "#9c5a24"]]),
    syrup: rad([[0, "#d8892c", 0.96], [0.55, "#a5521a", 0.94], [1, "#6e320c", 0.92]], "40%", "36%", "64%"),
    oatMilk: rad([[0, "#fffaf0"], [0.85, "#f6ead2"], [1, "#e6d4b2"]], "44%", "40%", "60%"),
    cake: rad([[0, "#6e3d27"], [0.75, "#4b2516"], [1, "#2f160c"]], "42%", "38%", "62%"),
    sponge: lin([[0, "#7a4a32"], [1, "#5a321f"]]),
    cookie: rad([[0, "#ecbf7e"], [0.65, "#d9a05b"], [1, "#b0702f"]], "44%", "40%", "60%"),
    crust: rad([[0.8, "#e9b56c"], [0.92, "#d1914a"], [1, "#a8652b"]]),
    sauce: rad([[0, "#e2603f"], [1, "#b4321e"]]),
    cheese: rad([[0, "#fffaf0"], [1, "#f0e1bd"]], "40%", "36%", "64%"),
    leafG: lin([[0, "#8cc076"], [1, "#4c8a3a"]], "1", "1"),
    basil: lin([[0, "#6cae55"], [1, "#2e6b2a"]], "1", "1"),
    spinach: lin([[0, "#5c9746"], [1, "#2c5a24"]], "1", "1"),
    avo: rad([[0, "#eef2b0"], [0.55, "#c4d96e"], [0.85, "#8fb547"], [1, "#4f7a2a"]], "30%", "50%", "80%"),
    carrot: lin([[0, "#ffb35c"], [1, "#e9742a"]], "1", "0"),
    quinoa: rad([[0, "#f3e8cc"], [1, "#e2d1aa"]]),
    chickpea: rad([[0, "#f6cf8f"], [0.7, "#e2a75f"], [1, "#c9843d"]], "38%", "34%", "66%"),
    soup: rad([[0, "#f9bc63"], [0.7, "#ee9638"], [1, "#d8731d"]], "45%", "42%", "58%"),
    coffee: rad([[0, "#c08350"], [0.6, "#93552c"], [0.92, "#6b3a1b"], [1, "#a8754a"]]),
    milk: rad([[0, "#ffffff"], [0.85, "#f7f4ee"], [1, "#e6e0d6"]], "44%", "40%", "60%"),
    glassRim: rad([[0.86, "#ffffff", 0], [0.93, "#cfe0e6", 0.6], [1, "#ffffff", 0.95]]),
    egg: rad([[0, "#fdf6ea"], [0.7, "#f2e2c6"], [1, "#d9bf97"]], "38%", "34%", "70%"),
    eggBrown: rad([[0, "#f3d2ae"], [0.7, "#dcae7e"], [1, "#b98454"]], "38%", "34%", "70%"),
    butter: lin([[0, "#fff1b3"], [1, "#f0cf62"]], "1", "1"),
    flour: rad([[0, "#ffffff"], [0.7, "#f7f3ec"], [1, "#e4dccf"]], "40%", "36%", "64%"),
    peanut: rad([[0, "#ecc890"], [1, "#c18d50"]], "40%", "36%", "64%"),
    wicker: rad([[0, "#d8ad73"], [1, "#9c6a33"]]),
    pink: rad([[0, "#ffc2cf"], [0.7, "#f492aa"], [1, "#d86a87"]], "38%", "34%", "66%"),
    mango: rad([[0, "#ffd07a"], [0.7, "#f8a93e"], [1, "#de8320"]], "38%", "34%", "66%"),
    lemon: rad([[0, "#fffbe0"], [0.7, "#fbef9f"], [1, "#e7d36a"]], "38%", "34%", "66%"),
    choc: lin([[0, "#5a3322"], [1, "#3a1d11"]], "1", "1"),
    croissant: rad([[0, "#f5c46f"], [0.6, "#e09a3f"], [1, "#a85c1c"]], "40%", "36%", "64%"),
    rice: rad([[0, "#fbf3e0"], [1, "#e8d6b0"]], "40%", "36%", "64%"),
    bread: rad([[0, "#c8834a"], [0.7, "#a9632c"], [1, "#7a4219"]], "40%", "36%", "64%"),
    crumb: rad([[0, "#b89676"], [1, "#9a7656"]]),
    crumbLight: rad([[0, "#f7ead1"], [1, "#e9d4ad"]]),
    apple: rad([[0, "#ff8d7a"], [0.6, "#e0402f"], [1, "#a52519"]], "36%", "32%", "70%"),
    paper: lin([[0, "#ffffff"], [1, "#f1ece3"]], "1", "1"),
    paperTone: lin([[0, "#fffdf7"], [1, "#f4ecdb"]], "1", "1"),
  };

  function ctx() {
    const u = "ef" + ++uidCounter + "_";
    const used = new Set();
    return {
      id(k) {
        used.add(k);
        return `url(#${u}${k})`;
      },
      defs() {
        return [...used].map((k) => DEFS[k](u + k)).join("");
      },
    };
  }

  /* ---------------- plates ---------------- */
  function plate(c, kind = "white", R) {
    if (kind === "white")
      return `<circle cx="100" cy="100" r="96" fill="${c.id("plateW")}"/>
        <circle cx="100" cy="100" r="74" fill="${c.id("plateWell")}"/>
        <circle cx="100" cy="100" r="74.5" fill="none" stroke="#e3ddd4" stroke-width="1"/>
        <path d="M30 70A74 74 0 0 1 96 26" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`;
    if (kind === "stone") {
      let s = `<circle cx="100" cy="100" r="96" fill="${c.id("stone")}"/>
        <circle cx="100" cy="100" r="76" fill="${c.id("stoneWell")}"/>`;
      R = R || rng(7);
      for (const [x, y, k] of scatter(R, 220, 100, 100, 94))
        s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.3 + k * 0.7)}" fill="${k > 0.5 ? "#8f8a84" : "#fff"}" opacity="${f(0.25 + k * 0.35)}"/>`;
      return s + `<path d="M30 70A74 74 0 0 1 96 26" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".55"/>`;
    }
    if (kind === "clay")
      return `<circle cx="100" cy="100" r="96" fill="${c.id("clay")}"/>
        <circle cx="100" cy="100" r="80" fill="${c.id("clayWell")}"/>
        <circle cx="100" cy="100" r="80.5" fill="none" stroke="#5b544d" stroke-width="1" opacity=".5"/>
        <path d="M26 74A78 78 0 0 1 96 22" stroke="#b9b1a8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`;
    if (kind === "wood") {
      let s = `<circle cx="100" cy="100" r="96" fill="${c.id("wood")}"/>`;
      R = R || rng(3);
      for (let i = 0; i < 9; i++) {
        const r = 12 + i * 9.5 + R() * 3;
        s += `<circle cx="${f(98 + R() * 4)}" cy="${f(100 + R() * 4)}" r="${f(r)}" fill="none" stroke="#a8743f" stroke-width="${f(
          0.5 + R() * 0.8
        )}" opacity="${f(0.18 + R() * 0.2)}"/>`;
      }
      return s + `<circle cx="100" cy="100" r="95" fill="none" stroke="#9c6a37" stroke-width="2" opacity=".5"/>`;
    }
    if (kind === "slate")
      return `<circle cx="100" cy="100" r="96" fill="${c.id("slate")}"/>
        <circle cx="100" cy="100" r="95" fill="none" stroke="#5d5955" stroke-width="1.5"/>`;
    if (kind === "bowl")
      return `<circle cx="100" cy="100" r="96" fill="${c.id("plateW")}"/>
        <circle cx="100" cy="100" r="84" fill="#f3efe9"/>
        <circle cx="100" cy="100" r="84" fill="${c.id("bowlIn")}"/>
        <path d="M24 80A80 80 0 0 1 92 18" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`;
    return "";
  }

  /* ---------------- food primitives ---------------- */
  const leaf = (x, y, len, w, rot, fill, vein = "rgba(255,255,255,.4)") =>
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><path d="M0 0C${f(len * 0.25)} ${f(-w)} ${f(len * 0.7)} ${f(
      -w * 0.9
    )} ${f(len)} 0C${f(len * 0.7)} ${f(w * 0.9)} ${f(len * 0.25)} ${f(w)} 0 0Z" fill="${fill}"/><path d="M0 0C${f(len * 0.25)} ${f(
      -w
    )} ${f(len * 0.7)} ${f(-w * 0.9)} ${f(len)} 0Z" fill="#fff" opacity=".12"/><path d="M${f(len * 0.06)} 0L${f(
      len * 0.86
    )} 0" stroke="${vein}" stroke-width="${f(Math.max(0.6, w * 0.13))}" stroke-linecap="round"/></g>`;

  const blueberry = (c, x, y, r) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${c.id("bb")}"/><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="#9fb0dd" opacity=".12"/>` +
    `<path d="M${f(x + r * 0.05)} ${f(y - r * 0.32)}l${f(r * 0.3)} 0M${f(x + r * 0.2)} ${f(y - r * 0.47)}l0 ${f(r * 0.3)}" stroke="#151935" stroke-width="${f(
      r * 0.16
    )}" stroke-linecap="round"/><circle cx="${f(x - r * 0.38)}" cy="${f(y - r * 0.38)}" r="${f(r * 0.22)}" fill="#fff" opacity=".35"/>`;

  function raspberry(c, x, y, r) {
    let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#b51f39"/>`;
    const d = r * 0.34;
    for (let i = 0; i < 7; i++) {
      const [px, py] = i === 0 ? [x, y] : pol(x, y, r * 0.58, i * 60 + 15);
      s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(d)}" fill="${c.id("rasp")}"/><circle cx="${f(px - d * 0.3)}" cy="${f(
        py - d * 0.3
      )}" r="${f(d * 0.28)}" fill="#fff" opacity=".45"/>`;
    }
    return s;
  }

  function bananaSlice(c, x, y, r) {
    let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${c.id("banana")}" stroke="#e0c477" stroke-width="1"/>`;
    for (let i = 0; i < 6; i++) {
      const [px, py] = pol(x, y, r * 0.32, i * 60);
      s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(r * 0.07)}" fill="#b68f4a" opacity=".55"/>`;
    }
    return s + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.12)}" fill="#e8d293"/>`;
  }

  function tomatoHalf(c, x, y, r, rot = 0) {
    let s = `<g transform="rotate(${rot} ${f(x)} ${f(y)})"><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${c.id("tomato")}"/>
      <circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.8)}" fill="${c.id("tomatoIn")}"/>`;
    for (let i = 0; i < 3; i++) {
      const [px, py] = pol(x, y, r * 0.42, i * 120 + 30);
      s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(r * 0.26)}" ry="${f(r * 0.18)}" transform="rotate(${i * 120 + 30} ${f(px)} ${f(
        py
      )})" fill="#d8402a" opacity=".55"/><circle cx="${f(px)}" cy="${f(py)}" r="${f(r * 0.06)}" fill="#ffe2a0"/>`;
    }
    return s + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.14)}" fill="#ffd2b8"/></g>`;
  }

  const tomato = (c, x, y, r) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${c.id("tomato")}"/><path d="M${f(x - r * 0.35)} ${f(y - r * 0.1)}l${f(r * 0.35)} ${f(
      -r * 0.2
    )} ${f(r * 0.35)} ${f(r * 0.2)}M${f(x)} ${f(y - r * 0.3)}l0 ${f(r * 0.4)}" stroke="#3f7d2c" stroke-width="${f(r * 0.18)}" stroke-linecap="round" fill="none"/><ellipse cx="${f(
      x - r * 0.4
    )}" cy="${f(y - r * 0.42)}" rx="${f(r * 0.22)}" ry="${f(r * 0.13)}" transform="rotate(-35 ${f(x - r * 0.4)} ${f(y - r * 0.42)})" fill="#fff" opacity=".5"/>`;

  const chickpea = (c, x, y, r, rot) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${c.id("chickpea")}"/><path d="M${f(x - r * 0.1)} ${f(y - r * 0.85)}q${f(
      r * 0.45
    )} ${f(r * 0.6)} ${f(r * 0.05)} ${f(r * 1.4)}" transform="rotate(${f(rot)} ${f(x)} ${f(y)})" stroke="#b7742f" stroke-width=".8" fill="none" opacity=".6"/><circle cx="${f(
      x - r * 0.35
    )}" cy="${f(y - r * 0.35)}" r="${f(r * 0.25)}" fill="#fff" opacity=".3"/>`;

  function egg(c, x, y, rx, ry, rot, brown) {
    return `<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x + 2}" cy="${y + 4}" rx="${rx}" ry="${ry}" fill="#000" opacity=".1"/>
      <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c.id(brown ? "eggBrown" : "egg")}"/>
      <ellipse cx="${f(x - rx * 0.35)}" cy="${f(y - ry * 0.35)}" rx="${f(rx * 0.25)}" ry="${f(ry * 0.18)}" fill="#fff" opacity=".6" transform="rotate(-30 ${f(
      x - rx * 0.35
    )} ${f(y - ry * 0.35)})"/></g>`;
  }

  function peanutShell(c, x, y, s, rot) {
    const d = `M0 ${-16 * s}C${9 * s} ${-16 * s} ${10 * s} ${-6 * s} ${6 * s} ${-1 * s}C${4 * s} ${1.5 * s} ${4 * s} ${3 * s} ${7 * s} ${
      6 * s
    }C${11 * s} ${12 * s} ${7 * s} ${19 * s} 0 ${19 * s}C${-7 * s} ${19 * s} ${-11 * s} ${12 * s} ${-7 * s} ${6 * s}C${-4 * s} ${3 * s} ${
      -4 * s
    } ${1.5 * s} ${-6 * s} ${-1 * s}C${-10 * s} ${-6 * s} ${-9 * s} ${-16 * s} 0 ${-16 * s}Z`;
    let t = "";
    for (let i = -2; i <= 2; i++)
      t += `<path d="M${f(i * 2.6 * s)} ${f(-14 * s)}L${f(i * 2.6 * s)} ${f(17 * s)}" stroke="#a87439" stroke-width="${f(0.5 * s)}" opacity=".35"/>`;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})"><path d="${d}" fill="${c.id("peanut")}" stroke="#b07a3e" stroke-width="${f(
      0.6 * s
    )}"/>${t}<path d="M${f(-6 * s)} ${f(-1 * s)}Q0 ${f(1.5 * s)} ${f(6 * s)} ${f(-1 * s)}" stroke="#a06c34" stroke-width="${f(0.7 * s)}" fill="none" opacity=".5"/></g>`;
  }

  function seed(x, y, len, rot, fill, stripe) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><path d="M${f(-len / 2)} 0Q0 ${f(-len * 0.38)} ${f(len / 2)} 0Q0 ${f(
      len * 0.38
    )} ${f(-len / 2)} 0Z" fill="${fill}"/>`;
    if (stripe) s += `<path d="M${f(-len * 0.35)} 0L${f(len * 0.35)} 0" stroke="${stripe}" stroke-width="${f(len * 0.12)}" stroke-linecap="round"/>`;
    return s + "</g>";
  }

  function wheatEar(x, y, len, rot, col = "#d9a85a") {
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})"><path d="M0 0L0 ${f(len)}" stroke="#c99a52" stroke-width="1.6" stroke-linecap="round"/>`;
    for (let i = 0; i < 6; i++) {
      const yy = 4 + i * (len * 0.075);
      s += `<ellipse cx="-3.4" cy="${f(yy)}" rx="2.6" ry="5" transform="rotate(-28 -3.4 ${f(yy)})" fill="${col}" stroke="#b9853f" stroke-width=".5"/>`;
      s += `<ellipse cx="3.4" cy="${f(yy)}" rx="2.6" ry="5" transform="rotate(28 3.4 ${f(yy)})" fill="${col}" stroke="#b9853f" stroke-width=".5"/>`;
      s += `<path d="M-4 ${f(yy - 3)}l-5 -9M4 ${f(yy - 3)}l5 -9" stroke="#d8b170" stroke-width=".5"/>`;
    }
    return s + `<ellipse cx="0" cy="1" rx="2.4" ry="5" fill="${col}" stroke="#b9853f" stroke-width=".5"/></g>`;
  }

  function oatFlake(x, y, s, rot, R) {
    return `<path d="${blob(x, y, [3.4 * s, 2.4 * s], 0.18, 7, R, rot)}" fill="#efdcb5" stroke="#d5b885" stroke-width=".5"/>`;
  }

  function glass(c, x, y, r, fill = "milk") {
    return `<circle cx="${x + 3}" cy="${y + 5}" r="${r + 2}" fill="#000" opacity=".1"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="#eef4f5" opacity=".9"/>
      <circle cx="${x}" cy="${y}" r="${f(r * 0.86)}" fill="${c.id(fill)}"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="${c.id("glassRim")}"/>
      <path d="M${f(x - r * 0.62)} ${f(y - r * 0.5)}A${f(r * 0.8)} ${f(r * 0.8)} 0 0 1 ${f(x - r * 0.1)} ${f(y - r * 0.8)}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/>`;
  }

  function flourPile(c, x, y, r, R) {
    let s = `<path d="${blob(x + 2, y + 4, r * 1.02, 0.08, 12, R)}" fill="#000" opacity=".06"/><path d="${blob(x, y, r, 0.1, 12, R)}" fill="${c.id(
      "flour"
    )}"/>`;
    for (const [px, py] of scatter(R, 30, x, y, r * 1.35, r * 0.9))
      s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(0.5 + R())}" fill="#fff" opacity=".85"/>`;
    return s + `<path d="M${f(x - r * 0.5)} ${f(y - r * 0.2)}q${f(r * 0.4)} ${f(-r * 0.4)} ${f(r * 0.9)} ${f(-r * 0.15)}" stroke="#e6ded1" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  }

  function butterBlock(c, x, y, w, h, rot) {
    return `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - w / 2 + 2}" y="${y - h / 2 + 4}" width="${w}" height="${h}" rx="4" fill="#000" opacity=".1"/>
      <rect x="${x - w / 2 - 5}" y="${y - h / 2 - 5}" width="${w + 10}" height="${h + 10}" rx="3" fill="#f5f1e6" stroke="#e2dccd"/>
      <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="4" fill="${c.id("butter")}"/>
      <path d="M${x - w / 2 + 4} ${y - h / 2 + 5}h${w * 0.5}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>
      <path d="M${x + w * 0.1} ${y - h / 2}q4 ${h * 0.4} 0 ${h}" stroke="#e1b94a" stroke-width="1.2" fill="none" opacity=".6"/></g>`;
  }

  function smallBowl(c, x, y, r, inner) {
    return `<circle cx="${x + 2}" cy="${y + 4}" r="${r}" fill="#000" opacity=".1"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c.id(
      "plateW"
    )}"/><circle cx="${x}" cy="${y}" r="${f(r * 0.8)}" fill="#efe9e0"/>${inner}<circle cx="${x}" cy="${y}" r="${f(r * 0.8)}" fill="${c.id(
      "bowlIn"
    )}"/>`;
  }

  function cookie(c, x, y, r, R) {
    let s = `<path d="${blob(x + 2, y + 3, r, 0.08, 11, R)}" fill="#6b3d17" opacity=".14"/><path d="${blob(x, y, r, 0.08, 11, R)}" fill="${c.id(
      "cookie"
    )}"/>`;
    for (let i = 0; i < 3; i++) {
      const a = R() * Math.PI * 2;
      const [x1, y1] = [x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2];
      const [x2, y2] = [x + Math.cos(a + 0.4) * r * 0.75, y + Math.sin(a + 0.4) * r * 0.75];
      s += `<path d="M${f(x1)} ${f(y1)}Q${f((x1 + x2) / 2 + 3)} ${f((y1 + y2) / 2 - 2)} ${f(x2)} ${f(y2)}" stroke="#b77836" stroke-width="1.2" fill="none" opacity=".55" stroke-linecap="round"/>`;
    }
    for (const [px, py] of scatter(R, 7, x, y, r * 0.75))
      s += `<path d="${blob(px, py, 2.6 + R() * 1.6, 0.25, 6, R)}" fill="#3b1f10"/><circle cx="${f(px - 0.8)}" cy="${f(py - 0.8)}" r=".7" fill="#fff" opacity=".35"/>`;
    for (const [px, py] of scatter(R, 6, x, y, r * 0.8)) s += oatFlake(px, py, 0.7, R() * 3, R);
    return s;
  }

  function croissant(c, x, y, s, rot) {
    const bz = (P, t) => {
      const m = 1 - t;
      return [0, 1].map((k) => m * m * m * P[0][k] + 3 * m * m * t * P[1][k] + 3 * m * t * t * P[2][k] + t * t * t * P[3][k]);
    };
    const O = [[-54, 18], [-48, -56], [48, -56], [54, 18]];
    const I = [[-54, 18], [-22, -2], [22, -2], [54, 18]];
    const body = `M-54 18C-48 -56 48 -56 54 18C56 24 48 26 44 22C22 -2 -22 -2 -44 22C-48 26 -56 24 -54 18Z`;
    let out = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="${body}" fill="#6b3a12" opacity=".14" transform="translate(3 6)"/><path d="${body}" fill="${c.id(
      "croissant"
    )}" stroke="#9b5418" stroke-width="1.2"/>`;
    for (const t of [0.14, 0.27, 0.39, 0.5, 0.61, 0.73, 0.86]) {
      const a = bz(I, t), b = bz(O, t), mx = (a[0] + b[0]) / 2 + (t - 0.5) * 10, my = (a[1] + b[1]) / 2;
      out += `<path d="M${f(a[0])} ${f(a[1])}Q${f(mx)} ${f(my)} ${f(b[0])} ${f(b[1])}" stroke="#a85c1c" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".75"/>`;
      const a2 = bz(I, t + 0.05), b2 = bz(O, t + 0.05);
      out += `<path d="M${f(a2[0] * 0.92)} ${f(a2[1] - 3)}L${f(b2[0] * 0.96)} ${f(b2[1] + 5)}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".28"/>`;
    }
    return out + `</g>`;
  }

  function apple(c, x, y, r) {
    return `<circle cx="${x + 2}" cy="${y + 4}" r="${r}" fill="#000" opacity=".12"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c.id(
      "apple"
    )}"/><circle cx="${x}" cy="${y}" r="${f(r * 0.18)}" fill="#7a2a12" opacity=".5"/><path d="M${x} ${y}l${f(r * 0.25)} ${f(-r * 0.35)}" stroke="#5a3a1a" stroke-width="1.6" stroke-linecap="round"/>${leaf(
      x + r * 0.15,
      y - r * 0.1,
      r * 0.7,
      r * 0.28,
      -60,
      c.id("leafG")
    )}<ellipse cx="${f(x - r * 0.4)}" cy="${f(y - r * 0.4)}" rx="${f(r * 0.25)}" ry="${f(r * 0.15)}" transform="rotate(-40 ${f(x - r * 0.4)} ${f(
      y - r * 0.4
    )})" fill="#fff" opacity=".45"/>`;
  }

  function carrot(c, x, y, len, rot) {
    return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 -5Q${len * 0.5} -5 ${len} 0Q${len * 0.5} 5 0 5Z" fill="${c.id(
      "carrot"
    )}"/><path d="M${len * 0.2} -2.5l3 1M${len * 0.45} 1.5l3 -1M${len * 0.65} -1l2 .7" stroke="#d0601c" stroke-width=".8"/><path d="M0 0l-9 -6M0 0l-11 0M0 0l-9 6" stroke="#5a9a3c" stroke-width="2" stroke-linecap="round"/></g>`;
  }

  function arrowCurve(x1, y1, x2, y2, bend, col = "#6b5c4e") {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - bend;
    const ang = Math.atan2(y2 - my, x2 - mx);
    const h = 6;
    const a1 = [x2 - Math.cos(ang - 0.5) * h, y2 - Math.sin(ang - 0.5) * h];
    const a2 = [x2 - Math.cos(ang + 0.5) * h, y2 - Math.sin(ang + 0.5) * h];
    return `<path d="M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}" stroke="${col}" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="1 5"/><path d="M${f(
      a1[0]
    )} ${f(a1[1])}L${x2} ${y2}L${f(a2[0])} ${f(a2[1])}" stroke="${col}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  const divider = () =>
    `<path d="M100 30V170" stroke="#cfc6b9" stroke-width="1.5" stroke-dasharray="2 6" stroke-linecap="round"/>`;

  /* ---------------- dishes ---------------- */
  const ART = {
    pancakes(c) {
      const R = rng(11);
      let s = plate(c, "white");
      s += `<path d="${blob(106, 109, 65, 0.02, 18, R)}" fill="#7a4618" opacity=".14"/>`;
      s += `<path d="${blob(104, 106, 63, 0.025, 18, R)}" fill="${c.id("pancakeLow")}"/>`;
      s += `<path d="${blob(102, 103, 63, 0.025, 18, R)}" fill="${c.id("pancake")}" opacity=".9"/>`;
      s += `<path d="${blob(100, 100, 61, 0.025, 18, R)}" fill="${c.id("pancake")}"/>`;
      for (const [x, y, k] of scatter(R, 22, 100, 100, 50))
        s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2 + k * 6)}" ry="${f(1.5 + k * 4)}" fill="#c27a35" opacity=".22"/>`;
      s += `<path d="${blob(95, 93, [33, 29], 0.2, 11, R)}" fill="${c.id("syrup")}" opacity=".82"/>`;
      s += `<path d="M120 102q8 10 4 24q-3 6 -6 0q-2 -10 -6 -16z" fill="${c.id("syrup")}"/><path d="M76 112q-4 12 -12 18q-5 2 -3 -4q4 -8 6 -16z" fill="${c.id(
        "syrup"
      )}"/>`;
      s += `<path d="M76 84q10 -12 28 -10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/><path d="M110 104q4 -3 6 -8" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>`;
      s += `<rect x="86" y="80" width="20" height="16" rx="4" transform="rotate(-12 96 88)" fill="${c.id("butter")}" stroke="#e5c35a"/><path d="M89 84h10" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7" transform="rotate(-12 96 88)"/>`;
      s += bananaSlice(c, 124, 76, 10) + bananaSlice(c, 134, 98, 9.5) + bananaSlice(c, 116, 120, 10);
      for (const [x, y] of [[68, 120], [79, 133], [64, 105], [92, 136], [146, 124], [142, 74]]) s += blueberry(c, x, y, 6.2);
      s += leaf(104, 70, 20, 7, -150, c.id("leafG")) + leaf(105, 72, 16, 6, -100, c.id("leafG"));
      for (const [x, y, k] of scatter(R, 60, 100, 100, 62)) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.4 + k * 0.8)}" fill="#fff" opacity=".85"/>`;
      return s;
    },

    cake(c) {
      const R = rng(5);
      let s = plate(c, "white");
      const cx = 96, cy = 100, r = 64, a1 = -20, a2 = 32;
      const p1 = pol(cx, cy, r, a1), p2 = pol(cx, cy, r, a2);
      s += `<path d="M${cx + 3} ${cy + 5}L${f(p2[0] + 3)} ${f(p2[1] + 5)}A${r} ${r} 0 1 1 ${f(p1[0] + 3)} ${f(p1[1] + 5)}Z" fill="#3a1d0e" opacity=".16"/>`;
      s += `<path d="M${cx} ${cy}L${f(p2[0])} ${f(p2[1])}A${r} ${r} 0 1 1 ${f(p1[0])} ${f(p1[1])}Z" fill="${c.id("cake")}"/>`;
      // cut edges show the sponge
      s += `<path d="M${cx} ${cy}L${f(p1[0])} ${f(p1[1])}" stroke="#8a5638" stroke-width="3"/><path d="M${cx} ${cy}L${f(p2[0])} ${f(
        p2[1]
      )}" stroke="#8a5638" stroke-width="3"/>`;
      // served slice, pulled out a little
      const ox = 14, oy = 5;
      s += `<path d="M${cx + ox + 3} ${cy + oy + 5}L${f(p1[0] + ox + 3)} ${f(p1[1] + oy + 5)}A${r} ${r} 0 0 1 ${f(p2[0] + ox + 3)} ${f(
        p2[1] + oy + 5
      )}Z" fill="#3a1d0e" opacity=".16"/><path d="M${cx + ox} ${cy + oy}L${f(p1[0] + ox)} ${f(p1[1] + oy)}A${r} ${r} 0 0 1 ${f(p2[0] + ox)} ${f(
        p2[1] + oy
      )}Z" fill="${c.id("cake")}"/>`;
      // ganache swirl
      let sw = "";
      for (let t = 0; t < 26; t++) {
        const a = t * 0.55, rr = 4 + t * 2;
        const [x, y] = pol(cx, cy, rr, (a * 180) / Math.PI);
        sw += (t ? "L" : "M") + f(x) + " " + f(y);
      }
      s += `<path d="${sw}" stroke="#2a130a" stroke-width="2" fill="none" opacity=".45" stroke-linejoin="round"/>`;
      s += `<path d="M56 76A48 48 0 0 1 98 52" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".18"/>`;
      for (const [x, y] of [[84, 82], [100, 76], [74, 98], [90, 98], [80, 116]]) s += raspberry(c, x, y, 7.5);
      s += leaf(100, 92, 16, 6, 40, c.id("leafG")) + leaf(100, 92, 14, 5, -20, c.id("leafG"));
      for (const [x, y, k] of scatter(R, 40, 150, 110, 30, 18)) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + k)}" fill="#5a3020" opacity=".55"/>`;
      return s;
    },

    bowl(c) {
      const R = rng(21);
      let s = plate(c, "bowl");
      s += `<circle cx="100" cy="100" r="80" fill="${c.id("quinoa")}"/>`;
      for (const [x, y, k] of scatter(R, 260, 100, 100, 78))
        s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.3" ry="1" fill="${k > 0.6 ? "#d6c193" : k > 0.3 ? "#f7eedb" : "#c9b07a"}"/>`;
      // spinach top-left
      for (let i = 0; i < 11; i++) s += leaf(34 + R() * 34, 52 + R() * 40, 30 + R() * 10, 11 + R() * 4, -50 + R() * 110, c.id("spinach"), "rgba(255,255,255,.3)");
      // red cabbage top-right
      for (let i = 0; i < 30; i++) {
        const x = 98 + R() * 50, y = 28 + R() * 40;
        s += `<path d="M${f(x)} ${f(y)}q${f(8 + R() * 6)} ${f(-4 + R() * 8)} ${f(18 + R() * 8)} ${f(R() * 6)}" stroke="${
          R() > 0.5 ? "#6e2763" : "#a24a8c"
        }" stroke-width="${f(2.4 + R() * 1.8)}" fill="none" stroke-linecap="round"/>`;
      }
      // carrot ribbons right
      for (let i = 0; i < 9; i++) {
        const x = 132 + R() * 22, y = 70 + R() * 34;
        s += `<path d="M${f(x)} ${f(y)}c8 -10 20 -8 26 4" stroke="${c.id("carrot")}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M${f(x + 3)} ${f(
          y - 3
        )}c6 -6 14 -6 18 0" stroke="#ffd29a" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>`;
      }
      // avocado fan bottom-right
      for (let i = 0; i < 6; i++) {
        const a = 18 + i * 13;
        s += `<g transform="rotate(${a} 108 110)"><path d="M108 110c12 -5 36 -5 48 6c-12 6 -34 7 -48 -6z" fill="${c.id(
          "avo"
        )}" stroke="#3f6a22" stroke-width="2"/></g>`;
      }
      // chickpeas bottom-left
      for (const [x, y] of scatter(R, 26, 66, 128, 24)) s += chickpea(c, x, y, 6, R() * 180);
      for (const [x, y] of scatter(R, 14, 66, 128, 26)) s += `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="#b8431d" opacity=".55"/>`;
      // tahini drizzle + sesame
      s += `<path d="M58 96c10 -8 18 8 28 0s18 8 28 0s16 8 26 0" stroke="#f3e5c6" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
      for (const [x, y, k] of scatter(R, 30, 100, 96, 44)) s += seed(x, y, 3.2, k * 180, "#fbf6e8");
      s += `<g transform="rotate(-20 92 150)"><path d="M70 152a22 22 0 0 0 44 0z" fill="#f8e57e" stroke="#e5c53f" stroke-width="2"/><path d="M76 152a16 16 0 0 0 32 0z" fill="#fbf0b3"/><path d="M92 152v14M92 152l-10 10M92 152l10 10" stroke="#ecd25e" stroke-width="1.2"/></g>`;
      return s;
    },

    pizza(c) {
      const R = rng(31);
      let s = plate(c, "wood", R);
      s += `<circle cx="102" cy="104" r="80" fill="#5a2e10" opacity=".18"/>`;
      s += `<path d="${blob(100, 100, 80, 0.015, 24, R)}" fill="${c.id("crust")}"/>`;
      for (const [x, y, k] of scatter(R, 40, 100, 100, 79, 70)) s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1 + k * 2.5)}" ry="${f(1 + k * 1.4)}" fill="#8f4c1c" opacity=".35"/>`;
      s += `<path d="${blob(100, 100, 66, 0.03, 20, R)}" fill="${c.id("sauce")}"/>`;
      for (const [x, y, k] of scatter(R, 30, 100, 100, 62)) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1 + k * 2)}" fill="#9f2a17" opacity=".3"/>`;
      for (const [x, y] of scatter(R, 11, 100, 100, 52)) s += `<path d="${blob(x, y, [10 + R() * 5, 8 + R() * 4], 0.22, 8, R, R() * 3)}" fill="${c.id("cheese")}"/>`;
      for (const [x, y] of [[76, 70], [130, 82], [110, 132], [68, 118], [100, 98]]) s += tomatoHalf(c, x, y, 8, R() * 90);
      for (const [x, y] of [[92, 66], [138, 114], [80, 98], [118, 108]]) s += leaf(x, y, 18, 7, R() * 360, c.id("basil"));
      for (let i = 0; i < 3; i++) {
        const [x1, y1] = pol(100, 100, 66, i * 60 + 10), [x2, y2] = pol(100, 100, 66, i * 60 + 190);
        s += `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="#7a3510" stroke-width="1.2" opacity=".35"/>`;
      }
      for (const [x, y] of scatter(R, 30, 100, 100, 60)) s += `<circle cx="${f(x)}" cy="${f(y)}" r=".8" fill="#3b4a20" opacity=".6"/>`;
      return s;
    },

    cookies(c) {
      const R = rng(41);
      let s = plate(c, "stone", R);
      s += cookie(c, 70, 74, 30, R) + cookie(c, 128, 68, 27, R) + cookie(c, 132, 126, 30, R) + cookie(c, 74, 132, 28, R) + cookie(c, 102, 100, 26, R);
      for (const [x, y] of scatter(R, 18, 100, 100, 78, 30)) s += `<path d="${blob(x, y, 1.4 + R() * 1.6, 0.3, 5, R)}" fill="#cf9550"/>`;
      return s;
    },

    bread(c) {
      const R = rng(51);
      let s = plate(c, "wood", R);
      s += `<g transform="rotate(-24 92 92)"><ellipse cx="94" cy="96" rx="62" ry="40" fill="#4a2a10" opacity=".22"/>
        <path d="${blob(90, 90, [62, 40], 0.03, 18, R)}" fill="${c.id("bread")}"/>`;
      for (let i = -1; i <= 1; i++)
        s += `<path d="M${68 + i * 22} 62q10 28 0 56" stroke="#e8c48c" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`;
      for (const [x, y, k] of scatter(R, 24, 90, 90, 34)) s += k > 0.5 ? seed(x, y, 7, R() * 180, "#6e8f45", "#88a95a") : seed(x, y, 7, R() * 180, "#575049", "#d8d2c6");
      s += `<path d="M44 74q24 -24 70 -20" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".18"/></g>`;
      // two slices
      for (const [x, y, rot] of [[126, 140, 18], [146, 116, 30]]) {
        s += `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 26 + 2}" y="${y - 20 + 4}" width="52" height="40" rx="18" fill="#4a2a10" opacity=".15"/>
          <rect x="${x - 26}" y="${y - 20}" width="52" height="40" rx="18" fill="#80461b"/><rect x="${x - 23}" y="${y - 17}" width="46" height="34" rx="15" fill="${c.id(
          "crumb"
        )}"/>`;
        for (const [px, py] of scatter(R, 14, x, y, 14)) s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(0.8 + R() * 1.6)}" ry="${f(0.6 + R())}" fill="#7d5e44" opacity=".55"/>`;
        s += seed(x - 8, y + 4, 6, 40, "#6e8f45") + seed(x + 9, y - 5, 6, -20, "#575049", "#d8d2c6") + `</g>`;
      }
      return s;
    },

    soup(c) {
      const R = rng(61);
      let s = plate(c, "clay");
      s += `<circle cx="100" cy="100" r="70" fill="${c.id("soup")}"/><circle cx="100" cy="100" r="70" fill="${c.id("shade")}"/>`;
      let sw = "";
      for (let t = 0; t < 30; t++) {
        const [x, y] = pol(100, 100, 3 + t * 1.25, t * 26);
        sw += (t ? "L" : "M") + f(x) + " " + f(y);
      }
      s += `<path d="${sw}" stroke="#fff8ea" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>`;
      for (const [x, y, k] of scatter(R, 12, 100, 100, 54, 20)) s += seed(x, y, 8, k * 360, "#5d8a3a", "#7aa652");
      for (const [x, y] of scatter(R, 40, 100, 100, 62)) s += `<circle cx="${f(x)}" cy="${f(y)}" r=".9" fill="#3d2a1a" opacity=".6"/>`;
      s += leaf(70, 72, 18, 6, 30, c.id("leafG")) + leaf(72, 74, 15, 5, 90, c.id("leafG"));
      s += `<path d="M60 64a54 54 0 0 1 40 -20" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>`;
      return s;
    },

    croissant(c) {
      let s = plate(c, "white");
      s += croissant(c, 118, 140, 0.62, 168) + croissant(c, 92, 92, 0.95, -18);
      s += smallBowl(c, 150, 64, 17, `<circle cx="150" cy="64" r="13" fill="#c42c45"/><circle cx="146" cy="60" r="4" fill="#fff" opacity=".35"/>`);
      return s;
    },

    latte(c) {
      let s = plate(c, "white");
      s += `<rect x="128" y="88" width="34" height="18" rx="9" fill="#000" opacity=".08" transform="translate(3 5)"/>
        <rect x="128" y="88" width="34" height="18" rx="9" fill="${c.id("plateW")}" stroke="#e3ddd4"/>
        <circle cx="96" cy="100" r="60" fill="#000" opacity=".1" transform="translate(3 6)"/>
        <circle cx="96" cy="100" r="60" fill="${c.id("plateW")}" stroke="#e7e2da"/>
        <circle cx="96" cy="100" r="50" fill="${c.id("coffee")}"/>
        <path d="M96 136C70 118 66 98 76 88c7 -7 16 -4 20 4c4 -8 13 -11 20 -4c10 10 6 30 -20 48z" fill="#fff7ec" opacity=".95"/>
        <path d="M96 128C78 114 76 100 82 94c5 -5 11 -2 14 4c3 -6 9 -9 14 -4c6 6 4 20 -14 34z" fill="#e9c9a3" opacity=".55"/>
        <path d="M58 82a50 50 0 0 1 30 -26" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="M40 150l30 -18" stroke="#b9b2a8" stroke-width="5" stroke-linecap="round"/><ellipse cx="74" cy="129" rx="9" ry="6" transform="rotate(-31 74 129)" fill="#cfc8bf"/>`;
      return s;
    },

    sorbet(c) {
      const R = rng(71);
      let s = plate(c, "bowl");
      const scoops = [[78, 82, "pink"], [124, 86, "mango"], [100, 126, "lemon"]];
      for (const [x, y, g] of scoops) {
        s += `<path d="${blob(x + 2, y + 4, 28, 0.08, 12, R)}" fill="#000" opacity=".1"/><path d="${blob(x, y, 28, 0.08, 12, R)}" fill="${c.id(g)}"/>`;
        for (let i = 0; i < 4; i++) {
          const [x1, y1] = pol(x, y, 10 + R() * 12, R() * 360);
          s += `<path d="M${f(x1)} ${f(y1)}q6 -3 10 2" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".45"/>`;
        }
        s += `<ellipse cx="${x - 9}" cy="${y - 10}" rx="8" ry="4" transform="rotate(-35 ${x - 9} ${y - 10})" fill="#fff" opacity=".45"/>`;
      }
      s += raspberry(c, 146, 128, 7) + raspberry(c, 60, 124, 6.5) + blueberry(c, 138, 146, 5.5);
      s += leaf(98, 98, 18, 6.5, -60, c.id("leafG")) + leaf(100, 100, 16, 6, 10, c.id("leafG"));
      return s;
    },

    basket(c) {
      const R = rng(81);
      let s = `<circle cx="100" cy="100" r="96" fill="${c.id("wicker")}"/>`;
      for (let i = 0; i < 9; i++) {
        const r = 20 + i * 9;
        s += `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${i % 2 ? "#b88447" : "#8c5c2a"}" stroke-width="6" stroke-dasharray="7 4" stroke-dashoffset="${i * 5}" opacity=".7"/>`;
      }
      s += `<circle cx="100" cy="100" r="95" fill="none" stroke="#7d4f22" stroke-width="5"/><circle cx="100" cy="100" r="86" fill="${c.id("shade")}"/>`;
      s += `<path d="M28 108q-6 -40 30 -60" stroke="#e9dcc6" stroke-width="14" fill="none" stroke-linecap="round"/>`;
      s += `<g transform="rotate(-30 92 120)"><ellipse cx="92" cy="122" rx="44" ry="22" fill="#4a2a10" opacity=".2"/><path d="${blob(92, 118, [44, 22], 0.04, 14, R)}" fill="${c.id(
        "bread"
      )}"/><path d="M70 104q6 14 0 28M92 102q6 16 0 32M114 104q6 14 0 28" stroke="#e8c48c" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>`;
      s += apple(c, 132, 74, 17) + apple(c, 148, 108, 15);
      s += carrot(c, 60, 66, 54, 20) + carrot(c, 64, 78, 50, 32);
      s += `<circle cx="134" cy="146" r="18" fill="#000" opacity=".12" transform="translate(2 3)"/><circle cx="134" cy="146" r="18" fill="#f6f1e6"/><circle cx="134" cy="146" r="13" fill="#e2b46a"/><circle cx="134" cy="146" r="13" fill="none" stroke="#c99a4f" stroke-width="1.5"/>`;
      return s;
    },

    toast(c) {
      const R = rng(91);
      let s = plate(c, "wood", R);
      const slice = (x, y, rot, toastLevel) => {
        let o = `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x - 34} ${y + 30}V${y - 10}c0 -26 12 -32 34 -32s34 6 34 32V${y + 30}z" fill="#4a2a10" opacity=".16" transform="translate(3 5)"/>
          <path d="M${x - 34} ${y + 30}V${y - 10}c0 -26 12 -32 34 -32s34 6 34 32V${y + 30}z" fill="#b9743a"/>
          <path d="M${x - 29} ${y + 26}V${y - 9}c0 -21 10 -27 29 -27s29 6 29 27V${y + 26}z" fill="${c.id("crumbLight")}"/>
          <path d="M${x - 29} ${y + 26}V${y - 9}c0 -21 10 -27 29 -27s29 6 29 27V${y + 26}z" fill="#c78a4a" opacity="${toastLevel}"/>`;
        for (const [px, py] of scatter(R, 18, x, y + 2, 22)) o += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(0.8 + R() * 1.4)}" ry="${f(0.6 + R())}" fill="#c9a77a" opacity=".7"/>`;
        return o + `</g>`;
      };
      s += slice(80, 94, -14, 0.15) + slice(122, 112, 12, 0.35);
      s += smallBowl(c, 152, 58, 16, `<circle cx="152" cy="58" r="12" fill="#7a2c5a"/><circle cx="148" cy="54" r="3.5" fill="#fff" opacity=".3"/>`);
      return s;
    },

    glass(c) {
      const R = rng(101);
      let s = plate(c, "stone", R);
      s += glass(c, 96, 96, 44, "oatMilk");
      for (const [x, y] of scatter(R, 22, 100, 100, 86, 56)) s += oatFlake(x, y, 1.3, R() * 3, R);
      s += `<path d="M150 150q10 -24 28 -30" stroke="#6b9a4a" stroke-width="2" fill="none"/>`;
      for (let i = 0; i < 6; i++) s += `<ellipse cx="${f(156 + i * 3.4)}" cy="${f(142 - i * 4.6)}" rx="2.4" ry="5" transform="rotate(${30 + i * 4} ${f(156 + i * 3.4)} ${f(
        142 - i * 4.6
      )})" fill="#e7cf95" stroke="#c4a668" stroke-width=".5"/>`;
      return s;
    },

    flour(c) {
      const R = rng(111);
      let s = plate(c, "bowl");
      s += flourPile(c, 100, 104, 58, R);
      s += `<g transform="rotate(-35 140 60)"><rect x="112" y="52" width="66" height="14" rx="7" fill="#b98652"/><ellipse cx="112" cy="59" rx="22" ry="17" fill="#c9965f"/><ellipse cx="112" cy="59" rx="16" ry="12" fill="${c.id(
        "flour"
      )}"/></g>`;
      return s;
    },

    chocolate(c) {
      const R = rng(121);
      let s = plate(c, "white");
      const piece = (x, y, cols, rows, rot) => {
        const w = cols * 18, h = rows * 18;
        let o = `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - w / 2 + 3}" y="${y - h / 2 + 5}" width="${w}" height="${h}" rx="3" fill="#2a120a" opacity=".2"/><rect x="${
          x - w / 2
        }" y="${y - h / 2}" width="${w}" height="${h}" rx="3" fill="#3a1d11"/>`;
        for (let i = 0; i < cols; i++)
          for (let j = 0; j < rows; j++) {
            const px = x - w / 2 + i * 18 + 2, py = y - h / 2 + j * 18 + 2;
            o += `<rect x="${px}" y="${py}" width="14" height="14" rx="2" fill="${c.id("choc")}"/><path d="M${px + 2} ${py + 3}h9" stroke="#8a5a40" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
          }
        return o + `</g>`;
      };
      s += piece(86, 88, 4, 3, -12) + piece(128, 128, 2, 2, 22) + piece(70, 140, 2, 1, 40);
      for (let i = 0; i < 7; i++) s += `<path d="${blob(110 + R() * 50, 60 + R() * 30, 3 + R() * 3, 0.4, 5, R)}" fill="#4a2616"/>`;
      return s;
    },

    ricecakes(c) {
      const R = rng(131);
      let s = plate(c, "clay");
      const cake = (x, y, r) => {
        let o = `<circle cx="${x + 3}" cy="${y + 5}" r="${r}" fill="#000" opacity=".15"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c.id("rice")}"/>`;
        for (const [px, py, k] of scatter(R, 70, x, y, r - 3)) o += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(2 + k * 1.6)}" ry="${f(1.4 + k)}" transform="rotate(${f(k * 180)} ${f(px)} ${f(py)})" fill="${
          k > 0.5 ? "#fffaf0" : "#e3cfa6"
        }" opacity=".9"/>`;
        return o + `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#d8c094" stroke-width="2"/>`;
      };
      s += cake(120, 118, 46) + cake(84, 86, 48);
      for (const [x, y] of [[84, 72], [70, 94], [96, 98]]) s += bananaSlice(c, x, y, 10);
      s += blueberry(c, 100, 76, 6) + blueberry(c, 76, 110, 6);
      return s;
    },

    empty(c) {
      let s = plate(c, "white");
      s += `<g opacity=".8"><path d="M58 60v34a6 6 0 0 0 12 0V60M64 60v84" stroke="#b6ada2" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M136 60c-8 6 -10 26 0 36v48" stroke="#b6ada2" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
      s += `<path d="M84 118q16 -12 32 0" stroke="#cfc6b9" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="88" cy="96" r="3" fill="#cfc6b9"/><circle cx="112" cy="96" r="3" fill="#cfc6b9"/>`;
      return s;
    },

    /* ---- learn ---- */
    learnAllergy(c) {
      const R = rng(141);
      let s = plate(c, "white");
      s += egg(c, 72, 70, 17, 22, -30, true);
      s += peanutShell(c, 130, 68, 1.2, 35);
      s += glass(c, 128, 128, 22);
      s += wheatEar(58, 98, 60, -10);
      for (const [x, y] of [[86, 132], [98, 118], [104, 140]]) s += `<circle cx="${x + 1}" cy="${y + 2}" r="8" fill="#000" opacity=".1"/><circle cx="${x}" cy="${y}" r="8" fill="#b67a43"/><path d="M${x - 7} ${y - 2}q7 -9 14 0" fill="#7a4a24"/><circle cx="${
        x - 3
      }" cy="${y + 1}" r="2" fill="#fff" opacity=".3"/>`;
      return s;
    },

    learnIntolerance(c) {
      let s = plate(c, "white");
      s += glass(c, 74, 92, 34);
      s += `<g transform="rotate(18 132 112)"><path d="M108 132L132 82L158 132Z" fill="#000" opacity=".1" transform="translate(3 4)"/><path d="M108 132L132 82L158 132Z" fill="#f6d77a" stroke="#e1b84a" stroke-width="1.5" stroke-linejoin="round"/><circle cx="128" cy="118" r="5" fill="#e8c35c"/><circle cx="140" cy="108" r="3.5" fill="#e8c35c"/><circle cx="136" cy="124" r="2.6" fill="#e8c35c"/></g>`;
      s += `<path d="M60 150q10 -8 20 0t20 0t20 0" stroke="#d98667" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      return s;
    },

    learnGluten(c) {
      let s = plate(c, "white");
      for (const a of [-30, -15, 0, 15, 30]) s += `<g transform="rotate(${a} 100 168)">${wheatEar(100, 30, 138, 0)}</g>`;
      s += `<path d="M86 136q14 8 28 0" stroke="#b9853f" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      return s;
    },

    learnMilk(c) {
      const R = rng(161);
      let s = plate(c, "white") + divider();
      s += glass(c, 64, 100, 28);
      s += glass(c, 136, 100, 28, "oatMilk");
      for (const [x, y] of scatter(R, 9, 136, 100, 44, 32)) s += oatFlake(x, y, 1.1, R() * 3, R);
      s += `<text x="64" y="152" text-anchor="middle" font-family="Mulish, sans-serif" font-size="11" font-weight="800" fill="#8a7d6e">LF</text><text x="136" y="152" text-anchor="middle" font-family="Mulish, sans-serif" font-size="11" font-weight="800" fill="#8a7d6e">DF</text>`;
      return s;
    },

    learnLabel(c) {
      let s = plate(c, "white");
      s += `<g transform="rotate(-8 96 100)"><rect x="54" y="44" width="84" height="110" rx="6" fill="#000" opacity=".1" transform="translate(3 5)"/><rect x="54" y="44" width="84" height="110" rx="6" fill="${c.id(
        "paperTone"
      )}" stroke="#e5dccb"/>
        <rect x="64" y="56" width="40" height="6" rx="3" fill="#8a7d6e"/>`;
      const rows = [[70, 58, 0], [80, 30, 1], [90, 62, 0], [100, 44, 1], [110, 60, 0], [120, 36, 0], [130, 52, 1]];
      for (const [y, w, bold] of rows)
        s += bold
          ? `<rect x="62" y="${y - 3}" width="${w + 8}" height="9" rx="2" fill="#f6dd7a" opacity=".85"/><rect x="66" y="${y}" width="${w}" height="4" rx="2" fill="#3a332c"/>`
          : `<rect x="66" y="${y}" width="${w}" height="3" rx="1.5" fill="#c9bfb1"/>`;
      s += `</g><circle cx="136" cy="126" r="24" fill="#000" opacity=".08" transform="translate(2 4)"/><circle cx="136" cy="126" r="22" fill="#eaf3f5" opacity=".55" stroke="#4a4038" stroke-width="5"/><path d="M152 142l18 18" stroke="#4a4038" stroke-width="8" stroke-linecap="round"/><path d="M124 116a14 14 0 0 1 10 -6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      return s;
    },

    learnCross(c) {
      const R = rng(171);
      let s = plate(c, "white");
      s += `<g transform="rotate(-14 100 100)"><rect x="40" y="58" width="120" height="84" rx="12" fill="#000" opacity=".1" transform="translate(3 5)"/><rect x="40" y="58" width="120" height="84" rx="12" fill="${c.id(
        "wood"
      )}"/><circle cx="146" cy="72" r="5" fill="#f3efe9"/>`;
      for (let i = 0; i < 5; i++) s += `<path d="M48 ${70 + i * 15}q50 ${R() * 6 - 3} 104 0" stroke="#a8743f" stroke-width=".8" fill="none" opacity=".35"/>`;
      for (const [x, y] of scatter(R, 16, 80, 104, 18)) s += `<path d="${blob(x, y, 1.6 + R() * 2.2, 0.3, 5, R)}" fill="#d9a466"/>`;
      s += `</g><g transform="rotate(32 120 104)"><rect x="96" y="98" width="62" height="12" rx="6" fill="#d7d3cd" stroke="#b6b0a8"/><rect x="150" y="96" width="40" height="16" rx="7" fill="#3f3a35"/><path d="${blob(
        114,
        104,
        [12, 5],
        0.2,
        8,
        R
      )}" fill="#b07a3e"/></g>`;
      return s;
    },

    /* ---- community swaps ---- */
    swapEgg(c) {
      const R = rng(181);
      let s = plate(c, "white") + divider();
      s += egg(c, 56, 86, 15, 20, -20) + egg(c, 70, 122, 15, 20, 25, true);
      s += smallBowl(c, 140, 104, 30, "");
      for (const [x, y] of scatter(R, 60, 140, 104, 20)) s += seed(x, y, 4.2, R() * 180, R() > 0.5 ? "#8a5a32" : "#a8774a");
      return s + arrowCurve(70, 46, 132, 54, 22);
    },
    swapButter(c) {
      const R = rng(191);
      let s = plate(c, "white") + divider();
      s += butterBlock(c, 60, 104, 40, 30, -10);
      s += smallBowl(c, 140, 104, 30, `<circle cx="140" cy="104" r="21" fill="#e9c75e" opacity=".9"/><circle cx="133" cy="97" r="6" fill="#fff" opacity=".45"/>`);
      s += `<ellipse cx="146" cy="150" rx="8" ry="6" fill="#4f6b2a"/><ellipse cx="144" cy="148" rx="2.5" ry="1.6" fill="#fff" opacity=".4"/>`;
      return s + arrowCurve(70, 46, 132, 54, 22);
    },
    swapMilk(c) {
      const R = rng(201);
      let s = plate(c, "white") + divider();
      s += glass(c, 60, 104, 28) + glass(c, 140, 104, 28, "oatMilk");
      for (const [x, y] of scatter(R, 8, 140, 104, 44, 32)) s += oatFlake(x, y, 1.1, R() * 3, R);
      return s + arrowCurve(70, 46, 132, 54, 22);
    },
    swapFlour(c) {
      const R = rng(211);
      let s = plate(c, "white") + divider();
      s += flourPile(c, 60, 104, 28, R) + wheatEar(40, 132, 34, -60);
      s += flourPile(c, 140, 104, 28, R);
      for (const [x, y] of scatter(R, 14, 140, 104, 42, 32)) s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.5" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})" fill="#fbf5e6" stroke="#ddd0b4" stroke-width=".5"/>`;
      return s + arrowCurve(70, 46, 132, 54, 22);
    },
    swapPeanut(c) {
      const R = rng(221);
      let s = plate(c, "white") + divider();
      s += peanutShell(c, 52, 96, 0.9, -30) + peanutShell(c, 72, 124, 0.85, 40) + peanutShell(c, 64, 76, 0.75, 70);
      for (const [x, y] of scatter(R, 26, 140, 106, 26)) s += seed(x, y, 9, R() * 180, "#4b4640", "#d9d3c7");
      return s + arrowCurve(70, 46, 132, 54, 22);
    },
  };

  EF.artKeys = Object.keys(ART);
  EF.art = function (key, extraClass = "") {
    const c = ctx();
    const draw = ART[key] || ART.pancakes;
    const body = draw(c);
    return `<svg class="art ${extraClass}" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><defs>${c.defs()}</defs>${body}</svg>`;
  };
})();
