/* Learn mode: instant rationales after each answer. */
(function (root) {
  const A = (root.AIB = root.AIB || {});

  function current() {
    return A.ctx.state.sets[A.ctx.view.setId];
  }

  function goLabel(q, need) {
    if (need === 0) return "Check answer";
    return q.select === 1 ? "Select an answer" : "Select " + need + " more";
  }

  function quizPills(set, cursor, q) {
    return [(cursor + 1) + " / " + set.ids.length, "Domain " + q.domain + " · " + (A.core.DOMAIN_SHORT[q.domain] || "")];
  }

  function html() {
    const { state } = A.ctx;
    const { core, ui } = A;
    const set = current();
    if (!set) return A.home.html();
    if (set.phase === "done") return A.results.setHtml(set, A.ctx.view.setId);
    const id = set.ids[set.cursor];
    const q = core.BY_ID[id];
    const revealed = set.phase === "reveal";
    const picked = revealed ? set.picks[id] || [] : [];
    const draft = revealed ? core.origToDisplay(set, id, picked) : set.drafts[id] || [];
    const need = q.select - draft.length;
    const saved = core.isSaved(state, id);
    const isLast = set.cursor + 1 >= set.ids.length;
    const top = revealed ? ui.reveal(set, id, picked, !!set.ok[id]) : "";
    const hint = !revealed && q.select > 1 ? ui.pickHint(q.select, draft.length) : "";
    const go = revealed
      ? ui.btn(isLast ? "See results" : "Next question", "next", { kind: "primary", id: "go", iconEnd: "arrowR", key: "Enter" })
      : ui.btn(goLabel(q, need), "check", { kind: "primary", id: "go", disabled: need !== 0, key: "Enter" });
    return ui.qbar({
      pills: quizPills(set, set.cursor, q),
      progress: { value: set.cursor + 1, max: set.ids.length, label: "Question " + (set.cursor + 1) + " of " + set.ids.length },
      right: "",
      homeTitle: "Home",
    })
      + ui.dotMap(set, set.cursor, { graded: set.ok, answered: set.picks, jumpAct: "jump-learn" })
      + ui.quizBody(ui.stemHtml(q.parts), top, ui.options(set, id, draft, revealed, "opt"), A.ctx.justRevealed ? "just-revealed" : "", hint)
      + '<div class="dock">'
      + ui.btn("Previous", "prev", { icon: "arrowL", cls: "collapse", disabled: set.cursor === 0, key: "←", title: "Previous" })
      + ui.btn(saved ? "Saved" : "Save", "toggle-save", { icon: "bookmark", cls: "collapse", pressed: saved, key: "S", title: saved ? "Remove from saved" : "Save for later" })
      + '<span class="spacer"></span>' + go + "</div>";
  }

  function start(setId, restart) {
    const { state } = A.ctx;
    const core = A.core;
    if (setId === "saved" && !core.idsFor(state, setId).length) return A.app.go({ name: "home" });
    if (restart || !state.sets[setId]) {
      const ids = setId.startsWith("missed:") ? state.sets[setId].ids.slice() : core.idsFor(state, setId);
      state.sets[setId] = core.blankSet(ids, false);
    } else if (setId === "saved") {
      const set = state.sets.saved;
      const cursorId = set.ids[set.cursor];
      set.ids = core.savedIds(state);
      const next = set.ids.indexOf(cursorId);
      set.cursor = next >= 0 ? next : Math.min(set.cursor, Math.max(0, set.ids.length - 1));
    }
    A.app.save();
    A.app.go({ name: "quiz", setId });
  }

  function startMissed(parentId) {
    const { state } = A.ctx;
    const parent = state.sets[parentId];
    const ids = parent.ids.filter((id) => parent.ok[id] === false);
    state.sets["missed:" + parentId] = A.core.blankSet(ids, true);
    A.app.save();
    A.app.go({ name: "quiz", setId: "missed:" + parentId });
  }

  function moveTo(index) {
    const set = current();
    set.cursor = index;
    set.phase = set.ids[index] in set.ok ? "reveal" : "pick";
    A.app.commit();
  }

  function toggle(letter) {
    const set = current();
    if (!set || set.phase !== "pick") return;
    const id = set.ids[set.cursor];
    const q = A.core.BY_ID[id];
    if (!A.core.displayOptions(set, id).some((o) => o.displayLetter === letter)) return;
    const draft = A.core.toggleDraft(set.drafts[id] || [], letter, q.select);
    if (!draft) return;
    set.drafts[id] = draft;
    A.app.save();
    A.ui.syncOptions(draft);
    A.ui.syncPickHint(q.select, draft.length);
    const go = document.getElementById("go");
    if (go) {
      const need = q.select - draft.length;
      go.disabled = need !== 0;
      go.querySelector(".btn-label").textContent = goLabel(q, need);
    }
  }

  function check() {
    const set = current();
    if (set.phase !== "pick") return;
    const id = set.ids[set.cursor];
    const q = A.core.BY_ID[id];
    const draft = (set.drafts[id] || []).slice();
    if (draft.length !== q.select) return;
    const picked = A.core.displayToOrig(set, id, draft);
    set.picks[id] = picked;
    set.ok[id] = A.core.same(picked, q.answer);
    A.core.recordAnswer(A.ctx.state, id, set.ok[id]);
    delete set.drafts[id];
    set.phase = "reveal";
    A.ctx.justRevealed = true;
    A.app.commit();
    const ex = document.getElementById("explain");
    if (ex && window.innerWidth < 960) ex.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function next() {
    const set = current();
    if (set.cursor + 1 >= set.ids.length) {
      set.phase = "done";
      A.app.commit();
    } else moveTo(set.cursor + 1);
  }

  function prev() {
    const set = current();
    if (set.cursor > 0) moveTo(set.cursor - 1);
  }

  function toggleSave() {
    const set = current();
    if (!set || set.phase === "done") return;
    const id = set.ids[set.cursor];
    const state = A.ctx.state;
    const core = A.core;
    if (core.isSaved(state, id)) {
      if (core.isPinned(state, id)) core.togglePin(state, id);
      else core.dropAutoSave(state, id);
    } else {
      core.togglePin(state, id);
    }
    A.app.commit();
  }

  function onKey(event, key) {
    const set = current();
    if (!set || set.phase === "done") return;
    if (set.phase === "pick" && /^[A-F]$/.test(key)) toggle(key);
    else if (key === "ENTER" || (key === "ARROWRIGHT" && set.phase === "reveal")) {
      const go = document.getElementById("go");
      if (go && !go.disabled) go.click();
      else return;
    } else if (key === "ARROWLEFT") prev();
    else if (key === "S") toggleSave();
    else return;
    event.preventDefault();
  }

  A.quiz = { html, start, startMissed, moveTo, toggle, check, next, prev, toggleSave, onKey };
})(this);
