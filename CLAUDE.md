# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

Joel Schroyen's game design portfolio — a single-page static website with no build step, framework, or package manager.

## Development

Serve locally (required for YouTube embeds and correct asset paths):

```bash
python -m http.server 8080 --directory website
```

To visually test the site, use the Playwright MCP tool to navigate to `http://localhost:8080` and take screenshots — do not open in a regular browser tab.

To jump to a specific project during testing, use `browser_evaluate` to call the global `jumpTo` function rather than pressing ArrowDown repeatedly:
```js
jumpTo('prof', 'storyxr')   // professional tab, project id
jumpTo('pers', 'vigilance') // personal tab
```

If the browser caches an old `projects.js` or `main.js`, use `location.reload(true)` via `browser_evaluate` to force a hard reload.

Cache-busting is done manually via query strings on `<script>` and `<link>` tags in `index.html` (e.g. `?v=43`). Increment these when deploying changes.

## Architecture

Three files do all the work:

- **`website/projects.js`** — single `PROJECTS` object with two arrays: `professional` and `personal`. Each entry has `id`, `year`, `title`, `meta`, `blurb`, `thumb`, `youtube`, `highlight`, `rank`, `involvement`, `links[]`, and `tags[]`.
- **`website/main.js`** — all UI logic: DOM construction from `PROJECTS` data, tab switching (`prof`/`pers`), sort mode (`rank`/`date`), scroll/wheel/keyboard/touch navigation, YouTube embed lifecycle (autoplay on select, stop on deselect), and a custom scrollbar.
- **`website/style.css`** — CSS custom properties (`--bg`, `--accent`, etc.) for the dark theme. Layout is a fixed-height flex column; the `.list-area` clips vertically with `clip-path` and the list translates with `transform` to simulate scrolling. `.project.active` expands in-place; the thumbnail grows leftward with negative `margin-left`.

Key interaction patterns:
- One project is "active" at a time per tab; tracked via `currentIdx[tab]`.
- `activate()` is the central state update — translates the list, swaps `.active` class, starts/stops video.
- YouTube: `startVideo()` sets `iframe.src` to autoplay; after 800ms the thumbnail cross-fades out via CSS transitions. `stopVideo()` clears `src` immediately.
- Highlight projects (`highlight: true`) get amber styling and wider margins; `rank` controls default sort order.

## Content

- **`reference/content.md`** — source of truth for all project details, images available, and content gaps. Check here before editing `projects.js`.
- **`website/assets/images/`** — one subfolder per project. Thumbs are referenced directly in `projects.js` as relative paths from `website/`.

## Documentation

Additional docs and session notes are stored in the Obsidian vault at `C:\ObsidianVault_JoelHome\ObsidianVault_JoelHome\Business\Portfolio`. Check there for prior decisions, content plans, and project notes.
