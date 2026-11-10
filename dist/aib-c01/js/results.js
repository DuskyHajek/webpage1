/* Results for learn sets and timed mocks. */
(function (root) {
  const A = (root.AIB = root.AIB || {});

  function layout(o) {
    const { core, ui } = A;
    const passLine = Math.ceil(o.total * core.PASS_RAW);
    const pass = o.correct >= passLine;
    const bars = core.domainBreakdown(o.ids, o.ok).map((g) =>
      '<div class="rbar"><span>Domain ' + g.domain + " · " + ui.esc(core.DOMAIN_SHORT[g.domain] || g.name) + "</span><span>" + g.correct + "/" + g.total + "</span>"
      + ui.track(g.correct / g.total, "pass-ref") + "</div>").join("");
    const missed = o.ids.map((id, i) => ({ id, i })).filter((row) => o.ok[row.id] === false);
    const rows = missed.map((row) =>
      '<button type="button" class="miss-row" data-act="' + o.missAct + '" data-index="' + row.i + '"><span class="qid">' + ui.esc(row.id) + "</span>"
      + '<span class="ask">' + ui.esc(core.askOf(core.BY_ID[row.id])) + "</span>" + ui.icon("arrowR", "ic-end") + "</button>").join("");
    return '<div class="results">'
      + '<section class="panel score-card"><p class="kicker">' + ui.esc(o.kicker) + "</p>"
      + '<div class="score-top">' + ui.ring(o.total ? o.correct / o.total : 0, pass ? "pass line met" : "below line") + "<div><h1>" + o.correct + "<span class=\"big-den\"> / " + o.total + "</span></h1>"
      + '<p class="sub score-denom">' + Math.round((o.correct / o.total) * 100) + "% correct</p></div></div>"
      + '<p class="sub">' + ui.esc(o.scoreline) + " Unofficial heuristic: " + passLine + "+ correct (about 700 scaled). AWS uses its own scoring.</p>"
      + '<div class="bars">' + bars + "</div>"
      + '<div class="actions">' + o.actions + "</div></section>"
      + '<section class="panel missed-panel"><div class="panel-head"><h2>Missed</h2><span class="sub">' + (missed.length ? missed.length + " to revisit · click to open" : "Nothing missed") + "</span></div>"
      + '<div class="miss-list">' + (rows || '<p class="sub">Clean run. Try the timed mock next.</p>') + "</div></section></div>";
  }

  function setHtml(set, setId) {
    const { btn } = A.ui;
    const sc = A.core.scoreOf(set);
    const missedCount = set.ids.filter((id) => set.ok[id] === false).length;
    return layout({
      kicker: "Results", ids: set.ids, ok: set.ok, correct: sc.correct, total: sc.total,
      scoreline: sc.answered + " answered.",
      missAct: "review-q",
      actions: (missedCount ? btn("Practice the " + missedCount + " missed", "missed", { kind: "primary", data: { set: setId }, iconEnd: "arrowR" }) : "")
        + btn("Try again", "restart", { data: { set: setId }, icon: "redo" })
        + btn("Home", "home", { kind: "quiet", icon: "home" }),
    });
  }

  function examHtml(ex) {
    const { btn } = A.ui;
    const correct = ex.ids.filter((id) => ex.ok[id]).length;
    const last = A.ctx.state.examHistory[A.ctx.state.examHistory.length - 1];
    const mins = Math.round(((last ? last.at : Date.now()) - ex.startedAt) / 60000);
    return layout({
      kicker: "Mock results", ids: ex.ids, ok: ex.ok, correct, total: ex.ids.length,
      scoreline: Math.min(mins, ex.durationMin) + " of " + ex.durationMin + " min used.",
      missAct: "exam-review",
      actions: btn("Review with rationales", "exam-review", { kind: "primary", data: { index: 0 }, iconEnd: "arrowR" })
        + btn("New mock", "exam-intro", { icon: "redo" })
        + btn("Home", "home", { kind: "quiet", icon: "home" }),
    });
  }

  A.results = { setHtml, examHtml };
})(this);
