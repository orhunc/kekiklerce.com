# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is the static personal portfolio site for Orhun Mersin (a.k.a. kekik), deployed to **kekiklerce.com** via GitHub Pages (see `CNAME`). It is plain HTML/CSS/vanilla JS — there is no build step, no package manager, no bundler, and no test suite.

## Development workflow

- There are no install/build/lint/test commands — none exist in this repo.
- To preview, open `index.html` directly in a browser, or serve the directory with any static file server (e.g. `python -m http.server`) since some features (relative fetches, routing) behave more accurately over `http://` than `file://`.
- Deployment is just pushing to `main`; GitHub Pages serves the repo directly using the domain in `CNAME`.

## Architecture

**Single shared stylesheet, no framework.** Every page links the same root-level `styles.css` (`../styles.css` from one level down). Theme colors and shared tokens live in `:root` custom properties at the top of that file.

**Site structure — one page per top-level directory.** `index.html` (site root) is a single-page-style home containing `#home`, `#bio`, and `#cv` sections navigated via in-page anchors. Each content category has its own directory with its own `index.html`: `exhibitions/`, `theatre/`, `drag/`, `workshops/`, `publications/`, plus standalone `bio/` and `cv/` pages and `impressum/`. Within a category page, each item is an `<div class="entry" id="...">` block; the sidebar links to it via `data-entry="<id>"` and an `href="#<id>"` (or `<category>/#<id>` from other pages).

**The sidebar nav is duplicated verbatim across every page.** There is no templating — the full `<nav id="sidebar">` markup (including every category's list of entries) is copy-pasted into `index.html` and every subdirectory's `index.html`, with relative paths adjusted (`href="exhibitions/..."` on the home page vs `href="../exhibitions/..."` from inside `exhibitions/`). **When adding, renaming, or reordering an entry, every page's sidebar block must be updated to match**, and the `data-entry`/`id` values must stay in sync between the nav link and the target `.entry` element for the JS (scroll spy, anchor scrolling) to work.

**Bio/CV content is also duplicated.** The bio and CV text exists both inline in `index.html` (`#bio`, `#cv`) and again as full standalone pages at `bio/index.html` and `cv/index.html` (for direct linking/SEO). Content edits to bio or CV need to be applied in both places.

**`main.js` is one file of independent, self-contained init functions**, all wired up on a single `DOMContentLoaded` listener at the bottom of the file. Each is safe to call on pages that don't have the relevant markup (they early-return if their root element isn't found):
- `initGalleries` — auto-advancing image carousels (`.gallery` / `.gallery-track`) with dots, per-slide photo credits (from a JSON `data-credits` attribute), and a counter; pauses on hover/touch and when scrolled out of view (`IntersectionObserver`).
- `initLightbox` — click-to-enlarge for gallery and drag-overlay images.
- `initLazyVideos` — lazily sets `src` on `iframe[data-src]` (Vimeo embeds) and drops playback quality for background/autoplay embeds.
- `initVideoExpand` — moves a `<video>` into a fullscreen-style overlay and restores it to its original DOM position on close.
- `initCustomVideoControls` — custom play/mute/expand controls for `.custom-video-wrap` videos, with iOS-specific fullscreen handling.
- `initScrollSpy` — highlights the active `.nav-item` based on scroll position within a category page, and handles smooth anchor scrolling/hash updates.
- `initHomeScrollSpy` — same idea but for the home page's `#home`/`#bio`/`#cv` sidebar links.
- `initMobileMenu` — hamburger toggle + backdrop for the sidebar on small screens.

**Assets:** images live in `images/` (full-res originals under `images/highres/`), videos in `videos/` (`videos/highres/` for full-res). Fonts are loaded from Google Fonts via a preloaded stylesheet link in each page's `<head>`. Page-view analytics are goatcounter, loaded via a `<script data-goatcounter="...">` tag near the end of `<body>`.

## Repo hygiene notes

- `Drag Technologies - Copy/` at the repo root is an unrelated, untracked project (a separate deepfake/video-editing toolkit) that happens to sit inside this working directory — it is not part of the website and should not be treated as site source.
- `.claude/` is gitignored; don't assume anything under it is version-controlled.
