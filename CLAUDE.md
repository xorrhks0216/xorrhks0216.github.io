# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## Repository overview

This is a personal **GitHub Pages** site (`xorrhks0216.github.io`) served from the
custom domain in `CNAME` (`vibe-daddy.shop`). It is a portfolio hub that links to
seven self-contained static mini-projects. There is **no build system, no package
manager, and no test suite** — everything is plain HTML / CSS / vanilla JavaScript
that is served directly by GitHub Pages.

- `index.html` — landing page with a card grid that links to each `projectN/index.html`.
  Korean UI (`lang="ko"`). Loads Google Analytics (`G-SVSCECNZHT`). Responsive grid
  with explicit mobile / tablet / desktop breakpoints and `prefers-color-scheme` dark
  mode.
- `CNAME` — GitHub Pages custom domain (`vibe-daddy.shop`).
- `ads.txt` — Google AdSense authorization record. Leave as-is unless the user asks.
- `project1/` … `project7/` — independent mini-projects, each with its own
  `index.html` entry point.

No root-level `package.json`, `.gitignore`, `README.md`, or CI config exists. Do not
invent one unless the user explicitly asks.

## Project directory

Every project is its own sandbox — changes in one project should not touch files in
another unless the task is explicitly cross-cutting (e.g. "add a back-link to every
project", like commit `5c6019a`).

| Dir | Title (ko) | Description | Key files | Notable deps |
|---|---|---|---|---|
| `project1/` | 아이와 함께하는 부루마블 | Kid-friendly Blue-Marble / Monopoly variant where dice rolls are solved as addition problems. Includes a developer mode, special cards, desert-island turn logic, birthday-party fund, etc. | `index.html`, `script.js` (~1.8k lines), `styles.css` (~1.2k lines), `server.js`, `images/`, `images/special/`, `.vscode/launch.json` | Font Awesome (CDN) |
| `project2/` | 주식 조건 검색 시스템 | US/KR stock technical-condition screener. `script.js` exposes a single `StockConditionApp` class that manages conditions, a request queue, and a response cache. | `index.html` (inline CSS, ~1.1k lines), `script.js` (~1.4k lines) | Twelve Data API (key stubbed as `YOUR_API_KEY_HERE`), Font Awesome (CDN) |
| `project3/` | 횡스크롤 2D 플랫폼 게임 | Canvas-based side-scrolling platformer with random map generation, keyboard + touch controls, coins, and spikes. `game.js` defines a `Game` class. | `index.html`, `game.js`, `style.css` | — |
| `project4/` | 미로 탈출 게임 | Randomly generated maze with **both 2D canvas and 3D (Three.js) views**, monster AI with sight/pathfinding, horror mode, wall-texture selector, shovel/sword items, compass, mobile joystick. Largest project. `maze.js` defines a `MazeGame` class. | `index.html`, `maze.js` (~3.3k lines), `style.css`, `textures/{brick,vine,wood}.png` | Three.js r128 (CDN) |
| `project5/` | 픽셀 아트 변환기 | Single-file image-to-pixel-art converter. Drag-and-drop upload, pixel-size slider, download. Everything (HTML/CSS/JS) lives inside `index.html`. | `index.html` only | — |
| `project6/` | 전세계 시계 | Multi-city world clock with weather. Large embedded city list (`{ name, timezone, lat, lon }`). Single-file. | `index.html` only | — |
| `project7/` | 방탈출: 미스터리 룸 | **Godot HTML5 export** of an escape-room game. Treat every `index.*` file here as compiled output — do not hand-edit. Requires cross-origin isolation (threads) and ships `coi-serviceworker.js` to enable it on GitHub Pages. | `index.html`, `index.js`, `index.wasm` (~37 MB), `index.pck` (~10 MB), `coi-serviceworker.js`, `index.png`, `index.icon.png*`, `index.apple-touch-icon.png*`, `index.audio*.worklet.js` | Godot engine runtime |

## Conventions

- **Language / locale.** All user-facing copy (HTML, comments, commit messages) is
  Korean. Preserve that when editing; do not translate existing strings. New strings
  should follow the same style.
- **One project per folder.** A project is a self-contained static site rooted at
  `projectN/index.html`. Paths inside a project are relative to that folder.
- **Back link.** Every project except `project7` (Godot canvas) includes
  `<a href="../index.html" class="back-link">← 프로젝트 목록으로 돌아가기</a>`. Keep
  this present when editing a project's `index.html`.
- **Styling.** The root `index.html` defines its own CSS variable palette
  (`--primary-color`, `--secondary-color`, etc.) and uses `clamp()` for fluid type.
  Sub-projects each define their own variables — do not try to share a global
  stylesheet.
- **Responsive design.** Mobile / tablet / desktop breakpoints and a
  `prefers-reduced-motion` block exist in the root page. Match the same style
  (explicit media queries, not a framework) if you add new layout.
- **Vanilla JS only.** No bundler, no TypeScript, no JSX, no ES modules with
  `import`. Scripts are loaded via `<script src="...">`. Games are typically one
  top-level class instantiated on `DOMContentLoaded`.
- **External libraries come from a CDN** (`cdnjs.cloudflare.com`) via `<script>` /
  `<link>` — do not try to `npm install` anything.
- **No tests.** There is no unit or e2e test runner. Verification is manual in a
  browser.
- **Registering a new project.** Add a card inside `<div class="projects-grid">` in
  the root `index.html` following the existing `<a class="project-card">` pattern
  (image optional, `<h2>`, `<p>`, `<p class="date">YYYY.MM.DD</p>`). Match the date
  format used by surrounding cards. Projects are currently listed oldest → newest.

## Running locally

GitHub Pages serves the site as-is, so opening `index.html` directly in a browser
works for most projects. A couple of caveats:

- **`project1/server.js`** is a tiny Node `http` server bound to `localhost:8080`
  and has no dependencies. Run with `node project1/server.js` from the `project1/`
  directory. `.vscode/launch.json` ships a Chrome launch config that attaches to
  `http://localhost:8080`.
- **`project7/` (Godot) requires cross-origin isolation** — the WASM build uses
  threads. `coi-serviceworker.js` installs a service worker that adds the
  `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` headers on GitHub
  Pages. Opening `project7/index.html` from `file://` will not work; serve it over
  HTTP (e.g. `python3 -m http.server` from the repo root) or push to GitHub Pages.
- Any other static server (`python3 -m http.server`, `npx serve`, etc.) will work
  for browsing the rest of the site.

## Editing guidance

- **Read before you edit.** `project1/script.js` (~1.8k lines), `project2/script.js`
  (~1.4k lines), and especially `project4/maze.js` (~3.3k lines) are long single
  files with a lot of coupled state on one class. Grep or Read the relevant region
  before making a change — do not assume structure from the filename.
- **Do not hand-edit `project7/`.** The `.js`, `.wasm`, `.pck`, `.png`, and
  `.worklet.js` files are Godot export artifacts. If a change is requested, ask the
  user to re-export from the Godot source project instead. The one exception is
  `coi-serviceworker.js`, which is a vendored file and should not be changed lightly.
- **`project2` API key.** `this.apiKey = 'YOUR_API_KEY_HERE'` in
  `project2/script.js` is an intentional placeholder. Do not commit a real Twelve
  Data key. If the user wants real data, suggest reading the key from
  `localStorage` or a query param rather than hard-coding.
- **Dev mode flags.** `project1` has a "개발자 모드" checkbox that exposes dice
  overrides and a jump button — it is a gameplay feature, not dead code.
- **Keep edits minimal.** The code across projects is consistent with a
  quickly-iterated personal-site style. Do not refactor, rename, add type
  annotations, split files, or "tidy up" unrelated code while completing a task.

## Git workflow

- **Default branch:** `main`. GitHub Pages deploys automatically from it on push,
  so a push to `main` is effectively a production deploy — only push to `main`
  when the user asks.
- **Commit message style.** History uses a Korean prefix-tag convention:
  - `[projectN] <설명>` for changes scoped to one project (e.g.
    `[project4] 나침반 기능 추가 및 스타일 적용`).
  - `[전체] …` for cross-cutting changes that touch every project.
  - `[주제] …` (e.g. `[부루마블]`, `[주식검색]`) is also used — match whichever
    label the surrounding history is using for that project.
  - Short English subjects are acceptable for infra changes but Korean is the norm.
- **One commit per logical change.** Look at `git log --oneline` before committing
  to match granularity.
- **Never amend or force-push** unless the user explicitly asks.
- When the user asks for a new feature, develop on the feature branch they
  specified (session instructions override this file) and only merge to `main`
  on their signal.

## Things to ask before doing

- Touching `CNAME`, `ads.txt`, or the Google Analytics tag in root `index.html`
  (live-site / monetization impact).
- Regenerating or modifying any file under `project7/` other than
  `coi-serviceworker.js`.
- Pushing to `main` (triggers a live deploy).
- Introducing a build step, package manager, framework, or bundler — the current
  design is deliberately tool-free and that should be confirmed before changing.
