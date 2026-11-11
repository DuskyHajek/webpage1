/* Home dashboard and timed mock intro. */
(function (root) {
  const A = (root.AIB = root.AIB || {});

  function primaryLearnId(state) {
    const { core } = A;
    if (core.hasActiveExam(state)) return "";
    if (core.phaseOf(state.sets.all) === "active") return "all";
    const domain = core.DOMAIN_IDS.find((d) => core.phaseOf(state.sets[String(d)]) === "active");
    if (domain) return String(domain);
    if (core.phaseOf(state.sets.all) === "new") return "all";
    return "";
  }

  function setActions(setId, phase, primary) {
    const { btn } = A.ui;
    const data = { set: setId };
    const kind = primary ? "primary" : undefined;
    if (phase === "active") {
      return btn("Continue", "start", { data, kind, iconEnd: "arrowR", cls: "sm" })
        + btn("", "restart", { data, kind: "quiet", cls: "sm icon-only", icon: "redo", title: "Start over" });
    }
    if (phase === "done") {
      return btn("Results", "results", { data, cls: "sm" })
        + btn("", "restart", { data, kind: "quiet", cls: "sm icon-only", icon: "redo", title: "Try again" });
    }
    return btn("Start", "start", { data, kind, iconEnd: "arrowR", cls: "sm" });
  }

  function scoreMeter(correct, total) {
    const pct = total ? Math.round(correct / total * 100) : 0;
    const label = correct + " of " + total + " correct";
    return '<div class="track" role="meter" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + correct + '" aria-label="' + A.ui.esc(label) + '"><i style="width:' + pct + '%"></i></div>';
  }

  function domainMeter(state, domainId) {
    const ids = A.core.idsFor(state, String(domainId));
    const tries = state.firstTry || {};
    const answeredIds = ids.filter((id) => id in tries);
    if (!answeredIds.length) return "";
    const correct = answeredIds.filter((id) => tries[id]).length;
    const answered = answeredIds.length;
    const pct = correct / answered;
    const low = answered >= 5 && pct < 0.6 ? " low" : "";
    const label = "First try, " + correct + " of " + answered + " answered";
    return '<div class="track dacc' + low + '" role="meter" aria-valuemin="0" aria-valuemax="' + answered + '" aria-valuenow="' + correct + '" aria-label="' + A.ui.esc(label) + '"><i style="width:' + Math.round(pct * 100) + '%"></i></div>';
  }

  function setNote(set, phase, fallback, compact) {
    if (phase === "new") return fallback;
    const sc = A.core.scoreOf(set);
    if (phase === "done") return sc.correct + (compact ? "/" : " of ") + sc.total + " correct";
    return compact
      ? sc.answered + "/" + sc.total + " done"
      : sc.answered + " of " + sc.total + " answered · " + sc.correct + " right";
  }

  function domainsHtml(state) {
    const { core, ui } = A;
    const primaryId = primaryLearnId(state);
    const rows = core.DOMAIN_IDS.map((d) => {
      const id = String(d);
      const set = state.sets[id];
      const phase = core.phaseOf(set);
      const count = core.idsFor(state, id).length;
      const weight = core.DOMAIN_WEIGHT[d] != null ? '<span class="wt">' + core.DOMAIN_WEIGHT[d] + "% of exam</span>" : "";
      return '<div class="drow">'
        + '<div class="dname"><span class="dnum">' + d + "</span><div><strong>"
        + ui.esc(core.DOMAIN_SHORT[d] || "Domain " + d) + weight
        + "</strong><small>" + ui.esc(core.DOMAINS[d]) + "</small></div></div>"
        + '<div class="dset"><span>' + ui.esc(setNote(set, phase, count + " questions", true)) + "</span>"
        + domainMeter(state, id)
        + '<div class="actions">' + setActions(id, phase, primaryId === id) + "</div></div>"
        + "</div>";
    }).join("");
    return '<section class="panel domains"><div class="panel-head"><h2>Domains</h2></div>' + rows + "</section>";
  }

  function tilesHtml(state) {
    const { core, ui } = A;
    const all = state.sets.all;
    const allPhase = core.phaseOf(all);
    const primaryId = primaryLearnId(state);
    const fullSc = allPhase === "new" ? null : core.scoreOf(all);
    const fullScore = fullSc ? scoreMeter(fullSc.correct, fullSc.total) : "";
    const fullOrder = all && all.shuffled
      ? core.QUESTIONS.length + " questions, shuffled"
      : core.QUESTIONS.length + " questions in exam order";
    const full = '<article class="tile"><p class="eyebrow">Learn</p><h3>Full practice set</h3><p>'
      + ui.esc(setNote(all, allPhase, fullOrder)) + "</p>"
      + fullScore + '<div class="actions">' + setActions("all", allPhase, primaryId === "all") + "</div></article>";

    const savedList = core.savedIds(state);
    const savedSet = state.sets.saved;
    const savedPhase = core.phaseOf(savedSet);
    const saved = savedList.length
      ? '<article class="tile"><p class="eyebrow">Review</p><h3>Saved questions</h3><p>'
        + ui.esc(savedPhase === "active" ? core.scoreOf(savedSet).answered + " of " + savedList.length + " reviewed" : savedList.length + " saved from misses and pins")
        + '</p><div class="actions">' + ui.btn(savedPhase === "active" ? "Continue" : "Review", savedPhase === "active" ? "start" : "restart", { data: { set: "saved" }, iconEnd: "arrowR", cls: "sm" }) + "</div></article>"
      : '<article class="tile empty"><p class="eyebrow">Review</p><h3>Saved questions</h3><p>Misses land here automatically. Pin any question with <kbd>S</kbd>.</p></article>';

    const active = core.hasActiveExam(state);
    const last = state.examHistory[state.examHistory.length - 1];
    const mockNote = active
      ? "In progress · " + Math.max(0, Math.ceil(core.examTimeLeft(state.exam) / 60000)) + " min left"
      : last ? "Last run " + last.correct + "/" + last.total + " · " + core.QUESTIONS.length + " questions, no hints"
        : core.QUESTIONS.length + " questions · 130 or 170 min · no hints";
    const mock = '<article class="tile dark"><p class="eyebrow">Exam pressure</p><h3>Timed mock</h3><p>' + ui.esc(mockNote) + '</p><div class="actions">'
      + (active ? ui.btn("Continue", "exam-continue", { kind: "primary", cls: "sm", iconEnd: "arrowR" }) : ui.btn("Start mock", "exam-intro", { kind: "primary", cls: "sm", icon: "clock" }))
      + "</div></article>";
    return '<div class="tiles">' + full + saved + mock + "</div>";
  }

  function menuHtml() {
    const { btn, icon } = A.ui;
    const prefs = A.ctx.state.prefs || {};
    const dark = prefs.theme === "dark";
    const shuffleRetry = prefs.shuffleOnRetry !== false;
    return '<details class="menu"><summary class="btn quiet icon-only" aria-label="Settings" title="Settings">' + icon("sliders") + "</summary>"
      + '<div class="menu-pop">'
      + btn("Dark mode", "theme", { kind: "quiet", icon: dark ? "moon" : "sun", pressed: dark })
      + btn("Shuffle on retry", "shuffle-retry", { kind: "quiet", icon: "redo", pressed: shuffleRetry, title: "Finished full set, domain, and saved review. Missed questions always shuffle." })
      + "<hr>"
      + btn("Export progress", "export", { kind: "quiet", icon: "download" })
      + btn("Import progress", "import", { kind: "quiet", icon: "upload" })
      + "<hr>" + btn("Clear all progress", "clear", { kind: "danger", icon: "trash" })
      + "</div></details>";
  }

  function html() {
    return '<div class="home">'
      + '<header class="home-head"><div class="head-tools">' + menuHtml() + "</div></header>"
      + '<div class="home-grid">' + tilesHtml(A.ctx.state) + domainsHtml(A.ctx.state) + "</div></div>";
  }

  function introHtml() {
    const { core, ui } = A;
    const state = A.ctx.state;
    const active = core.hasActiveExam(state);
    const warn = active
      ? '<div class="warn"><span>A mock is already running with ' + Math.max(0, Math.ceil(core.examTimeLeft(state.exam) / 60000)) + " min left. Starting a new one discards it.</span>"
        + ui.btn("Continue it", "exam-continue", { cls: "sm", iconEnd: "arrowR" }) + "</div>"
      : "";
    const pace = (min, title, sub) => '<button type="button" class="pace" data-act="exam-start" data-min="' + min + '"><strong>' + min + "<small>min</small></strong><span>" + title + "</span><em>" + sub + "</em>" + ui.icon("arrowR", "ic-end") + "</button>";
    return '<section class="panel intro"><p class="kicker">Timed mock</p><h2>' + core.QUESTIONS.length + " questions, exam pressure</h2>"
      + '<ul class="rules"><li>' + ui.icon("x") + "No rationales until you submit</li><li>" + ui.icon("flag") + "Flag items with <kbd>M</kbd> to revisit</li><li>" + ui.icon("clock") + "Blanks count as wrong; time up submits</li></ul>"
      + warn
      + '<div class="pace-grid">' + pace(130, "Exam guide pace", "Recommended") + pace(170, "Beta pace", "Extra time") + "</div>"
      + ui.btn("Back", "home", { kind: "quiet", icon: "arrowL" }) + "</section>";
  }

  A.home = { html, introHtml };
})(this);
