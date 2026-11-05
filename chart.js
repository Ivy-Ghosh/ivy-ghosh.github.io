// The one live thing: Ivy's QCEW jobs chart, drawn on the notebook grid.
// Plain SVG, no chart library, so every line here can be explained.
// It re-draws at the container's real width (not a scaled viewBox), so the labels stay
// readable on a phone instead of shrinking.

(function () {
  const data = window.QCEW;
  const svg = document.getElementById("chart");
  const readout = document.getElementById("readout");
  const buttons = document.querySelectorAll(".marker");
  if (!svg || !data) return;

  const NS = "http://www.w3.org/2000/svg";
  const COLORS = { public: "#0E6E6A", private: "#8A3B6B" };
  const fmt = new Intl.NumberFormat("en-US");

  let mode = "both";          // "both" | "public" | "private"
  let selected = 6;           // index of 2020: open on the dip, the chart's most interesting year
  let drawn = false;          // has the pen-stroke moment happened yet?

  const total = (d) => d.public + d.private;

  // Which lines to show in each mode
  function seriesFor(m) {
    if (m === "public")  return ["public"];
    if (m === "private") return ["private"];
    return ["public", "private"];
  }

  // Round the axis to clean numbers (steps of 50k, 100k or 200k jobs)
  function niceRange(min, max) {
    const span = max - min;
    const step = span > 600000 ? 200000 : span > 250000 ? 100000 : 50000;
    const lo = Math.floor((min - span * 0.08) / step) * step;
    const hi = Math.ceil((max + span * 0.08) / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + 1; v += step) ticks.push(v);
    return { lo, hi, ticks };
  }

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function render(animate) {
    const width = Math.max(300, svg.parentElement.clientWidth);
    const height = Math.round(Math.min(380, Math.max(260, width * 0.5)));
    const m = { top: 16, right: 16, bottom: 36, left: width < 500 ? 48 : 64 };
    const w = width - m.left - m.right;
    const h = height - m.top - m.bottom;

    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.replaceChildren();

    const keys = seriesFor(mode);
    const values = data.flatMap((d) => keys.map((k) => d[k]));
    const { lo, hi, ticks } = niceRange(Math.min(...values), Math.max(...values));

    const x = (i) => m.left + (i / (data.length - 1)) * w;
    const y = (v) => m.top + (1 - (v - lo) / (hi - lo)) * h;

    // Horizontal grid lines + labels, in millions so they fit on a phone
    ticks.forEach((t) => {
      el("line", { class: "grid-line", x1: m.left, x2: m.left + w, y1: y(t), y2: y(t) }, svg);
      const label = el("text", { class: "axis-text", x: m.left - 8, y: y(t) + 4, "text-anchor": "end" }, svg);
      label.textContent = (t / 1e6).toFixed(t % 1e5 === 0 ? 1 : 2) + "M";
    });

    // Year labels: every year on wide screens, every other year on phones
    data.forEach((d, i) => {
      if (width < 560 && i % 2 === 1) return;
      const label = el("text", { class: "axis-text", x: x(i), y: height - 10, "text-anchor": "middle" }, svg);
      label.textContent = width < 560 ? "’" + String(d.year).slice(2) : d.year;
    });

    // The dashed line at the selected year
    el("line", { class: "cursor", x1: x(selected), x2: x(selected), y1: m.top, y2: m.top + h }, svg);

    // A pencil ring around the 2020 dip, matching the margin note
    keys.forEach((k) => {
      el("ellipse", { class: "dip-ring", cx: x(6), cy: y(data[6][k]), rx: 16, ry: 16 }, svg);
    });

    // The lines themselves. pathLength=1 lets the CSS pen animation work for any length.
    keys.forEach((k) => {
      const dPath = data.map((d, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(d[k]).toFixed(1)).join(" ");
      el("path", {
        class: "series" + (animate ? " drawing" : ""),
        d: dPath, stroke: COLORS[k], pathLength: 1,
      }, svg);
      el("circle", { class: "dot", cx: x(selected), cy: y(data[selected][k]), r: 6, fill: COLORS[k] }, svg);
    });

    // One tap target per year (full chart height, so it is easy to hit with a thumb)
    const band = w / (data.length - 1);
    data.forEach((d, i) => {
      const hit = el("rect", {
        class: "hit", x: x(i) - band / 2, y: m.top, width: band, height: h,
        tabindex: i === selected ? 0 : -1, role: "button",
        "aria-label": `Show ${d.year}`,
      }, svg);
      hit.addEventListener("click", () => select(i, true));
      hit.addEventListener("keydown", onKey);
    });

    writeReadout();
  }

  function writeReadout() {
    const d = data[selected];
    const prev = data[selected - 1];
    const t = total(d);
    const share = ((d.public / t) * 100).toFixed(1);
    let change = "";
    if (prev) {
      const pct = ((t / total(prev) - 1) * 100).toFixed(1);
      change = ` Total ${pct >= 0 ? "up" : "down"} ${Math.abs(pct)}% from ${prev.year}.`;
    }
    readout.innerHTML =
      `<strong>${d.year}:</strong> <strong>${fmt.format(d.public)}</strong> public and ` +
      `<strong>${fmt.format(d.private)}</strong> private jobs, ` +
      `<strong>${fmt.format(t)}</strong> in all. Public share ${share}%.${change}`;
  }

  function select(i, focus) {
    selected = Math.max(0, Math.min(data.length - 1, i));
    render(false);
    if (focus) svg.querySelectorAll(".hit")[selected].focus();
  }

  // Arrow keys step through the years, like scrubbing along the grid
  function onKey(e) {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); select(selected + 1, true); }
    if (e.key === "ArrowLeft"  || e.key === "ArrowDown") { e.preventDefault(); select(selected - 1, true); }
    if (e.key === "Home") { e.preventDefault(); select(0, true); }
    if (e.key === "End")  { e.preventDefault(); select(data.length - 1, true); }
  }

  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      buttons.forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      render(false);
    });
  });

  // Draw once with the pen stroke when the chart first comes into view.
  // The lines start "un-drawn" with the animation paused; seeing the chart un-pauses it.
  // Any later re-render (new year, new marker, resize) draws the lines instantly.
  const canAnimate = "IntersectionObserver" in window;
  render(canAnimate);
  if (canAnimate) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting) && !drawn) {
        drawn = true;
        svg.classList.add("in-view");
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(svg);
  } else {
    svg.classList.add("in-view");
  }

  // Re-measure on resize (debounced, so dragging the window doesn't thrash)
  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => render(false), 120); });
})();
