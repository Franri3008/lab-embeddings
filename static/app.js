const state = {
  userWords: [],
  randomWords: [],
  dims: 3,
  method: "pca",
  normalize: false,
  showLabels: true,
  model: null,
  activeView: "graph",
};

const COLORS = {
  user: getCss("--user-pt"),
  random: getCss("--random-pt"),
};

function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const $input = document.getElementById("word-input");
const $addBtn = document.getElementById("add-btn");
const $rows = document.getElementById("word-rows");
const $embedBtn = document.getElementById("embed-btn");
const $status = document.getElementById("status");
const $normalizeCheck = document.getElementById("normalize-check");
const $labelsCheck = document.getElementById("labels-check");
const $dimToggle = document.getElementById("dim-toggle");
const $methodToggle = document.getElementById("method-toggle");
const $modelSelect = document.getElementById("model-select");
const $advancedOptions = document.getElementById("advanced-options");
const $advancedPanel = document.getElementById("advanced-panel");
const $advancedToggle = document.getElementById("advanced-toggle");
const $advancedToggleLabel = document.getElementById("advanced-toggle-label");
const $overlay = document.getElementById("overlay");
const $overlayText = document.getElementById("overlay-text");
const $loadFill = document.querySelector(".loadbar-fill");
const $fundsModal = document.getElementById("funds-modal");
document.getElementById("funds-close").onclick = () => $fundsModal.close();

function maybeShowFundsModal(msg) {
  if (/\b402\b|insufficient|no credit/i.test(msg || "")) {
    $fundsModal.showModal();
    return true;
  }
  return false;
}
const $costValue = document.getElementById("cost-value");
const $workspace = document.getElementById("workspace");
const $obsToggle = document.getElementById("obs-toggle");
const $observations = document.getElementById("observations");
const $obsList = document.getElementById("obs-list");
const $tabs = document.getElementById("tabs");
const $graph = document.getElementById("graph");
const $heatmap = document.getElementById("heatmap");
const $emptyHint = document.getElementById("empty-hint");
const $dimBar = document.getElementById("dim-bar");

function allWords() {
  return [...state.userWords, ...state.randomWords];
}

function setMethod(method) {
  state.method = method;
  for (const button of $methodToggle.querySelectorAll(".btn-method")) {
    button.classList.toggle("active", button.dataset.method === method);
  }
}

function syncMethodAvailability() {
  const wordCount = allWords().length;
  const minimum = state.dims + 2;
  const available = wordCount >= minimum;
  const umapButton = $methodToggle.querySelector('[data-method="umap"]');

  umapButton.disabled = !available;
  umapButton.title = available
    ? `Use UMAP for ${state.dims}D reduction`
    : `UMAP requires at least ${minimum} words for ${state.dims}D`;
  umapButton.setAttribute("aria-label", available
    ? "Use UMAP"
    : `UMAP unavailable: requires at least ${minimum} words for ${state.dims}D`);

  if (!available && state.method === "umap") setMethod("pca");
}

function setAdvancedOptionsOpen(isOpen) {
  $advancedOptions.classList.toggle("open", isOpen);
  $advancedPanel.setAttribute("aria-hidden", String(!isOpen));
  $advancedToggle.setAttribute("aria-expanded", String(isOpen));
  $advancedToggleLabel.textContent = isOpen ? "Hide advanced options" : "Advanced options";
}

function addWord() {
  const value = $input.value.trim();
  if (!value) return;
  if (!allWords().includes(value)) state.userWords.push(value);
  $input.value = "";
  $input.focus();
  renderRows();
}

async function fetchRandomWord() {
  const exclude = encodeURIComponent(allWords().join(","));
  const resp = await fetch(`/random?exclude=${exclude}`);
  if (!resp.ok) throw new Error(`/random returned ${resp.status}`);
  const data = await resp.json();
  return data.word;
}

async function addRandomWord() {
  try {
    const word = await fetchRandomWord();
    if (word && !allWords().includes(word)) state.randomWords.push(word);
    renderRows();
  } catch (err) {
    setStatus("Couldn't fetch a random word — is the server up to date? Restart it.", true);
  }
}

async function reshuffleRandom(index) {
  try {
    const word = await fetchRandomWord();
    if (word) state.randomWords[index] = word;
    renderRows();
  } catch (err) {
    setStatus("Couldn't fetch a random word — is the server up to date? Restart it.", true);
  }
}

function makeRow(word, isRandom, onRemove, onShuffle) {
  const tr = document.createElement("tr");
  if (isRandom) tr.className = "random";

  const label = document.createElement("td");
  label.className = "word-label";
  label.textContent = word;

  const actions = document.createElement("td");
  actions.className = "row-actions";
  if (isRandom) {
    const shuffle = document.createElement("button");
    shuffle.className = "row-shuffle";
    shuffle.textContent = "⟳";
    shuffle.title = "reshuffle random word";
    shuffle.addEventListener("click", onShuffle);
    actions.appendChild(shuffle);
  }
  const remove = document.createElement("button");
  remove.className = "row-remove";
  remove.textContent = "✕";
  remove.title = "remove";
  remove.addEventListener("click", onRemove);
  actions.appendChild(remove);

  tr.appendChild(label);
  tr.appendChild(actions);
  return tr;
}

function renderRows() {
  $rows.innerHTML = "";

  state.userWords.forEach((word, i) => {
    $rows.appendChild(makeRow(word, false, () => {
      state.userWords.splice(i, 1);
      renderRows();
    }));
  });

  state.randomWords.forEach((word, i) => {
    $rows.appendChild(makeRow(word, true,
      () => { state.randomWords.splice(i, 1); renderRows(); },
      () => reshuffleRandom(i),
    ));
  });

  const addTr = document.createElement("tr");
  addTr.style.border = "none";
  addTr.style.background = "none";
  addTr.style.padding = "0";
  const cell = document.createElement("td");
  cell.colSpan = 2;
  cell.style.display = "block";
  const block = document.createElement("div");
  block.id = "add-random";
  block.textContent = "Add random word";
  block.addEventListener("click", addRandomWord);
  cell.appendChild(block);
  addTr.appendChild(cell);
  $rows.appendChild(addTr);

  syncMethodAvailability();
  $embedBtn.disabled = allWords().length === 0;
}

async function runEmbed(opts = {}) {
  const silent = opts.silent === true;
  setStatus(silent ? "Re-projecting…" : "");
  $embedBtn.disabled = true;
  if (!silent) {
    resetProgress();
    $overlay.hidden = false;
  }
  try {
    const resp = await fetch("/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        words: allWords(),
        groups: [
          ...state.userWords.map(() => "user"),
          ...state.randomWords.map(() => "random"),
        ],
        dimensions: state.dims,
        method: state.method,
        normalize: state.normalize,
        model: state.model,
      }),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      const msg = data.error || `request failed (${resp.status})`;
      setStatus(msg, true);
      maybeShowFundsModal(msg);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result = null;
    let errorMsg = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep;
      while ((sep = buffer.indexOf("\n\n")) >= 0) {
        const raw = buffer.slice(0, sep).replace(/^data: ?/, "").trim();
        buffer = buffer.slice(sep + 2);
        if (!raw) continue;
        const ev = JSON.parse(raw);
        if (ev.progress) setProgress(ev.progress.done, ev.progress.total);
        else if (ev.result) result = ev.result;
        else if (ev.error) errorMsg = ev.error;
      }
    }

    if (errorMsg) {
      setStatus(errorMsg, true);
      maybeShowFundsModal(errorMsg);
      return;
    }
    if (result) {
      lastResult = result;
      $loadFill.style.width = "100%";
      $emptyHint.classList.add("hidden");
      enableTabs();
      plot(result);
      plotHeatmap(result.labels, result.similarity);
      showView(state.activeView);
      updateCost(result.session_cost);
      setStatus(result.note || "");
    }
  } catch (err) {
    setStatus(`network error: ${err.message}`, true);
  } finally {
    $overlay.hidden = true;
    $embedBtn.disabled = allWords().length === 0;
  }
}

function resetProgress() {
  $loadFill.style.width = "0%";
  $overlayText.textContent = "Embedding…";
}

function setProgress(done, total) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 100;
  $loadFill.style.width = pct + "%";
  $overlayText.textContent = total > 0 ? `Embedding… ${done}/${total}` : "Embedding…";
}

function setStatus(msg, isError = false) {
  $status.textContent = msg;
  $status.classList.toggle("error", isError);
}

function updateCost(usd) {
  if (typeof usd !== "number" || !isFinite(usd)) return;
  let text;
  if (usd === 0) text = "$0.00";
  else if (usd < 0.01) text = "$" + usd.toFixed(8);
  else text = "$" + usd.toFixed(4);
  $costValue.textContent = text;
}

const GRAY_BLUE = [[0, "#9e9e9e"], [1, "#2563d9"]];

function plot(data) {
  const dims = data.dimensions;
  const is4d = dims === 4;
  const use3d = dims === 3 || dims === 4;
  const groups = ["user", "random"];
  const traces = [];

  let cmin, cmax;
  if (is4d) {
    const c4 = data.points.map((p) => p.coords[3]);
    cmin = Math.min(...c4);
    cmax = Math.max(...c4);
  }
  let scaleShown = false;

  for (const group of groups) {
    const pts = data.points.filter((p) => p.group === group);
    if (pts.length === 0) continue;

    let marker;
    if (is4d) {
      const showscale = !scaleShown;
      scaleShown = true;
      marker = {
        size: 5,
        symbol: group === "random" ? "diamond" : "circle",
        color: pts.map((p) => p.coords[3]),
        colorscale: GRAY_BLUE,
        cmin,
        cmax,
        showscale,
        colorbar: showscale ? { thickness: 8, outlinewidth: 0, len: 0.8, title: "dim 4" } : undefined,
      };
    } else {
      marker = { size: use3d ? 5 : 11, color: COLORS[group] };
    }

    const trace = {
      mode: state.showLabels ? "markers+text" : "markers",
      type: use3d ? "scatter3d" : "scattergl",
      name: group,
      text: pts.map((p) => p.label),
      textposition: "top center",
      hoverinfo: state.showLabels ? "skip" : "text",
      marker,
      textfont: { color: COLORS[group] },
      x: pts.map((p) => p.coords[0]),
      y: pts.map((p) => p.coords[1]),
    };
    if (use3d) trace.z = pts.map((p) => p.coords[2]);
    traces.push(trace);
  }

  const axis = { zeroline: false, showgrid: true, gridcolor: "#e6e8ec" };
  const layout = {
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    showlegend: false,
    margin: { l: 24, r: 24, t: 24, b: 24 },
    font: { color: "#1c1f24" },
    dragmode: "pan",
  };
  if (use3d) {
    layout.scene = { xaxis: axis, yaxis: axis, zaxis: axis, dragmode: "turntable" };
  } else {
    const padded = (vals) => {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const margin = ((max - min) || 1) * 0.18;
      return [min - margin, max + margin];
    };
    layout.xaxis = { ...axis, range: padded(data.points.map((p) => p.coords[0])) };
    layout.yaxis = { ...axis, range: padded(data.points.map((p) => p.coords[1])) };
  }

  Plotly.react("graph", traces, layout, {
    displayModeBar: false,
    responsive: true,
  });
}

let pendingHeatmap = null;
let lastResult = null;

function plotHeatmap(labels, matrix) {
  if (!Array.isArray(labels) || !Array.isArray(matrix) || labels.length === 0) {
    pendingHeatmap = null;
    Plotly.purge("heatmap");
    return;
  }
  pendingHeatmap = { labels, matrix };
  if (state.activeView !== "heatmap") return;
  renderHeatmap(labels, matrix);
}

function renderHeatmap(labels, matrix) {
  const trace = {
    type: "heatmap",
    z: matrix,
    x: labels,
    y: labels,
    zmax: 1,
    colorscale: [[0, "#f0f4fb"], [0.5, "#9cc0f0"], [1, "#3f78d6"]],
    texttemplate: "%{z:.2f}",
    textfont: { size: 10, color: "#1c1f24" },
    hoverinfo: "skip",
    showscale: false,
  };
  const layout = {
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    margin: { l: 70, r: 10, t: 70, b: 10 },
    font: { color: "#1c1f24", size: 11 },
    xaxis: { side: "top", tickangle: -45, automargin: true, constrain: "domain" },
    yaxis: {
      autorange: "reversed",
      automargin: true,
      scaleanchor: "x",
      constrain: "domain",
    },
  };
  Plotly.react("heatmap", [trace], layout, {
    displaylogo: false,
    responsive: true,
    displayModeBar: false,
  });
}

$addBtn.addEventListener("click", addWord);
$input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addWord();
});
$embedBtn.addEventListener("click", runEmbed);
$normalizeCheck.addEventListener("change", () => {
  state.normalize = $normalizeCheck.checked;
});
$labelsCheck.addEventListener("change", () => {
  state.showLabels = $labelsCheck.checked;
  if (lastResult) plot(lastResult);
});
$advancedToggle.addEventListener("click", () => {
  setAdvancedOptionsOpen(!$advancedOptions.classList.contains("open"));
});
$dimToggle.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-dim");
  if (!btn) return;
  state.dims = Number(btn.dataset.dim);
  for (const b of $dimToggle.querySelectorAll(".btn-dim")) {
    b.classList.toggle("active", b === btn);
  }
  syncMethodAvailability();
  if (lastResult) runEmbed({ silent: lastResult.model === state.model });
});
$methodToggle.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-method");
  if (!btn || btn.disabled) return;
  setMethod(btn.dataset.method);
});

async function loadModels() {
  try {
    const resp = await fetch("/models");
    if (!resp.ok) return;
    const data = await resp.json();
    const models = data.models || [];
    $modelSelect.innerHTML = "";
    for (const m of models) {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.label || m.id;
      $modelSelect.appendChild(opt);
    }
    state.model = data.default || (models[0] && models[0].id) || null;
    if (state.model) $modelSelect.value = state.model;
  } catch (err) {
    /* model list is optional — without it the server uses its config default */
  }
}

$modelSelect.addEventListener("change", () => {
  state.model = $modelSelect.value;
  if (lastResult && lastResult.model !== state.model) {
    setStatus("Model changed — click Embed to re-run.");
  }
});
function enableTabs() {
  for (const t of $tabs.querySelectorAll(".tab")) t.disabled = false;
}

function showView(name) {
  state.activeView = name;
  $graph.classList.toggle("hidden", name !== "graph");
  $heatmap.classList.toggle("hidden", name !== "heatmap");
  $dimBar.classList.toggle("hidden", name !== "graph");
  for (const t of $tabs.querySelectorAll(".tab")) {
    t.classList.toggle("active", t.dataset.view === name);
  }
  if (name === "heatmap" && pendingHeatmap) {
    renderHeatmap(pendingHeatmap.labels, pendingHeatmap.matrix);
  } else if (name === "graph" && lastResult) {
    Plotly.Plots.resize($graph);
  }
}

$tabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (!tab || tab.disabled) return;
  showView(tab.dataset.view);
});

const DRAG_THRESHOLD = 3;
const mobileLayout = window.matchMedia("(max-width: 767px)");
let drag = null;
let suppressObsClick = false;

function setObsTogglePresentation() {
  const isOpen = !$workspace.classList.contains("obs-hidden");
  const label = isOpen ? "Hide observations" : "Show observations";
  $obsToggle.textContent = mobileLayout.matches ? label : (isOpen ? "▶" : "◀");
  $obsToggle.setAttribute("aria-expanded", String(isOpen));
  $obsToggle.setAttribute("aria-label", label);
  $obsToggle.title = mobileLayout.matches || !isOpen ? label : "Hide or resize observations";
}

function toggleObservations() {
  $workspace.style.removeProperty("--obs-width");
  $workspace.classList.toggle("obs-hidden");
  setObsTogglePresentation();
}

$obsToggle.addEventListener("mousedown", (e) => {
  if (mobileLayout.matches || $workspace.classList.contains("obs-hidden")) return;
  drag = { startX: e.clientX, moved: false };
  e.preventDefault();
});

window.addEventListener("mousemove", (e) => {
  if (!drag) return;
  if (!drag.moved && Math.abs(e.clientX - drag.startX) > DRAG_THRESHOLD) {
    drag.moved = true;
    $workspace.classList.add("no-transition");
  }
  if (drag.moved) {
    const rect = $workspace.getBoundingClientRect();
    let width = rect.right - e.clientX - 11;
    width = Math.max(0, Math.min(width, rect.width - 60));
    $workspace.style.setProperty("--obs-width", width + "px");
  }
});

window.addEventListener("mouseup", () => {
  if (!drag) return;
  if (drag.moved) {
    $workspace.classList.remove("no-transition");
    suppressObsClick = true;
    window.setTimeout(() => {
      suppressObsClick = false;
    }, 0);
  }
  drag = null;
});

$obsToggle.addEventListener("click", () => {
  if (suppressObsClick) {
    suppressObsClick = false;
    return;
  }
  toggleObservations();
});

mobileLayout.addEventListener("change", () => {
  drag = null;
  suppressObsClick = false;
  $workspace.classList.remove("no-transition");
  $workspace.style.removeProperty("--obs-width");
  setObsTogglePresentation();
});

setObsTogglePresentation();

async function loadObservations() {
  try {
    const resp = await fetch("/observations");
    if (!resp.ok) return;
    const data = await resp.json();
    renderBooks(data.observations || []);
  } catch (err) {
    /* observations are optional — silently skip if the server lacks them */
  }
}
const TOPIC_COLORS = {
  Foundations: "#2f9e6b",
  Representation: "#2563d9",
  Composition: "#7d4fd1",
  Applications: "#e0732f",
};

function renderBooks(list) {
  $obsList.innerHTML = "";
  let currentTopic = null;
  for (const obs of list) {
    if (obs.topic && obs.topic !== currentTopic) {
      currentTopic = obs.topic;
      const header = document.createElement("div");
      header.className = "obs-topic";
      header.textContent = obs.topic;
      header.style.color = TOPIC_COLORS[obs.topic] || "var(--text)";
      $obsList.append(header);
    }

    const book = document.createElement("div");
    book.className = "book";
    book.dataset.obsId = obs.id;

    const spine = document.createElement("div");
    spine.className = "book-spine";
    spine.style.background = obs.color || "#555555";

    const num = document.createElement("span");
    num.className = "book-num";
    num.textContent = String(obs.order).padStart(2, "0");
    const divider = document.createElement("span");
    divider.className = "book-divider";
    const title = document.createElement("span");
    title.className = "book-title";
    title.textContent = obs.title;
    spine.append(num, divider, title);

    const body = document.createElement("div");
    body.className = "book-body";

    let loaded = false;
    spine.addEventListener("click", async () => {
      const willOpen = !book.classList.contains("open");
      for (const b of $obsList.querySelectorAll(".book.open")) {
        if (b !== book) b.classList.remove("open");
      }
      book.classList.toggle("open", willOpen);
      if (willOpen && !loaded) {
        loaded = true;
        await fillBook(body, obs);
      }
    });

    book.append(spine, body);
    $obsList.append(book);
  }
}

function openObservation(id) {
  const book = $obsList.querySelector(`.book[data-obs-id="${id}"]`);
  if (!book) return;
  if (!book.classList.contains("open")) book.querySelector(".book-spine").click();
  book.scrollIntoView({ behavior: "smooth", block: "start" });
}
async function fillBook(body, obs) {
  body.textContent = "Loading…";
  try {
    const resp = await fetch(`/observations/${encodeURIComponent(obs.id)}/content.md`);
    if (!resp.ok) throw new Error(`content ${resp.status}`);
    const md = await resp.text();
    body.innerHTML = marked.parse(md);
    body.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!/^(https?:|\/)/.test(src)) {
        img.src = `/observations/${encodeURIComponent(obs.id)}/${src}`;
      }
    });
    body.querySelectorAll('a[href^="obs:"]').forEach((a) => {
      const id = a.getAttribute("href").slice(4);
      a.classList.add("obs-link");
      a.addEventListener("click", (e) => {
        e.preventDefault();
        openObservation(id);
      });
    });
    if (Array.isArray(obs.words) && obs.words.length) {
      const btn = document.createElement("button");
      btn.className = "book-load";
      btn.textContent = "Load these words";
      btn.addEventListener("click", () => loadWords(obs.words));
      body.append(btn);
    }
  } catch (err) {
    body.textContent = "Couldn't load this observation.";
  }
}

function loadWords(words) {
  state.userWords = words.slice();
  state.randomWords = [];
  renderRows();
}

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
      Plotly.Plots.resize(entry.target);
    }
  }
});
resizeObserver.observe(document.getElementById("graph"));
resizeObserver.observe(document.getElementById("heatmap"));

renderRows();

fetch("/cost")
  .then((r) => r.json())
  .then((d) => updateCost(d.session_cost))
  .catch(() => {});

loadModels();

addRandomWord();

loadObservations();
