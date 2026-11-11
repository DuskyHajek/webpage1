/* Timed mock: no feedback until submit, flags, clock, review with rationales. */
(function (root) {
  const A = (root.AIB = root.AIB || {});
  let ticker = null;

  function exam() {
    return A.ctx.state.exam;
  }

  function clockText(ex) {
    const left = A.core.examTimeLeft(ex);
    if (left <= 0) return "Time up";
    const s = Math.floor(left / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s % 60).padStart(2, "0");
  }

  function clockHtml(ex) {
    const urgent = A.core.examTimeLeft(ex) < 5 * 60000 ? " urgent" : "";
    return '<span class="clock' + urgent + '" id="clock">' + A.ui.icon("clock") + "<span>" + clockText(ex) + "</span></span>";
  }

  function examPills(ex, cursor, q, revealed) {
    return [(revealed ? "Review · " : "") + (cursor + 1) + " / " + ex.ids.length, "Domain " + q.domain + " · " + (A.core.DOMAIN_SHORT[q.domain] || "")];
  }

  function answeredCount(ex) {
    return ex.ids.filter((id) => ex.picks[id] && ex.picks[id].length).length;
  }

  function html() {
    const { core, ui } = A;
    const ex = exam();
    if (!ex) return A.home.introHtml();
    if (ex.submitted && !ex.review) return A.results.examHtml(ex);
    const id = ex.ids[ex.cursor];
    const q = core.BY_ID[id];
    const revealed = ex.submitted;
    const draft = ex.drafts[id] || [];
    const isLast = ex.cursor + 1 >= ex.ids.length;
    const top = revealed ? ui.reveal(ex, id, ex.picks[id] || [], !!ex.ok[id]) : "";
    const hint = !revealed && q.select > 1 ? ui.pickHint(q.select, draft.length) : "";
    const answered = answeredCount(ex);
    const nextLabel = revealed ? (isLast ? "Finish review" : "Next") : isLast ? "Submit mock" : "Next";
    const dock = '<div class="dock">'
      + ui.btn("Previous", "exam-prev", { icon: "arrowL", cls: "collapse", disabled: ex.cursor === 0, key: "←", title: "Previous" })
      + (revealed ? "" : ui.btn(ex.flags[id] ? "Flagged" : "Flag", "exam-flag", { icon: "flag", cls: "collapse flag-btn", pressed: !!ex.flags[id], key: "M", title: "Flag for review" }))
      + '<span class="spacer"></span>'
      + (revealed || isLast ? "" : ui.btn("Submit", "exam-submit", { kind: "quiet", icon: "send" }))
      + ui.btn(nextLabel, "exam-next", { kind: "primary", id: "go", iconEnd: isLast && !revealed ? "send" : "arrowR", key: "Enter" })
      + "</div>";
    return ui.qbar({
      pills: examPills(ex, ex.cursor, q, revealed),
      progress: { value: answered, max: ex.ids.length, label: answered + " of " + ex.ids.length + " answered" },
      right: clockHtml(ex),
      homeTitle: revealed ? "Home" : "Exit (clock keeps running)",
    })
      + ui.dotMap(ex, ex.cursor, { flags: ex.flags, answered: ex.picks, graded: revealed ? ex.ok : null, jumpAct: "jump-exam" })
      + ui.quizBody(ui.stemHtml(q.parts), top, ui.options(ex, id, draft, revealed, "exam-opt"), "", hint)
      + dock;
  }

  function start(durationMin) {
    const state = A.ctx.state;
    if (A.core.hasActiveExam(state) && !confirm("Discard the mock in progress and start a new one?")) return;
    state.exam = A.core.newExam(durationMin);
    A.app.save();
    A.app.go({ name: "exam" });
  }

  function toggle(letter) {
    const ex = exam();
    if (!ex || ex.submitted) return;
    const id = ex.ids[ex.cursor];
    if (!A.core.displayOptions(ex, id).some((o) => o.displayLetter === letter)) return;
    const q = A.core.BY_ID[id];
    const draft = A.core.toggleDraft(ex.drafts[id] || [], letter, q.select);
    if (!draft) return;
    ex.drafts[id] = draft;
    ex.picks[id] = A.core.displayToOrig(ex, id, draft);
    A.app.save();
    A.ui.syncOptions(draft);
    A.ui.syncPickHint(q.select, draft.length);
    const answered = answeredCount(ex);
    A.ui.syncProgress(answered, answered + " of " + ex.ids.length + " answered");
  }

  function moveTo(index) {
    const ex = exam();
    ex.cursor = Math.max(0, Math.min(index, ex.ids.length - 1));
    A.app.commit();
  }

  function next() {
    const ex = exam();
    if (ex.cursor + 1 < ex.ids.length) return moveTo(ex.cursor + 1);
    if (ex.submitted) return A.app.go({ name: "home" });
    submit(false);
  }

  function flag() {
    const ex = exam();
    if (!ex || ex.submitted) return;
    const id = ex.ids[ex.cursor];
    ex.flags[id] = !ex.flags[id];
    A.app.commit();
  }

  function submit(force) {
    const ex = exam();
    if (!ex || ex.submitted) return;
    if (!force) {
      const blank = A.core.examBlankCount(ex);
      const flagged = Object.values(ex.flags).filter(Boolean).length;
      const parts = [];
      if (blank) parts.push(blank + " unanswered (counted wrong)");
      if (flagged) parts.push(flagged + " flagged");
      if (!confirm("Submit the mock?" + (parts.length ? "\n" + parts.join(" · ") : ""))) return;
    }
    stopClock();
    A.core.gradeExam(A.ctx.state);
    A.app.commit();
  }

  function review(index) {
    const ex = exam();
    ex.review = true;
    ex.cursor = index || 0;
    A.app.save();
    A.app.go({ name: "exam" });
  }

  function startClock() {
    stopClock();
    ticker = setInterval(() => {
      const ex = exam();
      const el = document.getElementById("clock");
      if (!ex || ex.submitted) return stopClock();
      if (A.core.examTimeLeft(ex) <= 0) return submit(true);
      if (el) el.outerHTML = clockHtml(ex);
    }, 1000);
  }

  function stopClock() {
    if (ticker) clearInterval(ticker);
    ticker = null;
  }

  function onKey(event, key) {
    const ex = exam();
    if (!ex || (ex.submitted && !ex.review)) return;
    if (!ex.submitted && /^[A-F]$/.test(key)) toggle(key);
    else if (key === "ENTER" || key === "ARROWRIGHT") next();
    else if (key === "ARROWLEFT") moveTo(ex.cursor - 1);
    else if (key === "M") flag();
    else return;
    event.preventDefault();
  }

  A.exam = { html, start, toggle, moveTo, next, flag, submit, review, startClock, stopClock, onKey };
})(this);
