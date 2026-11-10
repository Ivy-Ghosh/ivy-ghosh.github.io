// Saved state for this browser only (localStorage). Every read and write goes through
// here, so a real backend could replace it later without changing the pages.
// If storage is blocked (private window), the site still works for the current visit.

window.QCStore = (function () {
  const KEY = "qc.v1";
  let state = null;

  function defaults() {
    const words = window.QC_DATA.aliasWords;
    const alias = words[Math.floor(Math.random() * words.length)] + " " + (10 + Math.floor(Math.random() * 90));
    return { alias: alias, courseId: null, covered: {}, history: [], drafts: {} };
  }

  function load() {
    if (state) return state;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { saved = null; }
    state = Object.assign(defaults(), saved || {});
    if (!saved) save(); // keep the generated nickname stable across pages
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: keep in memory */ }
  }

  return {
    get: function () { return load(); },
    set: function (patch) { Object.assign(load(), patch); save(); },
    addHistory: function (entry) {
      const s = load();
      s.history.unshift(Object.assign({ at: new Date().toISOString() }, entry));
      s.history = s.history.slice(0, 100); // cap it so storage never fills up
      save();
    },
    clearHistory: function () { load().history = []; save(); },
    setDraft: function (problemId, lines) { load().drafts[problemId] = lines; save(); }
  };
})();
