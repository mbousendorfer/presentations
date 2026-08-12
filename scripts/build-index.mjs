/**
 * Génère la page d'accueil du site à partir des dossiers de présentations.
 *
 * Convention : un dossier = une présentation, et il est pris en compte dès lors
 * qu'il contient un index.html. Un meta.json à côté permet d'en décrire le
 * titre, le sous-titre, la date et les tags ; sans lui, on retombe sur le
 * <title> du HTML puis sur le nom du dossier.
 *
 * Aucune dépendance : `node scripts/build-index.mjs` suffit.
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* dossiers qui ne sont pas des présentations */
const SKIP = new Set(['assets', 'scripts', 'node_modules', 'docs']);

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function collect() {
  const out = [];
  for (const entry of await readdir(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue;

    const dir = join(ROOT, entry.name);
    const html = join(dir, 'index.html');
    if (!(await exists(html))) continue;

    let meta = {};
    const metaPath = join(dir, 'meta.json');
    if (await exists(metaPath)) {
      try {
        meta = JSON.parse(await readFile(metaPath, 'utf8'));
      } catch (err) {
        console.warn(`meta.json illisible dans ${entry.name} : ${err.message}`);
      }
    }

    /* à défaut de meta.json, on récupère le <title> du deck */
    if (!meta.title) {
      const head = (await readFile(html, 'utf8')).slice(0, 8192);
      meta.title = head.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || entry.name;
    }

    /* nombre de slides : indicatif, utile pour se repérer dans la liste */
    const source = await readFile(html, 'utf8');
    const slides = (source.match(/<section class="slide/g) || []).length;

    out.push({ slug: entry.name, slides, ...meta });
  }

  /* les plus récentes d'abord ; sans date, on trie par nom */
  return out.sort((a, b) =>
    (b.date || '').localeCompare(a.date || '') || a.slug.localeCompare(b.slug));
}

function card(p) {
  const date = p.date
    ? new Date(p.date + 'T00:00:00Z').toLocaleDateString('fr-FR',
        { year: 'numeric', month: 'long', timeZone: 'UTC' })
    : '';
  const tags = (p.tags || []).map((t) => `<span>${esc(t)}</span>`).join('');
  return `      <a class="card" href="${esc(p.slug)}/" style="--accent:${esc(p.accent || '#FF6726')}">
        <div class="card-meta">${esc(date)}${date && p.slides ? ' · ' : ''}${p.slides ? p.slides + ' slides' : ''}</div>
        <h2>${esc(p.title)}</h2>
        ${p.subtitle ? `<p class="card-sub">${esc(p.subtitle)}</p>` : ''}
        ${p.description ? `<p class="card-desc">${esc(p.description)}</p>` : ''}
        ${tags ? `<div class="tags">${tags}</div>` : ''}
        <span class="go">Ouvrir la présentation →</span>
      </a>`;
}

const decks = await collect();

const page = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Présentations — Matthieu Bousendorfer</title>
<meta name="description" content="Les présentations, une par dossier.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
@font-face{font-family:'Averta Std';src:url('assets/fonts/AvertaStd-Regular.woff2') format('woff2');font-weight:400;font-display:swap}
@font-face{font-family:'Averta Std';src:url('assets/fonts/AvertaStd-Semibold.woff2') format('woff2');font-weight:600;font-display:swap}
@font-face{font-family:'Averta Std';src:url('assets/fonts/AvertaStd-Bold.woff2') format('woff2');font-weight:700;font-display:swap}
@font-face{font-family:'Averta Std';src:url('assets/fonts/AvertaStd-Extrabold.woff2') format('woff2');font-weight:800;font-display:swap}
@font-face{font-family:'Averta Std';src:url('assets/fonts/AvertaStd-Black.woff2') format('woff2');font-weight:900;font-display:swap}

:root{
  --ink:#101827; --ink-soft:#5E6E86; --ink-400:#8D9AAB;
  --rule:rgba(16,24,39,.12); --hair:rgba(16,24,39,.07);
  --bg:#fff; --accent:#FF6726;
  --disp:'Averta Std',system-ui,sans-serif;
  --mono:'Azeret Mono',ui-monospace,monospace;
}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font-family:var(--disp);-webkit-font-smoothing:antialiased}

.wrap{max-width:1180px;margin:0 auto;padding:0 32px}
header{border-bottom:3px solid var(--ink);padding:26px 0 20px;margin-bottom:70px}
.bar{display:flex;justify-content:space-between;align-items:baseline;gap:20px;
  font:500 13px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase}
.bar span:last-child{color:var(--ink-soft)}

.hero{margin-bottom:64px}
.hero .kicker{font:700 13px/1 var(--mono);letter-spacing:.22em;text-transform:uppercase;color:var(--accent)}
.hero h1{font-weight:900;font-size:clamp(44px,7vw,84px);line-height:1.02;letter-spacing:-.04em;margin-top:18px}
.hero p{font-size:clamp(18px,2.2vw,23px);line-height:1.5;color:var(--ink-soft);margin-top:20px;max-width:640px}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:26px;padding-bottom:90px}
.card{display:flex;flex-direction:column;border:2px solid var(--ink);padding:30px 32px 34px;
  text-decoration:none;color:inherit;position:relative;background:#fff;
  transition:transform .18s ease,box-shadow .18s ease}
.card::after{content:'';position:absolute;left:0;right:0;bottom:0;height:6px;background:var(--accent)}
.card:hover{transform:translateY(-4px);box-shadow:0 14px 0 -4px rgba(16,24,39,.1)}
.card-meta{font:700 11px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--ink-400)}
.card h2{font-weight:900;font-size:32px;line-height:1.06;letter-spacing:-.03em;margin-top:14px}
.card-sub{font-weight:700;font-size:17px;line-height:1.35;margin-top:10px}
.card-desc{font-size:16px;line-height:1.5;color:var(--ink-soft);margin-top:10px}
.tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:18px}
.tags span{font:500 11px/1 var(--mono);letter-spacing:.06em;color:var(--ink-soft);
  border:1px solid var(--rule);padding:6px 8px}
.go{margin-top:auto;padding-top:24px;font:700 12px/1 var(--mono);letter-spacing:.14em;
  text-transform:uppercase;color:var(--accent)}

.empty{border:2px dashed var(--rule);padding:40px;color:var(--ink-soft);font-size:17px;line-height:1.5}
footer{border-top:1px solid var(--rule);padding:26px 0 60px;
  font:500 12px/1.6 var(--mono);letter-spacing:.08em;color:var(--ink-400)}

@media (prefers-color-scheme:dark){
  :root{--bg:#0B1220;--ink:#EAF0FA;--ink-soft:#9AA8BC;--ink-400:#6C7C93;
        --rule:rgba(255,255,255,.16);--hair:rgba(255,255,255,.08)}
  .card{background:#0F1728;border-color:rgba(255,255,255,.22)}
  .card:hover{box-shadow:0 14px 0 -4px rgba(255,255,255,.08)}
  header{border-bottom-color:rgba(255,255,255,.32)}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="bar"><span>Matthieu Bousendorfer</span><span>Présentations</span></div>
  </header>

  <section class="hero">
    <div class="kicker">Archive</div>
    <h1>Présentations</h1>
    <p>Chaque présentation est une page autonome : flèches pour naviguer, <b>O</b> pour le plan, <b>F</b> pour le plein écran.</p>
  </section>

  <main class="grid">
${decks.length ? decks.map(card).join('\n') : '      <div class="empty">Aucune présentation pour l’instant. Ajoute un dossier contenant un <code>index.html</code> et il apparaîtra ici.</div>'}
  </main>

  <footer>Généré automatiquement à chaque push — ${decks.length} présentation${decks.length > 1 ? 's' : ''}.</footer>
</div>
</body>
</html>
`;

await writeFile(join(ROOT, 'index.html'), page);
console.log(`index.html généré — ${decks.length} présentation(s) :`);
for (const d of decks) console.log(`  · ${d.slug} — ${d.title} (${d.slides} slides)`);
