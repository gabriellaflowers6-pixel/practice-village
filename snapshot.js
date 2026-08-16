/* ============================================================
   SNAPSHOT ENGINE
   One engine, two rooms. The page sets data-instrument and this
   builds the questions, scores them, and shows the whole result.

   No email, no account, no gate, and nothing leaves the device:
   scoring is arithmetic on answers held in memory for the length
   of the visit. That is what lets the room say "nothing stored"
   and mean it literally, the way Safety Hall does.
   ============================================================ */
(function () {
  "use strict";

  var root = document.getElementById("snapshot");
  if (!root || !window.SNAPSHOT_DATA) return;

  var KEY = root.getAttribute("data-instrument");
  var DATA = window.SNAPSHOT_DATA[KEY];
  if (!DATA) return;

  var COPY = window.SNAPSHOT_COPY || {};
  var items = DATA.items;
  var answers = {};          /* id -> 1..5, or "skip" */
  var index = 0;

  /* The published instrument runs the same five-point scale for
     every item; reversed items are flipped when scored, never when
     asked, so the wording she reads is the wording that was written. */
  var SCALE = [
    { value: 5, label: "Almost always" },
    { value: 4, label: "Often" },
    { value: 3, label: "Sometimes" },
    { value: 2, label: "Rarely" },
    { value: 1, label: "Never" }
  ];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function scoreFor(item) {
    var raw = answers[item.id];
    if (raw === "skip" || raw == null) return null;
    return item.rev ? (6 - raw) : raw;
  }

  /* A pillar is the mean of its answered items, put on 0..100.
     Skipped items simply do not count, so skipping never reads as
     a low score. A pillar with nothing answered returns null and
     is left out rather than guessed at. */
  function pillarScore(pillar) {
    var vals = items.filter(function (i) { return i.pillar === pillar; })
                    .map(scoreFor)
                    .filter(function (v) { return v != null; });
    if (!vals.length) return null;
    var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    return Math.round(((mean - 1) / 4) * 100);
  }

  function answeredCount() {
    return items.filter(function (i) { return answers[i.id] != null; }).length;
  }

  /* ---------- question view ---------- */
  function renderQuestion() {
    var item = items[index];
    root.innerHTML = "";

    var line = el("div", "progress-line");
    line.append(el("span", null, "Question " + (index + 1) + " of " + items.length),
                el("span", null, Math.round((index / items.length) * 100) + "%"));
    var track = el("div", "progress-track");
    var fill = el("div", "progress-fill");
    fill.style.width = (index / items.length) * 100 + "%";
    track.append(fill);
    root.append(line, track);

    root.append(el("p", "qframe", COPY.frame || "In the past 7 days"));

    var h = el("h2", "qtext", item.text);
    h.id = "qtext";
    root.append(h);

    var group = el("div", "scale");
    group.setAttribute("role", "group");
    group.setAttribute("aria-labelledby", "qtext");
    SCALE.forEach(function (opt) {
      var b = el("button", null);
      b.type = "button";
      b.setAttribute("aria-pressed", answers[item.id] === opt.value ? "true" : "false");
      b.append(el("span", "dot", String(opt.value)), el("span", null, opt.label));
      b.addEventListener("click", function () {
        answers[item.id] = opt.value;
        advance();
      });
      group.append(b);
    });
    root.append(group);

    var nav = el("div", "qnav");
    if (index > 0) {
      var back = el("button", "btn btn--quiet", "Back");
      back.type = "button";
      back.addEventListener("click", function () { index--; renderQuestion(); });
      nav.append(back);
    }
    var skip = el("button", "skip", "Prefer not to answer");
    skip.type = "button";
    skip.addEventListener("click", function () {
      answers[item.id] = "skip";
      advance();
    });
    nav.append(skip);
    root.append(nav);

    var focusTarget = group.querySelector("button");
    if (focusTarget && index > 0) focusTarget.focus();
    if (index === 0) h.setAttribute("tabindex", "-1");
  }

  function advance() {
    if (index < items.length - 1) { index++; renderQuestion(); }
    else { renderResult(); }
  }

  /* ---------- result view ---------- */
  function renderResult() {
    var scoredKeys = Object.keys(DATA.labels);
    var scores = scoredKeys.map(function (k) {
      return { key: k, label: DATA.labels[k], score: pillarScore(k) };
    }).filter(function (s) { return s.score != null; });

    root.innerHTML = "";

    if (!scores.length) {
      root.append(el("h2", "qtext", "Everything was skipped, so there is nothing to show yet."));
      var again = el("button", "btn btn--primary", "Start again");
      again.type = "button";
      again.addEventListener("click", restart);
      root.append(again);
      return;
    }

    /* The lowest pillar is the drift: the place that was most
       depleted this week, which is where the next step starts. */
    var lowest = scores.reduce(function (a, b) { return b.score < a.score ? b : a; });

    var head = el("div", "result-head");
    head.append(el("p", "eyebrow", COPY.resultEyebrow || "Your snapshot"));
    var h1 = el("h1", null, COPY.resultTitle || "Here is your snapshot.");
    h1.setAttribute("tabindex", "-1");
    head.append(h1);
    var answered = answeredCount();
    head.append(el("p", "lede",
      "Based on the " + answered + " of " + items.length +
      " statements you answered. Nothing here was sent anywhere, and nothing was saved."));
    root.append(head);

    var card = el("div", "drift-card");
    card.append(el("p", "eyebrow", COPY.driftLabel || "Primary drift"),
                el("p", "drift-name", lowest.label),
                el("p", "drift-line", DATA.lines[lowest.key] || ""));
    root.append(card);

    root.append(el("h2", null, COPY.mapTitle || "Your map"));
    var map = el("div", "map");
    scores.slice().sort(function (a, b) { return b.score - a.score; }).forEach(function (s) {
      var row = el("div", "map-row" + (s.key === lowest.key ? " is-lowest" : ""));
      var bar = el("div", "map-bar");
      var i = el("i");
      i.style.width = Math.max(s.score, 2) + "%";
      bar.append(i);
      row.append(el("b", null, s.label), bar, el("span", "map-val", s.score));
      map.append(row);
    });
    root.append(map);

    /* Sixth pillar: a friction readout rather than a strength. */
    var sixth = pillarScore(DATA.sixth);
    if (sixth != null && COPY.friction) {
      var friction = 100 - sixth;
      var f = el("div", "friction");
      f.append(el("h3", null, COPY.friction.title));
      var bar = el("div", "bar");
      var fi = el("i");
      fi.style.width = Math.max(friction, 2) + "%";
      bar.append(fi);
      f.append(bar);
      f.append(el("p", null, friction >= 60 ? COPY.friction.high
                          : friction >= 35 ? COPY.friction.middle
                          : COPY.friction.low));
      root.append(f);
    }

    root.append(el("h2", null, "Three days of practice"));
    var plan = el("ol", "plan");
    (DATA.plans[lowest.key] || []).forEach(function (step) {
      plan.append(el("li", null, step));
    });
    root.append(plan);

    root.append(el("p", "caveat", COPY.caveat ||
      "This is a snapshot of one week, not a diagnosis, a test result, or a measure of who you are."));

    root.append(buildInvite());

    var actions = el("div", "result-actions");
    var print = el("button", "btn btn--quiet", "Print or save as PDF");
    print.type = "button";
    print.addEventListener("click", function () { window.print(); });
    var retake = el("button", "btn btn--quiet", "Take it again");
    retake.type = "button";
    retake.addEventListener("click", restart);
    actions.append(print, retake);
    root.append(actions);

    h1.focus();
    window.scrollTo(0, 0);
  }

  /* The invitation replaces the old email wall. She already has
     everything the snapshot promised; this is an offer, not a toll. */
  function buildInvite() {
    var cfg = COPY.invite || {};
    var box = el("div", "invite");
    box.append(el("p", "eyebrow", cfg.eyebrow || "If you want to go further"),
               el("h3", null, cfg.title || ""),
               el("p", null, cfg.body || ""));
    var actions = el("div", "invite-actions");
    if (cfg.primaryHref) {
      var a = el("a", "btn btn--primary", cfg.primaryLabel || "Learn more");
      a.href = cfg.primaryHref;
      actions.append(a);
    }
    var b = el("a", "btn btn--quiet", cfg.secondaryLabel || "Look around the Village");
    b.href = cfg.secondaryHref || "/#center";
    actions.append(b);
    box.append(actions);
    if (cfg.scholarship) box.append(el("p", "scholarship", cfg.scholarship));
    return box;
  }

  function restart() {
    answers = {};
    index = 0;
    renderQuestion();
  }

  /* ---------- start ---------- */
  var startBtn = document.getElementById("startSnapshot");
  if (startBtn) {
    startBtn.addEventListener("click", function () {
      document.getElementById("intro").hidden = true;
      root.hidden = false;
      renderQuestion();
      root.scrollIntoView({ block: "start" });
    });
  }
})();
