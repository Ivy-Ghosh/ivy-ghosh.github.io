# NOTES: Quant-Crosschecker

## Design decisions (Oct 27, 2026)
- **Idea:** the exam blue-book page is the stage. The student's own lines stay; feedback is written
  in the margin, pinned to the line where it slipped. (Competitor test: Photomath/Chegg show their
  own solution, not a marked-up version of yours.)
- **Apple-launch feel:** one object (the beige page) lit on a dark stage, huge short headlines,
  one claim per screen on the home page.
- **Colors (from the brief):** black ground, off-white text, beige paper, brown margin pen.
  Bold grotesk type (Schibsted Grotesk) instead of a serif, to avoid the "cream + clay + serif" AI look.
  IBM Plex Mono only for math lines.
- **Dark mode:** chosen because the site gets used late at night before quizzes.
- **Playfulness 3:** warm praise when right ("Every line holds. Clean work."), calm and direct when wrong.
- **Motion:** one signature moment, the sweep down the page that stops at the slipped line.
- **No plagiarism:** worked solutions unlock only after a check and two "Still stuck" presses.
- **Honest limits:** checker is real math (math.js); uploads are shown but not read; courses are demo.

## Changelog
- 2026-10-27: First version. Five pages, six demo problems, step checker. Tested 23 checker cases
  (all correct), the core loop in the browser, saved state across refresh, and layouts at
  390 / 768 / 1440 px with no console errors. Fixed: hidden elements showing, extra page height
  at tablet width, nav wrapping on phones, hero headline shortened to two lines.

- 2026-10-27, round 1 (design-director critique against skill Sections 5 and 4.3):
  1. Copy overclaimed: it said hints adapt to your class; they don't. Context only flags uncovered
     problems. Rewrote the home claim, Context intro and Check-page note to say exactly that.
  2. Home had four near-empty full-screen text slides with no proof. Now three claims, each beside
     real proof: actual checker messages, the Context checklist, and the unlock order.
  3. Contrast below the floor: field/button borders 1.5–1.9:1 (now 3.9:1), placeholders 3.6:1
     (now 5.7:1), brown on the slipped-line tint 4.3:1 (note now has a paper background).
  4. Profile used banned big-number stat tiles (showing 0/0/0). Now one plain sentence, hidden at zero.
  5. Desktop margin column was blank before a check. Now it says "Notes land here, next to the
     line that slipped."
  Also: tabular numbers removed outside line numbers (the font widened "." and ":").

- 2026-10-27, round 2 (Ivy): How to use page only. Body text, table and "How the checking works"
  went from thin (400) grey-beige to medium/semibold (500–700) in a brighter warm beige (#D9CDBB),
  so the page reads with more presence but stays sober. Scoped with body[data-page="how"];
  only how.html loads the extra font weights. No other page changed.

- 2026-10-27, round 2 undone (Ivy's request): removed the page-scoped How to use styles from
  styles.css and restored how.html's font link to weights 400;700;800. The site is back to the
  round 1 version. (No git repository here, so this was reversed by hand from this log.)

## Next
- Ivy to try it and give round-1 feedback.
