/* Practice Village · landing interactions + live Concierge demo */
(function () {
  "use strict";

  /* ---- config: drop real links/keys here when ready ---- */
  var CONFIG = {
    /* Founding Circle ($97) and $19/mo retired 2026-08-11. Paste the new Stripe
       payment links here when JoYi creates them; until then paid buttons route
       to the Charter List capture with a note. */
    stripeVillager: "https://buy.stripe.com/8x2fZa3q89NscN33OB4800i",     // $149/year Founding Villager (created 2026-08-12, plink_1U3SBE2ZVkTQmuLQcHdmQ7s9)
    stripeMembership: "https://buy.stripe.com/5kQ28k0dWf7M6oF1Gt4800j",   // $15/mo Membership (created 2026-08-12, plink_1U3SHI2ZVkTQmuLQc8dFuGso)
    whatsappInvite: "",     // WhatsApp porch link (channel or wa.me)
    signupEndpoint: "",     // POST endpoint for signups
    seatsTaken: 0,          // founding seats sold; update until webhook automation lands
    liveConcierge: true    // live Gemini ask-row; OFF in prod until the spec rebuild ships
  };

  /* single source of truth for the 108-seat counter (the Studio page shows a static line) */
  var seatsEl = document.getElementById("seatsLeft");
  if (seatsEl) seatsEl.textContent = Math.max(0, 108 - CONFIG.seatsTaken);

  /* ============ the Concierge: one live conversation (02_MVP spec) ============
     Chips seed it ("What feels heaviest this week?"), replies follow the spec:
     one reflection, one next-best question, a choice menu SHE picks from.
     Next-step ceremony only when she chose an action. Saves only by her choice. */
  var demoBody = document.getElementById("demoBody");
  var demoStack = document.getElementById("demoStack");
  var savedCount = 0;

  function saveCard(text) {
    if (savedCount === 0) demoStack.innerHTML = "";
    savedCount++;
    var c = document.createElement("span");
    c.className = "savedcard";
    c.textContent = text;
    demoStack.appendChild(c);
    if (savedCount === 1) {
      var teach = document.createElement("p");
      teach.className = "demo__teach fade-in";
      teach.innerHTML = "↑ That's your Concierge building your <strong>record</strong>. Join, and it keeps growing. You take it with you, anywhere.";
      var layer = document.getElementById("demoLayer");
      if (layer) layer.appendChild(teach);
    }
  }

  var SEEDS = {
    money:   "Money feels heaviest this week.",
    housing: "Housing feels heaviest this week.",
    work:    "Work feels heaviest this week.",
    family:  "Family feels heaviest this week.",
    stuck:   "I feel stuck. Everything is heavy at once.",
    body:    "My body feels heaviest this week."
  };
  var CHOICE_LABELS = {
    understand:       "Help me understand what's happening",
    one_action:       "One small action today",
    trusted_resource: "A trusted resource",
    save_this:        "Keep this in my record",
    keep_private:     "Keep this private"
  };
  var CHOICE_SENDS = {
    understand:       "Help me understand what is happening first.",
    one_action:       "Give me one small action I can take today.",
    trusted_resource: "Point me to a trusted resource for this."
  };

  var liveMsgs = [];
  var lastReply = null;
  var pendingCards = [];
  var askBusy = false;
  var askForm = document.getElementById("demoAsk");
  var askInput = document.getElementById("demoAskInput");

  function esc(t) {
    var d = document.createElement("div");
    d.textContent = t == null ? "" : t;
    return d.innerHTML;
  }

  function threadHtml() {
    return liveMsgs.map(function (m) {
      return '<p class="demo__msg demo__msg--' + (m.role === "user" ? "me" : "c") + '">' + esc(m.text) + "</p>";
    }).join("");
  }

  function renderConvo(d) {
    var html = '<div class="fade-in">' + threadHtml();
    if (d) {
      if (d.nextStep) {
        html += '<div class="demo__result"><span class="demo__rlabel">your clear next step</span>' +
                '<p class="demo__act">' + esc(d.nextStep) + "</p></div>";
      }
      if (d.results && d.results.items) {
        html += '<div class="demo__result"><span class="demo__rlabel">' + esc(d.results.title) + "</span>";
        if (d.results.items.length) {
          html += '<ul class="demo__found">' + d.results.items.map(function (it) {
            return '<li><a href="' + esc(it.href) + '" target="_blank" rel="noopener">' + esc(it.name) + "</a> · " + esc(it.detail) + "</li>";
          }).join("") + "</ul>";
        }
        html += '<p class="demo__srcnote">' + esc(d.results.sourceNote) + "</p></div>";
      }
      if (d.searchHelp) {
        html += '<div class="demo__result"><span class="demo__rlabel">search this, together</span>' +
                '<p class="demo__query"><code>' + esc(d.searchHelp.query) + "</code></p>" +
                '<p class="demo__srcnote">' + esc(d.searchHelp.trustNote) + "</p>";
        if (d.searchHelp.steps && d.searchHelp.steps.length) {
          html += '<ol class="demo__steps">' + d.searchHelp.steps.map(function (st) { return "<li>" + esc(st) + "</li>"; }).join("") + "</ol>";
        }
        html += "</div>";
      }
      if (d.route) {
        html += '<p class="demo__route">when you want it: <b><a href="' + esc(d.route.href) + '"' +
                (String(d.route.href).charAt(0) === "#" ? "" : ' target="_blank" rel="noopener"') + ">" + esc(d.route.label) + "</a></b></p>";
      }
      if (d.quickReplies && d.quickReplies.length) {
        html += '<div class="demo__chips demo__chips--quick">' + d.quickReplies.map(function (q) {
          return '<button data-quick="' + esc(q) + '">' + esc(q) + "</button>";
        }).join("") + "</div>";
      }
      var menu = (d.choices || []).filter(function (c) { return c !== "save_this"; });
      if (menu.length) {
        html += '<div class="demo__chips demo__chips--menu">' + menu.map(function (c) {
          return '<button data-choice="' + c + '">' + esc(CHOICE_LABELS[c] || c) + "</button>";
        }).join("") + "</div>";
      }
    }
    if (pendingCards.length) {
      html += '<p class="demo__pending">' + pendingCards.length + (pendingCards.length === 1 ? " moment" : " moments") + ' set aside · <button class="demo__wrap" type="button">wrap up and review</button></p>';
    }
    html += '<button class="demo__reset demo__reset--lone" type="button">↺ start over</button></div>';
    demoBody.innerHTML = html;
    demoBody.querySelectorAll("[data-choice]").forEach(function (b) {
      b.addEventListener("click", function () { pickChoice(b.getAttribute("data-choice"), b); });
    });
    demoBody.querySelectorAll("[data-quick]").forEach(function (b) {
      b.addEventListener("click", function () { askConcierge(b.getAttribute("data-quick")); });
    });
    var wrapBtn = demoBody.querySelector(".demo__wrap");
    if (wrapBtn) wrapBtn.addEventListener("click", renderWrapUp);
    var resetBtn = demoBody.querySelector(".demo__reset");
    if (resetBtn) resetBtn.addEventListener("click", function () { liveMsgs = []; lastReply = null; resetDemo(); });
    demoBody.scrollTop = demoBody.scrollHeight;
  }

  function pickChoice(choice, btn) {
    if (choice === "keep_private") {
      pendingCards.pop();
      btn.disabled = true; btn.textContent = "✓ kept private, nothing set aside";
      var p = demoBody.querySelector(".demo__pending");
      if (p && !pendingCards.length) p.remove();
      return;
    }
    if (CHOICE_SENDS[choice]) askConcierge(CHOICE_SENDS[choice]);
  }

  /* session-end review: ONE consent moment, per CONCIERGE_SCOPE (JoYi 2026-08-12) */
  function renderWrapUp() {
    var html = '<div class="fade-in"><p class="demo__q">Before you go: keep any of this in your record?</p><div class="demo__wraplist">';
    pendingCards.forEach(function (c, i) {
      html += '<label class="demo__wrapitem"><input type="checkbox" checked data-i="' + i + '"> ' + esc(c) + "</label>";
    });
    html += '</div><button class="demo__save" type="button">Keep the checked ones</button> <button class="demo__reset" type="button">keep nothing, discard all</button></div>';
    demoBody.innerHTML = html;
    demoBody.querySelector(".demo__save").addEventListener("click", function () {
      demoBody.querySelectorAll("input[data-i]:checked").forEach(function (cb) { saveCard(pendingCards[Number(cb.getAttribute("data-i"))]); });
      pendingCards = []; liveMsgs = []; lastReply = null; resetDemo();
    });
    demoBody.querySelector(".demo__reset").addEventListener("click", function () {
      pendingCards = []; liveMsgs = []; lastReply = null; resetDemo();
    });
  }

  function askConcierge(text) {
    if (askBusy) return;
    askBusy = true;
    liveMsgs.push({ role: "user", text: text });
    demoBody.innerHTML = '<div class="fade-in">' + threadHtml() + '<p class="demo__cleared">the Concierge is thinking…</p></div>';
    demoBody.scrollTop = demoBody.scrollHeight;
    fetch("/concierge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: liveMsgs })
    }).then(function (r) { return r.json(); }).then(function (d) {
      askBusy = false;
      if (!d.ok) {
        liveMsgs.pop();
        renderConvo(lastReply);
        demoBody.insertAdjacentHTML("beforeend", '<p class="demo__msg demo__msg--c">' + esc(d.error || "The Concierge is away from the desk. Try again in a moment.") + "</p>");
        return;
      }
      liveMsgs.push({ role: "model", text: d.reply });
      lastReply = d;
      if (d.card && pendingCards.indexOf(d.card) === -1) pendingCards.push(d.card);
      renderConvo(d);
    }).catch(function () {
      askBusy = false;
      liveMsgs.pop();
      renderConvo(lastReply);
      demoBody.insertAdjacentHTML("beforeend", '<p class="demo__msg demo__msg--c">The Concierge is away from the desk. Try again in a moment.</p>');
    });
  }

  function bindChips() {
    var chips = document.getElementById("demoChips");
    if (!chips) return;
    chips.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        var seed = SEEDS[b.getAttribute("data-k")];
        if (seed) askConcierge(seed);
      });
    });
  }

  function resetDemo() {
    demoBody.innerHTML =
      '<div class="fade-in">' +
      '<p class="demo__q">What feels heaviest this week?</p>' +
      '<div class="demo__chips" id="demoChips">' +
        '<button data-k="money">Money</button>' +
        '<button data-k="housing">Housing</button>' +
        '<button data-k="work">Work</button>' +
        '<button data-k="family">Family</button>' +
        '<button data-k="stuck">I feel stuck</button>' +
        '<button data-k="body">My body</button>' +
      "</div></div>";
    bindChips();
  }

  bindChips();

  if (askForm && askInput) {
    askForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var t = askInput.value.trim();
      if (!t) return;
      askInput.value = "";
      askConcierge(t);
    });
  }


  /* ============ Rebuild Arc pills: tap a step, read what it means ============ */
  var RAW_EXPLAIN = {
    arrive:   "Come into the present. Feel what it is like to be welcomed in your own body, your own space, and your own life.",
    notice:   "Build awareness without rushing to fix anything. Notice what you feel, what you need, what you repeat, and what is asking for your attention.",
    connect:  "Reach toward people, practices, resources, and relationships that support who you are becoming.",
    practice: "Move from knowing to doing. Try new responses, new habits, and new ways of being until they become available to you in daily life.",
    explore:  "Stay open. Experiment. Be curious about what you like, what you want, and what actually works for you instead of automatically following what works for someone else.",
    choose:   "Practice authentic responsibility. Notice where you have handed away your power, decide what is yours to carry, and use your ability to choose the life you want to live."
  };
  var RAW_WEEKS = {
    w1: "Presence, welcome, mindfulness, and awareness. Where am I now, and what can I see when I stop long enough to pay attention?",
    w2: "Support and action. Who and what helps me move forward, and what do I need to practice instead of simply understand?",
    w3: "Curiosity, experimentation, authentic responsibility, and personal power. What works for me, what is mine to decide, and where do I want to take my power back?",
    w4: "Bring the Arc together. Identify what you want to continue practicing, what you are choosing now, and how you want to use the Rebuild Arc when life changes again."
  };
  function wireSteps(listId, textId, table, attr) {
    var list = document.getElementById(listId), out = document.getElementById(textId);
    if (!list || !out) return;
    list.querySelectorAll("li").forEach(function (li) {
      li.setAttribute("tabindex", "0");
      li.setAttribute("role", "button");
      var show = function () {
        list.querySelectorAll("li").forEach(function (x) { x.classList.remove("is-on"); });
        li.classList.add("is-on");
        out.textContent = table[li.getAttribute(attr)] || "";
      };
      li.addEventListener("click", show);
      li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(); } });
    });
  }
  wireSteps("rawSteps", "rawExplain", RAW_EXPLAIN, "data-k");
  wireSteps("rawWeeks", "rawWeekText", RAW_WEEKS, "data-w");

  /* ============ card stack (PIL) ============ */
  var cardNext = document.getElementById("cardNext");
  var stack = document.getElementById("cardstack");
  if (cardNext && stack) {
    cardNext.addEventListener("click", function () {
      var cards = Array.prototype.slice.call(stack.querySelectorAll(".icard"));
      var n = cards.length;
      cards.forEach(function (card) {
        var i = parseInt(card.style.getPropertyValue("--i"), 10);
        var next = (i - 1 + n) % n;
        card.style.setProperty("--i", next);
      });
    });
  }

  /* ============ nav + scroll ============ */
  var nav = document.getElementById("nav");
  var menuBtn = document.getElementById("menuBtn");
  var sticky = document.getElementById("sticky");

  var onScroll = function () {
    var y = window.scrollY;
    nav.classList.toggle("is-stuck", y > 8);
    if (sticky) sticky.classList.toggle("show", y > 700);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll(".nav__links a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); });
    });
  }

  /* ============ reveal ============ */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add("in"); }); }

  /* ============ plan buttons -> Stripe / form ============ */
  document.querySelectorAll("[data-plan]").forEach(function (btn) {
    btn.addEventListener("click", function (ev) {
      var plan = btn.getAttribute("data-plan");
      var link = plan === "villager" ? CONFIG.stripeVillager : plan === "membership" ? CONFIG.stripeMembership : "";
      if (link) { ev.preventDefault(); window.location.href = link; return; }
      /* No checkout link yet: land on the Charter List capture with a note */
      var note = document.getElementById("charterNote");
      if (note) note.textContent = "Founding checkout opens shortly. Join the Charter List and we will email you the moment it is live.";
      var emailEl = document.querySelector('#charterForm input[name="email"]');
      if (emailEl) setTimeout(function () { emailEl.focus(); }, 400);
    });
  });

  var wa = document.getElementById("waLink");
  if (wa && CONFIG.whatsappInvite) wa.href = CONFIG.whatsappInvite;

  /* ============ free Charter List capture (in the pricing card) ============ */
  var charter = document.getElementById("charterForm");
  var charterNote = document.getElementById("charterNote");
  if (charter) {
    charter.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var emailEl = charter.querySelector('input[name="email"]');
      var email = (emailEl && emailEl.value.trim()) || "";
      if (!email || email.indexOf("@") < 1) { charterNote.textContent = "Please add a valid email."; return; }
      charterNote.textContent = "Sending…";
      var onLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
      var fail = function () {
        charterNote.textContent = onLocal
          ? "Local preview can't submit forms. This works on the live site."
          : "Something hiccuped. Email info@aidedeq.org and we'll get you in.";
      };
      // capture to Netlify Forms (appears in Netlify dashboard, can email you)
      var body = "form-name=founding-signup&plan=list&email=" + encodeURIComponent(email);
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
        .then(function (r) {
          if (r.ok) { charter.reset(); charterNote.textContent = "You're on the Charter List. We'll tell you the moment a new wing opens."; }
          else { fail(); }
        })
        .catch(fail);
    });
  }

  /* ============ flip room tiles (the Center) ============ */
  document.querySelectorAll(".room").forEach(function (room) {
    var flip = function () { room.classList.toggle("is-flipped"); };
    room.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;   /* links inside a card navigate, never flip */
      flip();
    });
    room.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
    });
  });

  /* ============ breathe tool (a gift from HUSH) ============ */
  var breatheBtn = document.getElementById("breatheBtn");
  var breathe = document.getElementById("breathe");
  var breatheOrb = document.getElementById("breatheOrb");
  var breatheWord = document.getElementById("breatheWord");
  var breatheTime = document.getElementById("breatheTime");
  var breatheClose = document.getElementById("breatheClose");
  var bTimers = [];
  var BREATH_PHASES = [
    { label: "Breathe in",  ms: 5000, scale: 1.05 },
    { label: "Hold",        ms: 2000, scale: 1.05 },
    { label: "Breathe out", ms: 5000, scale: 0.62 }
  ];
  var BREATH_ROUNDS = 5;

  function clearBreathe() { bTimers.forEach(function (t) { clearTimeout(t); }); bTimers = []; }

  function openBreathe() {
    if (!breathe || breathe.classList.contains("open")) return;
    breathe.classList.add("open");
    breathe.setAttribute("aria-hidden", "false");

    var seq = [];
    for (var r = 0; r < BREATH_ROUNDS; r++) seq = seq.concat(BREATH_PHASES);

    // reset orb to resting size with no transition, then arm the smooth transition
    breatheOrb.style.transition = "none";
    breatheOrb.style.transform = "scale(0.62)";
    void breatheOrb.offsetWidth;
    breatheOrb.style.transition = "transform linear";

    var idx = 0;
    var step = function () {
      if (idx >= seq.length) {
        breatheWord.textContent = "Well done";
        breatheTime.textContent = "that's 5 rounds";
        bTimers.push(setTimeout(closeBreathe, 1800));
        return;
      }
      var p = seq[idx];
      breatheWord.textContent = p.label;
      breatheOrb.style.transitionDuration = p.ms + "ms";
      breatheOrb.style.transform = "scale(" + p.scale + ")";
      breatheTime.textContent = "Round " + (Math.floor(idx / BREATH_PHASES.length) + 1) + " of " + BREATH_ROUNDS;
      idx++;
      bTimers.push(setTimeout(step, p.ms));
    };
    step();
  }

  function closeBreathe() {
    if (!breathe) return;
    clearBreathe();
    breathe.classList.remove("open");
    breathe.setAttribute("aria-hidden", "true");
    breatheOrb.style.transition = "none";
    breatheOrb.style.transform = "scale(0.62)";
  }

  if (breatheBtn) breatheBtn.addEventListener("click", function () { openBreathe(); armShake(); });
  if (breatheClose) breatheClose.addEventListener("click", closeBreathe);
  if (breathe) breathe.addEventListener("click", function (e) { if (e.target === breathe) closeBreathe(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeBreathe(); });

  /* shake-to-breathe on mobile (progressive enhancement) */
  var shakeArmed = false, lastShake = 0;
  function armShake() {
    if (shakeArmed) return;
    var start = function () {
      shakeArmed = true;
      var lx = 0, ly = 0, lz = 0;
      window.addEventListener("devicemotion", function (ev) {
        var a = ev.accelerationIncludingGravity; if (!a) return;
        var delta = Math.abs((a.x || 0) - lx) + Math.abs((a.y || 0) - ly) + Math.abs((a.z || 0) - lz);
        lx = a.x || 0; ly = a.y || 0; lz = a.z || 0;
        var now = Date.now();
        if (delta > 32 && now - lastShake > 1800) { lastShake = now; openBreathe(); }
      });
    };
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission().then(function (s) { if (s === "granted") start(); }).catch(function () {});
    } else if (typeof DeviceMotionEvent !== "undefined") {
      start();
    }
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ============ nav overflow guard (2026-08-13) ============
     Width breakpoints alone cannot predict this: the row's real width depends
     on the visitor's font rendering, browser zoom, and minimum-font-size
     setting. Measure the row and fall back to the menu button whenever the
     links plus the CTA would not fit, whatever the viewport says. */
  (function () {
    var navEl = document.getElementById("nav");
    if (!navEl) return;
    var brand = navEl.querySelector(".nav__brand");
    var links = navEl.querySelector(".nav__links");
    var cta = navEl.querySelector(".nav__cta");
    if (!brand || !links || !cta) return;

    function fitNav() {
      if (navEl.classList.contains("is-open")) return;
      navEl.classList.remove("is-crowded");
      if (getComputedStyle(links).display === "none") return; // CSS already compact
      var cs = getComputedStyle(navEl);
      var gap = parseFloat(cs.columnGap || cs.gap) || 0;
      var room = navEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var needed = brand.offsetWidth + links.scrollWidth + cta.offsetWidth + gap * 2;
      if (needed > room - 8) navEl.classList.add("is-crowded");
    }

    fitNav();
    window.addEventListener("resize", fitNav, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav).catch(function () {});
  })();
})();
