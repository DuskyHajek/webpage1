const test = require("node:test");
const assert = require("node:assert/strict");
const QUESTIONS = require("../questions.js");
const createCore = require("../js/core.js");

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function memStorage(init) {
  const mem = { ...(init || {}) };
  return { mem, getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
}

const core = createCore(QUESTIONS, seeded(42));
const multi = QUESTIONS.find((q) => q.select === 2);

test("question bank loads with derived domains", () => {
  assert.equal(QUESTIONS.length, 85);
  assert.deepEqual(core.DOMAIN_IDS, [1, 2, 3, 4]);
  assert.equal(core.idsFor(core.defaultState(), "2").length, QUESTIONS.filter((q) => q.domain === 2).length);
});

test("domain weights match the public exam guide", () => {
  assert.deepEqual(
    core.DOMAIN_IDS.map((d) => core.DOMAIN_WEIGHT[d]),
    [24, 28, 24, 24],
  );
});

test("display and original letters round-trip under shuffling", () => {
  const store = core.blankSet([multi.id], false);
  const disp = core.displayOptions(store, multi.id);
  assert.equal(disp.length, multi.options.length);
  const answerDisplay = core.origToDisplay(store, multi.id, multi.answer);
  assert.deepEqual(core.displayToOrig(store, multi.id, answerDisplay).sort(), multi.answer.slice().sort());
  answerDisplay.forEach((l) => {
    const row = disp.find((o) => o.displayLetter === l);
    assert.ok(multi.answer.includes(row.origLetter));
  });
});

test("option order is stable per store", () => {
  const store = core.blankSet([multi.id], false);
  const a = core.displayOptions(store, multi.id).map((o) => o.origLetter).join();
  const b = core.displayOptions(store, multi.id).map((o) => o.origLetter).join();
  assert.equal(a, b);
});

test("toggleDraft respects select count", () => {
  assert.deepEqual(core.toggleDraft(["A"], "B", 1), ["B"]);
  assert.deepEqual(core.toggleDraft(["A"], "B", 2), ["A", "B"]);
  assert.deepEqual(core.toggleDraft(["A", "B"], "A", 2), ["B"]);
  assert.equal(core.toggleDraft(["A", "B"], "C", 2), null);
});

test("letters formats lists", () => {
  assert.equal(core.letters(["B"]), "B");
  assert.equal(core.letters(["C", "A"]), "A and C");
  assert.equal(core.letters(["C", "A", "B"]), "A, B, and C");
});

test("recordAnswer tracks first try, auto-saves misses and clears them on success", () => {
  const state = core.defaultState();
  const id = QUESTIONS[0].id;
  core.recordAnswer(state, id, false, Date.UTC(2026, 0, 2));
  assert.equal(state.firstTry[id], false);
  assert.equal(state.saved[id], "auto");
  core.recordAnswer(state, id, true, Date.UTC(2026, 0, 2));
  assert.equal(state.firstTry[id], false);
  assert.equal(state.saved[id], undefined);
  assert.equal(state.attempts[id], 2);
  assert.equal(state.activity["2026-01-02"], 2);
});

test("pinned questions survive a correct answer", () => {
  const state = core.defaultState();
  const id = QUESTIONS[1].id;
  core.togglePin(state, id);
  core.recordAnswer(state, id, true);
  assert.equal(state.saved[id], "pin");
  core.togglePin(state, id);
  assert.equal(state.saved[id], undefined);
});

test("phaseOf and scoreOf", () => {
  const set = core.blankSet(["1.1", "1.2"], false);
  assert.equal(core.phaseOf(set), "new");
  set.ok["1.1"] = true;
  assert.equal(core.phaseOf(set), "active");
  assert.deepEqual(core.scoreOf(set), { correct: 1, answered: 1, total: 2 });
  set.phase = "done";
  assert.equal(core.phaseOf(set), "done");
});

test("gradeExam scores picks, blanks are wrong, misses auto-saved", () => {
  const state = core.defaultState();
  state.exam = core.newExam(130, 1000);
  const [a, b] = state.exam.ids;
  state.exam.picks[a] = core.BY_ID[a].answer.slice();
  state.exam.picks[b] = ["Z"];
  core.gradeExam(state, 2000);
  assert.equal(state.exam.submitted, true);
  assert.equal(state.exam.ok[a], true);
  assert.equal(state.exam.ok[b], false);
  assert.equal(state.saved[b], "auto");
  assert.equal(state.examHistory.length, 1);
  assert.equal(state.examHistory[0].correct, 1);
  assert.equal(core.hasActiveExam(state), false);
});

test("exam time left and blank count", () => {
  const ex = core.newExam(130, 0);
  assert.equal(core.examTimeLeft(ex, 60000), 129 * 60000);
  assert.equal(core.examBlankCount(ex), 85);
});

test("loadState migrates v1 storage and saveState persists", () => {
  const storage = memStorage({ "aib-c01-practice-v1": JSON.stringify({ sets: {}, saved: { "1.1": "pin" }, answers: { "1.1": true } }) });
  const state = core.loadState(storage);
  assert.equal(state.saved["1.1"], "pin");
  assert.ok(!("aib-c01-practice-v1" in storage.mem));
  assert.ok(core.KEY in storage.mem);
  assert.equal(core.migrateAnswers(state), true);
  assert.equal(state.firstTry["1.1"], true);
  assert.equal(core.saveState(storage, state), true);
  assert.equal(core.loadState(storage).firstTry["1.1"], true);
});

test("loadState falls back to defaults on corrupt data", () => {
  const state = core.loadState(memStorage({ "aib-c01-practice-v2": "{not json" }));
  assert.deepEqual(state, core.defaultState());
});

test("domainBreakdown groups by domain", () => {
  const ids = ["1.1", "1.2", QUESTIONS.find((q) => q.domain === 3).id];
  const rows = core.domainBreakdown(ids, { "1.1": true });
  assert.deepEqual(rows.map((r) => [r.domain, r.correct, r.total]), [[1, 1, 2], [3, 0, 1]]);
});

function doneSet(ids, extra) {
  const set = core.blankSet(ids, false);
  set.phase = "done";
  if (extra) Object.assign(set, extra);
  return set;
}

test("retryShuffles only a finished or already shuffled run", () => {
  const state = core.defaultState();
  delete state.prefs.shuffleOnRetry;
  const domainIds = core.idsFor(state, "2");
  state.sets.all = doneSet(["1.1", "1.2"]);
  state.sets["2"] = doneSet(domainIds);
  state.sets.saved = doneSet(["1.1", "1.2"]);
  assert.equal(core.retryShuffles(state, "all", true), true);
  assert.equal(core.retryShuffles(state, "2", true), true);
  assert.equal(core.retryShuffles(state, "saved", true), true);
  assert.equal(core.retryShuffles(state, "all", false), false);

  state.sets.all.phase = "pick";
  state.sets.all.shuffled = false;
  assert.equal(core.retryShuffles(state, "all", true), false);
  state.sets.all.shuffled = true;
  assert.equal(core.retryShuffles(state, "all", true), true);

  state.prefs.shuffleOnRetry = false;
  state.sets.all = doneSet(["1.1", "1.2"]);
  state.sets["2"] = doneSet(domainIds);
  state.sets.saved = doneSet(["1.1", "1.2"]);
  assert.equal(core.retryShuffles(state, "all", true), false);
  assert.equal(core.retryShuffles(state, "2", true), false);
  assert.equal(core.retryShuffles(state, "saved", true), false);
  state.sets["missed:all"] = doneSet(["1.1", "1.2"]);
  assert.equal(core.retryShuffles(state, "missed:all", true), true);
  assert.equal(core.retryShuffles(state, "missed:all", false), true);

  const fresh = core.defaultState();
  assert.equal(core.retryShuffles(fresh, "all", true), false);
});

test("a shuffled set is a permutation and not the previous order", () => {
  const ids = core.idsFor(core.defaultState(), "all");
  const set = core.blankSet(ids, true);
  assert.equal(set.shuffled, true);
  assert.equal(set.ids.length, ids.length);
  assert.equal(new Set(set.ids).size, ids.length);
  assert.deepEqual(set.ids.slice().sort(), ids.slice().sort());
  assert.notDeepEqual(set.ids, ids);

  const stuck = createCore(QUESTIONS, () => 0.999999);
  const short = ["1.1", "1.2", "1.3"];
  const again = stuck.blankSet(short, true, short);
  assert.deepEqual(again.ids.slice().sort(), short.slice().sort());
  assert.notDeepEqual(again.ids, short);
  const prior = ["1.3", "1.2", "1.1"];
  const avoided = stuck.blankSet(short, true, prior);
  assert.notDeepEqual(avoided.ids, prior);
  assert.deepEqual(avoided.ids.slice().sort(), short.slice().sort());

  const ordered = core.blankSet(short, false);
  assert.deepEqual(ordered.ids, short);
  assert.equal(ordered.shuffled, false);
});

test("keepSavedOrder keeps the stored sequence", () => {
  assert.deepEqual(core.keepSavedOrder(["c", "a", "b"], ["a", "b", "c"]), ["c", "a", "b"]);
  assert.deepEqual(core.keepSavedOrder(["b", "a", "c"], ["a", "c", "d"]), ["a", "c", "d"]);
});

test("a rebuilt set does not overwrite firstTry", () => {
  const state = core.defaultState();
  const id = QUESTIONS[0].id;
  core.recordAnswer(state, id, false);
  state.sets.all = core.blankSet(core.idsFor(state, "all"), true);
  core.recordAnswer(state, id, true);
  assert.equal(state.firstTry[id], false);
  assert.equal(state.answers[id], true);
  assert.equal(state.attempts[id], 2);
});

test("normalizeState fills shuffleOnRetry only when missing", () => {
  const missing = core.normalizeState({ sets: {}, prefs: { theme: "dark" } });
  assert.equal(missing.prefs.shuffleOnRetry, true);
  assert.equal(missing.prefs.theme, "dark");
  assert.equal(missing.prefs.shuffleQuestions, false);
  assert.equal(core.normalizeState(missing), missing);
  assert.equal(missing.prefs.shuffleOnRetry, true);
  assert.equal(missing.prefs.theme, "dark");

  const off = core.normalizeState({ prefs: { shuffleOnRetry: false } });
  assert.equal(off.prefs.shuffleOnRetry, false);
  core.normalizeState(off);
  assert.equal(off.prefs.shuffleOnRetry, false);
});
