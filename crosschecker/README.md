# Quant-Crosschecker

A study site for UMass students: type the steps of a math, stats or econ problem one per line,
and it finds the first line that doesn't follow from the one before, with what went wrong, why,
and what to try next. Built in class (RESECON 490AI, S15, Oct 27, 2026) with Claude Code and the
anti-slop-web skill.

## How to open it
Double-click `index.html`, or run a local server in this folder and open http://localhost:8000:

```
ruby -run -e httpd . -p 8000
```

(Python isn't installed on this laptop, so Ruby's built-in server is used.)
The checker downloads one library (math.js 12.4.2) from cdnjs, so it needs internet the first time.

## Pages
| File | What it is |
|---|---|
| `index.html` | About: what it does and what it can't do yet |
| `how.html` | How to use it, and how to type math it can read |
| `context.html` | Pick your course and the topics covered so far |
| `check.html` | The checker: problem, upload, your lines, margin notes |
| `profile.html` | Nickname and check history (no login) |

## Code
| File | Job |
|---|---|
| `checker.js` | The step checker. Plugs random numbers into each line and the line before it (math.js). Expressions must agree; equations must keep the same solution. |
| `data.js` | Demo courses, topics and six practice problems with hand-written hints and worked solutions |
| `store.js` | Saves nickname, course, drafts and history in this browser (localStorage) |
| `app.js` | Page behaviour: the sweep, margin notes, praise/support words, hints |
| `styles.css` | Design tokens at the top, then layout and components |

## What is real vs. demo
- **Real:** the checking of arithmetic and algebra steps (it really computes; nothing is scripted).
- **Demo:** the three courses, their topics, the six problems and their hints, and the random nickname.
- **Not built:** reading uploaded photos/PDFs, solving brand-new problems, using real course materials.
  These need an AI model behind a server (with the API key kept secret on the server), plus the
  course materials for retrieval (RAG).

Nothing leaves the browser. There are no keys, passwords or personal data in this folder.
