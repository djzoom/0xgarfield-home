# AGENTS.md — 0xgarfield.com

## What this is
Personal site of Garfield Wang (王众). Static HTML, built by `node scripts/build.mjs`
into `dist/`, deployed to Cloudflare by GitHub Actions on every push to `main`.

## Where things live
- Page templates: `src/pages/*.html` — EN and ZH are separate files and must stay in sync
  (index/index-zh, about/about-zh, recognition/recognition-zh). writing/writing-zh are redirects to the homepage; the Writing section was retired until there is published work.
- Editable copy: `config/content-en.json` and `config/content-zh.json` (same keys).
- Global links/versions: `config/site.json`. Bump `assets.cssVersion`/`scriptVersion`
  (YYYYMMDD-NN) when CSS/JS changes.
- Styles/scripts: `public/styles.css`, `public/script.js`.
- `/home/` is a legacy route; the build serves `index.html` there. There is no separate home.html.

## Hard rules
- Never edit `dist/`, `.github/`, `worker/`, or anything named *secret*.
- Never push to `main`. Work on a branch `agent/<topic>`, open a PR, stop.
- Every text change must be made in BOTH languages or explicitly flagged as EN-only/ZH-only.
- Run `node scripts/build.mjs` before committing; it must succeed. Check `dist/` for
  `/`, `/index-zh`, `/about`, `/recognition`, `/404`.
- Do not invent facts, dates, awards, quotes or press. If a fact is not in the
  "Facts" list below or already on the site, leave a `<!-- TODO: confirm -->` and ask.

## Facts (source of truth — use exactly these wordings)
- Emmy: "Judge, 47th News & Documentary Emmy® Awards — Documentary Categories (Sound),
  NATAS, 2026". ZH: 第 47 届美国新闻与纪录片艾美奖纪录片单元声音类评委（2026）.
  Never "International Emmy", never "Television Academy".
- Red Dot Award: Product Design 2016, product PILO, Soundario Inc.
- Broadcasting: China Radio International Hit FM (2006–2012); Phoenix U Radio,
  Hong Kong (2013–2014); Highlights Music Station (2020–2022).
- Products: PILO® (2015–), Run Baby Run® (2013–), Talktalk (2026–), AURORA (99 lessons, fully open source, MIT — never "open core" or "Lesson 1 free").
- Talktalk testimonial is from a Phoenix TV (Hong Kong) news anchor / 香港凤凰卫视新闻主播. Quote it verbatim: “It feels great — smooth and intuitive, never working against you. It keeps your attention entirely on what you're saying.”
- Talktalk was designed and built solo by Garfield (owner-stated). AURORA: Garfield designed and directed the curriculum; implementation was AI-assisted pair programming; repository dates from 2026.
- Aurora Quest is the course's own 8-bit companion game (in the AURORA repo, aurora-quest/); screenshots of it are real product images.
- China Good Design: Gold, 2015 (PILO in the China Good Design Yearbook 2015/2016).
- Wording: "sleep and relaxation audio" / 睡眠与放松音频 — never "sleep aid"/助眠.
- Do not mention: Vensa, Mensa, visa/immigration status, current city.

## Signal colour (--signal), the only allowed uses
The needle tip in the homepage opening; cursor notes; active-nav underline; axis dots; disc centre; primary-button and close-button hover rings; (the brand mark is now a plain circle in the portrait's backdrop colour #E1AB49, not signal). Never text, never fills.

## Homepage record crate (public/crate.css, public/crate.js)
- Work is shown as four record sleeves in this order: Run Baby Run, PILO, Talktalk, AURORA.
- Each sleeve uses its project's own colours (RBR neon on dark green, PILO navy logo on white, Talktalk CRT green, AURORA pixel cyan on navy). These are brand colours, not the site accent.
- Lower band artwork is public/images/band-*.svg (outlined type, no font loading). PILO uses its original logo paths.
- Record detail copy, facts, colours and UI strings live in the JSON block `#cr-data` inside index.html / index-zh.html. Edit EN and ZH together.
- The player plays a 32-second, loudness-normalised excerpt from each project's own library (public/audio/*-v1.mp3; RBR library, Kat Records, CHL). PILO's clip is from the CHL library (owner's choice) until the Yunmeng (云梦) recordings (mx01.mp3 etc.) are found. The zxzz*/dry*/BA* files in the EB1A folder are Zuoxiao Zuzhou recordings, not Yunmeng: never use them.
- /images/* is cached immutable for a year: when an image or band SVG changes, give it a new file name.
- Site type: Newsreader (EN) with Noto Serif SC (ZH); Geist Mono for metadata.

## Voice
Calm, specific, no exclamation marks, no marketing superlatives. Short sentences.
ZH copy is written natively, not translated word-for-word from EN.

## Done means
A PR with: what changed (EN/ZH), build output confirmed, screenshots or dist diff
for any layout change, and a list of anything you were unsure about.
