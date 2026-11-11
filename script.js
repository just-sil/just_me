// Page interactions. The 3D toys in the hero live in toys.js and load lazily below.

const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Shared with toys.js.
const state = { pointerX: 0, pointerY: 0, heroScroll: 0 };

window.__booted = true;

/* ── small things ─────────────────────────────────────────── */
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const clockEl = $("#clock");
if (clockEl) {
  const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const tick = () => (clockEl.textContent = fmt.format(new Date()));
  tick();
  setInterval(tick, 20000);
}

/* ── hero entrance ────────────────────────────────────────── */
$$("[data-hero]").forEach((el, i) => el.style.setProperty("--i", i));
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-loaded")));

/* ── reveal on scroll ─────────────────────────────────────── */
const revealEls = $$("[data-reveal]");
if ("IntersectionObserver" in window && !reducedMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      // stagger items that arrive together
      entries
        .filter((e) => e.isIntersecting)
        .forEach((e, i) => {
          e.target.style.setProperty("--d", `${Math.min(i, 5) * 70}ms`);
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
    },
    { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-in"));
}

/* ── nav: mark the section in view ────────────────────────── */
const navLinks = $$(".nav__links a");
const navTargets = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
const updateNav = () => {
  const mid = window.innerHeight * 0.4;
  let current = null;
  navTargets.forEach((sec) => {
    const r = sec.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) current = sec;
  });
  navLinks.forEach((a) => {
    if (current && a.getAttribute("href") === `#${current.id}`) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
};

/* ── quote: words light up as it crosses the screen ───────── */
const quote = $("#quote");
const trace = $(".trace");
let quoteWords = [];
if (quote && !reducedMotion) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) return frag.append(part);
          const span = document.createElement("span");
          span.className = "w";
          span.textContent = part;
          frag.append(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(quote);
  quoteWords = $$(".w", quote);
}
const updateQuote = () => {
  if (!quoteWords.length) return;
  const r = quote.getBoundingClientRect();
  const vh = window.innerHeight;
  if (r.bottom < 0 || r.top > vh) return;
  const p = clamp((vh * 0.92 - r.top) / (vh * 0.55));
  const n = quoteWords.length;
  quoteWords.forEach((w, i) => w.style.setProperty("--o", (0.14 + 0.86 * clamp(p * (n + 2) - i)).toFixed(3)));
  trace?.style.setProperty("--p", clamp(p * 1.3).toFixed(3));
};

/* ── scroll loop ──────────────────────────────────────────── */
const progressBar = $("#progress");
let scrollQueued = false;
const onScroll = () => {
  scrollQueued = false;
  const max = root.scrollHeight - root.clientHeight;
  if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? root.scrollTop / max : 0})`;
  state.heroScroll = window.scrollY;
  updateQuote();
  updateNav();
};
const queueScroll = () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(onScroll);
};
window.addEventListener("scroll", queueScroll, { passive: true });
window.addEventListener("resize", queueScroll);
onScroll();

/* ── pointer: tilt for cards ──────────────────────────────── */
if (finePointer && !reducedMotion) {
  window.addEventListener(
    "pointermove",
    (e) => {
      state.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      state.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  $$("[data-tilt]").forEach((el) => {
    const max = el.classList.contains("photo") ? 9 : 5;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.classList.add("is-tilting");
      el.style.setProperty("--ry", `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    });
    el.addEventListener("pointerleave", () => {
      el.classList.remove("is-tilting");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });
}

/* ── project filters ──────────────────────────────────────── */
const rows = $$("#index-list .row");
const filters = $$(".filter");
filters.forEach((btn) => {
  const key = btn.dataset.filter;
  const count = key === "all" ? rows.length : rows.filter((r) => r.dataset.cat.split(" ").includes(key)).length;
  const small = document.createElement("small");
  small.textContent = count;
  btn.append(" ", small);

  btn.addEventListener("click", () => {
    filters.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    rows.forEach((row) => {
      row.hidden = !(key === "all" || row.dataset.cat.split(" ").includes(key));
      row.classList.add("is-in");
    });
  });
});

/* ── CodeRoof card: a tiny typed terminal ─────────────────── */
const term = $("#term");
if (term && !reducedMotion && "IntersectionObserver" in window) {
  const script = [
    { type: "cmd", text: "git init" },
    { type: "out", text: "Initialized empty Git repository" },
    { type: "cmd", text: "python hello.py" },
    { type: "out", text: "Hello from the browser" },
    { type: "ok", text: "✓ exercise passed" }
  ];
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  let visible = false;
  let running = false;

  const run = async () => {
    running = true;
    while (visible) {
      term.textContent = "";
      const caret = document.createElement("span");
      caret.className = "caret";
      for (const line of script) {
        if (!visible) break;
        const row = document.createElement("div");
        term.append(row);
        if (line.type === "cmd") {
          const prompt = document.createElement("span");
          prompt.className = "p";
          prompt.textContent = "$ ";
          const text = document.createElement("span");
          row.append(prompt, text, caret);
          await wait(450);
          for (const ch of line.text) {
            text.textContent += ch;
            await wait(45 + Math.random() * 55);
          }
          await wait(320);
        } else {
          if (line.type === "ok") row.className = "ok";
          row.textContent = line.text;
          await wait(line.type === "ok" ? 200 : 380);
        }
      }
      caret.remove();
      await wait(3800);
    }
    running = false;
  };

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !running) run();
    },
    { threshold: 0.4 }
  ).observe(term);
}

/* ── 3D toys in the hero ─────────────────────────────────── */
if (root.classList.contains("has-3d")) {
  const start = () =>
    import("./toys.js")
      .then(({ initToys }) =>
        initToys({
          canvas: $("#toys"),
          hero: $("#top"),
          stage: $("#stage-hero"),
          state,
          reducedMotion
        })
      )
      .then(() => root.classList.add("scene-ready"))
      .catch((err) => {
        console.warn("3D toys unavailable:", err);
        root.classList.remove("has-3d", "scene-ready");
      });
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
