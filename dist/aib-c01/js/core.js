/* Pure practice logic: state shape, option shuffling, scoring, exam grading. Used by the app and node tests. */
(function (root) {
  const KEY = "aib-c01-practice-v2";
  const KEY_OLD = "aib-c01-practice-v1";
  const PASS_RAW = 0.82;
  const DOMAIN_SHORT = { 1: "Fundamentals", 2: "Strategy", 3: "Governance", 4: "Readiness" };

  function createCore(QUESTIONS, rand) {
    const random = rand || Math.random;
    const BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
    const DOMAINS = {};
    QUESTIONS.forEach((q) => { DOMAINS[q.domain] = q.domainName; });
    const DOMAIN_IDS = Object.keys(DOMAINS).map(Number).sort((a, b) => a - b);

    function todayKey(now) {
      return new Date(now ?? Date.now()).toISOString().slice(0, 10);
    }

    function defaultState() {
      return {
        sets: {},
        saved: {},
        answers: {},
        firstTry: {},
        attempts: {},
        activity: {},
        goalPerDay: 10,
        exam: null,
        examHistory: [],
        prefs: { shuffleQuestions: false, shuffleMockQuestions: true },
      };
    }

    function normalizeState(s) {
      const d = defaultState();
      Object.keys(d).forEach((k) => {
        if (s[k] === undefined) s[k] = d[k];
      });
      return s;
    }

    function loadState(storage) {
      try {
        const raw = storage.getItem(KEY);
        if (raw) return normalizeState(JSON.parse(raw));
        const old = storage.getItem(KEY_OLD);
        if (old) {
          const parsed = JSON.parse(old);
          const merged = defaultState();
          merged.sets = parsed.sets || {};
          merged.saved = parsed.saved || {};
          merged.answers = parsed.answers || {};
          storage.setItem(KEY, JSON.stringify(merged));
          storage.removeItem(KEY_OLD);
          return normalizeState(merged);
        }
      } catch (err) { /* fresh */ }
      return defaultState();
    }

    function saveState(storage, state) {
      try {
        storage.setItem(KEY, JSON.stringify(state));
        return true;
      } catch (err) {
        return false;
      }
    }

    function shuffleArr(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function savedIds(state) {
      const keys = new Set(Object.keys(state.saved || {}));
      return QUESTIONS.map((q) => q.id).filter((id) => keys.has(id));
    }
    function isPinned(state, id) { return state.saved[id] === "pin"; }
    function isSaved(state, id) { return !!state.saved[id]; }
    function togglePin(state, id) {
      if (isPinned(state, id)) delete state.saved[id];
      else state.saved[id] = "pin";
    }
    function autoSave(state, id) { if (state.saved[id] !== "pin") state.saved[id] = "auto"; }
    function dropAutoSave(state, id) { if (state.saved[id] === "auto") delete state.saved[id]; }

    function idsFor(state, setId) {
      if (setId === "all") return QUESTIONS.map((q) => q.id);
      if (setId === "saved") return savedIds(state);
      return QUESTIONS.filter((q) => String(q.domain) === setId).map((q) => q.id);
    }

    function blankSet(ids, shuffle) {
      return { ids: shuffle ? shuffleArr(ids) : ids.slice(), cursor: 0, phase: "pick", picks: {}, ok: {}, drafts: {}, optionOrder: {} };
    }

    function ensureOptionOrder(store, id) {
      if (!store.optionOrder) store.optionOrder = {};
      if (!store.optionOrder[id]) store.optionOrder[id] = shuffleArr(BY_ID[id].options.map((_, i) => i));
      return store.optionOrder[id];
    }

    function displayOptions(store, id) {
      const q = BY_ID[id];
      return ensureOptionOrder(store, id).map((origIdx, dispIdx) => ({
        displayLetter: String.fromCharCode(65 + dispIdx),
        origLetter: q.options[origIdx].k,
        text: q.options[origIdx].v,
      }));
    }

    function displayToOrig(store, id, list) {
      const map = Object.fromEntries(displayOptions(store, id).map((o) => [o.displayLetter, o.origLetter]));
      return list.map((l) => map[l]).filter(Boolean);
    }

    function origToDisplay(store, id, list) {
      const map = Object.fromEntries(displayOptions(store, id).map((o) => [o.origLetter, o.displayLetter]));
      return list.map((l) => map[l]).filter(Boolean);
    }

    function toggleDraft(draft, letter, select) {
      if (select === 1) return [letter];
      if (draft.includes(letter)) return draft.filter((x) => x !== letter);
      if (draft.length < select) return draft.concat(letter);
      return null;
    }

    function letters(list) {
      const items = list.slice().sort();
      if (items.length <= 1) return items.join("");
      if (items.length === 2) return items[0] + " and " + items[1];
      return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
    }

    function same(a, b) {
      return a.slice().sort().join() === b.slice().sort().join();
    }

    function askOf(q) {
      const part = [...q.parts].reverse().find((item) => item.t === "p");
      return part ? part.v : "";
    }

    function scoreOf(set) {
      let correct = 0;
      let answered = 0;
      set.ids.forEach((id) => {
        if (id in set.ok) {
          answered += 1;
          if (set.ok[id]) correct += 1;
        }
      });
      return { correct, answered, total: set.ids.length };
    }

    function phaseOf(set) {
      if (!set) return "new";
      if (set.phase === "done") return "done";
      const answered = set.ids.filter((id) => id in (set.ok || {})).length;
      const drafted = Object.keys(set.drafts || {}).length;
      if (answered === 0 && set.cursor === 0 && !drafted && set.phase === "pick") return "new";
      return "active";
    }

    function domainBreakdown(ids, ok) {
      const groups = {};
      ids.forEach((id) => {
        const d = BY_ID[id].domain;
        if (!groups[d]) groups[d] = { domain: d, name: DOMAINS[d], correct: 0, total: 0 };
        groups[d].total += 1;
        if (ok[id]) groups[d].correct += 1;
      });
      return Object.values(groups).sort((a, b) => a.domain - b.domain);
    }

    function recordAnswer(state, id, ok, now) {
      state.answers[id] = ok;
      state.attempts[id] = (state.attempts[id] || 0) + 1;
      if (!(id in state.firstTry)) state.firstTry[id] = ok;
      if (ok) dropAutoSave(state, id);
      else autoSave(state, id);
      const k = todayKey(now);
      state.activity[k] = (state.activity[k] || 0) + 1;
    }

    function migrateAnswers(state) {
      let touched = false;
      if (!Object.keys(state.firstTry).length && Object.keys(state.answers).length) {
        state.firstTry = { ...state.answers };
        touched = true;
      }
      Object.entries(state.sets).forEach(([key, set]) => {
        if (key.startsWith("missed:") || key === "saved") return;
        set.ids.forEach((id) => {
          if (id in set.ok && !(id in state.firstTry)) {
            state.firstTry[id] = set.ok[id];
            touched = true;
          }
          if (set.ok[id] === false && !state.saved[id]) {
            state.saved[id] = "auto";
            touched = true;
          }
        });
      });
      return touched;
    }

    function newExam(durationMin, now) {
      return {
        ids: shuffleArr(QUESTIONS.map((q) => q.id)),
        cursor: 0, picks: {}, drafts: {}, flags: {}, ok: {},
        durationMin, startedAt: now ?? Date.now(), submitted: false, review: false, optionOrder: {},
      };
    }

    function hasActiveExam(state) { return !!(state.exam && !state.exam.submitted); }

    function examTimeLeft(ex, now) {
      return ex.startedAt + ex.durationMin * 60000 - (now ?? Date.now());
    }

    function examBlankCount(ex) {
      return ex.ids.filter((id) => !(ex.picks[id] && ex.picks[id].length)).length;
    }

    function gradeExam(state, now) {
      const ex = state.exam;
      ex.ids.forEach((id) => {
        const pick = ex.picks[id] || [];
        ex.ok[id] = pick.length ? same(pick, BY_ID[id].answer) : false;
        if (!(id in state.firstTry)) state.firstTry[id] = ex.ok[id];
        state.answers[id] = ex.ok[id];
        if (!ex.ok[id]) autoSave(state, id);
      });
      ex.submitted = true;
      ex.review = false;
      state.examHistory.push({
        at: now ?? Date.now(),
        correct: ex.ids.filter((id) => ex.ok[id]).length,
        total: ex.ids.length,
        durationMin: ex.durationMin,
      });
    }

    return {
      KEY, PASS_RAW, QUESTIONS, BY_ID, DOMAINS, DOMAIN_IDS, DOMAIN_SHORT,
      todayKey, defaultState, normalizeState, loadState, saveState, shuffleArr,
      savedIds, isPinned, isSaved, togglePin, autoSave, dropAutoSave,
      idsFor, blankSet, displayOptions, displayToOrig, origToDisplay, toggleDraft,
      letters, same, askOf, scoreOf, phaseOf, domainBreakdown, recordAnswer, migrateAnswers,
      newExam, hasActiveExam, examTimeLeft, examBlankCount, gradeExam,
    };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = createCore;
  else (root.AIB = root.AIB || {}).createCore = createCore;
})(this);
