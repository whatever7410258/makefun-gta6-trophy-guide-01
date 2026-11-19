// Leonida Legend — GTA 6 trophy tracker.
// Loads the trophy list from data/trophies.json (a local file, nothing over the
// network), renders the checklist, keeps earned trophies in localStorage, and
// lets progress be exported to a file and imported back.
const STORAGE_KEY = "leonida-legend-progress-v1";
const KIND_LABELS = {
  story: "Story",
  missable: "Missable",
  collectibles: "Collectibles",
  activities: "Activities",
  online: "Online",
};
const STAGE_LABELS = { 1: "Stage 1 · Story", 2: "Stage 2 · 100%", 3: "Stage 3 · Cleanup" };

const listEl = document.getElementById("trophyList");
const detailEl = document.getElementById("detailPanel");
const countLineEl = document.getElementById("countLine");

const state = {
  trophies: [],
  earned: new Set(),
  spoiler: true,
  hideEarned: false,
  kind: "all",
  grade: "all",
  query: "",
  selectedId: null,
  view: "tracker",
};

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) {
      state.earned = new Set(saved.earned.filter((id) => Number.isInteger(id)));
    }
    if (typeof saved.spoiler === "boolean") state.spoiler = saved.spoiler;
    if (typeof saved.hideEarned === "boolean") state.hideEarned = saved.hideEarned;
  } catch {
    // A damaged save is ignored; the tracker starts empty.
  }
}

function saveProgress() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        earned: [...state.earned].sort((a, b) => a - b),
        spoiler: state.spoiler,
        hideEarned: state.hideEarned,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Private browsing can refuse storage; the page still works in memory.
  }
}

// A shared progress link (?earned=2,3,28) or a hash (#trophy-28, #roadmap)
// opens the guide in that state. Nothing here fetches from the network.
function applyDeepLink() {
  const params = new URLSearchParams(location.search);
  const earnedParam = params.get("earned");
  if (earnedParam) {
    for (const piece of earnedParam.split(",")) {
      const id = Number(piece.trim());
      if (Number.isInteger(id)) state.earned.add(id);
    }
  }
  const kindParam = params.get("kind");
  if (kindParam && (kindParam === "all" || KIND_LABELS[kindParam])) state.kind = kindParam;
  if (params.get("spoiler") === "off") state.spoiler = false;
  if (params.get("view") === "roadmap") state.view = "roadmap";
  const trophyParam = params.get("trophy");
  if (trophyParam) {
    const id = Number(trophyParam);
    if (Number.isInteger(id)) state.selectedId = id;
  }
  const hash = location.hash.replace(/^#/, "");
  if (hash === "roadmap") state.view = "roadmap";
  const hashTrophy = hash.match(/^trophy-(\d+)$/);
  if (hashTrophy) state.selectedId = Number(hashTrophy[1]);
}

function trophyIsStory(trophy) {
  return trophy.kinds.includes("story");
}

function trophyIsMasked(trophy) {
  return state.spoiler && trophyIsStory(trophy) && !state.earned.has(trophy.id);
}

function visibleTrophies() {
  const query = state.query.trim().toLowerCase();
  return state.trophies.filter((trophy) => {
    if (state.kind === "online") return false;
    if (state.kind !== "all" && !trophy.kinds.includes(state.kind)) return false;
    if (state.grade !== "all" && trophy.grade !== state.grade) return false;
    if (state.hideEarned && state.earned.has(trophy.id)) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function gradeBadge(trophy) {
  return `<span class="grade-badge grade-${trophy.grade}">${escapeHtml(trophy.grade)}</span>`;
}

function tagList(trophy) {
  const tags = [];
  if (trophy.missable) tags.push('<span class="tag missable">Missable</span>');
  if (trophyIsStory(trophy)) tags.push('<span class="tag story">Story</span>');
  for (const kind of trophy.kinds) {
    if (kind === "story" || kind === "missable") continue;
    tags.push(`<span class="tag">${escapeHtml(KIND_LABELS[kind])}</span>`);
  }
  if (trophy.chapter) tags.push(`<span class="tag">Ch ${trophy.chapter}</span>`);
  tags.push(`<span class="tag stage-tag">${escapeHtml(STAGE_LABELS[trophy.stage])}</span>`);
  return tags.join("");
}

function renderList() {
  const visible = visibleTrophies();
  countLineEl.textContent =
    state.kind === "online"
      ? "No online trophies — all 55 are single-player, offline. Nothing to filter here."
      : `Showing ${visible.length} of ${state.trophies.length} trophies`;
  listEl.innerHTML = visible
    .map((trophy) => {
      const earned = state.earned.has(trophy.id);
      const masked = trophyIsMasked(trophy);
      const name = masked ? "Hidden story trophy" : trophy.name;
      const description = masked
        ? "Earn this trophy in the story to reveal its name and description."
        : trophy.description;
      return `<li class="trophy-card${earned ? " earned" : ""}${state.selectedId === trophy.id ? " selected" : ""}" data-id="${trophy.id}" tabindex="0" role="button" aria-label="${escapeHtml(name)}">
        <input type="checkbox" class="trophy-check" data-id="${trophy.id}" ${earned ? "checked" : ""} aria-label="Mark ${escapeHtml(name)} as earned">
        <div class="trophy-main">
          <div class="trophy-name${masked ? " spoiler-mask" : ""}">${escapeHtml(name)}</div>
          <div class="trophy-desc${masked ? " spoiler-mask" : ""}">${escapeHtml(description)}</div>
          <div class="trophy-tags">${tagList(trophy)}</div>
        </div>
        ${gradeBadge(trophy)}
      </li>`;
    })
    .join("");
  for (const card of listEl.querySelectorAll(".trophy-card")) {
    card.addEventListener("click", (event) => {
      if (event.target.classList.contains("trophy-check")) return;
      selectTrophy(Number(card.dataset.id));
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectTrophy(Number(card.dataset.id));
      }
    });
  }
  for (const box of listEl.querySelectorAll(".trophy-check")) {
    box.addEventListener("change", () => {
      toggleEarned(Number(box.dataset.id), box.checked);
    });
    box.addEventListener("click", (event) => event.stopPropagation());
  }
}

function renderDetail() {
  const trophy = state.trophies.find((item) => item.id === state.selectedId);
  if (!trophy) {
    detailEl.innerHTML =
      '<p class="detail-empty">Select a trophy on the left to read its full guide and sources here.</p>';
    return;
  }
  const earned = state.earned.has(trophy.id);
  const masked = trophyIsMasked(trophy);
  const name = masked ? "Hidden story trophy" : trophy.name;
  const description = masked
    ? "Earn this trophy in the story to reveal its name and description."
    : trophy.description;
  const sources = trophy.sources
    .map((source) =>
      source.url
        ? `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.label)}</a></li>`
        : `<li>${escapeHtml(source.label)}</li>`,
    )
    .join("");
  detailEl.innerHTML = `
    ${gradeBadge(trophy)}
    <h2>${escapeHtml(name)}</h2>
    <p class="official">&ldquo;${escapeHtml(description)}&rdquo; — official description</p>
    <div class="detail-meta">${tagList(trophy)}</div>
    <p class="guide-label">Guide</p>
    <p class="guide-text">${escapeHtml(trophy.guide)}</p>
    <p class="sources-label">Sources</p>
    <ul class="sources">${sources}</ul>
    ${trophy.missable ? '<p class="missable-note"><strong>Missable.</strong> Do the Chapter 1 balcony meditation before Chapter 1 ends — see the guide above. Keep a manual save at the start of the chapter.</p>' : ""}
    <div class="earn-row"><button type="button" id="detailEarnBtn" class="${earned ? "earned" : ""}">${earned ? "✓ Earned — unmark" : "Mark as earned"}</button></div>`;
  document.getElementById("detailEarnBtn").addEventListener("click", () => {
    toggleEarned(trophy.id, !state.earned.has(trophy.id));
  });
}

function renderProgress() {
  const earned = state.earned.size;
  const total = state.trophies.length || 55;
  document.getElementById("earnedCount").textContent = earned;
  const bar = document.getElementById("progressBar");
  bar.setAttribute("aria-valuenow", String(earned));
  document.getElementById("progressFill").style.width = `${(earned / total) * 100}%`;
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of state.trophies) {
    if (state.earned.has(trophy.id)) counts[trophy.grade] += 1;
  }
  document.getElementById("progressDetail").textContent =
    `${counts.platinum} platinum · ${counts.gold} gold · ${counts.silver} silver · ${counts.bronze} bronze`;
  document.getElementById("platinumNote").textContent =
    earned === total
      ? "Platinum earned — Vice Got a Price! You are a Leonida Legend."
      : `Earn the other ${total - earned} to take the platinum: Vice Got a Price!`;
}

function renderRoadmapStages() {
  for (const stage of [1, 2, 3]) {
    const el = document.querySelector(`.stage-trophies[data-stage="${stage}"]`);
    if (!el) continue;
    const names = state.trophies
      .filter((trophy) => trophy.stage === stage)
      .map((trophy) => trophy.name);
    el.textContent = `Trophies in this stage (${names.length}): ${names.join(" · ")}`;
  }
}

function renderView() {
  document.getElementById("trackerView").hidden = state.view !== "tracker";
  document.getElementById("roadmapView").hidden = state.view !== "roadmap";
  document.getElementById("tabTracker").classList.toggle("active", state.view === "tracker");
  document.getElementById("tabRoadmap").classList.toggle("active", state.view === "roadmap");
}

function renderAll() {
  renderView();
  renderList();
  renderDetail();
  renderProgress();
  renderRoadmapStages();
}

function selectTrophy(id) {
  state.selectedId = id;
  renderList();
  renderDetail();
  const card = listEl.querySelector(`.trophy-card[data-id="${id}"]`);
  if (card) card.scrollIntoView({ block: "nearest" });
}

function toggleEarned(id, earned) {
  if (earned) state.earned.add(id);
  else state.earned.delete(id);
  saveProgress();
  renderList();
  renderDetail();
  renderProgress();
}

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportProgress() {
  downloadFile(
    "gta6-trophy-progress.json",
    JSON.stringify(
      { game: "Grand Theft Auto VI", earned: [...state.earned].sort((a, b) => a - b) },
      null,
      2,
    ),
  );
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error("no earned list");
      const valid = new Set(state.trophies.map((trophy) => trophy.id));
      state.earned = new Set(ids.filter((id) => Number.isInteger(id) && valid.has(id)));
      saveProgress();
      renderAll();
    } catch {
      alert("That file is not a Leonida Legend progress export.");
    }
  };
  reader.readAsText(file);
}

function bindControls() {
  document.getElementById("tabTracker").addEventListener("click", () => {
    state.view = "tracker";
    renderView();
  });
  document.getElementById("tabRoadmap").addEventListener("click", () => {
    state.view = "roadmap";
    renderView();
  });
  document.getElementById("missableJump").addEventListener("click", () => {
    state.view = "tracker";
    state.kind = "missable";
    state.spoiler = false;
    document.getElementById("spoilerToggle").checked = false;
    syncChips();
    selectTrophy(28);
    renderView();
    detailEl.scrollIntoView({ block: "start" });
  });
  document.getElementById("searchBox").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderList();
  });
  document.getElementById("kindChips").addEventListener("click", (event) => {
    const button = event.target.closest("[data-kind]");
    if (!button) return;
    state.kind = button.dataset.kind;
    syncChips();
    renderList();
  });
  document.getElementById("gradeSelect").addEventListener("change", (event) => {
    state.grade = event.target.value;
    renderList();
  });
  document.getElementById("spoilerToggle").addEventListener("change", (event) => {
    state.spoiler = event.target.checked;
    saveProgress();
    renderList();
    renderDetail();
  });
  document.getElementById("hideEarnedToggle").addEventListener("change", (event) => {
    state.hideEarned = event.target.checked;
    saveProgress();
    renderList();
  });
  document.getElementById("exportBtn").addEventListener("click", exportProgress);
  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
  });
  document.getElementById("importFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) importProgress(file);
    event.target.value = "";
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Clear all earned trophies? This cannot be undone.")) {
      state.earned.clear();
      saveProgress();
      renderAll();
    }
  });
}

function syncChips() {
  for (const chip of document.querySelectorAll("#kindChips .chip")) {
    chip.classList.toggle("active", chip.dataset.kind === state.kind);
  }
}

async function init() {
  loadSavedProgress();
  applyDeepLink();
  bindControls();
  document.getElementById("spoilerToggle").checked = state.spoiler;
  document.getElementById("hideEarnedToggle").checked = state.hideEarned;
  syncChips();
  const response = await fetch("data/trophies.json");
  const data = await response.json();
  state.trophies = data.trophies;
  if (state.selectedId && !state.trophies.some((trophy) => trophy.id === state.selectedId)) {
    state.selectedId = null;
  }
  renderAll();
}

init();
