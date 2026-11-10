/* AIB-C01 practice app — duskyAI side project. Boot, render loop, events. */
(function (root) {
  const A = root.AIB;
  const app = document.getElementById("app");
  const importFile = document.getElementById("import-file");
  const QUESTIONS = root.AIB_QUESTIONS;

  if (!Array.isArray(QUESTIONS) || !QUESTIONS.length) {
    app.textContent = "Question data did not load.";
    return;
  }

  const storage = (function () {
    try { return root.localStorage; } catch (err) {
      const mem = {};
      return { getItem: (k) => mem[k] || null, setItem: (k, v) => { mem[k] = v; }, removeItem: (k) => { delete mem[k]; } };
    }
  })();

  A.core = A.createCore(QUESTIONS);
  A.ctx = { state: A.core.loadState(storage), view: { name: "home" }, justRevealed: false };
  document.body.classList.add("has-app");

  function showToast(msg) {
    let el = document.getElementById("save-toast");
    if (!el) {
      el = document.createElement("p");
      el.id = "save-toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      app.parentElement.insertBefore(el, app);
    }
    el.textContent = msg;
    el.hidden = false;
  }

  function save() {
    if (A.core.saveState(storage, A.ctx.state)) {
      const el = document.getElementById("save-toast");
      if (el) el.hidden = true;
    } else {
      showToast("Could not save progress. Private browsing or storage full. Export a backup.");
    }
  }

  function render() {
    A.exam.stopClock();
    const name = A.ctx.view.name;
    if (name === "home") app.innerHTML = A.home.html();
    else if (name === "exam-intro") app.innerHTML = A.home.introHtml();
    else if (name === "exam") app.innerHTML = A.exam.html();
    else app.innerHTML = A.quiz.html();
    A.ctx.justRevealed = false;
    document.body.classList.toggle("in-quiz", !!app.querySelector(".quiz-body"));
    window.scrollTo(0, 0);
    A.ui.centerActiveDot();
    if (name === "exam" && A.core.hasActiveExam(A.ctx.state)) A.exam.startClock();
  }

  function go(view) {
    A.ctx.view = view;
    render();
  }

  function commit() {
    save();
    render();
  }

  function exportProgress() {
    const blob = new Blob([JSON.stringify(A.ctx.state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aib-c01-progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function onImportFile() {
    const file = importFile.files && importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object" || !data.sets) throw new Error("bad");
        if (confirm("Replace all progress with this file?")) {
          A.ctx.state = A.core.normalizeState(data);
          save();
          go({ name: "home" });
        }
      } catch (err) {
        alert("Invalid progress file.");
      }
      importFile.value = "";
    };
    reader.readAsText(file);
  }

  function clearAll() {
    if (!confirm("Clear all progress, saved questions, and mock history?")) return;
    A.ctx.state = A.core.defaultState();
    save();
    go({ name: "home" });
  }

  const num = (el, key) => Number(el.dataset[key] || 0);
  const ACTIONS = {
    home: () => go({ name: "home" }),
    start: (el) => A.quiz.start(el.dataset.set, false),
    restart: (el) => A.quiz.start(el.dataset.set, true),
    results: (el) => go({ name: "quiz", setId: el.dataset.set }),
    missed: (el) => A.quiz.startMissed(el.dataset.set),
    "review-q": (el) => A.quiz.moveTo(num(el, "index")),
    opt: (el) => A.quiz.toggle(el.dataset.letter),
    check: () => A.quiz.check(),
    next: () => A.quiz.next(),
    prev: () => A.quiz.prev(),
    "jump-learn": (el) => A.quiz.moveTo(num(el, "index")),
    "toggle-save": () => A.quiz.toggleSave(),
    "exam-intro": () => go({ name: "exam-intro" }),
    "exam-start": (el) => A.exam.start(num(el, "min")),
    "exam-continue": () => go({ name: "exam" }),
    "exam-opt": (el) => A.exam.toggle(el.dataset.letter),
    "exam-next": () => A.exam.next(),
    "exam-prev": () => A.exam.moveTo(A.ctx.state.exam.cursor - 1),
    "jump-exam": (el) => A.exam.moveTo(num(el, "index")),
    "exam-flag": () => A.exam.flag(),
    "exam-submit": () => A.exam.submit(false),
    "exam-review": (el) => A.exam.review(num(el, "index")),
    export: exportProgress,
    import: () => importFile.click(),
    clear: clearAll,
  };

  function closeMenus(except) {
    document.querySelectorAll("details.menu[open]").forEach((d) => { if (d !== except) d.open = false; });
  }

  document.addEventListener("click", (event) => {
    closeMenus(event.target.closest("details.menu"));
    const el = event.target.closest("[data-act]");
    if (!el || !app.contains(el) || el.disabled) return;
    const fn = ACTIONS[el.dataset.act];
    if (!fn) return;
    if (el.closest(".menu-pop")) closeMenus();
    fn(el);
  });

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Escape") return closeMenus();
    if (event.target.closest && event.target.closest("input, textarea, select, summary")) return;
    const key = event.key.toUpperCase();
    if (A.ctx.view.name === "quiz") A.quiz.onKey(event, key);
    else if (A.ctx.view.name === "exam") A.exam.onKey(event, key);
  });

  if (importFile) importFile.addEventListener("change", onImportFile);

  A.app = { save, render, go, commit };
  if (A.core.migrateAnswers(A.ctx.state)) save();
  render();
})(this);
