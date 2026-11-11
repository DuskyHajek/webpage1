/* Shared HTML builders: buttons, icons, ring, question map, options, reveal panel. */
(function (root) {
  const A = (root.AIB = root.AIB || {});

  const ICONS = {
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
    bookmark: '<path d="M6 4h12v17l-6-4-6 4z"/>',
    flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    redo: '<path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
    trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    send: '<path d="M4 12l16-8-6 16-2-7z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/>',
  };

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  }

  function icon(name, cls) {
    return '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + "</svg>";
  }

  function btn(label, act, o) {
    o = o || {};
    const data = Object.entries(o.data || {}).map(([k, v]) => " data-" + k + '="' + esc(v) + '"').join("");
    const attrs = (o.id ? ' id="' + o.id + '"' : "")
      + (o.disabled ? " disabled" : "")
      + (o.pressed !== undefined ? ' aria-pressed="' + o.pressed + '"' : "")
      + (o.title ? ' title="' + esc(o.title) + '" aria-label="' + esc(o.title) + '"' : "");
    return '<button type="button" class="btn ' + (o.kind || "secondary") + (o.cls ? " " + o.cls : "") + '" data-act="' + act + '"' + data + attrs + ">"
      + (o.icon ? icon(o.icon) : "")
      + (label ? '<span class="btn-label">' + esc(label) + "</span>" : "")
      + (o.iconEnd ? icon(o.iconEnd, "ic-end") : "")
      + (o.key ? "<kbd>" + esc(o.key) + "</kbd>" : "")
      + "</button>";
  }

  function ring(pct, label, empty) {
    const off = (327 * (1 - pct)).toFixed(1);
    return '<div class="ring" aria-hidden="true"><svg viewBox="0 0 120 120">'
      + '<circle cx="60" cy="60" r="52" class="ring-bg"/>'
      + (empty ? "" : '<circle cx="60" cy="60" r="52" class="ring-val" style="--off:' + off + '" transform="rotate(-90 60 60)"/>')
      + '</svg><div class="ring-text"><strong>' + (empty ? "—" : Math.round(pct * 100) + "%") + "</strong>"
      + (label ? "<span>" + esc(label) + "</span>" : "") + "</div></div>";
  }

  function track(pct, cls) {
    return '<div class="track' + (cls ? " " + cls : "") + '"><i style="width:' + Math.round(pct * 100) + '%"></i></div>';
  }

  function stemHtml(parts) {
    let last = -1;
    parts.forEach((part, index) => { if (part.t === "p") last = index; });
    let html = "";
    let index = 0;
    while (index < parts.length) {
      if (parts[index].t === "b") {
        let items = "";
        while (index < parts.length && parts[index].t === "b") {
          items += "<li>" + esc(parts[index].v) + "</li>";
          index += 1;
        }
        html += "<ul>" + items + "</ul>";
      } else {
        html += "<p" + (index === last ? ' class="ask"' : "") + ">" + esc(parts[index].v) + "</p>";
        index += 1;
      }
    }
    return html;
  }

  function dotMap(store, cursor, o) {
    const flags = o.flags || {};
    const graded = o.graded || null;
    const answered = o.answered || {};
    let html = '<nav class="navstrip" aria-label="Question map">';
    store.ids.forEach((id, i) => {
      let cls = "dot";
      const bits = ["Question " + (i + 1)];
      if (i === cursor) {
        cls += " on";
        bits.push("current");
      }
      if (flags[id]) {
        cls += " flagged";
        bits.push("flagged");
      }
      if ((answered[id] && answered[id].length) || (store.drafts && store.drafts[id] && store.drafts[id].length)) {
        cls += " answered";
        bits.push("answered");
      }
      if (graded && id in graded) {
        cls += graded[id] ? " hit" : " miss";
        bits.push(graded[id] ? "correct" : "missed");
      }
      html += '<button type="button" class="' + cls + '" data-act="' + o.jumpAct + '" data-index="' + i + '" aria-label="' + esc(bits.join(", ")) + '">' + (i + 1) + "</button>";
    });
    return html + "</nav>";
  }

  function options(store, id, draft, revealed, act) {
    const q = A.core.BY_ID[id];
    return A.core.displayOptions(store, id).map((opt) => {
      const on = draft.includes(opt.displayLetter);
      const isAnswer = q.answer.includes(opt.origLetter);
      let cls = "opt";
      let extra = "";
      if (revealed) {
        cls += isAnswer ? " correct" : on ? " wrong" : " dim";
        const tag = isAnswer ? (on ? "Your pick · correct" : "Answer") : on ? "Your pick" : "";
        if (tag) extra += '<span class="tag">' + tag + "</span>";
        if (!isAnswer && q.whyNot[opt.origLetter]) extra += '<span class="why">' + esc(q.whyNot[opt.origLetter]) + "</span>";
      }
      return '<button type="button" class="' + cls + '" data-act="' + act + '" data-letter="' + opt.displayLetter + '" aria-pressed="' + (on && !revealed) + '"' + (revealed ? " disabled" : "") + ">"
        + '<span class="letter">' + opt.displayLetter + "</span>"
        + '<span class="otext">' + esc(opt.text) + extra + "</span></button>";
    }).join("");
  }

  function reveal(store, id, picked, good) {
    const core = A.core;
    const q = core.BY_ID[id];
    const ans = core.letters(core.origToDisplay(store, id, q.answer));
    const mine = core.letters(core.origToDisplay(store, id, picked));
    const verdict = good ? "Correct · " + ans
      : picked.length ? "Not quite · you chose " + mine + " · answer is " + ans
        : "Unanswered · answer is " + ans;
    return '<section class="explain ' + (good ? "good" : "bad") + '" id="explain" aria-live="polite">'
      + '<p class="verdict">' + icon(good ? "check" : "x") + esc(verdict) + "</p>"
      + '<p class="rationale">' + esc(q.whyRight) + "</p>"
      + '<p class="skill">Exam guide · Task ' + esc(q.task) + " · Skill " + esc(q.skill) + "</p></section>";
  }

  function selectLabel(n) {
    return n === 1 ? "Select one" : "Select " + ["", "one", "two", "three", "four"][n];
  }

  function qbar(o) {
    const right = o.right ? '<div class="qright">' + o.right + "</div>" : "";
    let bar = "";
    if (o.progress && o.progress.max) {
      const value = o.progress.value;
      const max = o.progress.max;
      const pct = Math.max(0, Math.min(100, Math.round(value / max * 100)));
      bar = '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + max + '" aria-valuenow="' + value + '" aria-label="' + esc(o.progress.label) + '"><span style="width:' + pct + '%"></span></div>';
    }
    return '<header class="qbar"><div class="qbar-row">'
      + btn("", "home", { kind: "quiet", cls: "icon-only", icon: "home", title: o.homeTitle || "Home" })
      + '<div class="qmeta">' + o.pills.map((p, i) => '<span class="pill' + (i === 0 ? " strong" : "") + '">' + esc(p) + "</span>").join("") + "</div>"
      + right + "</div></header>" + bar;
  }

  function pickHintText(select, picked) {
    let text = "Select " + select;
    if (picked > 0) text += " · " + picked + " of " + select + " selected";
    return text;
  }

  function pickHint(select, picked) {
    if (!select || select < 2) return "";
    return '<p class="pick-hint" id="pick-hint" aria-live="polite">' + esc(pickHintText(select, picked)) + "</p>";
  }

  function syncPickHint(select, picked) {
    const el = document.getElementById("pick-hint");
    if (el && select > 1) el.textContent = pickHintText(select, picked);
  }

  function syncProgress(value, label) {
    const el = document.querySelector('.bar[role="progressbar"]');
    if (!el) return;
    const max = Number(el.getAttribute("aria-valuemax")) || 1;
    el.setAttribute("aria-valuenow", String(value));
    if (label) el.setAttribute("aria-label", label);
    const span = el.querySelector("span");
    if (span) span.style.width = Math.max(0, Math.min(100, Math.round(value / max * 100))) + "%";
  }

  function sourceLine() {
    return '<p class="source">Adapted from <a href="https://www.linkedin.com/posts/purcellmatthew_aws-ai-business-strategist-aib-c01-practice-activity-7514059578137927680-w-jP">Matthew Purcell’s unofficial practice set</a>'
      + ' · <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a>. Not endorsed by the author or AWS.</p>';
  }

  function quizBody(stem, top, opts, cls, hint) {
    return '<div class="quiz-body' + (cls ? " " + cls : "") + '">'
      + '<section class="pane stem-pane"><div class="stem">' + stem + "</div></section>"
      + '<section class="pane opts-pane">' + top + (hint || "") + '<div class="opts" role="group" aria-label="Answers">' + opts + "</div></section></div>"
      + sourceLine();
  }

  function syncOptions(draft) {
    document.querySelectorAll(".opt:not(:disabled)").forEach((el) => {
      el.setAttribute("aria-pressed", draft.includes(el.dataset.letter) ? "true" : "false");
    });
    const dot = document.querySelector(".dot.on");
    if (dot) dot.classList.toggle("answered", draft.length > 0);
  }

  function centerActiveDot() {
    const strip = document.querySelector(".navstrip");
    const dot = strip && strip.querySelector(".dot.on");
    if (dot) strip.scrollLeft = dot.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + dot.offsetWidth / 2;
  }

  A.ui = { esc, icon, btn, ring, track, stemHtml, dotMap, options, reveal, selectLabel, qbar, pickHint, quizBody, syncOptions, syncPickHint, syncProgress, centerActiveDot };
})(this);
