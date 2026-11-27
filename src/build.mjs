// Builds the datasheet CV: one static page per lens, plus resume.json and llms.txt.
// Zero dependencies. Run from anywhere:  node src/build.mjs
//
// Output (committed, served as-is by GitHub Pages):
//   index.html            MSM-G  general
//   embedded/index.html   MSM-E  embedded systems
//   software/index.html   MSM-S  software
//   hardware/index.html   MSM-H  hardware & robotics
//   resume.json           JSON Resume (general lens)
//   llms.txt              plain-text summary for AI screening tools

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { site, person, lenses, lensOrder, skills, projects, recognition, education } from "./data.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ── helpers ─────────────────────────────────────────────────── */
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const attr = esc;
const byId = new Map(projects.map((p) => [p.id, p]));
const rankOf = (p) => projects.indexOf(p);
const LENS_KEY = { embedded: "e", software: "s", hardware: "h" };
const scoreFor = (p, lens) => (lens === "general" ? Math.max(p.score.e, p.score.s, p.score.h) : p.score[LENS_KEY[lens]]);
const DOMAIN_LABEL = { embedded: "Embedded", hardware: "Hardware", software: "Software", ai: "AI" };
const TYPE_LABEL = { FW: "Firmware", HW: "Hardware", SW: "Software", AI: "AI" };
const ext = (href) => (/^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "");

function orderedProjects(lens) {
  const featured = lenses[lens].featured.map((id) => byId.get(id));
  const rest = projects
    .filter((p) => !featured.includes(p))
    .sort((a, b) => scoreFor(b, lens) - scoreFor(a, lens) || rankOf(a) - rankOf(b));
  return { featured, all: [...featured, ...rest] };
}

// Pins: the 16 skills that carry the most weight for this lens.
function pinsFor(lens) {
  const weight = new Map();
  for (const p of projects) {
    const w = scoreFor(p, lens);
    if (!w) continue;
    for (const s of p.skills) weight.set(s, (weight.get(s) || 0) + w * w);
  }
  const keys = Object.keys(skills);
  const ranked = [...weight.entries()]
    .sort((a, b) => b[1] - a[1] || keys.indexOf(a[0]) - keys.indexOf(b[0]))
    .map(([key]) => key);
  // A DIP package always has 16 pins: top up with the most-used remaining skills.
  const filler = keys
    .filter((k) => !ranked.includes(k))
    .sort((a, b) => projectsUsing(b).length - projectsUsing(a).length || keys.indexOf(a) - keys.indexOf(b));
  return [...ranked, ...filler].slice(0, 16);
}
const projectsUsing = (skill) => projects.filter((p) => p.skills.includes(skill));

const counts = (() => {
  const c = { embedded: 0, hardware: 0, software: 0, ai: 0 };
  for (const p of projects) for (const d of p.domain) c[d]++;
  return c;
})();
const liveCount = projects.filter((p) => /live|released/i.test(p.status)).length;

/* ── fragments ───────────────────────────────────────────────── */
const fit = (n) =>
  `<span class="fit" role="img" aria-label="Relevance ${n} of 3">${[1, 2, 3].map((i) => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}</span>`;

function chip(lens, pins) {
  const L = lenses[lens];
  const pin = (key, n) => {
    const s = skills[key];
    const used = projectsUsing(key).length;
    return `<li><button class="pin" type="button" data-skill="${key}" data-type="${s.type}" aria-pressed="false" aria-describedby="trace" style="--n:${n}"><span class="pin__lead" aria-hidden="true"></span><span class="pin__no">${n}</span><span class="pin__name">${esc(s.name)}</span><span class="pin__count" aria-label="${used} projects">×${used}</span></button></li>`;
  };
  const left = pins.slice(0, 8).map((k, i) => pin(k, i + 1)).join("");
  const right = pins.slice(8).map((k, i) => pin(k, i + 9)).join("");
  return `<figure class="chip" aria-labelledby="chip-cap">
          <div class="chip__pkg">
            <ol class="chip__side chip__side--l">${left}</ol>
            <div class="chip__body" aria-hidden="true">
              <span class="chip__notch"></span>
              <span class="chip__dot"></span>
              <span class="chip__brand">SIMAL</span>
              <span class="chip__part">${L.part}</span>
              <span class="chip__rev">REV ${site.revision.slice(2)} · KL · IN</span>
            </div>
            <ol class="chip__side chip__side--r">${right}</ol>
          </div>
          <figcaption id="chip-cap"><span class="figno">Figure 1</span> Pin configuration, top view. Each pin is a skill; select one to trace the projects that use it.</figcaption>
          <p class="trace" id="trace" aria-live="polite"><span class="trace__idle">16 pins · ${projects.length} projects · select a pin</span></p>
        </figure>`;
}

function flow(steps) {
  if (!steps) return "";
  return `<ol class="flow" aria-label="Functional block diagram">${steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`;
}

function featuredCard(p, i, lens) {
  return `<article class="app" id="app-${p.id}" data-skills="${p.skills.join(" ")}">
          <header class="app__head">
            <span class="app__id">${p.id}</span>
            <span class="app__status">${esc(p.status)}</span>
            ${fit(scoreFor(p, lens))}
          </header>
          <h3 class="app__title">${esc(p.title)}</h3>
          <p class="app__sub">${esc(p.sub)}</p>
          <p class="app__desc">${esc(p.desc)}</p>
          ${p.flow ? `<figure class="app__fig">${flow(p.flow)}<figcaption><span class="figno">Figure ${i + 2}</span> ${esc(p.title.split(" — ")[0])} functional block diagram</figcaption></figure>` : ""}
          <footer class="app__foot">
            <ul class="stack">${p.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
            ${p.link ? `<a class="app__link" href="${attr(p.link.href)}"${ext(p.link.href)}>${esc(p.link.label)} <span aria-hidden="true">↗</span></a>` : ""}
          </footer>
        </article>`;
}

function indexRow(p, lens, featuredSet) {
  const cls = [featuredSet.has(p.id) && "is-featured", scoreFor(p, lens) === 0 && "is-extra"].filter(Boolean).join(" ");
  return `<tr id="${p.id}" data-skills="${p.skills.join(" ")}" data-domain="${p.domain.join(" ")}"${cls ? ` class="${cls}"` : ""}>
              <td class="c-id">${p.id}</td>
              <th scope="row" class="c-name"><span class="c-title">${p.link ? `<a href="${attr(p.link.href)}"${ext(p.link.href)}>${esc(p.title)} <span aria-hidden="true">↗</span></a>` : esc(p.title)}</span><span class="c-sub">${esc(p.sub)}</span><span class="c-desc">${esc(p.desc)}</span></th>
              <td class="c-dom">${p.domain.map((d) => DOMAIN_LABEL[d]).join(" · ")}</td>
              <td class="c-stack">${p.stack.map(esc).join(" · ")}</td>
              <td class="c-status">${esc(p.status)}</td>
              <td class="c-fit">${fit(scoreFor(p, lens))}</td>
            </tr>`;
}

function sectionHead(n, title, id, part, extra = "") {
  return `<header class="sec__head">
        <h2 id="${id}"><span class="sec__no">${n}</span>${esc(title)}</h2>
        <span class="sec__run" aria-hidden="true">${part} · Rev ${site.revision}</span>
        ${extra}
      </header>`;
}

/* ── page ────────────────────────────────────────────────────── */
function page(lens) {
  const L = lenses[lens];
  const base = L.path ? "../" : "";
  const url = site.url + L.path;
  const { featured, all } = orderedProjects(lens);
  const featuredSet = new Set(featured.map((p) => p.id));
  const pins = pinsFor(lens);
  const otherSkills = Object.keys(skills).filter((k) => !pins.includes(k));

  const variantNav = lensOrder
    .map((k) => {
      const V = lenses[k];
      const cur = k === lens ? ' aria-current="page"' : "";
      return `<a href="${base}${V.path}" data-lens-link="${k}"${cur}><span class="vn__part">${V.part.slice(-1)}</span><span class="vn__label">${V.label}</span></a>`;
    })
    .join("");

  const specs = [
    ["Projects built", String(projects.length), `Embedded ${counts.embedded} · Hardware ${counts.hardware} · Software ${counts.software} · AI ${counts.ai}`],
    ["State-level recognitions", "4", "Including a win at the Young Innovators Programme"],
    ["Live or released builds", String(liveCount), "Usable today, linked below"],
    ...L.specs,
    ["Class 12, Science", "95%", "Higher Secondary"],
    ["Education", "B.Tech CSBS", "Model Engineering College · in progress"],
    ["Location", "Kerala, India", `IST, UTC+05:30 · <span class="clock" data-clock>--:--</span> now`],
    ["Status", esc(person.status), "Internships, projects and collaborations"]
  ];

  const ld = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    url: site.url,
    image: site.url + site.image,
    email: "mailto:" + person.email,
    address: { "@type": "PostalAddress", addressLocality: "Tirur", addressRegion: "Kerala", addressCountry: "IN" },
    alumniOf: { "@type": "CollegeOrUniversity", name: person.school },
    knowsAbout: pins.map((k) => skills[k].name),
    sameAs: person.links.filter((l) => l.label !== "WhatsApp").map((l) => l.href)
  };

  return `<!DOCTYPE html>
<html lang="en" data-lens="${lens}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(L.title)}</title>
  <meta name="description" content="${attr(L.description)}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#FAFAF8" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0D0E0F" media="(prefers-color-scheme: dark)">
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${attr(L.title)}">
  <meta property="og:description" content="${attr(L.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${site.url}assets/og/${lens}.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${attr(`${L.part} · ${person.name} · ${L.headline.join(" ")}`)}">
  <meta name="twitter:card" content="summary_large_image">
  ${lensOrder.map((k) => `<link rel="alternate" href="${site.url + lenses[k].path}" title="${attr(lenses[k].title)}">`).join("\n  ")}
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='7' y='4' width='18' height='24' rx='2' fill='%23111'/%3E%3Cpath d='M3 9h4M3 14h4M3 19h4M3 24h4M25 9h4M25 14h4M25 19h4M25 24h4' stroke='%23111' stroke-width='2'/%3E%3Ccircle cx='11' cy='8' r='1.6' fill='%23FF4D00'/%3E%3C/svg%3E">
  <script>
    (function () {
      var d = document.documentElement, q = new URLSearchParams(location.search);${
        lens === "general"
          ? `
      // ?for=embedded|software|hardware → the matching variant (keeps ?to=)
      var f = (q.get("for") || "").toLowerCase(), map = { embedded: "embedded/", software: "software/", hardware: "hardware/", emb: "embedded/", sw: "software/", hw: "hardware/" };
      if (map[f]) { q.delete("for"); var s = q.toString(); location.replace(map[f] + (s ? "?" + s : "") + location.hash); return; }`
          : ""
      }
      try { var t = localStorage.getItem("ds-theme"); if (t) d.dataset.theme = t; } catch (e) {}
      d.classList.add("js");
    })();
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${base}assets/datasheet.css">
  <style>@page { @bottom-left { content: "${esc(person.name)} · ${L.part} · ${esc(L.variant)}"; font: 8pt "IBM Plex Mono", monospace; color: #6B6E72; } }</style>
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="bar">
  <a class="bar__brand" href="${base}${L.path}#top" aria-label="${attr(person.name)}, ${L.part}, back to top">
    <svg class="bar__glyph" viewBox="0 0 22 26" aria-hidden="true"><path d="M1 6h4M1 11h4M1 16h4M1 21h4M17 6h4M17 11h4M17 16h4M17 21h4" stroke="currentColor" stroke-width="1.8"/><rect x="5" y="1" width="12" height="24" rx="1.5" fill="currentColor"/><circle cx="8.6" cy="4.8" r="1.5" fill="var(--accent)"/></svg>
    <span class="bar__part">${L.part}</span>
    <span class="bar__name">${esc(person.name)}</span>
  </a>
  <nav class="vn" aria-label="CV variant">
    <span class="vn__title" aria-hidden="true">Variant</span>
    ${variantNav}
  </nav>
  <div class="bar__actions">
    <button class="icon-btn" type="button" data-theme-toggle aria-label="Toggle dark mode" title="Toggle dark mode"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor"/></svg></button>
    <button class="btn btn--ghost btn--sm" type="button" data-print>PDF</button>
    <a class="btn btn--sm" href="#contact">Contact</a>
  </div>
</header>

<main id="main">
  <div class="sheet">

    <!-- document strip -->
    <div class="strip" id="top" data-url="${url.replace(/^https:\/\//, "")}">
      <span class="strip__part">${L.part}</span>
      <span class="strip__variant">${esc(L.variant)}</span>
      <span class="strip__to" data-to hidden>Prepared for <b data-to-name></b></span>
      <span class="strip__rev">Datasheet · Rev ${site.revision}</span>
    </div>

    <!-- title block -->
    <section class="title" aria-labelledby="name">
      <div class="title__text">
        <p class="eyebrow">B.Tech CSBS · ${esc(person.school.split(",")[0])} · Kerala</p>
        <h1 id="name" class="name">${esc(person.name)}</h1>
        <p class="headline">${L.headline.map((l) => `<span>${esc(l)}</span>`).join(" ")}</p>
        <p class="summary">${esc(L.summary)}</p>
        <div class="cta">
          <a class="btn btn--primary" href="mailto:${person.email}">Email me</a>
          <a class="btn" href="${person.links[0].href}"${ext(person.links[0].href)}>GitHub <span aria-hidden="true">↗</span></a>
          <button class="btn btn--ghost" type="button" data-print>Download PDF</button>
        </div>

        <div class="features">
          <h2 class="minihead"><span class="sec__no">1</span>Features</h2>
          <ul>${L.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        </div>
      </div>

      <div class="title__fig">
        ${chip(lens, pins)}
      </div>
    </section>

    <!-- 2 key specs -->
    <section class="sec" aria-labelledby="specs">
      ${sectionHead(2, "Key specifications", "specs", L.part)}
      <table class="spec">
        <thead><tr><th scope="col">Parameter</th><th scope="col">Value</th><th scope="col">Conditions / notes</th></tr></thead>
        <tbody>
          ${specs.map(([a, b, c]) => `<tr><th scope="row">${esc(a)}</th><td class="spec__v">${b}</td><td>${c}</td></tr>`).join("\n          ")}
        </tbody>
      </table>
    </section>

    <!-- 3 typical applications -->
    <section class="sec" aria-labelledby="apps">
      ${sectionHead(3, "Typical applications", "apps", L.part, `<p class="sec__sub">The six builds that best fit this variant, with how each one works.</p>`)}
      <div class="apps">
        ${featured.map((p, i) => featuredCard(p, i, lens)).join("\n        ")}
      </div>
    </section>

    <!-- 4 index -->
    <section class="sec" aria-labelledby="index">
      ${sectionHead(4, "Application index", "index", L.part, `<p class="sec__sub">All ${projects.length} projects, most relevant to this variant first. Select a row to read more.</p>`)}
      <div class="filters" role="group" aria-label="Filter projects by domain">
        <button type="button" class="filter" data-filter="all" aria-pressed="true">All <small>${projects.length}</small></button>
        ${["embedded", "hardware", "software", "ai"].map((d) => `<button type="button" class="filter" data-filter="${d}" aria-pressed="false">${DOMAIN_LABEL[d]} <small>${counts[d]}</small></button>`).join("\n        ")}
        <p class="filters__note" data-pin-note hidden></p>
      </div>
      <div class="table-wrap">
        <table class="idx">
          <thead><tr><th scope="col">ID</th><th scope="col">Project</th><th scope="col">Domain</th><th scope="col">Stack</th><th scope="col">Status</th><th scope="col"><abbr title="Relevance to this variant">Fit</abbr></th></tr></thead>
          <tbody>
            ${all.map((p) => indexRow(p, lens, featuredSet)).join("\n            ")}${
              all.some((p) => scoreFor(p, lens) === 0)
                ? `
            <tr class="idx__more" data-more hidden><td colspan="6"><button type="button" class="more-btn" aria-expanded="false">Show ${all.filter((p) => scoreFor(p, lens) === 0).length} more, outside this variant's focus</button></td></tr>`
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- 5 pin descriptions -->
    <section class="sec" aria-labelledby="pins">
      ${sectionHead(5, "Pin descriptions", "pins", L.part, `<p class="sec__sub">Skills, each backed by the projects that use it. No self-rated bars.</p>`)}
      <table class="pintab">
        <thead><tr><th scope="col">Pin</th><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Description</th><th scope="col">Used in</th></tr></thead>
        <tbody>
          ${pins
            .map((k, i) => {
              const s = skills[k];
              const used = projectsUsing(k);
              return `<tr data-skill-row="${k}"><td class="c-id">${i + 1}</td><th scope="row">${esc(s.name)}</th><td><span class="type type--${s.type}">${TYPE_LABEL[s.type]}</span></td><td>${esc(s.desc)}</td><td class="refs">${used.map((p) => `<a href="#${p.id}">${p.id}</a>`).join(" ")}</td></tr>`;
            })
            .join("\n          ")}
        </tbody>
      </table>
      <p class="also"><span>Also:</span> ${otherSkills.map((k) => esc(skills[k].name)).join(" · ")}</p>
    </section>

    <!-- 6 recognition -->
    <section class="sec" aria-labelledby="recognition">
      ${sectionHead(6, "Recognition", "recognition", L.part)}
      <table class="rev">
        <thead><tr><th scope="col">Level</th><th scope="col">Programme</th><th scope="col">Notes</th><th scope="col">Ref.</th></tr></thead>
        <tbody>
          ${recognition
            .map((r) => `<tr><td class="rev__lvl">${esc(r.level)}</td><th scope="row">${esc(r.title)}<span>${esc(r.org)}</span></th><td>${esc(r.note)}</td><td class="refs">${r.refs.map((id) => `<a href="#${id}">${id}</a>`).join(" ") || "—"}</td></tr>`)
            .join("\n          ")}
        </tbody>
      </table>
    </section>

    <!-- 7 about -->
    <section class="sec" aria-labelledby="about">
      ${sectionHead(7, "Application notes", "about", L.part)}
      <div class="about">
        <figure class="about__photo">
          <img src="${base}me.jpg" alt="${attr(person.name)}, smiling outdoors by the sea" width="1444" height="1444" loading="lazy" decoding="async">
          <figcaption><span class="figno">Figure 8</span> ${esc(person.name)}, ${esc(person.location.split(",").slice(0, 2).join(","))}</figcaption>
        </figure>
        <div class="about__text">
          ${person.bio.map((b) => `<p>${esc(b)}</p>`).join("\n          ")}
          <blockquote class="quote"><p>“${esc(person.philosophy)}”</p></blockquote>
          <h3 class="minihead no-print">Method</h3>
          <ol class="method no-print">${person.approach.map((a, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span>${esc(a)}</li>`).join("")}</ol>
          <h3 class="minihead">Education</h3>
          <table class="edu">
            <tbody>
              ${education.map((e) => `<tr><td class="edu__when">${esc(e.when)}</td><th scope="row">${esc(e.title)}<span>${esc(e.where)}</span></th><td class="edu__grade">${esc(e.grade)}</td></tr>`).join("\n              ")}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- 8 ordering information -->
    <section class="sec sec--order" aria-labelledby="ordering">
      ${sectionHead(8, "Ordering information", "ordering", L.part, `<p class="sec__sub">Every variant describes the same person. Only the order and emphasis change.</p>`)}
      <table class="order">
        <thead><tr><th scope="col">Part number</th><th scope="col">Variant</th><th scope="col">Best for</th><th scope="col">Link</th></tr></thead>
        <tbody>
          ${lensOrder
            .map((k) => {
              const V = lenses[k];
              const href = site.url + V.path;
              const cur = k === lens;
              return `<tr${cur ? ' class="is-current"' : ""}><th scope="row"><a href="${base}${V.path}" data-lens-link="${k}">${V.part}</a>${cur ? '<span class="this">this document</span>' : ""}</th><td>${esc(V.variant)}</td><td>${esc(V.bestFor)}</td><td><div class="order__url"><code>${esc(href.replace(/^https:\/\//, ""))}</code><button class="copy" type="button" data-copy="${attr(href)}" aria-label="Copy link to ${V.part}">Copy</button></div></td></tr>`;
            })
            .join("\n          ")}
        </tbody>
      </table>
    </section>

    <!-- 9 contact -->
    <section class="sec contact" id="contact" aria-labelledby="contact-h">
      ${sectionHead(9, "Contact", "contact-h", L.part)}
      <div class="contact__body">
        <p class="contact__lead">Have a role, a project or a question about electronics? Write to me.</p>
        <a class="contact__mail" href="mailto:${person.email}">${esc(person.email)}</a>
        <ul class="contact__links">
          ${person.links.map((l) => `<li><a href="${attr(l.href)}"${ext(l.href)}><span>${esc(l.label)}</span><span class="h">${esc(l.handle)}</span></a></li>`).join("\n          ")}
        </ul>
      </div>
    </section>

  </div>
</main>

<footer class="foot">
  <span>${L.part} · Datasheet rev. ${site.revision} · Hand-built in HTML, CSS and JS</span>
  <span>Other designs: <a href="${base}classic/">Classic</a> · <a href="${base}experiment/">Experiment</a></span>
  <span>© <span data-year>${new Date().getFullYear()}</span> ${esc(person.name)}</span>
</footer>

<div class="toast" role="status" aria-live="polite" data-toast></div>
<script src="${base}assets/datasheet.js" defer></script>
</body>
</html>
`;
}

/* ── JSON Resume ─────────────────────────────────────────────── */
function resumeJson() {
  return {
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: person.name,
      label: "Embedded, hardware and software builder",
      image: site.url + site.image,
      email: person.email,
      url: site.url,
      summary: lenses.general.summary,
      location: { city: "Tirur", region: "Kerala", countryCode: "IN" },
      profiles: person.links.filter((l) => l.label !== "WhatsApp").map((l) => ({ network: l.label, username: l.handle, url: l.href }))
    },
    education: [{ institution: person.school, area: "Computer Science and Business Systems", studyType: "B.Tech" }],
    awards: recognition.map((r) => ({ title: r.title, awarder: r.org, summary: `${r.level}. ${r.note}` })),
    skills: ["FW", "HW", "SW", "AI"].map((t) => ({
      name: TYPE_LABEL[t],
      keywords: Object.values(skills).filter((s) => s.type === t).map((s) => s.name)
    })),
    projects: projects.map((p) => ({
      name: p.title,
      description: p.desc,
      keywords: p.stack,
      ...(p.link ? { url: p.link.href } : {})
    })),
    meta: { canonical: site.url + "resume.json", version: site.revision }
  };
}

/* ── llms.txt ────────────────────────────────────────────────── */
function llmsTxt() {
  const lines = [
    `# ${person.name}`,
    "",
    `> ${lenses.general.summary}`,
    "",
    `Location: ${person.location}. Studying ${person.study} at ${person.school}. Contact: ${person.email}.`,
    "",
    "## Role-specific CVs",
    ...lensOrder.map((k) => `- [${lenses[k].part}: ${lenses[k].variant}](${site.url + lenses[k].path}): ${lenses[k].bestFor}`),
    `- [JSON Resume](${site.url}resume.json)`,
    "",
    "## Recognition",
    ...recognition.map((r) => `- ${r.title} (${r.level}): ${r.note}`),
    "",
    "## Projects",
    ...projects.map((p) => `- ${p.id} ${p.title}: ${p.desc} [${p.stack.join(", ")}]${p.link ? ` ${p.link.href}` : ""}`),
    ""
  ];
  return lines.join("\n");
}

/* ── write ───────────────────────────────────────────────────── */
const write = (rel, content) => {
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  console.log("  wrote", rel);
};

for (const id of lenses.general.featured.concat(...lensOrder.map((k) => lenses[k].featured))) {
  if (!byId.has(id)) throw new Error(`Featured project ${id} does not exist`);
}
for (const p of projects) for (const s of p.skills) if (!skills[s]) throw new Error(`${p.id} uses unknown skill "${s}"`);

for (const k of lensOrder) write(join(lenses[k].path, "index.html"), page(k));
write("resume.json", JSON.stringify(resumeJson(), null, 2) + "\n");
write("llms.txt", llmsTxt());
