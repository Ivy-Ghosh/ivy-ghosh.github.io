// Page behaviour. Each HTML page sets <body data-page="...">, and only that page's
// setup runs. Text from the student is always inserted with textContent, never as HTML.

(function () {
  const D = window.QC_DATA;
  const S = window.QCStore;

  // Tone: warm when it's right, calm and direct when it isn't (playfulness 3).
  const WORDS = {
    clean: ["Every line holds. Clean work.", "Checked top to bottom. Nothing slipped.", "That's it, and you showed every step."],
    slip: ["One line slipped. The rest is worth keeping.", "Close. Here's exactly where it turned.", "Good attempt. Let's look at one line."],
    gotIt: ["That's the click. Keep it.", "Nice. That one's yours now.", "Logged. Try the next one without help."],
    stuck: ["That's fine. Here's a smaller step.", "Stuck is part of it. Try just this piece."]
  };
  const pick = function (list) { return list[Math.floor(Math.random() * list.length)]; };

  const ICON = {
    tick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 13l5 5L20 6"/></svg>',
    bad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>',
    unknown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.6V14M12 17.5v.5"/></svg>'
  };

  function el(tag, attrs, text) {
    const n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function course(id) { return D.courses.find(function (c) { return c.id === id; }); }
  function topic(c, id) { return c ? c.topics.find(function (t) { return t.id === id; }) : null; }
  function problemById(id) { return D.problems.find(function (p) { return p.id === id; }) || null; }
  function when(iso) {
    try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
    catch (e) { return ""; }
  }
  function toast(msg) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const t = el("div", { class: "toast", role: "status" }, msg);
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = function (ms) { return new Promise(function (r) { setTimeout(r, reduceMotion ? 0 : ms); }); };

  // ---------------- Check page ----------------
  function initCheck() {
    const select = document.getElementById("problem");
    const promptEl = document.getElementById("problemText");
    const coverEl = document.getElementById("coverageNote");
    const ownBox = document.getElementById("ownProblem");
    const ownText = document.getElementById("ownText");
    const pageEl = document.getElementById("page");
    const listEl = document.getElementById("lines");
    const sweep = document.getElementById("sweep");
    const checkBtn = document.getElementById("checkBtn");
    const sampleBtn = document.getElementById("loadSample");
    const verdict = document.getElementById("verdict");
    const followup = document.getElementById("followup");
    const deeper = document.getElementById("deeper");
    const solutionBtn = document.getElementById("showSolution");
    const pageHead = document.getElementById("pageHead");

    let current = null;   // the demo problem, or null for "my own problem"
    let currentId = "";
    let lines = [""];
    let last = null;      // last check result
    let stuckLevel = 0;
    let busy = false;

    // Problem list, grouped by course. Topics the class hasn't covered are labeled.
    const st = S.get();
    D.courses.forEach(function (c) {
      const group = el("optgroup", { label: c.name });
      D.problems.filter(function (p) { return p.course === c.id; }).forEach(function (p) {
        const notYet = st.courseId === c.id && !(st.covered[c.id] || []).includes(p.topic);
        group.appendChild(el("option", { value: p.id }, p.title + (notYet ? " (not covered yet)" : "")));
      });
      select.appendChild(group);
    });
    select.appendChild(el("option", { value: "own" }, "My own problem"));

    const fromUrl = new URLSearchParams(location.search).get("p");
    const firstInCourse = D.problems.find(function (p) { return p.course === st.courseId && (st.covered[p.course] || []).includes(p.topic); });
    select.value = (fromUrl && (fromUrl === "own" || problemById(fromUrl))) ? fromUrl : (firstInCourse ? firstInCourse.id : D.problems[0].id);

    function coverageNote(p) {
      coverEl.textContent = "";
      const s = S.get();
      if (!p) {
        coverEl.textContent = "For your own problem, each line is checked against the one before it. Your first line is the starting point, so copy it carefully.";
        return;
      }
      const c = course(p.course), t = topic(c, p.topic);
      if (!s.courseId) {
        coverEl.append("Set your course on ");
        coverEl.appendChild(el("a", { href: "context.html" }, "Context"));
        coverEl.append(" so problems match where your class is.");
      } else if (s.courseId !== p.course) {
        coverEl.textContent = "This one is from " + c.name + ", not your course. The hints still use plain words.";
      } else if (!(s.covered[p.course] || []).includes(p.topic)) {
        coverEl.textContent = "Your class hasn't covered " + t.name.toLowerCase() + " yet. Try it anyway, or come back after that class.";
      } else {
        coverEl.textContent = "Your class has covered " + t.name.toLowerCase() + ".";
      }
    }

    function loadProblem() {
      currentId = select.value;
      current = currentId === "own" ? null : problemById(currentId);
      promptEl.textContent = current ? current.prompt : "Type your own problem below (optional), then your steps on the page.";
      ownBox.hidden = !!current;
      sampleBtn.hidden = !current;
      pageHead.textContent = current ? "Your work: " + current.title : "Your work";
      coverageNote(current);
      const draft = S.get().drafts[currentId];
      lines = draft && draft.length ? draft.slice() : [""];
      if (!current && S.get().drafts.ownText) ownText.value = S.get().drafts.ownText;
      renderLines();
      resetResult();
      try { history.replaceState(null, "", "?p=" + currentId); } catch (e) { /* some browsers block this on file:// pages */ }
    }

    function renderLines(focusIndex) {
      listEl.textContent = "";
      lines.forEach(function (text, i) {
        const li = el("li", { class: "line" });
        li.appendChild(el("span", { class: "num", "aria-hidden": "true" }, String(i + 1)));
        const input = el("input", {
          type: "text", "aria-label": "Line " + (i + 1), spellcheck: "false", autocomplete: "off",
          autocapitalize: "off", placeholder: i === 0 ? (current ? "Your first step" : "Your starting line") : ""
        });
        input.value = text;
        input.addEventListener("input", function () { lines[i] = input.value; saveDraft(); resetResult(); });
        input.addEventListener("keydown", function (e) { onKey(e, i, input); });
        li.appendChild(input);
        li.appendChild(el("span", { class: "mark" }));
        listEl.appendChild(li);
      });
      if (focusIndex !== undefined) listEl.children[focusIndex].querySelector("input").focus();
    }

    // Enter = new line, Backspace on an empty line = remove it, arrows move between lines.
    function onKey(e, i, input) {
      if (e.key === "Enter") {
        e.preventDefault();
        lines.splice(i + 1, 0, "");
        saveDraft(); resetResult(); renderLines(i + 1);
      } else if (e.key === "Backspace" && input.value === "" && lines.length > 1) {
        e.preventDefault();
        lines.splice(i, 1);
        saveDraft(); resetResult(); renderLines(Math.max(0, i - 1));
      } else if (e.key === "ArrowDown" && i < lines.length - 1) {
        e.preventDefault(); listEl.children[i + 1].querySelector("input").focus();
      } else if (e.key === "ArrowUp" && i > 0) {
        e.preventDefault(); listEl.children[i - 1].querySelector("input").focus();
      }
    }

    function saveDraft() { S.setDraft(currentId, lines); }

    function resetResult() {
      if (busy) return;
      last = null; stuckLevel = 0;
      Array.from(listEl.children).forEach(function (li) {
        li.classList.remove("is-bad");
        li.querySelector(".mark").innerHTML = "";
        const n = li.querySelector(".margin-note"); if (n) n.remove();
      });
      pageEl.style.minHeight = "";
      pageEl.classList.remove("has-note");
      verdict.textContent = "";
      followup.hidden = true;
      deeper.textContent = "";
      solutionBtn.hidden = true;
    }

    function showVerdict(title, body) {
      verdict.textContent = "";
      verdict.appendChild(el("h2", {}, title));
      if (body) verdict.appendChild(el("p", {}, body));
    }

    async function runCheck() {
      if (busy) return;
      resetResult();
      if (!window.QCChecker.available()) {
        showVerdict("The checker didn't load.", "It needs an internet connection the first time, to fetch its math library. Connect, then refresh this page.");
        return;
      }
      const written = lines.filter(function (t) { return t.trim() !== ""; }).length;
      if (written === 0) { showVerdict("Nothing to check yet.", "Write your first step on line 1."); return; }
      if (!current && written < 2) { showVerdict("Add a second line.", "I check each step against the one before it, so your own problem needs at least two lines."); return; }

      const result = window.QCChecker.check(lines, current);
      last = result;
      busy = true; checkBtn.disabled = true;

      // The sweep: move down the page, marking each line, and stop where it slipped.
      const rows = Array.from(listEl.children);
      const stop = result.firstBad >= 0 ? result.firstBad : rows.length - 1;
      sweep.classList.add("is-on");
      for (let i = 0; i <= stop; i++) {
        const row = rows[i];
        sweep.style.transform = "translateY(" + (row.offsetTop + row.offsetHeight - 2) + "px)";
        await wait(240);
        const mark = result.marks[i];
        const slot = row.querySelector(".mark");
        if (mark === "ok") { slot.innerHTML = ICON.tick; slot.title = "This line follows"; }
        if (mark === "unknown") { slot.innerHTML = ICON.unknown; slot.title = "Couldn't test this line"; }
        if (mark === "bad") { slot.innerHTML = ICON.bad; slot.title = "This line slipped"; row.classList.add("is-bad"); }
        slot.classList.add("is-new");
      }
      await wait(200);
      sweep.classList.remove("is-on");

      const title = current ? current.title : (ownText.value.trim() || "My own problem");
      const unknownLines = result.marks.map(function (m, i) { return m === "unknown" ? i + 1 : 0; }).filter(Boolean);
      const unknownNote = unknownLines.length ? " I couldn't test line " + unknownLines.join(", ") + " (for example, it divides by zero), so check it by hand." : "";

      if (result.firstBad >= 0) {
        const row = rows[result.firstBad];
        const note = el("div", { class: "margin-note is-new", role: "note" });
        [["What went wrong: ", result.note.what], ["Why: ", result.note.why], ["Try next: ", result.note.next]].forEach(function (pair) {
          const p = el("p");
          p.appendChild(el("b", {}, pair[0]));
          p.append(pair[1]);
          note.appendChild(p);
        });
        row.appendChild(note);
        pageEl.classList.add("has-note");
        fitPageToNote(row, note);
        const n = result.firstBad + 1;
        showVerdict(pick(WORDS.slip), (n === 1 ? "It turned on line 1, so start there." : "Lines 1–" + (n - 1) + " hold up. Line " + n + " is where it turned.") + unknownNote);
        S.addHistory({ title: title, result: "Slipped at line " + n });
      } else if (result.finished) {
        showVerdict(pick(WORDS.clean), (current ? "That's the answer, with every step shown." : "Every step follows from the one before.") + unknownNote);
        S.addHistory({ title: title, result: "Clean: every line holds" });
      } else {
        showVerdict("So far, so good.", "Every line holds. You're not at a final answer yet, so keep going." + unknownNote);
        S.addHistory({ title: title, result: "On track, not finished" });
      }
      followup.hidden = false;
      busy = false; checkBtn.disabled = false;
    }

    // On wide screens the note sits in the margin; make sure the paper is tall enough to hold it.
    const wide = window.matchMedia("(min-width: 900px)");
    wide.addEventListener("change", function () { pageEl.style.minHeight = ""; });
    function fitPageToNote(row, note) {
      if (!wide.matches) return; // on narrow screens the note sits under the line, inside the page
      const needed = row.offsetTop + note.offsetHeight + 24;
      if (needed > pageEl.offsetHeight) pageEl.style.minHeight = needed + "px";
    }

    function onStuck() {
      if (!last) return;
      stuckLevel++;
      toast(pick(WORDS.stuck));
      deeper.textContent = "";
      let text;
      if (last.firstBad >= 0) text = last.note.deeper;
      else if (!last.finished) text = "Look at your last line. What one operation would make it simpler? Do just that on the next line.";
      else text = "Nothing is wrong in your work. If the idea still feels shaky, change one number in the problem and solve it again.";
      deeper.appendChild(el("p", {}, text));
      if (current && stuckLevel >= 2) solutionBtn.hidden = false;
      else if (current) deeper.appendChild(el("p", { class: "note-line" }, "Still stuck after this? Press Still stuck again to unlock the worked solution."));
      S.addHistory({ title: current ? current.title : "My own problem", result: "Asked for a hint" });
    }

    function onSolution() {
      deeper.textContent = "";
      deeper.appendChild(el("p", {}, "Worked solution. Read it, then close it and redo the problem from line 1 on your own."));
      const ol = el("ol");
      current.solution.forEach(function (s) { ol.appendChild(el("li", {}, s)); });
      deeper.appendChild(ol);
      solutionBtn.hidden = true;
    }

    document.getElementById("gotIt").addEventListener("click", function () {
      toast(pick(WORDS.gotIt));
      S.addHistory({ title: current ? current.title : (ownText.value.trim() || "My own problem"), result: "Got it", gotIt: true });
    });
    document.getElementById("stuck").addEventListener("click", onStuck);
    solutionBtn.addEventListener("click", onSolution);
    document.getElementById("addLine").addEventListener("click", function () {
      lines.push(""); saveDraft(); resetResult(); renderLines(lines.length - 1);
    });
    sampleBtn.addEventListener("click", function () {
      lines = current.sample.slice(); saveDraft(); resetResult(); renderLines();
    });
    checkBtn.addEventListener("click", runCheck);
    select.addEventListener("change", loadProblem);
    ownText.addEventListener("input", function () { S.get().drafts.ownText = ownText.value; S.set({}); });

    // Upload: shows the page next to your typed lines. Reading it automatically needs an AI model (see the note).
    const upload = document.getElementById("upload");
    const preview = document.getElementById("uploadPreview");
    upload.addEventListener("change", function () {
      preview.textContent = "";
      const f = upload.files[0];
      if (!f) return;
      if (f.size > 15 * 1024 * 1024) { preview.appendChild(el("p", { class: "note-line" }, "That file is over 15 MB. Try a smaller photo.")); return; }
      if (f.type.startsWith("image/")) {
        const img = el("img", { alt: "Your uploaded page", width: "640", height: "480" });
        img.src = URL.createObjectURL(f);
        img.addEventListener("load", function () { img.setAttribute("width", img.naturalWidth); img.setAttribute("height", img.naturalHeight); });
        preview.appendChild(img);
      }
      preview.appendChild(el("p", { class: "note-line" }, "Loaded " + f.name + ". Copy its lines onto the page, one step per line, and press Check my work."));
    });

    loadProblem();
  }

  // ---------------- Context page ----------------
  function initContext() {
    const courseList = document.getElementById("courseList");
    const topicList = document.getElementById("topicList");
    const topicLegend = document.getElementById("topicLegend");
    const status = document.getElementById("saveStatus");
    const s = S.get();
    let chosen = s.courseId || D.courses[0].id;
    const covered = JSON.parse(JSON.stringify(s.covered));

    D.courses.forEach(function (c) {
      const label = el("label", { class: "choice" });
      const input = el("input", { type: "radio", name: "course", value: c.id });
      input.checked = c.id === chosen;
      input.addEventListener("change", function () { chosen = c.id; renderTopics(); status.textContent = ""; });
      label.appendChild(input);
      label.append(c.name);
      courseList.appendChild(label);
    });

    function renderTopics() {
      const c = course(chosen);
      topicLegend.textContent = "Covered so far in " + c.name;
      topicList.querySelectorAll(".choice").forEach(function (n) { n.remove(); });
      c.topics.forEach(function (t) {
        const label = el("label", { class: "choice" });
        const input = el("input", { type: "checkbox", value: t.id });
        input.checked = (covered[c.id] || []).includes(t.id);
        input.addEventListener("change", function () {
          const set = new Set(covered[c.id] || []);
          if (input.checked) set.add(t.id); else set.delete(t.id);
          covered[c.id] = Array.from(set);
          status.textContent = "";
        });
        label.appendChild(input);
        label.append(t.name);
        topicList.appendChild(label);
      });
    }

    document.getElementById("saveContext").addEventListener("click", function () {
      S.set({ courseId: chosen, covered: covered });
      const n = (covered[chosen] || []).length;
      status.textContent = n
        ? "Saved. The Check page now knows your class has covered " + n + " topic" + (n === 1 ? "" : "s") + "."
        : "Saved. No topics ticked yet, so every problem will be marked not covered.";
    });
    renderTopics();
  }

  // ---------------- Profile page ----------------
  function initProfile() {
    const s = S.get();
    const alias = document.getElementById("alias");
    alias.value = s.alias;
    document.getElementById("aliasForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const v = alias.value.trim().slice(0, 40);
      if (!v) { alias.value = S.get().alias; toast("A nickname can't be empty. Kept the old one."); return; }
      S.set({ alias: v }); toast("Nickname saved");
    });

    const c = course(s.courseId);
    const courseEl = document.getElementById("courseSummary");
    if (c) {
      const names = (s.covered[c.id] || []).map(function (id) { return topic(c, id).name.toLowerCase(); });
      courseEl.textContent = c.name + ". Covered so far: " + (names.length ? names.join(", ") : "nothing ticked yet") + ". ";
    } else {
      courseEl.textContent = "No course set yet. ";
    }
    courseEl.appendChild(el("a", { href: "context.html" }, "Change it on Context"));

    function render() {
      const h = S.get().history;
      // One plain sentence instead of big-number tiles (and nothing at all when it would say 0).
      const checks = h.filter(function (x) { return /Slipped|Clean|On track/.test(x.result); }).length;
      const clean = h.filter(function (x) { return /^Clean/.test(x.result); }).length;
      const got = h.filter(function (x) { return x.gotIt; }).length;
      const summary = document.getElementById("summary");
      summary.hidden = checks === 0 && got === 0;
      summary.textContent = "You've run " + checks + " check" + (checks === 1 ? "" : "s") + ". " +
        (clean ? clean + " came back clean" : "None came back clean yet") +
        (got ? ", and you said “got it” " + (got === 1 ? "once" : got + " times") + "." : ".");
      const list = document.getElementById("history");
      const empty = document.getElementById("historyEmpty");
      list.textContent = "";
      empty.hidden = h.length > 0;
      document.getElementById("clearHistory").disabled = h.length === 0;
      h.forEach(function (x) {
        const li = el("li");
        li.appendChild(el("span", { class: "what" }, x.title));
        li.appendChild(el("time", { datetime: x.at }, when(x.at)));
        li.appendChild(el("span", { class: "result" }, x.result));
        list.appendChild(li);
      });
    }
    document.getElementById("clearHistory").addEventListener("click", function () {
      if (confirm("Clear your whole check history on this laptop? This can't be undone.")) { S.clearHistory(); render(); toast("History cleared"); }
    });
    render();
  }

  // Mark the current page in the nav.
  document.querySelectorAll(".site-nav a").forEach(function (a) {
    if (a.getAttribute("href") === location.pathname.split("/").pop() || (a.getAttribute("href") === "index.html" && /\/$/.test(location.pathname))) {
      a.setAttribute("aria-current", "page");
    }
  });

  const page = document.body.dataset.page;
  if (page === "check") initCheck();
  if (page === "context") initContext();
  if (page === "profile") initProfile();
})();
