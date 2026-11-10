# Ivy Ghosh — course website (RESECON 490AI, Fall 2026)

The public website for my final project, "AI and the Future of My Industry" (U.S. colleges and
universities, NAICS 611310). Everything in this folder is public. Never put private files here.

## How to open it
Double-click `index.html`. The fonts load from Google Fonts, so it looks best with internet on.

## Pages
| File | What it is |
|---|---|
| `index.html` | Home: who I am, plus the live jobs chart |
| `about.html` | About: education, experience, skills (About paragraph is a **draft** for me to rewrite) |
| `projects.html` | Projects: the final project (summary is a **draft** for me to write), Quant-Crosschecker, trust-game paper |
| `resume.html` | Résumé: PDF viewer and download (`assets/resume.pdf`) |
| `contact.html` | Email and LinkedIn (no form: a form needs a server) |
| `crosschecker/` | A copy of my Oct 27 class build, Quant-Crosschecker |

## Code
| File | Job |
|---|---|
| `styles.css` | Design tokens at the top (colors, fonts, sizes), then layout and components |
| `data.js` | The 12 years of QCEW job counts used in the chart |
| `chart.js` | Draws the chart as plain SVG; marker buttons, tap/arrow-key year readout, pen-draw animation |

## What is real vs. draft
- **Real:** chart numbers. They are BLS QCEW annual averages for NAICS 611310, U.S. totals, summed from
  `project/data/QCEW_611310_US_extract_2014_2025.csv` (public = federal + state + local).
  Résumé facts and contact details come from my résumé.
- **Draft:** text inside the dashed "Draft" boxes. These are quotes from my Oct 15 interview and a
  checklist. I replace them with my own words.
- **Not posted yet:** report PDF (by Dec 3) and slides (by Dec 8).

## To publish (GitHub Pages, later)
Make a public repo, upload the *contents* of this folder (so `index.html` is at the top), then
Settings → Pages → Deploy from a branch → main / (root). All paths are relative, so it works there.
