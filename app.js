(function () {
  const range = document.getElementById("length-range");
  const output = document.getElementById("length-output");
  const note = document.getElementById("length-note");
  const configTitle = document.getElementById("config-title");
  const configSummary = document.getElementById("config-summary");
  const slabPanel = document.getElementById("slab-panel");
  const tablePanel = document.getElementById("table-panel");
  const tableObject = document.getElementById("table-object");
  const tableKnot = document.querySelector(".table-knot");
  const cutMark = document.querySelector(".cut-mark");
  const offcutMask = document.querySelector(".offcut-mask");
  const offcutRect = offcutMask.querySelector("rect");
  const cutLabel = document.querySelector(".cut-label");
  const knotCallout = document.querySelector(".knot-callout");
  const tableLength = document.querySelector(".table-length-note");
  const sceneLength = document.querySelector(".scene-length");
  const sceneBaseName = document.querySelector(".scene-base-name");
  const cardLength = document.getElementById("card-length");
  const cardBase = document.getElementById("card-base");
  const cardKnot = document.getElementById("card-knot");
  const cardMiniLength = document.getElementById("card-mini-length");
  const miniBoard = document.querySelector(".mini-board");
  const designCard = document.querySelector(".design-card");
  const feedback = document.getElementById("action-feedback");
  const baseButtons = Array.from(document.querySelectorAll(".base-option"));
  const viewButtons = Array.from(document.querySelectorAll(".view-button"));
  const state = { length: 72, base: "trestle", view: "slab" };
  const baseNames = { trestle: "Timber trestle", steel: "Blackened steel" };
  let displayedCutX = null;
  let cutAnimationFrame = 0;

  function moveCut(cutX) {
    if (cutAnimationFrame) window.cancelAnimationFrame(cutAnimationFrame);
    const startX = displayedCutX === null ? cutX : displayedCutX;
    const startTime = performance.now();
    const duration = 220;
    function frame(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const x = startX + (cutX - startX) * eased;
      cutMark.setAttribute("transform", "translate(" + x + " 0)");
      offcutRect.setAttribute("x", String(x));
      displayedCutX = x;
      if (progress < 1) {
        cutAnimationFrame = window.requestAnimationFrame(frame);
      } else {
        displayedCutX = cutX;
        cutAnimationFrame = 0;
      }
    }
    if (startX === cutX) {
      cutMark.setAttribute("transform", "translate(" + cutX + " 0)");
      offcutRect.setAttribute("x", String(cutX));
      displayedCutX = cutX;
      cutAnimationFrame = 0;
    } else {
      cutAnimationFrame = window.requestAnimationFrame(frame);
    }
  }

  function setStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const hasSavedQuery = ["length", "base", "view"].some(function (key) { return params.has(key); });
    if (!hasSavedQuery) {
      try {
        const saved = JSON.parse(window.localStorage.getItem("cutline-last-design") || "null");
        if (saved && [72, 78, 84].includes(Number(saved.length))) state.length = Number(saved.length);
        if (saved && (saved.base === "steel" || saved.base === "trestle")) state.base = saved.base;
        if (saved && (saved.view === "table" || saved.view === "slab")) state.view = saved.view;
      } catch (error) {}
    }
    const length = Number(params.get("length"));
    if ([72, 78, 84].includes(length)) state.length = length;
    if (params.get("base") === "steel" || params.get("base") === "trestle") state.base = params.get("base");
    if (params.get("view") === "table" || params.get("view") === "slab") state.view = params.get("view");
  }

  function updateUrl() {
    const params = new URLSearchParams(window.location.search);
    params.set("slab", "07");
    params.set("length", String(state.length));
    params.set("base", state.base);
    params.set("view", state.view);
    const nextUrl = window.location.pathname + "?" + params.toString() + window.location.hash;
    window.history.replaceState({}, "", nextUrl);
  }

  function render() {
    range.value = String(state.length);
    output.innerHTML = String(state.length) + "<span> in</span>";
    tableLength.textContent = state.length + " inches long";
    sceneLength.textContent = state.length + " IN";
    sceneBaseName.textContent = state.base === "steel" ? "BLACKENED STEEL" : "TIMBER TRESTLE";
    cardLength.textContent = state.length + " inches";
    cardBase.textContent = baseNames[state.base];
    const knotIncluded = state.length === 84;
    const tableScale = state.length / 84;
    tableObject.setAttribute("transform", "translate(460 0) scale(" + tableScale + " 1) translate(-460 0)");
    tableKnot.style.opacity = knotIncluded ? "1" : "0";
    cardMiniLength.textContent = state.length + "″";
    miniBoard.style.setProperty("--mini-cut", (state.length / 84 * 100) + "%");
    designCard.dataset.base = state.base;
    cardKnot.textContent = knotIncluded ? "Fork knot retained" : "Fork knot offcut";
    note.textContent = state.length === 72
      ? "At 72 inches (6 feet), the fork knot stays in the offcut."
      : state.length === 78
        ? "At 78 inches (6½ feet), the cut stops just before the fork knot."
        : "At 84 inches (7 feet), the fork knot stays with the table.";
    configTitle.textContent = state.view === "slab" ? "Keep the knot?" : "See it on its feet.";
    configSummary.textContent = state.view === "slab"
      ? "Drag the cut. The board stays the same; only the length changes."
      : "The selected slab becomes a table. Switch the base, then save this exact design.";
    const cutX = 95 + state.length * 1010 / 84;
    cutLabel.textContent = state.length + " IN";
    moveCut(cutX);
    knotCallout.classList.toggle("visible", knotIncluded && state.view === "slab");
    tablePanel.dataset.base = state.base;
    slabPanel.classList.toggle("is-visible", state.view === "slab");
    tablePanel.classList.toggle("is-visible", state.view === "table");
    viewButtons.forEach(function (button) {
      const active = button.dataset.view === state.view;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    baseButtons.forEach(function (button) {
      const active = button.dataset.base === state.base;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateUrl();
  }

  range.addEventListener("input", function () {
    state.length = Number(range.value);
    render();
  });
  baseButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      state.base = button.dataset.base;
      if (state.view === "slab") state.view = "table";
      render();
    });
  });
  viewButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      state.view = button.dataset.view;
      render();
    });
  });

  function getBrief() {
    const detail = state.length === 84 ? "fork knot retained" : "fork knot left in offcut";
    return "CUTLINE / PROJECT NOTE\nSlab 07 · Claro walnut (fictional demo)\nFinished length: " +
      state.length + " inches\nBase: " + baseNames[state.base] + "\nGrain detail: " + detail +
      "\nSaved configuration: " + window.location.href;
  }

  function setFeedback(message) {
    feedback.textContent = message;
    window.clearTimeout(setFeedback.timer);
    setFeedback.timer = window.setTimeout(function () { feedback.textContent = ""; }, 4200);
  }

  document.getElementById("save-design").addEventListener("click", async function () {
    render();
    window.localStorage.setItem("cutline-last-design", JSON.stringify(state));
    try {
      await navigator.clipboard.writeText(window.location.href);
      setFeedback("Saved on this device. The link is copied with this exact cut and base.");
    } catch (error) {
      setFeedback("Saved on this device. The URL holds this exact cut and base.");
    }
  });
  document.getElementById("copy-brief").addEventListener("click", async function () {
    render();
    const brief = getBrief();
    try {
      await navigator.clipboard.writeText(brief);
      setFeedback("Project brief copied. This fictional demo does not send a quote request.");
    } catch (error) {
      const area = document.createElement("textarea");
      area.value = brief;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      setFeedback("Project brief copied. This fictional demo does not send a quote request.");
    }
  });

  const menuButton = document.querySelector(".menu-button");
  const mobileNav = document.querySelector(".mobile-nav");
  menuButton.addEventListener("click", function () {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileNav.classList.toggle("is-open", open);
  });
  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open menu");
      mobileNav.classList.remove("is-open");
    });
  });

  setStateFromUrl();
  render();
})();
