// The step checker. It does real checking, not scripted answers:
// each line is compared with the line before it by plugging numbers into both
// (math.js does the arithmetic). Two expressions are "the same" if they agree at
// many random values. Two equations are "the same" if they keep the same solution,
// which means (left − right) on one line is a fixed multiple of the other's.
// Limits: it checks algebra and arithmetic steps. It cannot read words, graphs or proofs.

window.QCChecker = (function () {
  const CONSTANTS = { pi: true, e: true };

  function available() { return typeof window.math !== "undefined"; }

  // Turn what students actually type into something math.js can read.
  function normalize(raw) {
    return raw
      .replace(/[−–—]/g, "-")
      .replace(/[×·∙]/g, "*")
      .replace(/÷/g, "/")
      .replace(/²/g, "^2").replace(/³/g, "^3")
      .replace(/≈/g, "=")
      .replace(/\$/g, "")
      .replace(/\([^()]*[A-Za-z]{3,}[^()]*\)/g, "") // drop notes like "(unit elastic)"; sqrt(x) is untouched
      .trim();
  }

  // A label such as "MC =", "E(X) =" or "y =" in front of a value that isn't an equation to solve.
  const LABEL = /^\s*([A-Za-z][A-Za-z0-9_]*(?:\([^()=]*\))?)\s*=(?!=)(.*)$/;

  function compileOne(text) {
    const node = math.parse(text);
    const vars = {};
    node.traverse(function (n, path, parent) {
      const isFnName = parent && parent.isFunctionNode && path === "fn";
      if (n.isSymbolNode && !isFnName && !CONSTANTS[n.name]) vars[n.name] = true;
    });
    return { code: node.compile(), vars: Object.keys(vars), text: text };
  }

  // Parse one written line into a list of pieces to check, in order.
  // kind is "expr" or "eq" (the kind of work: simplifying/computing vs. solving an equation).
  function parseLine(raw, kind) {
    let s = normalize(raw);
    if (s.startsWith("=")) s = s.slice(1).trim(); // "= 10 + 5" continues the line above
    const m = s.match(LABEL);
    if (m && (kind === "expr" || (kind === null && (m[1].length >= 2 || m[1].includes("("))))) {
      s = m[2].trim();
    }
    if (s === "") throw new Error("empty");
    const parts = s.split("=").map(function (p) { return p.trim(); });
    if (parts.some(function (p) { return p === ""; })) throw new Error("dangling =");

    if (kind === "eq" || (kind === null && parts.length === 2)) {
      if (parts.length !== 2) return { kind: parts.length === 1 ? "expr" : "chain", pieces: [] };
      const piece = compileOne("(" + parts[0] + ") - (" + parts[1] + ")");
      piece.shown = s;
      return { kind: "eq", pieces: [piece] };
    }
    // Computing: "10 + 5 = 15" is two steps on one line, each checked in turn.
    return { kind: "expr", pieces: parts.map(function (p) { const c = compileOne(p); c.shown = p; return c; }) };
  }

  function valueAt(piece, scope) {
    try {
      const v = piece.code.evaluate(Object.assign({}, scope));
      return (typeof v === "number" && isFinite(v)) ? v : null;
    } catch (e) { return null; }
  }

  function randomScopes(vars, count) {
    const scopes = [];
    for (let i = 0; i < count; i++) {
      const s = {};
      vars.forEach(function (v) {
        const size = 0.5 + Math.random() * 4; // avoid 0, where many slips hide
        s[v] = Math.random() < 0.5 ? -size : size;
      });
      scopes.push(s);
    }
    return scopes;
  }

  function close(a, b, tol) { return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)); }

  // Where a straight line in one variable crosses zero (for "line 2 gives x = 9" messages).
  function rootIfLinear(piece, v) {
    const at = function (x) { const s = {}; s[v] = x; return valueAt(piece, s); };
    const f0 = at(0), f1 = at(1), f2 = at(2);
    if (f0 === null || f1 === null || f2 === null) return null;
    if (!close(f2 - 2 * f1 + f0, 0, 1e-9) || close(f1 - f0, 0, 1e-12)) return null;
    return -f0 / (f1 - f0);
  }

  // Compare two pieces of the same kind. Returns { status: "ok" | "bad" | "unknown", ... }.
  function compare(a, b, kind) {
    const vars = Array.from(new Set(a.vars.concat(b.vars)));
    const numeric = vars.length === 0;
    const scopes = numeric ? [{}] : randomScopes(vars, 12);
    const pairs = [];
    scopes.forEach(function (s) {
      const x = valueAt(a, s), y = valueAt(b, s);
      if (x !== null && y !== null) pairs.push({ x: x, y: y, scope: s });
    });
    if (pairs.length < (numeric ? 1 : 3)) return { status: "unknown" };

    if (kind === "eq") {
      if (numeric) return { status: "unknown" };
      let ratio = null, same = true;
      pairs.forEach(function (p) {
        const xz = Math.abs(p.x) < 1e-9, yz = Math.abs(p.y) < 1e-9;
        if (xz && yz) return;
        if (xz || yz) { same = false; return; }
        const r = p.y / p.x;
        if (ratio === null) ratio = r; else if (!close(r, ratio, 1e-6)) same = false;
      });
      if (same && ratio !== null && Math.abs(ratio) > 1e-9) return { status: "ok" };
      const out = { status: "bad", hint: "eq" };
      if (vars.length === 1) {
        const r1 = rootIfLinear(a, vars[0]), r2 = rootIfLinear(b, vars[0]);
        if (r1 !== null && r2 !== null) { out.hint = "roots"; out.v = vars[0]; out.r1 = r1; out.r2 = r2; }
      }
      return out;
    }

    // Computing: allow rounding (0.5%) when there are no variables; be exact otherwise.
    const tol = numeric ? 0.005 : 1e-7;
    if (pairs.every(function (p) { return close(p.x, p.y, tol); })) return { status: "ok" };
    if (numeric) return { status: "bad", hint: close(pairs[0].x, -pairs[0].y, tol) ? "numsign" : "numeric", x: pairs[0].x, y: pairs[0].y };
    if (pairs.every(function (p) { return close(p.x, -p.y, 1e-7); })) return { status: "bad", hint: "sign" };
    const withX = pairs.filter(function (p) { return Math.abs(p.x) > 1e-9; });
    if (withX.length >= 3) {
      const k = withX[0].y / withX[0].x;
      if (withX.every(function (p) { return close(p.y / p.x, k, 1e-6); })) return { status: "bad", hint: "factor", k: k };
    }
    const c = pairs[0].y - pairs[0].x;
    if (pairs.every(function (p) { return close(p.y - p.x, c, 1e-7); })) return { status: "bad", hint: "constant", c: c };
    const p0 = pairs[0];
    return { status: "bad", hint: "point", v: vars[0], val: p0.scope[vars[0]], x: p0.x, y: p0.y };
  }

  function fmt(n) {
    const r = Number(Math.abs(n) < 1e-12 ? 0 : n.toPrecision(4));
    return String(r).replace("-", "−");
  }

  // A plain-words note for slips that aren't in the hand-written list.
  function genericNote(cmp, lineNo, prevLabel) {
    const what = "Line " + lineNo + " doesn't follow from " + prevLabel + ".";
    let why, next;
    switch (cmp.hint) {
      case "roots":
        why = capital(prevLabel) + " gives " + cmp.v + " = " + fmt(cmp.r1) + ", but line " + lineNo + " gives " + cmp.v + " = " + fmt(cmp.r2) + ".";
        next = "Whatever you do to one side, do to the other. Redo just this step.";
        break;
      case "eq":
        why = "The two equations don't have the same solution, so something changed one side but not the other.";
        next = "Whatever you do to one side, do to the other. Redo just this step.";
        break;
      case "numsign":
        why = capital(prevLabel) + " works out to " + fmt(cmp.x) + ", but line " + lineNo + " works out to " + fmt(cmp.y) + ". Only the sign is different.";
        next = "Follow each minus sign through this step.";
        break;
      case "numeric":
        why = capital(prevLabel) + " works out to " + fmt(cmp.x) + ", but line " + lineNo + " works out to " + fmt(cmp.y) + ".";
        next = "Redo just this step on scratch paper, one operation at a time.";
        break;
      case "sign":
        why = "Line " + lineNo + " is the negative of the line before it, so a minus sign flipped somewhere.";
        next = "Look at each minus sign you moved or distributed in this step.";
        break;
      case "factor":
        why = "Line " + lineNo + " is " + fmt(cmp.k) + " times the line before it, so a multiply or divide went wrong.";
        next = "Check every multiply and divide in this step.";
        break;
      case "constant":
        why = "Line " + lineNo + " is off by " + fmt(cmp.c) + " from the line before it, so a term was added, dropped or moved wrongly.";
        next = "Check the terms you added, dropped or moved in this step.";
        break;
      default:
        why = "With " + cmp.v + " = " + fmt(cmp.val) + ", " + prevLabel + " gives " + fmt(cmp.x) + " but line " + lineNo + " gives " + fmt(cmp.y) + ". Equal lines would give the same number.";
        next = "Redo just this step. Plug a simple number like 1 into both lines and compare.";
    }
    const deeper = cmp.hint === "numeric" || cmp.hint === "numsign"
      ? "Split this step into smaller lines, one operation each, and check again. The checker will stop at the exact operation."
      : "Cover everything except " + prevLabel + " and line " + lineNo + ". Plug in a simple number by hand. If they disagree, this one step is the whole problem, and the rest of your work can stay.";
    return { what: what, why: why, next: next, deeper: deeper };
  }

  function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function isFinal(text, form) {
    const s = normalize(text);
    if (form === "solved") return /^[A-Za-z]\s*=\s*-?\d*\.?\d+$/.test(s) || /^-?\d*\.?\d+\s*=\s*[A-Za-z]$/.test(s);
    if (form === "number") {
      const parts = s.split("=");
      return /^-?\d*\.?\d+$/.test(parts[parts.length - 1].trim());
    }
    return true;
  }

  // Main entry. lines: array of strings. problem: a demo problem, or null for "my own problem".
  // Returns marks per line ("ok" | "bad" | "unknown" | "empty" | "unchecked"), the first bad line, and a note.
  function check(lines, problem) {
    const marks = lines.map(function (t) { return t.trim() === "" ? "empty" : "unchecked"; });
    let kind = null, prev = null, prevLabel = null, prevLine = -1;

    if (problem) {
      const ref = parseLine(problem.start, null);
      kind = ref.kind;
      prev = ref.pieces[ref.pieces.length - 1];
      prevLabel = "the problem's setup";
    }

    for (let i = 0; i < lines.length; i++) {
      if (marks[i] === "empty") continue;
      let parsed;
      try { parsed = parseLine(lines[i], kind); } catch (e) {
        marks[i] = "bad";
        return { marks: marks, firstBad: i, note: {
          what: "I can't read line " + (i + 1) + ".",
          why: "It has a symbol or word the checker doesn't understand.",
          next: "Use + − * / and ^ for powers. Write 3(x − 4) or 3*(x − 4). Keep words out of the line.",
          deeper: "One step per line works best. See How to use for examples."
        } };
      }
      if (kind === null) kind = parsed.kind;
      if (parsed.kind !== kind || parsed.pieces.length === 0) {
        marks[i] = "bad";
        return { marks: marks, firstBad: i, note: kind === "eq" ? {
          what: "Line " + (i + 1) + " isn't an equation.",
          why: "You're solving an equation, so each line should keep an = sign with a left and a right side.",
          next: "Write it as an equation, for example x = 17.",
          deeper: "If you meant to keep going on the same line, start it with = instead."
        } : {
          what: "Line " + (i + 1) + " is set up as an equation to solve.",
          why: "This problem is a calculation, so each line should be a value that equals the one before.",
          next: "Write just the value, for example 10 + 5, or start the line with =.",
          deeper: "Labels like MC = or E(X) = in front are fine."
        } };
      }

      let lineStatus = "ok";
      for (let j = 0; j < parsed.pieces.length; j++) {
        const piece = parsed.pieces[j];
        if (prev) {
          const cmp = compare(prev, piece, kind);
          if (cmp.status === "bad") {
            marks[i] = "bad";
            const label = prevLine === i ? "the part before it on the same line" : prevLabel;
            let note = null;
            if (problem) note = matchMistake(problem, piece, kind);
            if (!note) note = genericNote(cmp, i + 1, label);
            if (prevLabel === "the problem's setup" && !problem.mistakes.some(function (m) { return m === note; })) {
              note.what = "Line " + (i + 1) + " doesn't match the problem's setup.";
            }
            return { marks: marks, firstBad: i, note: note };
          }
          if (cmp.status === "unknown") lineStatus = "unknown";
        }
        prev = piece;
      }
      marks[i] = lineStatus;
      prevLabel = "line " + (i + 1);
      prevLine = i;
    }

    const written = lines.map(function (t, i) { return i; }).filter(function (i) { return marks[i] !== "empty"; });
    const last = written.length ? lines[written[written.length - 1]] : "";
    const finished = problem ? isFinal(last, problem.finalForm) : true;
    return { marks: marks, firstBad: -1, finished: finished, count: written.length };
  }

  function matchMistake(problem, piece, kind) {
    for (let k = 0; k < problem.mistakes.length; k++) {
      const m = problem.mistakes[k];
      try {
        const parsed = parseLine(m.match, kind);
        const target = parsed.pieces[parsed.pieces.length - 1];
        if (compare(target, piece, kind).status === "ok") return m;
      } catch (e) { /* a bad match string should never block the check */ }
    }
    return null;
  }

  return { available: available, check: check };
})();
