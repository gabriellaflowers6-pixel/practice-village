(function () {
  "use strict";

  var beforeHide = function () {};
  var beforeExit = function () {};
  var normalTitle = document.title;

  function safelyRun(callback) {
    try { callback(); } catch (error) { /* A safety action must not be blocked by cleanup. */ }
  }

  function closeOpenDialogs() {
    document.querySelectorAll("dialog[open]").forEach(function (dialog) {
      try { if (dialog.close) dialog.close(); else dialog.removeAttribute("open"); } catch (error) { dialog.removeAttribute("open"); }
    });
  }

  function enterDiscreetMode() {
    safelyRun(beforeHide);
    closeOpenDialogs();
    document.body.classList.add("is-discreet");
    var cover = document.getElementById("discreetCover");
    if (cover) cover.hidden = false;
    document.title = "Private notes";
    try { window.scrollTo(0, 0); } catch (error) { /* Older webviews may not support scrollTo. */ }
  }

  function leaveDiscreetMode() {
    document.body.classList.remove("is-discreet");
    var cover = document.getElementById("discreetCover");
    if (cover) cover.hidden = true;
    document.title = normalTitle;
  }

  function quickExit(event) {
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    // Hide sensitive content immediately while the neutral destination loads.
    enterDiscreetMode();
    try {
      safelyRun(beforeExit);
    } finally {
      window.location.replace("https://www.google.com/");
    }
  }

  function bind(id, eventName, handler) {
    var element = document.getElementById(id);
    if (element) element.addEventListener(eventName, handler);
  }

  bind("discreetMode", "click", enterDiscreetMode);
  bind("safetyDiscreet", "click", enterDiscreetMode);
  bind("returnFromDiscreet", "click", leaveDiscreetMode);
  bind("quickExit", "click", quickExit);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !document.querySelector("dialog[open]") && !document.body.classList.contains("is-discreet")) enterDiscreetMode();
  });

  window.SafetyHallControls = {
    enterDiscreetMode: enterDiscreetMode,
    leaveDiscreetMode: leaveDiscreetMode,
    quickExit: quickExit,
    setBeforeHide: function (callback) { beforeHide = typeof callback === "function" ? callback : function () {}; },
    setBeforeExit: function (callback) { beforeExit = typeof callback === "function" ? callback : function () {}; }
  };
})();
