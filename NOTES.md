# NOTES: course website

## Design decisions (Nov 5, 2026)
- **Ivy's choices:** draft boxes with her own interview quotes (no AI-written narrative); post the
  current résumé PDF as-is (transcript stays out); Japanese stationery notebook look.
- **Idea:** a grid-paper study notebook is the layout. Pages sit on a 24 px grid, navigation is a row
  of index tabs, key phrases get a highlighter swipe, and short notes sit in a margin column.
- **Palette:** cool white paper `#FAFBF8`, pale blue grid `#DCE5EC`, gel-pen ink `#1F2633`, marker teal
  `#0E6E6A` (public), marker plum `#8A3B6B` (private), highlighter `#F3E35A` (only behind text).
  Avoided cream paper + serif (the stock "AI editorial" look).
- **Type:** Zen Kaku Gothic New for everything; Klee One (handwriting) for margin notes only.
- **The one live thing:** the QCEW chart. Marker buttons switch Both / Public / Private; tap a year
  (or use arrow keys) for the exact count, share and change from the year before.
- **Motion:** one moment. The lines draw like a pen stroke the first time the chart is seen;
  off with reduced motion.
- **Honesty:** y-axis does not start at zero, and the source note says so. 2025 flagged as possibly
  preliminary. Report and slides show "posting by" dates, not fake links.

## Changelog
- 2026-11-05: First version. Five pages + Crosschecker copy + résumé PDF. Checked at 375, 768 and
  1440 px: no horizontal scroll, no console errors, all local links resolve, chart readout matches the
  CSV (e.g. 2020 total 2,927,626, down 3.4% from 2019). Fixed: name styled as a tab and tabs wrapping
  on phones; removed margin notes that spoke for Ivy.
- Testing note: the app's local server can't read the Desktop (macOS privacy), so the site was
  tested from a copy in Claude's scratchpad. `.claude/launch.json` points at that temporary copy.

- 2026-11-10: Matched the Oct 29 rules: résumé renamed to assets/resume.pdf (lowercase),
  unfinished items tagged [PLACEHOLDER]. Ivy chose to keep her GPA visible on the posted résumé,
  even though the Oct 29 sheet suggests leaving it off.

## Next
- Ivy writes the About paragraph and the 150–250 word project summary (before M4, Nov 12).
- Add the report PDF, slides and more charts at M6. Résumé with QR code at M5 (Nov 19).
- Publish on GitHub Pages when ready.
