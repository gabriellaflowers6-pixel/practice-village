/* Roo on Practice Village (2026-08-18)
   One loader for every page. Injects the canonical Roo markup, loads roo.js,
   and inits against the shared AIdedEQ endpoint with app_name practice-village.

   Modes (data-roo-mode on this script tag):
     "button" (default) - the pink kangaroo button, bottom-right (member area,
                          login, free tools).
     "footer"           - no floating button. Any element with [data-roo-open]
                          (the footer line on the landing page) opens the modal.

   Context sent with every report: role (member | visitor) from the Identity
   cookie, plus the page path. Members' sign-in email is attached so a report
   from a paying member can be answered; visitors stay anonymous.
*/
(function () {
  var script = document.currentScript;
  var mode = (script && script.dataset.rooMode) || "button";
  var base = "/assets/roo/";
  var ENDPOINT = "https://aidedeq.org/.netlify/functions/roo";

  function hasMemberCookie() {
    return /(?:^|;\s*)nf_jwt=/.test(document.cookie);
  }
  function memberEmail() {
    // Decode the Identity access token payload for the email only. Never sent
    // anywhere except the Roo endpoint, and only for signed-in members.
    try {
      var m = document.cookie.match(/(?:^|;\s*)nf_jwt=([^;]+)/);
      if (!m) return null;
      var part = decodeURIComponent(m[1]).split(".")[1];
      var json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
      return json && json.email ? String(json.email) : null;
    } catch (e) { return null; }
  }

  var markup =
    '<button id="roo-btn" class="roo-btn" type="button" aria-label="Tell Roo what\'s up" title="Tell Roo what\'s up">' +
      '<span class="roo-speech">Tell Roo</span>' +
      '<img src="' + base + 'roo-btn.png" alt="Roo the kangaroo" class="roo-img" width="40" height="40" />' +
    '</button>' +
    '<div id="roo-modal" class="roo-modal-backdrop" role="dialog" aria-labelledby="roo-title" aria-hidden="true">' +
      '<div class="roo-modal">' +
        '<div class="roo-modal-header">' +
          '<img src="' + base + 'roo-header.png" alt="" aria-hidden="true" />' +
          '<div class="roo-modal-title"><h3 id="roo-title">Tell Roo what\'s up</h3><p>Bugs, ideas, content fixes. She hops them to the team lead.</p></div>' +
          '<button class="roo-modal-close" type="button" aria-label="Close" data-roo-close>&times;</button>' +
        '</div>' +
        '<div class="roo-type-row" role="radiogroup" aria-label="Type of report">' +
          '<button type="button" class="roo-type-btn roo-active" data-roo-type="bug">⚠ Bug</button>' +
          '<button type="button" class="roo-type-btn" data-roo-type="content">✳ Content</button>' +
          '<button type="button" class="roo-type-btn" data-roo-type="idea">✦ Idea</button>' +
        '</div>' +
        '<textarea id="roo-message" class="roo-message" rows="4" placeholder="What happened? What did you expect? (Roo is listening.)"></textarea>' +
        '<div class="roo-actions"><button type="button" class="roo-btn-cancel" data-roo-close>Cancel</button><button type="button" class="roo-btn-send" id="roo-send">Send to Roo</button></div>' +
      '</div>' +
    '</div>' +
    '<div id="roo-toast" class="roo-toast" role="status" aria-live="polite"></div>';

  function mount() {
    if (document.getElementById("roo-btn")) return;
    var host = document.createElement("div");
    host.id = "roo-host";
    host.innerHTML = markup;
    document.body.appendChild(host);
    if (mode === "footer") document.body.classList.add("roo-footer-mode");

    var js = document.createElement("script");
    js.src = base + "roo.js";
    js.onload = function () {
      if (!window.RooReporter) return;
      var member = hasMemberCookie();
      window.RooReporter.init({
        endpoint: ENDPOINT,
        appName: "practice-village",
        assetsPath: base,
        getUser: function () {
          var email = member ? memberEmail() : null;
          return Promise.resolve(email ? { email: email } : null);
        },
        getPageContext: function () {
          var role = hasMemberCookie() ? "member" : "visitor";
          var page = document.body.getAttribute("data-roo-page") || document.title || location.pathname;
          return "role=" + role + " · " + page + " · " + location.pathname;
        }
      });
      // Footer mode: any [data-roo-open] opens the modal via the (hidden) button.
      document.querySelectorAll("[data-roo-open]").forEach(function (a) {
        a.addEventListener("click", function (ev) {
          ev.preventDefault();
          var b = document.getElementById("roo-btn");
          if (b) b.click();
        });
      });
      // Auto-hide while the site's own overlays are open (mobile menu, dialogs).
      var menu = document.getElementById("menuBtn");
      function sync() {
        var open = (menu && menu.getAttribute("aria-expanded") === "true") ||
          !!document.querySelector('[role="dialog"]:not(#roo-modal):not([aria-hidden="true"]):not([hidden])');
        document.body.classList.toggle("roo-hidden", open);
      }
      new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["aria-expanded", "aria-hidden", "hidden", "class"] });
      sync();
    };
    document.body.appendChild(js);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
