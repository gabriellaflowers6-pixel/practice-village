(function () {
  "use strict";

  var STORAGE_KEY = "practiceVillage.safetyEntries.v1";
  var DRAFT_KEY = "practiceVillage.safetyDraft.v3";
  var PIL_KEY = "practiceVillage.pilCards.v1";
  var PATTERN_REVIEW_KEY = "practiceVillage.patternReviews.v1";
  var DB_NAME = "PracticeVillageSafety";
  var DB_STORE = "privateMedia";
  var MAX_FILE_SIZE = 25 * 1024 * 1024;
  var MAX_REDACTION_DIMENSION = 4096;
  var saveTimer = null;
  var dbPromise = null;
  var entries = normalizeEntries(readArray(STORAGE_KEY));
  var draft = normalizeDraft(readObject(DRAFT_KEY));
  var patternReviews = readObject(PATTERN_REVIEW_KEY) || {};
  var lastSavedId = null;
  var recorder = null;
  var recorderStream = null;
  var recorderChunks = [];
  var recordingMedia = null;
  var recordingButton = null;
  var recordingStopResolve = null;
  var activeTranscriptMediaId = null;
  var activeImageMediaId = null;
  var activeRedactionItem = null;
  var redactionSourceImage = null;
  var redactionSourceUrl = "";
  var redactionRectangles = [];
  var redactionDraftRectangle = null;
  var activeResourceJurisdiction = "";
  var activeResourceLocationLabel = "";
  var activeResourceFilter = "all";
  var requestedResourceFilter = "all";
  var activePatternArea = "";
  var activeHandoffArea = "";
  var activeHandoffText = "";
  var activeHandoffEntryIds = [];
  var attachmentDecisions = {};
  var activeAttachmentManifest = "";
  var returnToAttachmentPacket = false;

  var storyText = document.getElementById("storyText");
  var saveState = document.getElementById("saveState");
  var captureError = document.getElementById("captureError");
  var fileInput = document.getElementById("entryFiles");
  var afterSaveDialog = document.getElementById("afterSaveDialog");
  var patternDialog = document.getElementById("patternDialog");
  var handoffDialog = document.getElementById("handoffDialog");
  var attachmentPacketDialog = document.getElementById("attachmentPacketDialog");
  var routeDialog = document.getElementById("routeDialog");
  var safetyDialog = document.getElementById("safetyDialog");
  var transcriptDialog = document.getElementById("transcriptDialog");
  var imageDetailsDialog = document.getElementById("imageDetailsDialog");
  var redactionDialog = document.getElementById("redactionDialog");
  var redactionCanvas = document.getElementById("redactionCanvas");
  var redactionContext = redactionCanvas.getContext("2d");
  var micSession = document.getElementById("micSession");

  function uid() {
    return window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  }

  function readArray(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function readObject(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === "object" && !Array.isArray(value) ? value : null;
    } catch (error) {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function blankMap() {
    return { theirs: "", cannot: "", mine: "", support: "", hope: "" };
  }

  function blankImageDetails() {
    return { artifactType: "", groupLabel: "", sequence: "", displayedPeople: "", displayedAt: "", sourceContext: "", contextNote: "", visibleText: "", visualDescription: "", textSource: "", updatedAt: null };
  }

  function normalizeMediaItem(item, createdAt) {
    var next = Object.assign({ id: uid(), type: "file", label: "Attachment", name: "Saved item", mime: "", size: 0, blobId: null, sha256: "", transcript: "", transcriptSource: "", transcriptConsentAt: null, imageDetails: blankImageDetails(), createdAt: createdAt || new Date().toISOString() }, item);
    next.imageDetails = Object.assign(blankImageDetails(), item && item.imageDetails || {});
    return next;
  }

  function blankDraft() {
    return {
      id: uid(), editingId: null, story: "", remember: "", whatChanged: "", people: "", happenedAt: "", area: "",
      safety: "", behaviors: [], powers: [], consequences: [], map: blankMap(), media: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
  }

  function normalizedMedia(entry) {
    if (Array.isArray(entry.media)) return entry.media.map(function (item) {
      return normalizeMediaItem(item, entry.createdAt);
    });
    if (entry.attachment) {
      return [normalizeMediaItem({ id: "legacy-" + (entry.id || uid()), type: entry.attachment.kind === "voice" ? "voice" : "file", label: entry.attachment.kind === "voice" ? "Voice note" : "Attachment reference", name: entry.attachment.name || "Attachment", mime: entry.attachment.type || "", size: 0, blobId: null }, entry.createdAt)];
    }
    return [];
  }

  function normalizeEntries(items) {
    return items.map(function (entry) {
      var normalized = Object.assign({
        id: uid(), story: entry.what || "", what: entry.story || entry.what || "", feltOff: "", remember: "", whatChanged: "", people: "",
        area: "Not sure", safety: "", behaviors: [], powers: [], consequences: [], map: blankMap(), media: [], createdAt: new Date().toISOString(), happenedAt: entry.createdAt || new Date().toISOString()
      }, entry);
      normalized.story = entry.story || entry.what || "";
      normalized.what = normalized.story;
      normalized.behaviors = Array.isArray(entry.behaviors) ? entry.behaviors : [];
      normalized.powers = Array.isArray(entry.powers) ? entry.powers : [];
      normalized.consequences = Array.isArray(entry.consequences) ? entry.consequences : [];
      normalized.map = Object.assign(blankMap(), entry.map || {});
      normalized.media = normalizedMedia(entry);
      normalized.area = entry.area || "Not sure";
      return normalized;
    });
  }

  function normalizeDraft(value) {
    var base = blankDraft();
    if (!value) return base;
    var next = Object.assign(base, value);
    next.behaviors = Array.isArray(value.behaviors) ? value.behaviors : [];
    next.powers = Array.isArray(value.powers) ? value.powers : [];
    next.consequences = Array.isArray(value.consequences) ? value.consequences : [];
    next.media = normalizedMedia({ media: Array.isArray(value.media) ? value.media : [], createdAt: value.createdAt });
    next.map = Object.assign(blankMap(), value.map || {});
    return next;
  }

  function escapeText(value) {
    var span = document.createElement("span");
    span.textContent = value || "";
    return span.innerHTML;
  }

  function formatDate(value) {
    var date = new Date(value);
    return isNaN(date) ? "Date not added" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function shortTitle(entry) {
    var imageContext = (entry.media || []).map(function (item) {
      var details = item.imageDetails || {};
      return details.contextNote || details.groupLabel || details.visibleText || details.artifactType || "";
    }).find(Boolean);
    var source = (entry.remember || entry.story || entry.what || imageContext || "Private entry").trim();
    var words = source.split(/\s+/).filter(Boolean);
    return words.slice(0, 12).join(" ") + (words.length > 12 ? "…" : "");
  }

  function bytesLabel(size) {
    if (!size) return "Stored reference";
    if (size < 1024 * 1024) return Math.max(1, Math.round(size / 1024)) + " KB";
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  }

  async function hashBlob(blob) {
    if (!window.crypto || !window.crypto.subtle || !blob.arrayBuffer) return "";
    try {
      var digest = await window.crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
      return Array.from(new Uint8Array(digest)).map(function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
    } catch (error) {
      return "";
    }
  }

  function hasImageDetails(item) {
    var details = item && item.imageDetails || {};
    return [details.artifactType, details.groupLabel, details.sequence, details.displayedPeople, details.displayedAt, details.sourceContext, details.contextNote, details.visibleText, details.visualDescription].some(function (value) { return String(value || "").trim(); });
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error("Local media storage is unavailable"));
      var request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = function () {
        if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE, { keyPath: "id" });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
    return dbPromise;
  }

  function mediaTransaction(mode, action) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(DB_STORE, mode);
        var store = tx.objectStore(DB_STORE);
        var request = action(store);
        tx.oncomplete = function () { resolve(request && request.result); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  function putBlob(id, blob) { return mediaTransaction("readwrite", function (store) { return store.put({ id: id, blob: blob }); }); }
  function getBlob(id) { return id ? mediaTransaction("readonly", function (store) { return store.get(id); }).then(function (record) { return record && record.blob; }) : Promise.resolve(null); }
  function deleteBlob(id) { return id ? mediaTransaction("readwrite", function (store) { return store.delete(id); }).catch(function () {}) : Promise.resolve(); }
  function clearBlobs() { return mediaTransaction("readwrite", function (store) { return store.clear(); }).catch(function () {}); }

  /* Emptying the store still leaves a database named PracticeVillageSafety in
     the browser, and the name alone tells anyone looking that a safety tool was
     used here. Delete all means delete the name too. Never let this hang: a
     blocked delete resolves anyway so the rest of the wipe always finishes. */
  function dropDatabase() {
    return new Promise(function (resolve) {
      var settled = false;
      var done = function () { if (!settled) { settled = true; resolve(); } };
      setTimeout(done, 1500);
      try {
        var pending = dbPromise;
        dbPromise = null;
        Promise.resolve(pending)
          .then(function (db) { if (db && db.close) db.close(); })
          .catch(function () {})
          .then(function () {
            var request = indexedDB.deleteDatabase(DB_NAME);
            request.onsuccess = done;
            request.onerror = done;
            request.onblocked = done;
          });
      } catch (error) { done(); }
    });
  }

  function hasDraftContent(value) {
    var mapValues = Object.keys(value.map || {}).some(function (key) { return String(value.map[key] || "").trim(); });
    return [value.story, value.remember, value.whatChanged, value.people].some(function (text) { return String(text || "").trim(); }) ||
      value.media.length > 0 || value.behaviors.length > 0 || value.powers.length > 0 || value.consequences.length > 0 || mapValues || Boolean(value.area || value.safety || value.happenedAt);
  }

  function collectDraft() {
    draft.story = storyText.value;
    draft.remember = document.getElementById("contextRemember").value;
    draft.whatChanged = document.getElementById("contextAfter").value;
    draft.people = document.getElementById("contextPeople").value;
    draft.happenedAt = document.getElementById("contextDate").value;
    draft.map.theirs = document.getElementById("mapTheirs").value;
    draft.map.cannot = document.getElementById("mapCannot").value;
    draft.map.mine = document.getElementById("mapMine").value;
    draft.map.support = document.getElementById("mapSupport").value;
    draft.map.hope = document.getElementById("mapHope").value;
    draft.updatedAt = new Date().toISOString();
    return draft;
  }

  function updateWordCount() {
    var words = storyText.value.trim() ? storyText.value.trim().split(/\s+/).length : 0;
    document.getElementById("wordCount").textContent = words;
  }

  function saveDraftNow() {
    clearTimeout(saveTimer);
    collectDraft();
    if (!hasDraftContent(draft)) {
      localStorage.removeItem(DRAFT_KEY);
      saveState.textContent = "Ready when you are";
      saveState.className = "save-state";
      return true;
    }
    var ok = writeJson(DRAFT_KEY, draft);
    saveState.textContent = ok ? "Autosaved on this device" : "Could not autosave";
    saveState.className = "save-state " + (ok ? "is-saved" : "is-saving");
    return ok;
  }

  function queueDraftSave() {
    saveState.textContent = "Saving…";
    saveState.className = "save-state is-saving";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraftNow, 450);
  }

  function restoreChoiceState() {
    document.querySelectorAll("#areaGrid button, #safetyChoice button, #behaviorGrid button, #powerGrid button, #consequenceGrid button").forEach(function (button) {
      var selected = false;
      if (button.dataset.area) selected = button.dataset.area === draft.area;
      if (button.dataset.safety) selected = button.dataset.safety === draft.safety;
      if (button.dataset.behavior) selected = draft.behaviors.indexOf(button.dataset.behavior) >= 0;
      if (button.dataset.power) selected = draft.powers.indexOf(button.dataset.power) >= 0;
      if (button.dataset.consequence) selected = draft.consequences.indexOf(button.dataset.consequence) >= 0;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    document.getElementById("supportFirst").hidden = draft.safety !== "Yes" && draft.safety !== "Not sure";
  }

  function restoreForm() {
    storyText.value = draft.story || "";
    document.getElementById("contextRemember").value = draft.remember || "";
    document.getElementById("contextAfter").value = draft.whatChanged || "";
    document.getElementById("contextPeople").value = draft.people || "";
    document.getElementById("contextDate").value = toLocalInput(draft.happenedAt);
    document.getElementById("mapTheirs").value = draft.map.theirs || "";
    document.getElementById("mapCannot").value = draft.map.cannot || "";
    document.getElementById("mapMine").value = draft.map.mine || "";
    document.getElementById("mapSupport").value = draft.map.support || "";
    document.getElementById("mapHope").value = draft.map.hope || "";
    document.getElementById("draftLabel").textContent = draft.editingId ? "Adding to a saved entry" : "Private entry";
    updateWordCount();
    restoreChoiceState();
    renderDraftMedia();
    if (hasDraftContent(draft)) {
      saveState.textContent = "Draft restored · autosaved on this device";
      saveState.className = "save-state is-saved";
    } else {
      saveState.textContent = "Ready when you are";
      saveState.className = "save-state";
    }
  }

  function toLocalInput(value) {
    if (!value) return "";
    var date = new Date(value);
    if (isNaN(date)) return String(value).slice(0, 16);
    var local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  async function renderMedia(container, items, editable) {
    container.innerHTML = "";
    items.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "media-item";
      row.dataset.mediaId = item.id;
      var icon = document.createElement("span");
      icon.className = "media-icon";
      var isImage = String(item.mime || "").indexOf("image/") === 0;
      icon.textContent = item.type === "voice" ? "VOICE" : (isImage ? "IMG" : "FILE");
      var copy = document.createElement("div");
      copy.className = "media-copy";
      var title = document.createElement("b");
      title.textContent = item.type === "voice" ? (item === recordingMedia ? "Recording · autosaving on this device" : "Voice note saved on this device") : (isImage ? "Screenshot saved on this device" : "File saved on this device");
      var meta = document.createElement("small");
      var metaParts = [item.label || item.name || "Saved item"];
      if (item.name && item.name !== item.label) metaParts.push(item.name);
      metaParts.push(bytesLabel(item.size));
      if (isImage) metaParts.push("not read or analyzed");
      meta.textContent = metaParts.join(" · ");
      copy.append(title, meta);
      var actions = document.createElement("div");
      actions.className = "media-actions";
      if (editable) {
        var rename = document.createElement("button");
        rename.type = "button";
        rename.textContent = "Rename";
        rename.addEventListener("click", function () { renameDraftMedia(item.id); });
        actions.appendChild(rename);
        if (item.type === "voice") {
          var transcript = document.createElement("button");
          transcript.type = "button";
          transcript.textContent = item.transcript ? "Edit transcript" : "Add transcript";
          transcript.addEventListener("click", function () { openTranscript(item.id); });
          actions.appendChild(transcript);
        }
        if (isImage) {
          var detailsButton = document.createElement("button");
          detailsButton.type = "button";
          detailsButton.textContent = hasImageDetails(item) ? "Edit details" : "Add details";
          detailsButton.addEventListener("click", function () { openImageDetails(item.id); });
          actions.appendChild(detailsButton);
        }
        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-media";
        remove.textContent = "Delete";
        remove.addEventListener("click", function () { removeDraftMedia(item.id); });
      }
      if (isImage && item.blobId) {
        var redact = document.createElement("button");
        redact.type = "button";
        redact.textContent = "Make redacted copy";
        redact.addEventListener("click", function () { openRedaction(item); });
        actions.appendChild(redact);
      }
      if (editable) actions.appendChild(remove);
      row.append(icon, copy, actions);
      container.appendChild(row);
      if (item.transcript) {
        var transcriptPreview = document.createElement("div");
        transcriptPreview.className = "media-transcript";
        var transcriptLabel = document.createElement("b");
        transcriptLabel.textContent = "Editable transcript · original audio unchanged";
        var transcriptCopy = document.createElement("p");
        transcriptCopy.textContent = item.transcript;
        transcriptPreview.append(transcriptLabel, transcriptCopy);
        row.appendChild(transcriptPreview);
      }
      if (isImage && (hasImageDetails(item) || item.sha256)) {
        var artifact = document.createElement("div");
        artifact.className = "image-artifact-details";
        var artifactLabel = document.createElement("b");
        artifactLabel.textContent = "Your added image context · original unchanged";
        var chips = document.createElement("div");
        chips.className = "image-detail-chips";
        var details = item.imageDetails || blankImageDetails();
        [details.artifactType, details.groupLabel && (details.groupLabel + (details.sequence ? " · " + details.sequence : "")), details.displayedPeople, details.displayedAt, details.sourceContext, item.sha256 && "Local integrity fingerprint recorded"].filter(Boolean).forEach(function (value) {
          var chip = document.createElement("span");
          chip.textContent = value;
          chips.appendChild(chip);
        });
        artifact.append(artifactLabel, chips);
        if (details.contextNote || details.visibleText || details.visualDescription) {
          var expanded = document.createElement("details");
          var expandedSummary = document.createElement("summary");
          expandedSummary.textContent = "View my saved context";
          expanded.appendChild(expandedSummary);
          [["My context", details.contextNote], ["Visible words I entered · not OCR", details.visibleText], ["My visual description", details.visualDescription]].forEach(function (pair) {
            if (!pair[1]) return;
            var paragraph = document.createElement("p");
            var strong = document.createElement("strong");
            strong.textContent = pair[0] + ": ";
            paragraph.append(strong, document.createTextNode(pair[1]));
            expanded.appendChild(paragraph);
          });
          artifact.appendChild(expanded);
        }
        row.appendChild(artifact);
      }
      if (!item.blobId) {
        meta.textContent += " · original content was not stored by the earlier prototype";
        return;
      }
      getBlob(item.blobId).then(function (blob) {
        if (!blob || !row.isConnected) {
          meta.textContent += " · content unavailable";
          return;
        }
        var url = URL.createObjectURL(blob);
        if (item.type === "voice" || String(item.mime).indexOf("audio/") === 0) {
          var audio = document.createElement("audio");
          audio.controls = true;
          audio.preload = "metadata";
          audio.src = url;
          row.appendChild(audio);
        }
        if (isImage) {
          var preview = document.createElement("details");
          preview.className = "image-preview";
          var previewSummary = document.createElement("summary");
          previewSummary.textContent = "Preview screenshot";
          var image = document.createElement("img");
          image.loading = "lazy";
          image.alt = "Local preview of " + ([item.label, item.name].filter(Boolean).join(" · ") || "uploaded screenshot");
          image.src = url;
          preview.append(previewSummary, image);
          row.appendChild(preview);
        }
        var download = document.createElement("a");
        download.href = url;
        download.download = item.name || (item.type === "voice" ? "safety-hall-voice-note.webm" : "safety-hall-file");
        download.textContent = "Download";
        actions.prepend(download);
      }).catch(function () { meta.textContent += " · content unavailable"; });
    });
  }

  function renderDraftMedia() {
    renderMedia(document.getElementById("draftMediaList"), draft.media, true);
    var screenshots = draft.media.filter(function (item) { return String(item.mime || "").indexOf("image/") === 0; }).length;
    var otherItems = draft.media.length - screenshots;
    var parts = [];
    if (screenshots) parts.push(screenshots + " screenshot" + (screenshots === 1 ? "" : "s") + " saved on this device · not read or analyzed");
    if (otherItems) parts.push(otherItems + " other saved item" + (otherItems === 1 ? "" : "s"));
    document.getElementById("attachmentSummary").textContent = parts.join(" · ");
  }

  function persistMediaForSavedEntry() {
    if (!draft.editingId) return true;
    var entry = entries.find(function (item) { return item.id === draft.editingId; });
    if (!entry) return false;
    entry.media = draft.media.map(function (item) { return Object.assign({}, item); });
    entry.updatedAt = new Date().toISOString();
    var ok = writeJson(STORAGE_KEY, entries);
    if (!document.getElementById("entries").hidden) renderEntries();
    return ok;
  }

  function renameDraftMedia(id) {
    var item = draft.media.find(function (media) { return media.id === id; });
    if (!item) return;
    var isImage = String(item.mime || "").indexOf("image/") === 0;
    var next = window.prompt("Name this " + (item.type === "voice" ? "recording" : (isImage ? "screenshot" : "file")), item.label || item.name || "Saved item");
    if (next === null) return;
    next = next.trim();
    if (!next) return;
    item.label = next.slice(0, 120);
    renderDraftMedia();
    saveDraftNow();
    persistMediaForSavedEntry();
  }

  function openImageDetails(id) {
    var item = draft.media.find(function (media) { return media.id === id; });
    if (!item) return;
    activeImageMediaId = id;
    var details = Object.assign(blankImageDetails(), item.imageDetails || {});
    document.getElementById("imageArtifactType").value = details.artifactType;
    document.getElementById("imageGroupLabel").value = details.groupLabel;
    document.getElementById("imageSequence").value = details.sequence;
    document.getElementById("imageDisplayedPeople").value = details.displayedPeople;
    document.getElementById("imageDisplayedAt").value = details.displayedAt;
    document.getElementById("imageSourceContext").value = details.sourceContext;
    document.getElementById("imageContextNote").value = details.contextNote;
    document.getElementById("imageVisibleText").value = details.visibleText;
    document.getElementById("imageVisualDescription").value = details.visualDescription;
    document.getElementById("imageDetailsStatus").textContent = item.sha256 ? "Original-file integrity fingerprint is stored locally." : "The original image remains unchanged.";
    openDialog(imageDetailsDialog);
    document.getElementById("imageArtifactType").focus();
  }

  function collectImageDetails() {
    var visibleText = document.getElementById("imageVisibleText").value.trim();
    return {
      artifactType: document.getElementById("imageArtifactType").value,
      groupLabel: document.getElementById("imageGroupLabel").value.trim(),
      sequence: document.getElementById("imageSequence").value.trim(),
      displayedPeople: document.getElementById("imageDisplayedPeople").value.trim(),
      displayedAt: document.getElementById("imageDisplayedAt").value.trim(),
      sourceContext: document.getElementById("imageSourceContext").value.trim(),
      contextNote: document.getElementById("imageContextNote").value.trim(),
      visibleText: visibleText,
      visualDescription: document.getElementById("imageVisualDescription").value.trim(),
      textSource: visibleText ? "user-authored" : "",
      updatedAt: new Date().toISOString()
    };
  }

  document.getElementById("saveImageDetails").addEventListener("click", function () {
    var item = draft.media.find(function (media) { return media.id === activeImageMediaId; });
    if (!item) return;
    item.imageDetails = collectImageDetails();
    saveDraftNow();
    persistMediaForSavedEntry();
    renderDraftMedia();
    document.getElementById("imageDetailsStatus").textContent = hasImageDetails(item) ? "Your added details are saved on this device. Original image unchanged." : "No additional details were added. Original image kept.";
  });

  document.getElementById("removeImageDetails").addEventListener("click", function () {
    var item = draft.media.find(function (media) { return media.id === activeImageMediaId; });
    if (!item || !hasImageDetails(item)) { document.getElementById("imageDetailsStatus").textContent = "There are no added details to remove."; return; }
    if (!window.confirm("Remove your added screenshot details? The original image will stay on this device.")) return;
    item.imageDetails = blankImageDetails();
    saveDraftNow();
    persistMediaForSavedEntry();
    renderDraftMedia();
    document.getElementById("imageDetailsStatus").textContent = "Added details removed. Original image kept.";
  });

  function normalizedRectangle(rectangle) {
    var left = Math.min(rectangle.x, rectangle.x + rectangle.width);
    var top = Math.min(rectangle.y, rectangle.y + rectangle.height);
    return { x: left, y: top, width: Math.abs(rectangle.width), height: Math.abs(rectangle.height) };
  }

  function renderRedactions() {
    if (!redactionSourceImage || !redactionCanvas.width || !redactionCanvas.height) return;
    redactionContext.clearRect(0, 0, redactionCanvas.width, redactionCanvas.height);
    redactionContext.drawImage(redactionSourceImage, 0, 0, redactionCanvas.width, redactionCanvas.height);
    redactionContext.fillStyle = "#111111";
    redactionRectangles.forEach(function (rectangle) {
      redactionContext.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    });
    if (redactionDraftRectangle) {
      var draftRectangle = normalizedRectangle(redactionDraftRectangle);
      redactionContext.fillRect(draftRectangle.x, draftRectangle.y, draftRectangle.width, draftRectangle.height);
      redactionContext.strokeStyle = "#ffffff";
      redactionContext.lineWidth = Math.max(2, redactionCanvas.width / 700);
      redactionContext.setLineDash([redactionContext.lineWidth * 3, redactionContext.lineWidth * 2]);
      redactionContext.strokeRect(draftRectangle.x, draftRectangle.y, draftRectangle.width, draftRectangle.height);
      redactionContext.setLineDash([]);
    }
  }

  function updateRedactionControls(resetReview) {
    var count = redactionRectangles.length;
    var review = document.getElementById("redactionReviewCheck");
    if (resetReview) review.checked = false;
    review.disabled = count === 0;
    if (!count) review.checked = false;
    document.getElementById("undoRedaction").disabled = count === 0;
    document.getElementById("clearRedactions").disabled = count === 0;
    document.getElementById("downloadRedacted").disabled = count === 0 || !review.checked;
    document.getElementById("redactionCount").textContent = count ? count + " covered " + (count === 1 ? "area" : "areas") : "No areas covered yet";
  }

  function resetRedaction() {
    if (redactionSourceUrl) URL.revokeObjectURL(redactionSourceUrl);
    activeRedactionItem = null;
    redactionSourceImage = null;
    redactionSourceUrl = "";
    redactionRectangles = [];
    redactionDraftRectangle = null;
    redactionCanvas.width = 1;
    redactionCanvas.height = 1;
    document.getElementById("redactionLoading").hidden = false;
    document.getElementById("redactionStage").setAttribute("aria-busy", "true");
    document.getElementById("redactionStatus").textContent = "";
    document.getElementById("redactionReviewCheck").checked = false;
    updateRedactionControls(false);
  }

  async function openRedaction(item) {
    resetRedaction();
    activeRedactionItem = item;
    openDialog(redactionDialog);
    document.getElementById("redactionStatus").textContent = "Loading the original locally. Nothing is being sent.";
    try {
      var blob = await getBlob(item.blobId);
      if (!blob) throw new Error("missing image");
      redactionSourceUrl = URL.createObjectURL(blob);
      var image = new Image();
      image.onload = function () {
        if (!activeRedactionItem) return;
        var scale = Math.min(1, MAX_REDACTION_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
        redactionCanvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        redactionCanvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        redactionSourceImage = image;
        renderRedactions();
        document.getElementById("redactionLoading").hidden = true;
        document.getElementById("redactionStage").setAttribute("aria-busy", "false");
        document.getElementById("redactionStatus").textContent = scale < 1 ? "Local preview ready. The share copy will be resized to " + redactionCanvas.width + " × " + redactionCanvas.height + " pixels; the original stays full size." : "Local preview ready. Drag to cover an area.";
        redactionCanvas.focus();
      };
      image.onerror = function () {
        document.getElementById("redactionLoading").textContent = "This image could not be prepared for redaction.";
        document.getElementById("redactionStatus").textContent = "The original is still stored unchanged. Try downloading it and using a trusted image editor.";
      };
      image.src = redactionSourceUrl;
    } catch (error) {
      document.getElementById("redactionLoading").textContent = "The local image could not be opened.";
      document.getElementById("redactionStatus").textContent = "No copy was created and the original was not changed.";
    }
  }

  function redactionPoint(event) {
    var bounds = redactionCanvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(redactionCanvas.width, (event.clientX - bounds.left) * redactionCanvas.width / bounds.width)),
      y: Math.max(0, Math.min(redactionCanvas.height, (event.clientY - bounds.top) * redactionCanvas.height / bounds.height))
    };
  }

  redactionCanvas.addEventListener("pointerdown", function (event) {
    if (!redactionSourceImage) return;
    var point = redactionPoint(event);
    redactionDraftRectangle = { x: point.x, y: point.y, width: 0, height: 0 };
    redactionCanvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  redactionCanvas.addEventListener("pointermove", function (event) {
    if (!redactionDraftRectangle) return;
    var point = redactionPoint(event);
    redactionDraftRectangle.width = point.x - redactionDraftRectangle.x;
    redactionDraftRectangle.height = point.y - redactionDraftRectangle.y;
    renderRedactions();
    event.preventDefault();
  });

  function finishRedaction(event) {
    if (!redactionDraftRectangle) return;
    var rectangle = normalizedRectangle(redactionDraftRectangle);
    redactionDraftRectangle = null;
    if (rectangle.width >= 4 && rectangle.height >= 4) redactionRectangles.push(rectangle);
    renderRedactions();
    updateRedactionControls(true);
    if (event && redactionCanvas.hasPointerCapture(event.pointerId)) redactionCanvas.releasePointerCapture(event.pointerId);
  }

  redactionCanvas.addEventListener("pointerup", finishRedaction);
  redactionCanvas.addEventListener("pointercancel", finishRedaction);

  document.getElementById("addNumericRedaction").addEventListener("click", function () {
    if (!redactionSourceImage) return;
    var left = Number(document.getElementById("redactionLeft").value);
    var top = Number(document.getElementById("redactionTop").value);
    var width = Number(document.getElementById("redactionWidth").value);
    var height = Number(document.getElementById("redactionHeight").value);
    if (![left, top, width, height].every(Number.isFinite) || left < 0 || top < 0 || width <= 0 || height <= 0 || left >= 100 || top >= 100) {
      document.getElementById("redactionStatus").textContent = "Use values from 0 to 99 for position and 1 to 100 for size.";
      return;
    }
    width = Math.min(width, 100 - left);
    height = Math.min(height, 100 - top);
    redactionRectangles.push({ x: redactionCanvas.width * left / 100, y: redactionCanvas.height * top / 100, width: redactionCanvas.width * width / 100, height: redactionCanvas.height * height / 100 });
    renderRedactions();
    updateRedactionControls(true);
    document.getElementById("redactionStatus").textContent = "Cover added. Review the entire image before downloading.";
  });

  document.getElementById("undoRedaction").addEventListener("click", function () {
    redactionRectangles.pop();
    renderRedactions();
    updateRedactionControls(true);
  });

  document.getElementById("clearRedactions").addEventListener("click", function () {
    redactionRectangles = [];
    renderRedactions();
    updateRedactionControls(true);
    document.getElementById("redactionStatus").textContent = "Covers cleared. The original was not changed.";
  });

  document.getElementById("redactionReviewCheck").addEventListener("change", function () {
    updateRedactionControls(false);
  });

  document.getElementById("downloadRedacted").addEventListener("click", function () {
    if (!activeRedactionItem || !redactionRectangles.length || !document.getElementById("redactionReviewCheck").checked) return;
    var redactionItem = activeRedactionItem;
    renderRedactions();
    document.getElementById("redactionStatus").textContent = "Creating the redacted copy on this device…";
    redactionCanvas.toBlob(function (blob) {
      if (!blob) {
        document.getElementById("redactionStatus").textContent = "This browser could not create the copy. The original was not changed.";
        return;
      }
      var sourceName = (redactionItem.name || "screenshot").replace(/\.[^.]+$/, "");
      var baseName = sourceName.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "screenshot";
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = baseName + "-redacted-copy.png";
      link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      document.getElementById("redactionStatus").textContent = "Redacted PNG downloaded. The original remains unchanged in Safety Hall.";
    }, "image/png");
  });

  redactionDialog.addEventListener("close", function () {
    resetRedaction();
    if (returnToAttachmentPacket) {
      returnToAttachmentPacket = false;
      openAttachmentPacket(true);
    }
  });

  function openTranscript(id) {
    var item = draft.media.find(function (media) { return media.id === id; });
    if (!item) return;
    activeTranscriptMediaId = id;
    var hasTranscript = !!item.transcript;
    document.getElementById("transcriptConsent").hidden = hasTranscript;
    document.getElementById("transcriptEditor").hidden = !hasTranscript;
    document.getElementById("transcriptConsentCheck").checked = false;
    document.getElementById("beginTranscript").disabled = true;
    document.getElementById("transcriptText").value = item.transcript || "";
    document.getElementById("transcriptStatus").textContent = "";
    openDialog(transcriptDialog);
    if (hasTranscript) document.getElementById("transcriptText").focus();
  }

  document.getElementById("transcriptConsentCheck").addEventListener("change", function () {
    document.getElementById("beginTranscript").disabled = !this.checked;
  });

  document.getElementById("beginTranscript").addEventListener("click", function () {
    if (!document.getElementById("transcriptConsentCheck").checked) return;
    document.getElementById("transcriptConsent").hidden = true;
    document.getElementById("transcriptEditor").hidden = false;
    document.getElementById("transcriptText").focus();
  });

  document.getElementById("saveTranscript").addEventListener("click", function () {
    var item = draft.media.find(function (media) { return media.id === activeTranscriptMediaId; });
    if (!item) return;
    item.transcript = document.getElementById("transcriptText").value.trim();
    item.transcriptSource = "user-authored";
    item.transcriptConsentAt = item.transcriptConsentAt || new Date().toISOString();
    saveDraftNow();
    persistMediaForSavedEntry();
    renderDraftMedia();
    document.getElementById("transcriptStatus").textContent = item.transcript ? "Transcript saved on this device. Original audio unchanged." : "No transcript text was added.";
  });

  document.getElementById("removeTranscript").addEventListener("click", function () {
    var item = draft.media.find(function (media) { return media.id === activeTranscriptMediaId; });
    if (!item) return;
    item.transcript = "";
    item.transcriptSource = "";
    item.transcriptConsentAt = null;
    document.getElementById("transcriptText").value = "";
    saveDraftNow();
    persistMediaForSavedEntry();
    renderDraftMedia();
    document.getElementById("transcriptStatus").textContent = "Transcript text removed. Original audio kept.";
  });

  async function removeDraftMedia(id) {
    var item = draft.media.find(function (media) { return media.id === id; });
    if (item) {
      var isImage = String(item.mime || "").indexOf("image/") === 0;
      var kind = item.type === "voice" ? "recording" : (isImage ? "screenshot" : "file");
      if (!window.confirm("Delete this " + kind + " from this browser? This cannot be undone.")) return;
    }
    draft.media = draft.media.filter(function (media) { return media.id !== id; });
    if (item && item.blobId) await deleteBlob(item.blobId);
    renderDraftMedia();
    saveDraftNow();
    persistMediaForSavedEntry();
  }

  fileInput.addEventListener("change", async function () {
    captureError.textContent = "";
    var files = Array.from(fileInput.files || []);
    for (var index = 0; index < files.length; index += 1) {
      var file = files[index];
      if (file.size > MAX_FILE_SIZE) {
        captureError.textContent = file.name + " is larger than the 25 MB prototype limit and was not added.";
        continue;
      }
      var blobId = uid();
      try {
        await putBlob(blobId, file);
        var sha256 = await hashBlob(file);
        var isImage = file.type.indexOf("image/") === 0;
        draft.media.push({ id: uid(), type: file.type.indexOf("audio/") === 0 ? "voice" : "file", label: file.type.indexOf("audio/") === 0 ? "Uploaded audio" : (isImage ? "Screenshot" : "Uploaded file"), name: file.name, mime: file.type, size: file.size, blobId: blobId, sha256: sha256, transcript: "", transcriptSource: "", transcriptConsentAt: null, imageDetails: blankImageDetails(), createdAt: new Date().toISOString() });
      } catch (error) {
        captureError.textContent = "This browser could not store " + file.name + ". Try a smaller file or another private device.";
      }
    }
    fileInput.value = "";
    renderDraftMedia();
    saveDraftNow();
    persistMediaForSavedEntry();
  });

  async function startRecording(button) {
    captureError.textContent = "";
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      showRoute("Voice notes aren’t available here", "You can still type or upload an existing audio file.");
      return;
    }
    try {
      recorderStream = await getMicrophoneStream();
      recorderChunks = [];
      recordingButton = button;
      var blobId = uid();
      recordingMedia = { id: uid(), type: "voice", label: button.dataset.recordLabel || "Voice note", name: "Voice note · " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ".webm", mime: "audio/webm", size: 0, blobId: blobId, transcript: "", transcriptSource: "", transcriptConsentAt: null, createdAt: new Date().toISOString() };
      draft.media.push(recordingMedia);
      renderDraftMedia();
      saveDraftNow();
      recorder = new MediaRecorder(recorderStream);
      recordingMedia.mime = recorder.mimeType || "audio/webm";
      recorder.ondataavailable = function (event) {
        if (!event.data || !event.data.size) return;
        recorderChunks.push(event.data);
        var partial = new Blob(recorderChunks, { type: recordingMedia.mime });
        recordingMedia.size = partial.size;
        putBlob(recordingMedia.blobId, partial).catch(function () { captureError.textContent = "The recording could not be autosaved. Stop and try again."; });
        saveDraftNow();
      };
      recorder.onstop = async function () {
        var finalBlob = new Blob(recorderChunks, { type: recordingMedia.mime });
        try { await putBlob(recordingMedia.blobId, finalBlob); } catch (error) { captureError.textContent = "The recording could not be stored on this device."; }
        recordingMedia.size = finalBlob.size;
        if (recordingButton) {
          recordingButton.classList.remove("is-recording");
          recordingButton.textContent = "● " + recordingButton.dataset.defaultText;
        }
        recorder = null;
        recordingMedia = null;
        recordingButton = null;
        renderDraftMedia();
        saveDraftNow();
        persistMediaForSavedEntry();
        if (recordingStopResolve) recordingStopResolve();
        recordingStopResolve = null;
      };
      recorder.start(1000);
      button.classList.add("is-recording");
      button.textContent = "■ Stop recording";
    } catch (error) {
      releaseMicrophone();
      showRoute("Microphone access wasn’t granted", "Nothing was recorded. You can type or upload an existing audio file instead.");
    }
  }

  function microphoneIsLive() {
    return !!(recorderStream && recorderStream.active && recorderStream.getAudioTracks().some(function (track) { return track.readyState === "live"; }));
  }

  async function getMicrophoneStream() {
    if (!microphoneIsLive()) recorderStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micSession.hidden = false;
    return recorderStream;
  }

  function releaseMicrophone() {
    if (recorder && recorder.state === "recording") recorder.stop();
    if (recorderStream) recorderStream.getTracks().forEach(function (track) { track.stop(); });
    recorderStream = null;
    micSession.hidden = true;
  }

  function stopRecording() {
    if (!recorder || recorder.state !== "recording") return Promise.resolve();
    return new Promise(function (resolve) {
      recordingStopResolve = resolve;
      recorder.stop();
    });
  }

  document.addEventListener("click", function (event) {
    var recordButton = event.target.closest("[data-record]");
    if (!recordButton) return;
    if (recorder && recorder.state === "recording") stopRecording();
    else startRecording(recordButton);
  });
  document.getElementById("releaseMicrophone").addEventListener("click", releaseMicrophone);

  function selectSingle(container, button, key, value) {
    draft[key] = value;
    container.querySelectorAll("button").forEach(function (item) {
      var selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    saveDraftNow();
  }

  function toggleMulti(button, collection, value, exclusiveValue) {
    if (value === exclusiveValue) {
      collection.splice(0, collection.length, value);
      button.parentElement.querySelectorAll("button").forEach(function (item) {
        var selected = item === button;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    } else {
      var exclusiveIndex = collection.indexOf(exclusiveValue);
      if (exclusiveIndex >= 0) collection.splice(exclusiveIndex, 1);
      var exclusiveButton = button.parentElement.querySelector('[data-behavior="' + exclusiveValue + '"], [data-power="' + exclusiveValue + '"], [data-consequence="' + exclusiveValue + '"]');
      if (exclusiveButton) { exclusiveButton.classList.remove("is-selected"); exclusiveButton.setAttribute("aria-pressed", "false"); }
      var index = collection.indexOf(value);
      if (index >= 0) collection.splice(index, 1); else collection.push(value);
      button.classList.toggle("is-selected", index < 0);
      button.setAttribute("aria-pressed", index < 0 ? "true" : "false");
    }
    saveDraftNow();
  }

  document.getElementById("areaGrid").addEventListener("click", function (event) { var button = event.target.closest("button[data-area]"); if (button) selectSingle(this, button, "area", button.dataset.area); });
  document.getElementById("safetyChoice").addEventListener("click", function (event) {
    var button = event.target.closest("button[data-safety]");
    if (!button) return;
    selectSingle(this, button, "safety", button.dataset.safety);
    document.getElementById("supportFirst").hidden = button.dataset.safety !== "Yes" && button.dataset.safety !== "Not sure";
  });
  document.getElementById("behaviorGrid").addEventListener("click", function (event) { var button = event.target.closest("button[data-behavior]"); if (button) toggleMulti(button, draft.behaviors, button.dataset.behavior, "Nothing here fits yet"); });
  document.getElementById("powerGrid").addEventListener("click", function (event) { var button = event.target.closest("button[data-power]"); if (button) toggleMulti(button, draft.powers, button.dataset.power, "None or not sure"); });
  document.getElementById("consequenceGrid").addEventListener("click", function (event) { var button = event.target.closest("button[data-consequence]"); if (button) toggleMulti(button, draft.consequences, button.dataset.consequence, "No clear change yet"); });

  document.querySelectorAll("#captureCard textarea, #captureCard input[type='text'], #captureCard input[type='datetime-local']").forEach(function (input) {
    input.addEventListener("input", function () { if (input === storyText) updateWordCount(); queueDraftSave(); });
    input.addEventListener("change", queueDraftSave);
  });

  function showPanel(id, focus) {
    var panel = document.getElementById(id);
    panel.hidden = false;
    var control = document.querySelector('[aria-controls="' + id + '"]');
    if (control) control.setAttribute("aria-expanded", "true");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
    if (focus) setTimeout(function () { focus.focus(); }, 250);
  }

  function hidePanel(id) {
    document.getElementById(id).hidden = true;
    var control = document.querySelector('[aria-controls="' + id + '"]');
    if (control) control.setAttribute("aria-expanded", "false");
  }

  document.getElementById("showContext").addEventListener("click", function () { showPanel("contextPanel", document.getElementById("contextRemember")); });
  document.getElementById("showSense").addEventListener("click", function () { showPanel("sensePanel"); });
  document.querySelectorAll("[data-hide-panel]").forEach(function (button) { button.addEventListener("click", function () { hidePanel(button.dataset.hidePanel); document.getElementById("captureCard").scrollIntoView({ behavior: "smooth", block: "start" }); }); });
  document.querySelector("[data-route-inline='support']").addEventListener("click", showSupportRouter);

  function entryFromDraft() {
    collectDraft();
    var original = draft.editingId ? entries.find(function (entry) { return entry.id === draft.editingId; }) : null;
    return {
      id: draft.editingId || draft.id, story: draft.story.trim(), what: draft.story.trim(), feltOff: "", remember: draft.remember.trim(), whatChanged: draft.whatChanged.trim(), people: draft.people.trim(),
      area: draft.area || "Not sure", safety: draft.safety, behaviors: draft.behaviors.slice(), powers: draft.powers.slice(), consequences: draft.consequences.slice(), map: Object.assign(blankMap(), draft.map),
      happenedAt: draft.happenedAt || (original && original.happenedAt) || new Date().toISOString(), createdAt: (original && original.createdAt) || draft.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
      media: draft.media.slice(), privacy: "private"
    };
  }

  async function finishEntry() {
    captureError.textContent = "";
    await stopRecording();
    collectDraft();
    if (!hasDraftContent(draft)) {
      captureError.textContent = "Add a few words, a recording, or a file first. There is no minimum.";
      storyText.focus();
      return;
    }
    var entry = entryFromDraft();
    var existingIndex = entries.findIndex(function (item) { return item.id === entry.id; });
    if (existingIndex >= 0) entries.splice(existingIndex, 1, entry); else entries.unshift(entry);
    if (!writeJson(STORAGE_KEY, entries)) {
      captureError.textContent = "This browser could not add the draft to your private entries. Your autosaved draft is still here.";
      return;
    }
    lastSavedId = entry.id;
    localStorage.removeItem(DRAFT_KEY);
    draft = blankDraft();
    restoreForm();
    hidePanel("contextPanel");
    hidePanel("sensePanel");
    renderEntries();
    document.getElementById("afterSaveTitle").textContent = existingIndex >= 0 ? "Updated. You can stop here." : "Saved. You can stop here.";
    openDialog(afterSaveDialog);
  }

  document.getElementById("doneNow").addEventListener("click", finishEntry);

  function openEntry(entry, openSense) {
    if (hasDraftContent(draft) && draft.editingId !== entry.id) {
      showRoute("Your current note is still saved", "Finish or delete the current note before opening a different saved entry. Safety Hall will not replace a draft that contains text, screenshots, recordings, or files.", '<div class="grounding"><b>Nothing was replaced.</b><p>Your current draft and its local files are still here.</p></div>');
      return false;
    }
    draft = normalizeDraft(Object.assign({}, entry, { editingId: entry.id, story: entry.story || entry.what || "", media: entry.media.slice() }));
    writeJson(DRAFT_KEY, draft);
    restoreForm();
    hidePanel("contextPanel");
    hidePanel("sensePanel");
    if (openSense) showPanel("sensePanel");
    else document.getElementById("captureCard").scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  function entryTags(entry) { return entry.behaviors.concat(entry.powers, entry.consequences).slice(0, 8); }

  function renderEntries() {
    var list = document.getElementById("entryList");
    var template = document.getElementById("entryTemplate");
    list.innerHTML = "";
    document.getElementById("entryCount").textContent = entries.length;
    document.getElementById("emptyState").hidden = entries.length > 0;
    entries.forEach(function (entry) {
      var node = template.content.cloneNode(true);
      var article = node.querySelector("article");
      article.dataset.id = entry.id;
      node.querySelector(".saved-entry__area").textContent = entry.area || "Not sure";
      node.querySelector("time").textContent = formatDate(entry.happenedAt || entry.createdAt);
      node.querySelector("h3").textContent = shortTitle(entry);
      var screenshotCount = (entry.media || []).filter(function (item) { return String(item.mime || "").indexOf("image/") === 0; }).length;
      node.querySelector(".saved-entry>p").textContent = entry.story || entry.what || (screenshotCount ? screenshotCount + " screenshot" + (screenshotCount === 1 ? "" : "s") + " stored locally" : "Voice or file entry");
      var tags = node.querySelector(".saved-entry__tags");
      entryTags(entry).forEach(function (tag) { var chip = document.createElement("span"); chip.textContent = tag; tags.appendChild(chip); });
      var mediaContainer = node.querySelector(".saved-entry__media");
      list.appendChild(node);
      renderMedia(mediaContainer, entry.media || [], false);
    });
  }

  document.getElementById("entryList").addEventListener("click", async function (event) {
    var button = event.target.closest("button[data-entry-action]");
    if (!button) return;
    var id = button.closest("article").dataset.id;
    var entry = entries.find(function (item) { return item.id === id; });
    if (!entry) return;
    if (button.dataset.entryAction === "open") openEntry(entry, false);
    else if (button.dataset.entryAction === "pil") addToPil(entry, button);
    else if (confirm("Delete this private entry and its locally stored recordings or files? This cannot be undone.")) {
      await Promise.all((entry.media || []).map(function (item) { return deleteBlob(item.blobId); }));
      entries = entries.filter(function (item) { return item.id !== id; });
      writeJson(STORAGE_KEY, entries);
      if (draft.editingId === id) { localStorage.removeItem(DRAFT_KEY); draft = blankDraft(); restoreForm(); }
      renderEntries();
    }
  });

  function addToPil(entry, feedback) {
    if (!entry) return;
    var cards = readArray(PIL_KEY);
    if (cards.some(function (card) { return card.sourceId === entry.id; })) return setFeedback(feedback, "Already added to your PIL.");
    cards.unshift({ id: "pil-" + entry.id, sourceId: entry.id, type: "Patterns I’m noticing", title: entry.area, content: entry.remember || entry.story || entry.what, tags: entry.behaviors.slice(), createdAt: new Date().toISOString() });
    setFeedback(feedback, writeJson(PIL_KEY, cards) ? "Added to your Personal Intelligence Layer." : "This browser could not save the card.");
  }

  function setFeedback(target, message) {
    if (!target) return;
    if (target.tagName === "BUTTON") {
      var old = target.textContent;
      target.textContent = message;
      target.disabled = true;
      setTimeout(function () { target.textContent = old; target.disabled = false; }, 2200);
    } else target.textContent = message;
  }

  document.getElementById("viewEntries").addEventListener("click", function () { var section = document.getElementById("entries"); section.hidden = false; renderEntries(); section.scrollIntoView({ behavior: "smooth" }); });

  async function clearAllData() {
    if (!entries.length && !hasDraftContent(draft)) return true;
    if (!confirm("Delete every Safety Hall entry, draft, recording, and uploaded file on this device? This cannot be undone.")) return false;
    await stopRecording();
    entries = [];
    draft = blankDraft();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(PATTERN_REVIEW_KEY);
    patternReviews = {};
    await clearBlobs();
    await dropDatabase();
    restoreForm();
    renderEntries();
    hidePanel("contextPanel");
    hidePanel("sensePanel");
    return true;
  }

  document.getElementById("clearEntries").addEventListener("click", clearAllData);
  document.getElementById("safetyDelete").addEventListener("click", async function () { if (await clearAllData()) closeDialog(safetyDialog); });

  document.getElementById("exportEntries").addEventListener("click", function () {
    if (!entries.length) return showRoute("Nothing to export yet", "Finish a private entry first. Your current draft remains autosaved above.");
    var safeEntries = entries.map(function (entry) { return Object.assign({}, entry, { media: (entry.media || []).map(function (item) { return Object.assign({}, item, { blobId: undefined, note: "User-authored transcript and screenshot-context text plus local integrity fingerprints are included when present. Original audio and file content remain stored separately on this device and are not included in this JSON export." }); }) }); });
    var blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), source: "Practice Village · Safety Hall", note: "User-authored records, editable transcript text, screenshot context, local integrity fingerprints, and the user's pattern-review responses are included. Original audio and uploaded file content are not included. Pattern observations are editable aids, not diagnoses or legal conclusions.", entries: safeEntries, patternReviews: patternReviews }, null, 2)], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "practice-village-safety-entries.json";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  });

  function topValues(items, key) {
    var counts = {};
    items.forEach(function (item) { (item[key] || []).forEach(function (value) { if (["Nothing here fits yet", "None or not sure", "No clear change yet"].indexOf(value) < 0) counts[value] = (counts[value] || 0) + 1; }); });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 5).map(function (value) { return value + " (" + counts[value] + ")"; });
  }

  function countEntriesWith(items, key, values) {
    return items.filter(function (entry) {
      return (entry[key] || []).some(function (value) { return values.indexOf(value) >= 0; });
    }).length;
  }

  function reviewFor(area) {
    if (!patternReviews[area]) patternReviews[area] = { states: {}, note: "", updatedAt: null };
    patternReviews[area].states = patternReviews[area].states || {};
    return patternReviews[area];
  }

  function savePatternReviews() {
    var review = reviewFor(activePatternArea || "Not sure");
    review.updatedAt = new Date().toISOString();
    return writeJson(PATTERN_REVIEW_KEY, patternReviews);
  }

  function patternObservations(pattern) {
    var items = pattern.entries;
    var observations = [];
    var realityCount = countEntriesWith(items, "behaviors", ["Denial or rewriting", "Credibility undermining"]);
    var microaggressionCount = countEntriesWith(items, "behaviors", ["Interruption, exclusion, or stereotyping", "Identity-linked slight or double standard"]);
    var inconsistencyCount = countEntriesWith(items, "behaviors", ["Promises and actions did not match"]);
    var controlCount = countEntriesWith(items, "behaviors", ["Changing rules or expectations", "Information or access control", "Pressure or leverage", "Monitoring or isolation"]);
    var leverageCount = items.filter(function (entry) { return (entry.powers || []).some(function (value) { return value !== "None or not sure"; }); }).length;
    var retaliationCount = countEntriesWith(items, "behaviors", ["Escalation after resistance"]);
    var consequenceCount = countEntriesWith(items, "consequences", ["Job or evaluation changed", "Pay or schedule changed", "Access or information withheld", "Threat, punishment, or pressure", "Health or safety effect"]);

    if (realityCount) observations.push({ id: "reality-pressure", title: realityCount > 1 ? "Reality or credibility pressure appears more than once" : "This record includes reality or credibility pressure", count: realityCount, copy: "Denial, rewriting, or attacks on memory, judgment, competence, or stability appear in " + realityCount + " " + (realityCount === 1 ? "entry" : "entries") + ". Some people use the word gaslighting for a sustained pattern like this. This record cannot determine intent or apply that label for you." });
    if (microaggressionCount) observations.push({ id: "identity-and-belonging", title: microaggressionCount > 1 ? "Identity-linked slights or unequal treatment appear more than once" : "The record includes a possible identity-linked slight or unequal standard", count: microaggressionCount, copy: "Interruption, exclusion, stereotyping, an identity-linked assumption, or a double standard appears in " + microaggressionCount + " " + (microaggressionCount === 1 ? "entry" : "entries") + ". Microaggressions are often cumulative and contextual. You decide whether that language helps describe the impact or pattern." });
    if (inconsistencyCount) observations.push({ id: "promises-versus-actions", title: inconsistencyCount > 1 ? "Promises and later actions repeatedly do not match" : "A promise and later action do not match", count: inconsistencyCount, copy: "You marked a difference between what was said would happen and what later occurred. Recording the promise, later action, and consequence separately can make the pattern easier to review." });
    if (controlCount || leverageCount) observations.push({ id: "narrowed-choice", title: controlCount + leverageCount > 2 ? "Control or leverage may be narrowing choices" : "Control or leverage is present in the record", count: Math.max(controlCount, leverageCount), copy: "The record includes changing rules, restricted information, pressure, monitoring, isolation, or influence over something important. These details can matter when considering coercive control, but Safety Hall does not make that determination." });
    if (retaliationCount || consequenceCount) observations.push({ id: "response-and-consequence", title: retaliationCount ? "Resistance or questioning was followed by escalation" : "Consequences followed the events you recorded", count: Math.max(retaliationCount, consequenceCount), copy: "Your entries include escalation, punishment, work changes, withheld access, pressure, or health and safety effects. Support can come before another confrontation or boundary." });

    var behaviorCounts = {};
    items.forEach(function (entry) { (entry.behaviors || []).forEach(function (value) { if (value !== "Nothing here fits yet") behaviorCounts[value] = (behaviorCounts[value] || 0) + 1; }); });
    Object.keys(behaviorCounts).filter(function (value) { return behaviorCounts[value] >= 2 && ["Denial or rewriting", "Credibility undermining", "Interruption, exclusion, or stereotyping", "Identity-linked slight or double standard", "Promises and actions did not match", "Changing rules or expectations", "Information or access control", "Pressure or leverage", "Monitoring or isolation", "Escalation after resistance"].indexOf(value) < 0; }).sort(function (a, b) { return behaviorCounts[b] - behaviorCounts[a]; }).slice(0, 2).forEach(function (value) {
      observations.push({ id: "repeated-" + value.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title: value + " appears repeatedly", count: behaviorCounts[value], copy: "You selected this description in " + behaviorCounts[value] + " entries. Repetition can be worth noticing even when the reason or remedy is not clear yet." });
    });
    if (!observations.length) observations.push({ id: "not-enough-context", title: "There is not enough structured context to suggest a pattern yet", count: 0, copy: "That does not mean nothing is wrong. You can add details, write what you are noticing in your own words, or seek support without waiting for more entries." });
    return observations;
  }

  function timelineMarkup(pattern) {
    var ordered = pattern.entries.slice().sort(function (a, b) { return new Date(a.happenedAt || a.createdAt) - new Date(b.happenedAt || b.createdAt); });
    var html = '<section class="pattern-section"><div class="pattern-section__heading"><div><span class="eyebrow">Your incident timeline</span><h3>What changed over time</h3></div><span>' + pattern.count + " " + (pattern.count === 1 ? "entry" : "entries") + '</span></div><div class="pattern-timeline">';
    ordered.forEach(function (entry, index) {
      var tags = (entry.behaviors || []).concat(entry.powers || [], entry.consequences || []).filter(function (value) { return ["Nothing here fits yet", "None or not sure", "No clear change yet"].indexOf(value) < 0; });
      var mediaCount = (entry.media || []).length;
      html += '<article class="timeline-entry"><div class="timeline-marker" aria-hidden="true">' + (index + 1) + '</div><div><div class="timeline-entry__meta"><time>' + escapeText(formatDate(entry.happenedAt || entry.createdAt)) + '</time><span>' + escapeText(entry.area || "Not sure") + '</span></div><h4>' + escapeText(shortTitle(entry)) + '</h4>';
      if (entry.people) html += '<p><b>People or roles:</b> ' + escapeText(entry.people) + '</p>';
      if (entry.whatChanged) html += '<p><b>Before or afterward:</b> ' + escapeText(entry.whatChanged) + '</p>';
      if (tags.length) html += '<div class="timeline-tags">' + tags.slice(0, 8).map(function (tag) { return '<span>' + escapeText(tag) + '</span>'; }).join("") + '</div>';
      if (mediaCount) html += '<small>' + mediaCount + " locally stored " + (mediaCount === 1 ? "item" : "items") + '</small>';
      html += '<button type="button" data-pattern-edit="' + escapeText(entry.id) + '">Open and edit this entry</button></div></article>';
    });
    return html + '</div></section>';
  }

  function observationsMarkup(pattern) {
    var review = reviewFor(pattern.area);
    var html = '<section class="pattern-section"><div class="pattern-section__heading"><div><span class="eyebrow">Possible observations</span><h3>You decide what fits</h3></div></div><p class="pattern-boundary">These suggestions come only from descriptions you selected. They are not diagnoses, proof of intent, or legal findings.</p><div class="pattern-observations">';
    patternObservations(pattern).forEach(function (observation) {
      var state = review.states[observation.id] || "";
      html += '<article class="pattern-observation" data-observation="' + escapeText(observation.id) + '"><span class="observation-evidence">' + (observation.count ? observation.count + " related " + (observation.count === 1 ? "entry" : "entries") : "More context optional") + '</span><h4>' + escapeText(observation.title) + '</h4><p>' + escapeText(observation.copy) + '</p><div class="observation-choices" aria-label="Does this observation fit?"><button type="button" data-observation-state="fits" aria-pressed="' + (state === "fits") + '">This fits</button><button type="button" data-observation-state="unsure" aria-pressed="' + (state === "unsure") + '">Not sure</button><button type="button" data-observation-state="does-not-fit" aria-pressed="' + (state === "does-not-fit") + '">Does not fit</button></div></article>';
    });
    html += '</div><label class="pattern-note"><span>What are you noticing in your own words? <em>optional</em></span><textarea id="patternUserNote" rows="3" placeholder="Your language matters more than a suggested label.">' + escapeText(review.note || "") + '</textarea><small>Saved privately on this device with this pattern review.</small></label></section>';
    return html;
  }

  function responsibilityMarkup(pattern) {
    var entriesAtRisk = pattern.entries.filter(function (entry) {
      return entry.safety === "Yes" || (entry.behaviors || []).some(function (value) { return ["Escalation after resistance", "Monitoring or isolation", "Pressure or leverage"].indexOf(value) >= 0; }) || (entry.consequences || []).some(function (value) { return ["Job or evaluation changed", "Pay or schedule changed", "Access or information withheld", "Threat, punishment, or pressure", "Health or safety effect"].indexOf(value) >= 0; });
    }).length;
    var riskCopy = entriesAtRisk ? "Because " + entriesAtRisk + " " + (entriesAtRisk === 1 ? "entry includes" : "entries include") + " safety concerns, power, escalation, or serious consequences, setting a direct boundary may increase risk. You do not have to set a boundary to receive help." : "A direct conversation or boundary is one option if it helps you reach your goal and feels safe.";
    return '<section class="pattern-section"><div class="pattern-section__heading"><div><span class="eyebrow">Responsibility map</span><h3>Sort responsibility and next steps</h3></div></div><div class="responsibility-lanes"><article><span>My choices</span><h4>What I can decide</h4><p>Choose what to save, what you want, who you trust, whether to respond, and what risks you are willing to take.</p><button type="button" data-pattern-route="personal">Review my choices</button></article><article class="' + (entriesAtRisk ? "lane-caution" : "") + '"><span>Optional personal action</span><h4>Ask a question or set a boundary</h4><p>' + escapeText(riskCopy) + '</p><button type="button" data-pattern-route="boundary">See an optional script</button></article><article class="lane-support"><span>Not mine to solve alone</span><h4>Other people and organizations are responsible for their actions</h4><p>Repeated misconduct, retaliation, discrimination, coercion, policy failures, or workplace consequences may require help from an advocate, union, ombuds, regulator, or legal information service.</p><div><button type="button" data-pattern-route="support">Explore outside support</button><button type="button" data-pattern-route="rights">Review rights or rules</button></div></article></div></section>';
  }

  function selectedHandoffEntries() {
    var selectedIds = Array.from(document.querySelectorAll('#handoffEntryList input[type="checkbox"]:checked')).map(function (input) { return input.value; });
    return entries.filter(function (entry) { return selectedIds.indexOf(entry.id) >= 0; }).sort(function (a, b) { return new Date(a.happenedAt || a.createdAt) - new Date(b.happenedAt || b.createdAt); });
  }

  function renderHandoffEntries(area) {
    var list = document.getElementById("handoffEntryList");
    list.innerHTML = "";
    entries.slice().sort(function (a, b) { return new Date(b.happenedAt || b.createdAt) - new Date(a.happenedAt || a.createdAt); }).forEach(function (entry) {
      var label = document.createElement("label");
      if (area && (entry.area || "Not sure") === area) label.classList.add("is-related");
      label.innerHTML = '<input type="checkbox" value="' + escapeText(entry.id) + '" /><span><b>' + escapeText(shortTitle(entry)) + '</b><small>' + escapeText(formatDate(entry.happenedAt || entry.createdAt)) + " · " + escapeText(entry.area || "Not sure") + (area && (entry.area || "Not sure") === area ? " · related to this review" : "") + '</small></span>';
      list.appendChild(label);
    });
  }

  function updateHandoffBuilder() {
    var count = selectedHandoffEntries().length;
    document.getElementById("previewHandoff").disabled = count === 0;
    document.getElementById("handoffBuilderStatus").textContent = count ? count + " " + (count === 1 ? "incident selected" : "incidents selected") + ". Review the exact text before downloading." : "Choose at least one incident.";
  }

  function resetHandoffReview() {
    activeHandoffText = "";
    document.getElementById("handoffReviewCheck").checked = false;
    document.getElementById("downloadHandoff").disabled = true;
    document.getElementById("handoffReviewStatus").textContent = "";
    document.getElementById("handoffBuilder").hidden = false;
    document.getElementById("handoffReview").hidden = true;
  }

  function handoffMediaItems() {
    var result = [];
    entries.filter(function (entry) { return activeHandoffEntryIds.indexOf(entry.id) >= 0; }).forEach(function (entry) {
      (entry.media || []).forEach(function (item) { result.push({ entry: entry, item: item }); });
    });
    return result;
  }

  function openHandoff(area) {
    if (!entries.length) return showRoute("Nothing to prepare yet", "Finish a private entry first. Your current draft remains autosaved.");
    activeHandoffArea = area || "";
    resetHandoffReview();
    document.getElementById("handoffRecipient").value = "";
    document.getElementById("handoffPurpose").value = "";
    ["handoffIncludeAccount", "handoffIncludeTags", "handoffIncludePattern"].forEach(function (id) { document.getElementById(id).checked = true; });
    ["handoffIncludePeople", "handoffIncludeMediaManifest", "handoffIncludeDerivedMedia", "handoffIncludeReflection"].forEach(function (id) { document.getElementById(id).checked = false; });
    renderHandoffEntries(activeHandoffArea);
    updateHandoffBuilder();
    openDialog(handoffDialog);
  }

  function mediaManifestText(entry) {
    if (!(entry.media || []).length) return "";
    return (entry.media || []).map(function (item) {
      var fingerprint = item.sha256 ? "; local SHA-256 " + item.sha256 : "; no local fingerprint recorded";
      return "- " + (item.name || item.label || "Saved item") + ": " + (item.label || item.type || "file") + ", " + bytesLabel(item.size) + fingerprint;
    }).join("\n");
  }

  function derivedMediaText(entry) {
    var parts = [];
    (entry.media || []).forEach(function (item) {
      if (String(item.transcript || "").trim()) parts.push("User-authored transcript for " + (item.name || item.label || "recording") + ":\n" + item.transcript.trim());
      var details = item.imageDetails || {};
      var context = [];
      if (details.contextNote) context.push("Context: " + details.contextNote);
      if (details.visibleText) context.push("Visible words typed by the user: " + details.visibleText);
      if (details.visualDescription) context.push("User description: " + details.visualDescription);
      if (context.length) parts.push("User-authored screenshot context for " + (item.name || item.label || "image") + ":\n" + context.join("\n"));
    });
    return parts.join("\n\n");
  }

  function responsibilityText(entry) {
    var map = entry.map || {};
    var parts = [];
    if (map.theirs) parts.push("What may belong to them:\n" + map.theirs);
    if (map.cannot) parts.push("What I cannot control:\n" + map.cannot);
    if (map.mine) parts.push("What remains mine to choose:\n" + map.mine);
    if (map.support) parts.push("What support can carry with me:\n" + map.support);
    if (map.hope) parts.push("What I hope, wish, or desire:\n" + map.hope);
    return parts.join("\n\n");
  }

  function confirmedPatternText(selected) {
    var areas = [];
    selected.forEach(function (entry) { var area = entry.area || "Not sure"; if (areas.indexOf(area) < 0) areas.push(area); });
    var sections = [];
    areas.forEach(function (area) {
      var areaEntries = selected.filter(function (entry) { return (entry.area || "Not sure") === area; });
      var review = patternReviews[area];
      if (!review) return;
      var pattern = { area: area, entries: areaEntries };
      var fits = patternObservations(pattern).filter(function (observation) { return review.states && review.states[observation.id] === "fits"; });
      var lines = fits.map(function (observation) { return "- " + observation.title + " (marked ‘This fits’ by the user)"; });
      if (review.note) lines.push("User's own pattern note:\n" + review.note);
      if (lines.length) sections.push(area + ":\n" + lines.join("\n"));
    });
    return sections.join("\n\n");
  }

  function buildHandoffText() {
    var selected = selectedHandoffEntries();
    var recipient = document.getElementById("handoffRecipient").value;
    var purpose = document.getElementById("handoffPurpose").value;
    var includeAccount = document.getElementById("handoffIncludeAccount").checked;
    var includePeople = document.getElementById("handoffIncludePeople").checked;
    var includeTags = document.getElementById("handoffIncludeTags").checked;
    var includePattern = document.getElementById("handoffIncludePattern").checked;
    var includeManifest = document.getElementById("handoffIncludeMediaManifest").checked;
    var includeDerived = document.getElementById("handoffIncludeDerivedMedia").checked;
    var includeReflection = document.getElementById("handoffIncludeReflection").checked;
    var lines = ["PRACTICE VILLAGE · SAFETY HALL", "USER-PREPARED SUPPORT HANDOFF", "", "Prepared: " + new Date().toLocaleString(), recipient ? "Prepared for: " + recipient : "Prepared for: Not named", purpose ? "Help requested: " + purpose.trim() : "Help requested: Not specified", "", "IMPORTANT CONTEXT", "This document was prepared by the user from their private Safety Hall entries. It contains the user's account and descriptions they selected. Practice Village has not verified the events. Pattern observations can be edited and are not diagnoses, proof of intent, or legal conclusions.", "", "INCIDENT TIMELINE"];
    selected.forEach(function (entry, index) {
      var block = ["", String(index + 1) + ". " + formatDate(entry.happenedAt || entry.createdAt) + ": " + (entry.area || "Not sure")];
      if (includeAccount) {
        if (entry.story || entry.what) block.push("\nUSER'S ACCOUNT\n" + (entry.story || entry.what));
        if (entry.whatChanged) block.push("\nWHAT HAPPENED BEFORE OR AFTERWARD\n" + entry.whatChanged);
        if (entry.remember) block.push("\nWHAT THE USER WANTED TO REMEMBER\n" + entry.remember);
      }
      if (includePeople && entry.people) block.push("\nPEOPLE OR ROLES\n" + entry.people);
      if (includeTags) {
        var tags = (entry.behaviors || []).concat(entry.powers || [], entry.consequences || []).filter(function (value) { return ["Nothing here fits yet", "None or not sure", "No clear change yet"].indexOf(value) < 0; });
        if (tags.length) block.push("\nDESCRIPTIONS SELECTED BY THE USER\n- " + tags.join("\n- "));
      }
      if (includeManifest) {
        var manifest = mediaManifestText(entry);
        if (manifest) block.push("\nMEDIA LIST: FILES NOT ATTACHED\n" + manifest);
      }
      if (includeDerived) {
        var derived = derivedMediaText(entry);
        if (derived) block.push("\nUSER NOTES ABOUT MEDIA: NOT ORIGINAL MEDIA\n" + derived);
      }
      if (includeReflection) {
        var reflection = responsibilityText(entry);
        if (reflection) block.push("\nPERSONAL RESPONSIBILITY NOTES: INCLUDED BY USER CHOICE\n" + reflection);
      }
      lines.push(block.join("\n"));
    });
    if (includePattern) {
      var confirmed = confirmedPatternText(selected);
      if (confirmed) lines.push("", "PATTERN OBSERVATIONS THE USER MARKED AS FITTING", confirmed);
    }
    lines.push("", "ATTACHMENT BOUNDARY", "No original audio, screenshot, document, or redacted image is embedded in this text file. Any attachment must be selected, reviewed, and shared separately by the user. A local SHA-256 fingerprint can help detect later file changes; it does not authenticate a source, prove when an event occurred, or guarantee legal admissibility.", "", "END OF USER-PREPARED HANDOFF");
    return lines.join("\n");
  }

  document.getElementById("prepareHandoff").addEventListener("click", function () { openHandoff(); });
  document.getElementById("handoffEntryList").addEventListener("change", updateHandoffBuilder);
  document.getElementById("previewHandoff").addEventListener("click", function () {
    if (!selectedHandoffEntries().length) return updateHandoffBuilder();
    activeHandoffEntryIds = selectedHandoffEntries().map(function (entry) { return entry.id; });
    activeHandoffText = buildHandoffText();
    document.getElementById("handoffPreview").textContent = activeHandoffText;
    document.getElementById("handoffReviewCheck").checked = false;
    document.getElementById("downloadHandoff").disabled = true;
    document.getElementById("handoffBuilder").hidden = true;
    document.getElementById("handoffReview").hidden = false;
    var attachmentCount = handoffMediaItems().length;
    document.getElementById("prepareAttachments").disabled = attachmentCount === 0;
    document.getElementById("prepareAttachments").textContent = attachmentCount ? "Prepare " + attachmentCount + " separate " + (attachmentCount === 1 ? "attachment" : "attachments") : "No attachments in these incidents";
    document.getElementById("handoffPreview").focus();
  });
  function editHandoffSelections() { document.getElementById("handoffReview").hidden = true; document.getElementById("handoffBuilder").hidden = false; document.getElementById("previewHandoff").focus(); }
  document.getElementById("editHandoff").addEventListener("click", editHandoffSelections);
  document.getElementById("editHandoffBottom").addEventListener("click", editHandoffSelections);
  document.getElementById("handoffReviewCheck").addEventListener("change", function (event) { document.getElementById("downloadHandoff").disabled = !event.target.checked; });
  document.getElementById("downloadHandoff").addEventListener("click", function () {
    if (!activeHandoffText || !document.getElementById("handoffReviewCheck").checked) return;
    var blob = new Blob([activeHandoffText], { type: "text/plain;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "safety-hall-reviewed-handoff-" + new Date().toISOString().slice(0, 10) + ".txt";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
    document.getElementById("handoffReviewStatus").textContent = "Reviewed handoff downloaded. Nothing was sent and your private entries remain unchanged.";
  });
  handoffDialog.addEventListener("close", resetHandoffReview);

  function attachmentState(id) {
    if (!attachmentDecisions[id]) attachmentDecisions[id] = { decision: "private", reviewed: false };
    return attachmentDecisions[id];
  }

  function downloadOriginalMedia(item) {
    if (!item.blobId) return Promise.resolve(false);
    return getBlob(item.blobId).then(function (blob) {
      if (!blob) return false;
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = item.name || item.label || "safety-hall-file";
      link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return true;
    });
  }

  function updateAttachmentBuilder() {
    var items = handoffMediaItems();
    var chosen = items.filter(function (record) { return attachmentState(record.item.id).decision !== "private"; });
    var reviewed = chosen.filter(function (record) { return attachmentState(record.item.id).reviewed; });
    var ready = chosen.length > 0 && chosen.length === reviewed.length;
    document.getElementById("previewAttachmentManifest").disabled = !ready;
    if (!items.length) document.getElementById("attachmentBuilderStatus").textContent = "The selected incidents have no locally stored attachments.";
    else if (!chosen.length) document.getElementById("attachmentBuilderStatus").textContent = "Every attachment is still private. Choose a share version only if it helps.";
    else if (!ready) document.getElementById("attachmentBuilderStatus").textContent = "Review the entire selected file or redacted copy before preparing the manifest.";
    else document.getElementById("attachmentBuilderStatus").textContent = chosen.length + " reviewed " + (chosen.length === 1 ? "attachment is" : "attachments are") + " ready for the manifest.";
  }

  function renderAttachmentDecisions() {
    var list = document.getElementById("attachmentDecisionList");
    list.innerHTML = "";
    var records = handoffMediaItems();
    if (!records.length) {
      list.innerHTML = '<div class="attachment-empty"><b>No attachments in the selected incidents.</b><p>The text handoff can still be useful on its own.</p></div>';
      updateAttachmentBuilder();
      return;
    }
    records.forEach(function (record) {
      var entry = record.entry;
      var item = record.item;
      var isImage = String(item.mime || "").indexOf("image/") === 0;
      var state = attachmentState(item.id);
      var card = document.createElement("article");
      card.className = "attachment-decision";
      card.dataset.attachmentId = item.id;
      card.innerHTML = '<div class="attachment-decision__head"><span>' + (isImage ? "IMAGE" : (item.type === "voice" ? "AUDIO" : "FILE")) + '</span><div><h3>' + escapeText(item.label || item.name || "Saved item") + '</h3><p>' + escapeText(formatDate(entry.happenedAt || entry.createdAt)) + " · " + escapeText(entry.area || "Not sure") + " · " + escapeText(bytesLabel(item.size)) + '</p></div></div>' +
        '<p class="attachment-fingerprint">' + (item.sha256 ? "Original-file fingerprint: " + escapeText(item.sha256) : "No local fingerprint recorded for this original") + '</p>' +
        '<label class="field"><span>What do you intend to share?</span><select data-attachment-decision><option value="private">Keep this file private</option><option value="original">Share the reviewed original separately</option>' + (isImage ? '<option value="redacted">Share a reviewed redacted copy separately</option>' : "") + '</select></label>' +
        '<div class="attachment-file-actions"><button type="button" data-download-attachment>Download original for review</button>' + (isImage ? '<button type="button" data-redact-attachment>Make a redacted copy</button>' : "") + '</div>' +
        '<label class="attachment-file-review"><input type="checkbox" data-attachment-reviewed disabled /> <span>I reviewed the entire ' + (isImage ? "image or redacted copy" : "file") + ' and intend to share only the version selected above.</span></label>';
      list.appendChild(card);
      card.querySelector("[data-attachment-decision]").value = state.decision;
      var check = card.querySelector("[data-attachment-reviewed]");
      check.disabled = state.decision === "private";
      check.checked = state.decision !== "private" && state.reviewed;
    });
    updateAttachmentBuilder();
  }

  function resetAttachmentReview() {
    activeAttachmentManifest = "";
    document.getElementById("attachmentManifestReviewCheck").checked = false;
    document.getElementById("downloadAttachmentManifest").disabled = true;
    document.getElementById("attachmentReviewStatus").textContent = "";
    document.getElementById("attachmentBuilder").hidden = false;
    document.getElementById("attachmentReview").hidden = true;
  }

  function openAttachmentPacket(preserveDecisions) {
    if (!preserveDecisions) attachmentDecisions = {};
    resetAttachmentReview();
    renderAttachmentDecisions();
    openDialog(attachmentPacketDialog);
  }

  document.getElementById("prepareAttachments").addEventListener("click", function () {
    if (!handoffMediaItems().length) return;
    closeDialog(handoffDialog);
    openAttachmentPacket(false);
  });

  document.getElementById("attachmentDecisionList").addEventListener("change", function (event) {
    var card = event.target.closest("[data-attachment-id]");
    if (!card) return;
    var state = attachmentState(card.dataset.attachmentId);
    if (event.target.matches("[data-attachment-decision]")) {
      state.decision = event.target.value;
      state.reviewed = false;
      var check = card.querySelector("[data-attachment-reviewed]");
      check.checked = false;
      check.disabled = state.decision === "private";
    } else if (event.target.matches("[data-attachment-reviewed]")) state.reviewed = event.target.checked;
    updateAttachmentBuilder();
  });

  document.getElementById("attachmentDecisionList").addEventListener("click", async function (event) {
    var card = event.target.closest("[data-attachment-id]");
    if (!card) return;
    var record = handoffMediaItems().find(function (candidate) { return candidate.item.id === card.dataset.attachmentId; });
    if (!record) return;
    if (event.target.closest("[data-download-attachment]")) {
      var downloaded = await downloadOriginalMedia(record.item);
      document.getElementById("attachmentBuilderStatus").textContent = downloaded ? "Original downloaded for private review. Choosing to share it still requires the review checkbox." : "The original file is unavailable in this browser.";
    }
    if (event.target.closest("[data-redact-attachment]")) {
      returnToAttachmentPacket = true;
      closeDialog(attachmentPacketDialog);
      openRedaction(record.item);
    }
  });

  function buildAttachmentManifest() {
    var selected = handoffMediaItems().filter(function (record) { return attachmentState(record.item.id).decision !== "private"; });
    var lines = ["PRACTICE VILLAGE · SAFETY HALL", "USER-REVIEWED ATTACHMENT MANIFEST", "", "Prepared: " + new Date().toLocaleString(), "", "IMPORTANT", "This manifest does not contain or transmit any attachment. Each file must be attached separately by the user after whole-file review. A listed decision records the user's preparation choice; it does not verify what was ultimately sent.", "", "FILES PREPARED FOR SEPARATE SHARING"];
    selected.forEach(function (record, index) {
      var item = record.item;
      var entry = record.entry;
      var state = attachmentState(item.id);
      lines.push("", String(index + 1) + ". " + (item.label || item.name || "Saved item"), "Related incident: " + formatDate(entry.happenedAt || entry.createdAt) + ": " + (entry.area || "Not sure"), "Stored original filename: " + (item.name || "Not recorded"), "File type: " + (item.mime || item.type || "Not recorded"), "Stored size: " + bytesLabel(item.size), "Version the user prepared: " + (state.decision === "redacted" ? "Separately created and reviewed redacted copy" : "Reviewed original"), "Whole-file review confirmed by user: Yes");
      if (item.sha256) lines.push("Local SHA-256 of stored original: " + item.sha256);
      if (state.decision === "redacted") lines.push("Redacted-copy fingerprint: Not recorded by Safety Hall; the downloaded redacted copy is separate from the stored original.");
    });
    lines.push("", "FINGERPRINT BOUNDARY", "A local SHA-256 can help detect later changes to the stored original. It does not authenticate the source, prove when an event occurred, verify that a listed file was sent, or guarantee legal admissibility.", "", "END OF USER-REVIEWED ATTACHMENT MANIFEST");
    return lines.join("\n");
  }

  document.getElementById("previewAttachmentManifest").addEventListener("click", function () {
    if (this.disabled) return;
    activeAttachmentManifest = buildAttachmentManifest();
    document.getElementById("attachmentManifestPreview").textContent = activeAttachmentManifest;
    document.getElementById("attachmentManifestReviewCheck").checked = false;
    document.getElementById("downloadAttachmentManifest").disabled = true;
    document.getElementById("attachmentBuilder").hidden = true;
    document.getElementById("attachmentReview").hidden = false;
    document.getElementById("attachmentManifestPreview").focus();
  });
  function editAttachmentDecisions() { document.getElementById("attachmentReview").hidden = true; document.getElementById("attachmentBuilder").hidden = false; document.getElementById("previewAttachmentManifest").focus(); }
  document.getElementById("editAttachmentDecisions").addEventListener("click", editAttachmentDecisions);
  document.getElementById("editAttachmentDecisionsBottom").addEventListener("click", editAttachmentDecisions);
  document.getElementById("attachmentManifestReviewCheck").addEventListener("change", function (event) { document.getElementById("downloadAttachmentManifest").disabled = !event.target.checked; });
  document.getElementById("downloadAttachmentManifest").addEventListener("click", function () {
    if (!activeAttachmentManifest || !document.getElementById("attachmentManifestReviewCheck").checked) return;
    var blob = new Blob([activeAttachmentManifest], { type: "text/plain;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "safety-hall-reviewed-attachment-manifest-" + new Date().toISOString().slice(0, 10) + ".txt";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
    document.getElementById("attachmentReviewStatus").textContent = "Reviewed manifest downloaded. Files remain separate and nothing was sent.";
  });
  attachmentPacketDialog.addEventListener("close", resetAttachmentReview);

  function patternFor(area) {
    if (!entries.length) return null;
    var counts = {};
    entries.forEach(function (entry) { var key = entry.area || "Not sure"; counts[key] = (counts[key] || 0) + 1; });
    var target = area || Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
    var relevant = entries.filter(function (entry) { return (entry.area || "Not sure") === target; });
    var dates = relevant.map(function (entry) { return new Date(entry.happenedAt || entry.createdAt); }).filter(function (date) { return !isNaN(date); }).sort(function (a, b) { return a - b; });
    return { area: target, count: relevant.length, entries: relevant, latest: relevant[0], behaviors: topValues(relevant, "behaviors"), powers: topValues(relevant, "powers"), consequences: topValues(relevant, "consequences"), span: dates.length > 1 ? dates[0].toLocaleDateString() + " to " + dates[dates.length - 1].toLocaleDateString() : "One recorded date" };
  }

  function fact(label, values, fallback) { return '<div class="pattern-fact"><strong>' + escapeText(label) + '</strong><span>' + escapeText(values.length ? values.join(", ") : fallback) + "</span></div>"; }

  function showPattern(area) {
    var pattern = patternFor(area);
    activePatternArea = pattern ? pattern.area : "";
    document.getElementById("patternStatus").textContent = "";
    if (!pattern) {
      document.getElementById("patternTitle").textContent = "Your record is still yours";
      document.getElementById("patternCopy").textContent = "There are no completed entries to compare. Your current draft is still autosaved.";
      document.getElementById("patternSummary").innerHTML = "<b>No pattern review yet</b><p>One experience is still worth documenting. It does not need to become a pattern.</p>";
    } else {
      document.getElementById("patternTitle").textContent = pattern.count >= 3 ? "This has come up " + pattern.count + " times." : "Here is what your record contains.";
      document.getElementById("patternCopy").textContent = pattern.count >= 3 ? "This may be a pattern related to " + pattern.area.toLowerCase() + ". This suggestion comes from your entries. It is not a diagnosis or legal conclusion." : "There are fewer than three related entries, so Safety Hall is not calling this a pattern. Here is what appears in the entries you chose to review.";
      document.getElementById("patternSummary").innerHTML = '<div class="pattern-overview"><b>' + escapeText(pattern.area) + " · " + pattern.count + " related " + (pattern.count === 1 ? "entry" : "entries") + '</b><div class="pattern-facts">' + fact("Time span", [pattern.span], "Not enough dates yet") + fact("Behavior descriptions you selected", pattern.behaviors, "None selected") + fact("Power or leverage", pattern.powers, "None selected") + fact("Consequences", pattern.consequences, "None selected") + '</div></div>' + timelineMarkup(pattern) + observationsMarkup(pattern) + responsibilityMarkup(pattern);
    }
    openDialog(patternDialog);
  }

  document.getElementById("reviewAnytime").addEventListener("click", function () { showPattern(); });

  afterSaveDialog.addEventListener("click", function (event) {
    var button = event.target.closest("[data-after]");
    if (!button) return;
    var entry = entries.find(function (item) { return item.id === lastSavedId; });
    closeDialog(afterSaveDialog);
    if (button.dataset.after === "sense" && entry) openEntry(entry, true);
    else if (button.dataset.after === "pattern") showPattern(entry && entry.area);
    else { storyText.focus(); document.getElementById("captureCard").scrollIntoView({ behavior: "smooth", block: "start" }); }
  });

  patternDialog.addEventListener("click", function (event) {
    var edit = event.target.closest("[data-pattern-edit]");
    if (edit) {
      var editEntry = entries.find(function (entry) { return entry.id === edit.dataset.patternEdit; });
      if (editEntry) { closeDialog(patternDialog); openEntry(editEntry, true); }
      return;
    }
    var observationChoice = event.target.closest("[data-observation-state]");
    if (observationChoice) {
      var observation = observationChoice.closest("[data-observation]");
      var review = reviewFor(activePatternArea);
      review.states[observation.dataset.observation] = observationChoice.dataset.observationState;
      savePatternReviews();
      observation.querySelectorAll("[data-observation-state]").forEach(function (choice) { choice.setAttribute("aria-pressed", choice === observationChoice ? "true" : "false"); });
      document.getElementById("patternStatus").textContent = "Your response was saved privately. You can change it anytime.";
      return;
    }
    var route = event.target.closest("[data-pattern-route]");
    if (route) {
      var currentPattern = patternFor(activePatternArea);
      closeDialog(patternDialog);
      if (route.dataset.patternRoute === "personal" && currentPattern) openEntry(currentPattern.latest, true);
      else if (route.dataset.patternRoute === "boundary") showScript(currentPattern && currentPattern.latest);
      else if (route.dataset.patternRoute === "rights") showRoute("Understand rights or rules", "Your location and setting determine which protections or deadlines may apply. Safety Hall can show reviewed public sources. It cannot decide whether a violation occurred.", supportResults.rights);
      else showSupportRouter();
      return;
    }
    var button = event.target.closest("[data-pattern-action]");
    if (!button) return;
    var pattern = patternFor(activePatternArea);
    if (button.dataset.patternAction === "pil" && pattern) addToPil(pattern.latest, document.getElementById("patternStatus"));
    else if (button.dataset.patternAction === "handoff") { closeDialog(patternDialog); openHandoff(pattern && pattern.area); }
    else if (button.dataset.patternAction === "support") { closeDialog(patternDialog); showSupportRouter(); }
    else showScript(pattern && pattern.latest);
  });

  patternDialog.addEventListener("input", function (event) {
    if (event.target.id !== "patternUserNote") return;
    reviewFor(activePatternArea).note = event.target.value;
    savePatternReviews();
    document.getElementById("patternStatus").textContent = "Your words are saved privately on this device.";
  });

  function showScript(entry) {
    var area = entry ? entry.area : "Work";
    var script = "I want to clarify what happened so we have the same record. In the conversation, ___ happened. My understanding is ___. Going forward, I need ___.";
    if (area === "Family" || area === "Home") script = "I hear what you are asking. I’m not available for that right now. I can do ___, or we can talk about another option.";
    if (area === "Body / health") script = "I want this concern documented. What are the possible causes, what are we ruling out, and what should I watch for next?";
    showRoute("Words you can use", "Use this only if direct communication feels safe. Setting a boundary is optional. You are not responsible for fixing someone else’s behavior.", '<blockquote class="route-script">' + escapeText(script) + "</blockquote>");
  }

  function showRoute(title, copy, body) {
    document.getElementById("routeTitle").textContent = title;
    document.getElementById("routeCopy").textContent = copy || "";
    document.getElementById("routeBody").innerHTML = body || "";
    openDialog(routeDialog);
  }

  function showSupportRouter() {
    showRoute("What kind of support would help?", "Choose the closest direction. This is a starting point, not a diagnosis or legal finding.",
      '<div class="support-router">' +
      '<p class="support-privacy"><b>Your private entry stays here.</b> Safety Hall does not attach, quote, or send it when you explore support.</p>' +
      '<div class="support-paths" aria-label="Outside support directions">' +
      '<button class="support-path" type="button" data-support-path="safety"><b>I need to feel safer now</b><small>Immediate danger, surveillance, retaliation, or nowhere private</small></button>' +
      '<button class="support-path" type="button" data-support-path="workplace"><b>This involves work or an organization</b><small>Manager, HR, policy, union, school, board, or institution</small></button>' +
      '<button class="support-path" type="button" data-support-path="rights"><b>I want to understand rights or rules</b><small>Possible workplace, housing, service, or legal protections</small></button>' +
      '<button class="support-path" type="button" data-support-path="advocate"><b>I want someone independent beside me</b><small>Advocate, worker center, union, ombuds, legal aid, or trusted professional</small></button>' +
      '<button class="support-path" type="button" data-support-path="community"><b>I need emotional or community support</b><small>Find someone who will listen without taking over</small></button>' +
      '<button class="support-path" type="button" data-support-path="unsure"><b>I still do not know</b><small>Sort by what would help in the next hour</small></button>' +
      '</div><div class="support-result" id="supportResult" aria-live="polite"></div></div>');
  }

  var supportResults = {
    safety: '<h3>Safety can come before sorting.</h3><p>If you may be in immediate danger, use a private device if possible and contact local emergency help or a trusted person nearby. If someone monitors your device, closing this dialog may not remove browser or network history.</p><ul><li>Move toward a safer or more public place if that is possible.</li><li>Tell one trusted person what kind of contact is safe.</li><li>Do not confront, announce documentation, or set a boundary if that could increase danger.</li></ul><button class="support-next" type="button" data-find-resources="safety">Find reviewed safety resources</button>',
    workplace: '<h3>Save information before choosing where to go.</h3><p>You can document what happened and get confidential guidance before deciding whether to report it. An employer process is one option, but it is not your only option.</p><ul><li>Keep originals, dates, exact words, witnesses, and resulting work changes when safe.</li><li>Save the policy or procedure that was in effect at the time.</li><li>Consider an independent union representative, ombuds, worker advocate, or employment information service before a direct conversation.</li></ul><button class="support-next" type="button" data-find-resources="workplace">Find reviewed workplace resources</button>',
    rights: '<h3>Location and setting determine which rules may apply.</h3><p>Safety Hall should never infer a violation from a behavior label. Add only enough location information to select reviewed public sources; it is not saved with your entry.</p><form class="location-form" id="locationForm"><label>Country or jurisdiction<input id="supportCountry" autocomplete="country-name" required placeholder="For example: United States or Japan"></label><label>State, province, territory, or region <span class="sr-only">optional</span><input id="supportRegion" autocomplete="address-level1" placeholder="Optional"></label><button type="submit">Set location for resources</button><p class="support-status" id="supportLocationStatus" role="status"></p></form>',
    advocate: '<h3>Look for a person whose role is independent.</h3><p>The right companion depends on the setting. Possibilities include a union or worker center, ombuds, disability or civil-rights advocate, legal-aid intake service, domestic-abuse advocate, professional association, or community elder.</p><ul><li>Ask what is confidential before sharing details.</li><li>Ask whether deadlines or reporting duties may apply.</li><li>Share only the portion of your record needed for the help you want.</li></ul><button class="support-next" type="button" data-find-resources="legal-aid">Find reviewed independent resources</button>',
    community: '<h3>Choose someone who will listen without pressuring you.</h3><p>A helpful person can believe you, help you slow down, and respect that the next decision is yours.</p><ul><li>“I need you to listen, not solve this yet.”</li><li>“Can you help me notice what has repeated?”</li><li>“Please check with me before contacting anyone.”</li></ul>',
    unsure: '<h3>Choose one useful step.</h3><p>For the next hour, would it help most to feel safer, save one piece of information, understand one option, or talk to one person? You can stop after that step.</p>'
  };

  function normalizeResourceJurisdiction(country) {
    var value = String(country || "").trim().toLowerCase().replace(/\./g, "");
    if (["us", "usa", "united states", "united states of america"].indexOf(value) >= 0) return "US";
    if (["jp", "japan", "日本", "日本国"].indexOf(value) >= 0) return "JP";
    return "UNSUPPORTED";
  }

  function resourceDate(value) {
    var date = new Date(value + "T12:00:00");
    return isNaN(date) ? value : date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  }

  function resourceLibraryMarkup() {
    var resources = Array.isArray(window.PRACTICE_VILLAGE_SAFETY_RESOURCES) ? window.PRACTICE_VILLAGE_SAFETY_RESOURCES : [];
    var libraryMeta = window.PRACTICE_VILLAGE_SAFETY_RESOURCE_META || {};
    var jurisdictionResources = resources.filter(function (resource) {
      return resource.jurisdiction === activeResourceJurisdiction || resource.jurisdiction === "GLOBAL";
    });
    var filtered = jurisdictionResources.filter(function (resource) {
      return activeResourceFilter === "all" || resource.tags.indexOf(activeResourceFilter) >= 0;
    });
    var supported = activeResourceJurisdiction === "US" || activeResourceJurisdiction === "JP";
    var html = '<div class="resource-library">' +
      '<div class="resource-library__head"><div><span class="eyebrow">Reviewed starting points</span><h3>' + escapeText(activeResourceLocationLabel) + '</h3></div><button type="button" data-change-resource-location>Change location</button></div>' +
      '<p class="library-status"><b>Prototype research:</b> ' + escapeText(libraryMeta.approval || "Team approval pending") + '. Review again by ' + escapeText(resourceDate(libraryMeta.reviewBy || "2026-11-04")) + '.</p>' +
      '<p class="support-privacy"><b>Nothing from your entry is attached.</b> Opening a link sends you to that organization’s website under its privacy practices.</p>';
    if (!supported) {
      html += '<div class="coverage-gap"><b>This MVP does not have reviewed rights sources for this jurisdiction yet.</b><p>Safety Hall will not substitute another country’s rules or generate a legal answer. Global safety guidance may still appear below.</p></div>';
    } else {
      html += '<p class="library-boundary">National starting points only. State, territory, prefecture, local, tribal, and sector-specific protections may differ. A listing is not a determination that a law or policy was violated.</p>';
    }
    html += '<div class="resource-filters" aria-label="Filter reviewed resources">' +
      '<button type="button" data-resource-filter="all">All</button><button type="button" data-resource-filter="workplace">Workplace</button>' +
      '<button type="button" data-resource-filter="safety">Safety</button><button type="button" data-resource-filter="legal-aid">Legal aid</button>' +
      '<button type="button" data-resource-filter="identity-aware">Identity-aware</button><button type="button" data-resource-filter="language-access">Language access</button></div>';
    if (!filtered.length) html += '<p class="resource-empty">No reviewed resource matches this filter yet. This means the library is incomplete. It does not mean support is unavailable.</p>';
    html += '<div class="resource-list">';
    filtered.forEach(function (resource) {
      var overdue = new Date(resource.reviewBy + "T23:59:59") < new Date();
      html += '<article class="resource-card">' +
        '<div class="resource-card__meta"><span>' + escapeText(resource.sourceType) + '</span><span class="' + (overdue ? "is-overdue" : "") + '">' + (overdue ? "Review overdue" : "Reviewed " + escapeText(resourceDate(resource.reviewedAt))) + '</span></div>' +
        '<h4>' + escapeText(resource.title) + '</h4><p class="resource-org">' + escapeText(resource.organization) + '</p>' +
        '<p>' + escapeText(resource.summary) + '</p>' +
        '<details><summary>When this may help and what it cannot do</summary><p><b>May help when:</b> ' + escapeText(resource.useWhen) + '</p><p><b>Limits:</b> ' + escapeText(resource.limits) + '</p><p><b>Language:</b> ' + escapeText(resource.languages) + '</p><p><b>Cost:</b> ' + escapeText(resource.cost) + '</p><p><b>Review again by:</b> ' + escapeText(resourceDate(resource.reviewBy)) + '</p></details>' +
        '<a href="' + escapeText(resource.url) + '" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Open source <span aria-hidden="true">↗</span></a></article>';
    });
    html += '</div><p class="library-feedback">These sources are reviewed starting points, not endorsements of every institutional practice. Practice Village should add a private “resource was inaccessible, unsafe, or unhelpful” feedback path before launch.</p></div>';
    return html;
  }

  function renderResourceLibrary() {
    var result = document.getElementById("supportResult");
    result.innerHTML = resourceLibraryMarkup();
    result.querySelectorAll("[data-resource-filter]").forEach(function (button) {
      button.classList.toggle("is-selected", button.dataset.resourceFilter === activeResourceFilter);
      button.setAttribute("aria-pressed", button.dataset.resourceFilter === activeResourceFilter ? "true" : "false");
    });
  }

  document.getElementById("routeBody").addEventListener("click", function (event) {
    var filter = event.target.closest("[data-resource-filter]");
    if (filter) { activeResourceFilter = filter.dataset.resourceFilter; renderResourceLibrary(); return; }
    if (event.target.closest("[data-change-resource-location]")) {
      requestedResourceFilter = activeResourceFilter;
      document.getElementById("supportResult").innerHTML = supportResults.rights;
      document.getElementById("supportCountry").focus();
      return;
    }
    var finder = event.target.closest("[data-find-resources]");
    if (finder) {
      requestedResourceFilter = finder.dataset.findResources || "all";
      document.getElementById("supportResult").innerHTML = supportResults.rights;
      document.getElementById("supportCountry").focus();
      return;
    }
    var button = event.target.closest("[data-support-path]");
    if (!button) return;
    this.querySelectorAll("[data-support-path]").forEach(function (item) { item.classList.toggle("is-selected", item === button); });
    document.getElementById("supportResult").innerHTML = supportResults[button.dataset.supportPath] || "";
  });

  document.getElementById("routeBody").addEventListener("submit", function (event) {
    if (event.target.id !== "locationForm") return;
    event.preventDefault();
    var country = document.getElementById("supportCountry").value.trim();
    var region = document.getElementById("supportRegion").value.trim();
    var status = document.getElementById("supportLocationStatus");
    if (!country) { status.textContent = "Add a country or jurisdiction first."; return; }
    activeResourceJurisdiction = normalizeResourceJurisdiction(country);
    activeResourceLocationLabel = country + (region ? ", " + region : "");
    activeResourceFilter = requestedResourceFilter || "all";
    requestedResourceFilter = "all";
    renderResourceLibrary();
  });

  document.querySelector(".support-menu").addEventListener("click", function (event) {
    var card = event.target.closest("[data-route]");
    if (!card) return;
    this.querySelectorAll(".support-card").forEach(function (item) { item.classList.toggle("is-active", item === card); });
    var route = card.dataset.route;
    if (route === "document") { document.getElementById("tracker").scrollIntoView({ behavior: "smooth" }); storyText.focus(); }
    else if (route === "script") showScript();
    else if (route === "information") showSupportRouter();
    else if (route === "calm") showRoute("Pause for 30 seconds", "Look around and name three things you can see. Notice where your feet or body touch the floor or chair. Take one breath at your normal pace.", '<div class="grounding"><b>You do not have to decide anything right now.</b><p>Take one breath at your normal pace.</p></div>');
    else if (route === "step") showRoute("Choose one next step", "What is one thing that could help in the next hour? You could save one message, drink water, contact one person, or do nothing yet.");
    else showRoute("You do not have to know yet", "You can record what happened, pause for 30 seconds, or read one piece of information. Choose the option that feels easiest to start.");
  });

  function openDialog(dialog) {
    document.querySelectorAll("dialog[open]").forEach(function (open) { if (open !== dialog) closeDialog(open); });
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (!dialog || !dialog.hasAttribute("open")) return;
    if (dialog.close) dialog.close(); else dialog.removeAttribute("open");
  }

  if (window.SafetyHallControls) {
    window.SafetyHallControls.setBeforeHide(releaseMicrophone);
    window.SafetyHallControls.setBeforeExit(function () { saveDraftNow(); releaseMicrophone(); });
  }
  document.getElementById("safetyInfo").addEventListener("click", function () { openDialog(safetyDialog); });
  document.getElementById("storageDetails").addEventListener("click", function () { openDialog(safetyDialog); });

  async function updateStorageProtection() {
    var summary = document.getElementById("storageProtection");
    var copy = document.getElementById("storageCheckCopy");
    var button = document.getElementById("requestStorageProtection");
    if (!navigator.storage || !navigator.storage.persisted) {
      summary.textContent = "Browser storage protection: unavailable";
      copy.textContent = "This browser does not report whether local data is protected from automatic cleanup.";
      button.disabled = true;
      return false;
    }
    try {
      var protectedStorage = await navigator.storage.persisted();
      summary.textContent = protectedStorage ? "Browser cleanup protection: on" : "Browser cleanup protection: standard";
      copy.textContent = protectedStorage ? "This browser reports that Safety Hall’s local storage is protected from automatic cleanup." : "This browser may clear local Safety Hall data during automatic storage cleanup.";
      button.disabled = protectedStorage || !navigator.storage.persist;
      button.textContent = protectedStorage ? "Local storage protection is on" : "Ask this browser to protect local data";
      return protectedStorage;
    } catch (error) {
      summary.textContent = "Browser storage protection: unknown";
      copy.textContent = "Safety Hall could not check this browser’s automatic-cleanup setting.";
      button.disabled = true;
      return false;
    }
  }

  document.getElementById("requestStorageProtection").addEventListener("click", async function () {
    var status = document.getElementById("storageCheckStatus");
    status.textContent = "Asking this browser…";
    try {
      var granted = await navigator.storage.persist();
      await updateStorageProtection();
      status.textContent = granted ? "Protection is on. This is still not a backup." : "The browser kept standard storage. Download important recordings separately if it is safe to do so.";
    } catch (error) {
      status.textContent = "This browser could not change the storage setting. Your current local data was not deleted.";
    }
  });

  document.querySelectorAll("dialog [data-close]").forEach(function (button) { button.addEventListener("click", function () { closeDialog(button.closest("dialog")); }); });
  document.querySelectorAll("dialog").forEach(function (dialog) { dialog.addEventListener("click", function (event) { if (event.target === dialog) closeDialog(dialog); }); });
  window.addEventListener("beforeunload", function () { saveDraftNow(); releaseMicrophone(); });
  window.addEventListener("pagehide", releaseMicrophone);

  restoreForm();
  renderEntries();
  updateStorageProtection();
})();

/* The Village bar: the hairline only appears once you have left the top.
   Same behaviour as the landing's .nav.is-stuck. Cosmetic only — it can
   never affect the exit control, which is position:fixed and always present. */
(function () {
  var header = document.querySelector(".hall-header");
  if (!header) return;
  var sync = function () {
    var y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    header.classList.toggle("is-stuck", y > 8);
  };
  window.addEventListener("scroll", sync, { passive: true });
  document.addEventListener("scroll", sync, true);
  sync();
})();
