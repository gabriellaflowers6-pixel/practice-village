/* Practice Village · landing interactions + live Concierge demo */
(function () {
  "use strict";

  /* ---- config: drop real links/keys here when ready ---- */
  var CONFIG = {
    /* Founding Circle ($97) and $19/mo retired 2026-08-11. Paste the new Stripe
       payment links here when JoYi creates them; until then paid buttons route
       to the Charter List capture with a note. */
    stripeVillager: "",     // $149/year Founding Villager (Stripe link pending)
    stripeMembership: "",   // $15/mo Membership (Stripe link pending)
    whatsappInvite: "",     // WhatsApp porch link (channel or wa.me)
    signupEndpoint: ""      // POST endpoint for signups
  };

  /* ============ interactive Concierge demo (clears the hard layer) ============ */
  var SCRIPTS = {
    money:   { hl: ["12 tabs open", "which form?", "hold music", "the shame spiral"],
               clear: "The benefits and local programs you actually qualify for, in one list.",
               route: "the resource library · benefits",
               save: "Money: the programs I qualify for, in one list" },
    housing: { hl: ["19 listing sites", "is it even safe?", "first + last + deposit", "do it alone"],
               clear: "Trusted local options and a safe next step, not 19 sketchy listings.",
               route: "Safety Hall + the resource library",
               save: "Housing: trusted options + a safe next step" },
    work:    { hl: ["55 and starting over", "100 applications", "the AI screener", "no callbacks"],
               clear: "A real plan to restart your income at midlife, with the tools to do it.",
               route: "the resource library · restart your income",
               save: "Work: a plan to restart my income at midlife" },
    family:  { hl: ["Mom needs more care", "I work full-time", "no respite", "what do I qualify for?"],
               clear: "Caregiving help and respite you didn't know existed, and women in it with you.",
               route: "the resource library + your people",
               save: "Family: caregiving help + respite I didn't know existed" },
    stuck:   { hl: ["everything at once", "ten 'shoulds'", "no starting point", "all alone"],
               clear: "One first step, and your circle, so you're not doing it alone.",
               route: "your Concierge + the Village",
               save: "Stuck: my first step, and my circle" },
    body:    { hl: ["dismissed by doctors", "conflicting advice", "no time", "where to start?"],
               clear: "Trusted menopause info, and the questions to bring to your doctor.",
               route: "the resource library · health (Moxie Studio open)",
               save: "Body: menopause info + questions for my doctor" }
  };

  var demoBody = document.getElementById("demoBody");
  var demoStack = document.getElementById("demoStack");
  var savedCount = 0;

  function bindChips() {
    var chips = document.getElementById("demoChips");
    if (!chips) return;
    chips.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { showReflection(b.getAttribute("data-k")); });
    });
  }

  function showReflection(key) {
    var s = SCRIPTS[key];
    if (!s) return;
    var chips = s.hl.map(function (h, i) {
      return '<span class="demo__hlchip" style="--cd:' + (i * 0.12) + 's">' + h + "</span>";
    }).join("");
    demoBody.innerHTML =
      '<div class="fade-in">' +
        '<p class="demo__cleared">clearing the runaround…</p>' +
        '<div class="demo__hl">' + chips + "</div>" +
        '<div class="demo__result">' +
          '<span class="demo__rlabel">your clear next step</span>' +
          '<p class="demo__act">' + s.clear + "</p>" +
          '<p class="demo__route">→ leads to <b>' + s.route + "</b></p>" +
          '<button class="demo__save" type="button">Let my Concierge keep this</button>' +
          '<button class="demo__reset" type="button">↺ try another</button>' +
        "</div>" +
      "</div>";
    demoBody.querySelector(".demo__save").addEventListener("click", function () { saveCard(s.save); this.disabled = true; this.textContent = "✓ your Concierge saved it"; this.style.background = "var(--moss)"; });
    demoBody.querySelector(".demo__reset").addEventListener("click", resetDemo);
  }

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

  function resetDemo() {
    demoBody.innerHTML =
      '<div class="fade-in">' +
      '<p class="demo__q">How may we help you?</p>' +
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
})();
