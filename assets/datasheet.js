// Datasheet CV: progressive enhancement only. Every page is complete without it.
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);

  /* ── toast ─────────────────────────────────────────────── */
  const toastEl = $("[data-toast]");
  let toastTimer;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 1800);
  };

  /* ── "Prepared for <company>" via ?to= ─────────────────── */
  // Letters, numbers, spaces and a little punctuation; rendered as text only.
  const rawTo = (params.get("to") || "").normalize("NFKC");
  const to = rawTo.replace(/[^\p{L}\p{N} .,&'()+-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (to) {
    $$("[data-to]").forEach((el) => {
      const name = $("[data-to-name]", el);
      if (name) name.textContent = to;
      el.hidden = false;
    });
    document.title = `${document.title} · for ${to}`;
    // Keep the personalisation when switching variants.
    $$("[data-lens-link]").forEach((a) => {
      const url = new URL(a.href, location.href);
      url.searchParams.set("to", to);
      a.href = url.pathname + url.search;
    });
  }

  /* ── theme ─────────────────────────────────────────────── */
  const prefersDark = matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : prefersDark.matches);
  $$("[data-theme-toggle]").forEach((btn) => {
    const sync = () => btn.setAttribute("aria-pressed", String(isDark()));
    sync();
    btn.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("ds-theme", next); } catch (_) {}
      sync();
    });
  });

  /* ── print / PDF ───────────────────────────────────────── */
  $$("[data-print]").forEach((b) => b.addEventListener("click", () => window.print()));

  /* ── copy links ────────────────────────────────────────── */
  $$("[data-copy]").forEach((b) =>
    b.addEventListener("click", async () => {
      let text = b.dataset.copy;
      if (to) text += `?to=${encodeURIComponent(to)}`;
      try {
        await navigator.clipboard.writeText(text);
        toast("Link copied");
      } catch (_) {
        toast(text);
      }
    })
  );

  /* ── live clock (IST) ──────────────────────────────────── */
  const clocks = $$("[data-clock]");
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const tick = () => clocks.forEach((c) => (c.textContent = fmt.format(new Date())));
    tick();
    setInterval(tick, 15000);
  }
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ── index: expandable rows ────────────────────────────── */
  const rows = $$(".idx tbody tr[id]");
  const moreRow = $("[data-more]");
  const moreBtn = moreRow && $("button", moreRow);
  rows.forEach((tr) => {
    const id = $(".c-id", tr);
    const desc = $(".c-desc", tr);
    if (!id || !desc) return;
    desc.id = `${tr.id}-desc`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row-toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", desc.id);
    btn.setAttribute("aria-label", `Details for ${tr.id}`);
    btn.textContent = id.textContent;
    id.textContent = "";
    id.append(btn);
    const toggle = (open = !tr.classList.contains("is-open")) => {
      tr.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    };
    btn.addEventListener("click", () => toggle());
    tr.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      if (getSelection().toString()) return;
      toggle();
    });
  });

  /* ── index: which rows show ────────────────────────────── */
  // Rows outside this variant's focus start collapsed. A domain filter or a
  // traced pin shows every match, so nothing relevant is ever hidden.
  const filters = $$(".filter");
  const view = { filter: "all", expanded: false, pin: null };
  const applyRows = () => {
    const showExtras = view.expanded || view.filter !== "all" || !!view.pin;
    rows.forEach((tr) => {
      const inFilter = view.filter === "all" || tr.dataset.domain.split(" ").includes(view.filter);
      tr.hidden = !inFilter || (tr.classList.contains("is-extra") && !showExtras);
    });
    if (moreRow) {
      moreRow.hidden = view.filter !== "all" || !!view.pin;
      moreBtn.setAttribute("aria-expanded", String(view.expanded));
      moreBtn.textContent = view.expanded
        ? "Show fewer"
        : moreBtn.dataset.label || (moreBtn.dataset.label = moreBtn.textContent);
    }
  };
  const setFilter = (key) => {
    view.filter = key;
    filters.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === key)));
    applyRows();
  };
  filters.forEach((b) => b.addEventListener("click", () => setFilter(b.dataset.filter)));
  moreBtn?.addEventListener("click", () => {
    view.expanded = !view.expanded;
    applyRows();
  });

  // Jumping to #P-xx from a reference opens that row.
  const openFromHash = () => {
    const tr = location.hash && document.getElementById(location.hash.slice(1));
    if (!tr || !tr.matches(".idx tbody tr")) return;
    if (tr.hidden) {
      view.expanded = true;
      setFilter("all");
      tr.scrollIntoView();
    }
    tr.classList.add("is-open");
    $(".row-toggle", tr)?.setAttribute("aria-expanded", "true");
  };
  window.addEventListener("hashchange", openFromHash);
  applyRows();
  openFromHash();

  /* ── pin tracing: skill ↔ projects ─────────────────────── */
  const pins = $$(".pin");
  const trace = $("#trace");
  const traceIdle = trace ? trace.innerHTML : "";
  const apps = $$(".app");
  const skillRows = $$("[data-skill-row]");
  const pinNote = $("[data-pin-note]");
  let locked = null;

  const light = (skill) => {
    const has = (el) => (el.dataset.skills || "").split(" ").includes(skill);
    // Only a clicked (locked) pin reveals collapsed rows; hovering must not shift the layout.
    if (view.pin !== locked) {
      view.pin = locked;
      applyRows();
    }
    if (!skill) {
      delete root.dataset.pin;
      [...rows, ...apps, ...skillRows].forEach((el) => el.classList.remove("is-lit"));
      pins.forEach((p) => p.setAttribute("aria-pressed", "false"));
      if (trace) trace.innerHTML = traceIdle;
      if (pinNote) pinNote.hidden = true;
      return;
    }
    root.dataset.pin = skill;
    rows.forEach((el) => el.classList.toggle("is-lit", has(el)));
    apps.forEach((el) => el.classList.toggle("is-lit", has(el)));
    skillRows.forEach((el) => el.classList.toggle("is-lit", el.dataset.skillRow === skill));
    pins.forEach((p) => p.setAttribute("aria-pressed", String(p.dataset.skill === skill)));

    const pin = pins.find((p) => p.dataset.skill === skill);
    const name = $(".pin__name", pin).textContent;
    const no = $(".pin__no", pin).textContent;
    const hits = rows.filter(has);
    if (trace) {
      trace.textContent = "";
      const head = document.createElement("b");
      head.textContent = `Pin ${no} · ${name} → `;
      trace.append(head, `${hits.length} project${hits.length === 1 ? "" : "s"}: `);
      hits.forEach((tr, i) => {
        const a = document.createElement("a");
        a.href = `#${tr.id}`;
        a.textContent = tr.id;
        trace.append(i ? " " : "", a);
      });
      if (locked) {
        const clear = document.createElement("button");
        clear.type = "button";
        clear.className = "trace__clear";
        clear.textContent = "Clear";
        clear.addEventListener("click", () => { locked = null; light(null); });
        trace.append(clear);
      }
    }
    if (pinNote) {
      pinNote.hidden = !locked;
      pinNote.textContent = `Highlighting ${name}: ${hits.length} of ${rows.length}`;
    }
  };

  const hoverable = matchMedia("(hover: hover) and (pointer: fine)").matches;
  pins.forEach((pin) => {
    const skill = pin.dataset.skill;
    if (hoverable) {
      pin.addEventListener("pointerenter", () => { if (!locked) light(skill); });
      pin.addEventListener("pointerleave", () => { if (!locked) light(null); });
    }
    pin.addEventListener("click", () => {
      locked = locked === skill ? null : skill;
      light(locked);
    });
  });
  // Skill names in the pin table work as triggers too.
  skillRows.forEach((tr) => {
    const th = $("th", tr);
    if (!th) return;
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      locked = locked === tr.dataset.skillRow ? null : tr.dataset.skillRow;
      light(locked);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && locked) { locked = null; light(null); }
  });

  /* ── block diagrams: run the packet only while visible ─── */
  const flows = $$(".flow");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("is-live", e.isIntersecting)),
      { threshold: 0.6 }
    );
    flows.forEach((f, i) => {
      f.style.setProperty("--dur", `${3.2 + (i % 3) * 0.5}s`);
      io.observe(f);
    });
  } else {
    flows.forEach((f) => f.classList.add("is-live"));
  }
})();
