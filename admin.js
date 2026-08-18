/**
 * admin.js — Admin Panel Logic
 */

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let editingQuestionId = null; // null = adding new
let dragSrcIndex = null;

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
function init() {
  // Apply theme
  const saved = localStorage.getItem("quiz_theme");
  if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");

  // Login
  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("adminPasswordInput").addEventListener("keydown", e => {
    if (e.key === "Enter") handleLogin();
  });

  // Tabs
  document.querySelectorAll(".nav-item[data-tab]").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      switchTab(item.dataset.tab);
    });
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("quiz_admin_auth");
    showScreen("loginScreen");
  });

  // Questions tab
  document.getElementById("addQuestionBtn").addEventListener("click", () => openQuestionModal(null));

  // Modal
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("cancelModal").addEventListener("click", closeModal);
  document.getElementById("saveQuestionBtn").addEventListener("click", saveQuestion);
  document.getElementById("addOptionBtn").addEventListener("click", addOptionInput);

  // Results tab
  document.getElementById("resultsSearch").addEventListener("input", renderResults);
  document.getElementById("resultsSort").addEventListener("change", renderResults);
  document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);
  document.getElementById("clearResultsBtn").addEventListener("click", clearResults);

  // Result detail modal
  document.getElementById("closeResultModal").addEventListener("click", () => {
    document.getElementById("resultDetailModal").classList.add("hidden");
  });
  document.getElementById("closeResultModalBtn").addEventListener("click", () => {
    document.getElementById("resultDetailModal").classList.add("hidden");
  });

  // Settings
  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);

  // Click outside modal to close
  document.getElementById("questionModal").addEventListener("click", e => {
    if (e.target === document.getElementById("questionModal")) closeModal();
  });
  document.getElementById("resultDetailModal").addEventListener("click", e => {
    if (e.target === document.getElementById("resultDetailModal")) {
      document.getElementById("resultDetailModal").classList.add("hidden");
    }
  });

  // Check if already logged in this session
  if (sessionStorage.getItem("quiz_admin_auth") === "true") {
    showAdminPanel();
  }
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
function handleLogin() {
  const pw = document.getElementById("adminPasswordInput").value;
  if (DB.checkPassword(pw)) {
    sessionStorage.setItem("quiz_admin_auth", "true");
    document.getElementById("adminPasswordInput").value = "";
    showAdminPanel();
  } else {
    document.getElementById("loginError").classList.remove("hidden");
    document.getElementById("adminPasswordInput").value = "";
    document.getElementById("adminPasswordInput").focus();
    setTimeout(() => document.getElementById("loginError").classList.add("hidden"), 3000);
  }
}

function showAdminPanel() {
  showScreen("adminPanel");
  loadSettings();
  renderQuestions();
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll(".nav-item[data-tab]").forEach(i => i.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelector(`.nav-item[data-tab="${tab}"]`).classList.add("active");
  document.getElementById("tab-" + tab).classList.add("active");

  if (tab === "results") renderResults();
  if (tab === "questions") renderQuestions();
}

// ─────────────────────────────────────────────
// QUESTIONS
// ─────────────────────────────────────────────
function renderQuestions() {
  const list = document.getElementById("questionsList");
  const questions = DB.getQuestions();
  const letters = ["A","B","C","D","E","F"];

  document.getElementById("questionCountLabel").textContent =
    questions.length + " question" + (questions.length !== 1 ? "s" : "");

  if (questions.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No questions yet</h3>
        <p>Click "Add Question" to create your first question.</p>
      </div>`;
    return;
  }

  list.innerHTML = "";
  questions.forEach((q, i) => {
    const card = document.createElement("div");
    card.className = "question-admin-card";
    card.draggable = true;
    card.dataset.id = q.id;
    card.dataset.index = i;

    const optionTags = q.options.map((opt, j) => `
      <span class="q-option-tag ${j === q.correct ? 'correct-tag' : ''}">
        ${j === q.correct ? '✓ ' : ''}${letters[j] || (j+1)}. ${escapeHtml(opt)}
      </span>`).join("");

    card.innerHTML = `
      <span class="q-drag-handle" title="Drag to reorder">⠿</span>
      <div class="q-content">
        <div class="q-num">Question ${i + 1}</div>
        <div class="q-text">${escapeHtml(q.text)}</div>
        <div class="q-options">${optionTags}</div>
      </div>
      <div class="q-actions">
        <button class="btn btn-outline btn-sm" onclick="openQuestionModal('${q.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')">🗑</button>
      </div>`;

    // Drag events
    card.addEventListener("dragstart", e => {
      dragSrcIndex = i;
      e.dataTransfer.effectAllowed = "move";
      setTimeout(() => card.style.opacity = "0.4", 0);
    });
    card.addEventListener("dragend", () => card.style.opacity = "1");
    card.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; });
    card.addEventListener("drop", e => {
      e.preventDefault();
      if (dragSrcIndex !== null && dragSrcIndex !== i) {
        const qs = DB.getQuestions();
        const moved = qs.splice(dragSrcIndex, 1)[0];
        qs.splice(i, 0, moved);
        DB.reorderQuestions(qs);
        renderQuestions();
        showToast("Questions reordered ✓");
      }
      dragSrcIndex = null;
    });

    list.appendChild(card);
  });
}

function deleteQuestion(id) {
  if (!confirm("Delete this question? This cannot be undone.")) return;
  DB.deleteQuestion(id);
  renderQuestions();
  showToast("Question deleted");
}

// ─────────────────────────────────────────────
// QUESTION MODAL
// ─────────────────────────────────────────────
function openQuestionModal(id) {
  editingQuestionId = id;
  const modal = document.getElementById("questionModal");
  const title = document.getElementById("modalTitle");

  if (id) {
    // Edit mode
    title.textContent = "Edit Question";
    const q = DB.getQuestions().find(q => q.id === id);
    if (!q) return;
    document.getElementById("modalQuestionText").value = q.text;
    renderOptionInputs(q.options, q.correct);
  } else {
    // Add mode
    title.textContent = "Add Question";
    document.getElementById("modalQuestionText").value = "";
    renderOptionInputs(["", "", "", ""], 0);
  }

  modal.classList.remove("hidden");
  document.getElementById("modalQuestionText").focus();
}

function renderOptionInputs(options, correctIndex) {
  const container = document.getElementById("optionInputs");
  const select    = document.getElementById("correctAnswerSelect");
  container.innerHTML = "";
  select.innerHTML = '<option value="">Select correct answer...</option>';
  const letters = ["A","B","C","D","E","F"];

  options.forEach((opt, i) => {
    addOptionRow(opt, i, options.length);
  });

  // Populate correct answer select
  rebuildCorrectSelect(correctIndex);
}

function addOptionRow(value = "", index, total) {
  const letters = ["A","B","C","D","E","F"];
  const container = document.getElementById("optionInputs");

  const row = document.createElement("div");
  row.className = "option-input-row";
  row.dataset.optionIndex = index;

  const lbl = document.createElement("span");
  lbl.className = "option-letter-label";
  lbl.textContent = letters[index] || (index + 1);

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Option " + (letters[index] || (index + 1));
  input.value = value;
  input.className = "option-text-input";
  input.addEventListener("input", () => rebuildCorrectSelect());

  const delBtn = document.createElement("button");
  delBtn.className = "btn btn-icon";
  delBtn.title = "Remove option";
  delBtn.innerHTML = "✕";
  delBtn.addEventListener("click", () => {
    const rows = container.querySelectorAll(".option-input-row");
    if (rows.length <= 2) { showToast("Need at least 2 options"); return; }
    row.remove();
    // Re-label remaining
    container.querySelectorAll(".option-input-row").forEach((r, i) => {
      r.querySelector(".option-letter-label").textContent = letters[i] || (i + 1);
      r.querySelector("input").placeholder = "Option " + (letters[i] || (i + 1));
    });
    rebuildCorrectSelect();
  });

  row.appendChild(lbl);
  row.appendChild(input);
  row.appendChild(delBtn);
  container.appendChild(row);
}

function addOptionInput() {
  const rows = document.getElementById("optionInputs").querySelectorAll(".option-input-row");
  if (rows.length >= 6) { showToast("Maximum 6 options allowed"); return; }
  addOptionRow("", rows.length);
  rebuildCorrectSelect();
}

function rebuildCorrectSelect(selectedIndex) {
  const select = document.getElementById("correctAnswerSelect");
  const rows   = document.getElementById("optionInputs").querySelectorAll(".option-input-row");
  const letters = ["A","B","C","D","E","F"];

  const prev = selectedIndex !== undefined ? selectedIndex : parseInt(select.value);
  select.innerHTML = '<option value="">Select correct answer...</option>';

  rows.forEach((row, i) => {
    const val = row.querySelector("input").value.trim();
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = (letters[i] || (i+1)) + ". " + (val || "(empty)");
    if (i === prev) opt.selected = true;
    select.appendChild(opt);
  });
}

function closeModal() {
  document.getElementById("questionModal").classList.add("hidden");
  editingQuestionId = null;
}

function saveQuestion() {
  const text = document.getElementById("modalQuestionText").value.trim();
  if (!text) { showToast("Please enter a question"); return; }

  const rows = document.getElementById("optionInputs").querySelectorAll(".option-input-row");
  const options = [];
  let valid = true;
  rows.forEach(row => {
    const val = row.querySelector("input").value.trim();
    if (!val) valid = false;
    options.push(val);
  });

  if (!valid) { showToast("Please fill in all option fields"); return; }
  if (options.length < 2) { showToast("Need at least 2 options"); return; }

  const correctVal = document.getElementById("correctAnswerSelect").value;
  if (correctVal === "") { showToast("Please select the correct answer"); return; }
  const correct = parseInt(correctVal);

  if (editingQuestionId) {
    DB.updateQuestion(editingQuestionId, { text, options, correct });
    showToast("Question updated ✓");
  } else {
    DB.addQuestion({ text, options, correct });
    showToast("Question added ✓");
  }

  closeModal();
  renderQuestions();
}

// ─────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────
function renderResults() {
  const search  = document.getElementById("resultsSearch").value.trim().toLowerCase();
  const sort    = document.getElementById("resultsSort").value;
  const list    = document.getElementById("resultsList");
  let results   = DB.getResults();

  document.getElementById("submissionCountLabel").textContent =
    results.length + " submission" + (results.length !== 1 ? "s" : "");

  // Filter
  if (search) results = results.filter(r => r.viewerName.toLowerCase().includes(search));

  // Sort
  if (sort === "newest")     results.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  if (sort === "oldest")     results.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  if (sort === "score-high") results.sort((a,b) => (b.score/b.total) - (a.score/a.total));
  if (sort === "score-low")  results.sort((a,b) => (a.score/a.total) - (b.score/b.total));

  if (results.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>${search ? "No results match your search" : "No submissions yet"}</h3>
        <p>${search ? "Try a different name." : "Share the quiz link with viewers to get submissions."}</p>
      </div>`;
    return;
  }

  list.innerHTML = "";
  results.forEach(r => {
    const pct   = Math.round((r.score / r.total) * 100);
    const cls   = scoreColor(r.score, r.total);
    const correct = (r.answers || []).filter(a => a.isCorrect).length;
    const wrong   = (r.answers || []).filter(a => !a.isCorrect).length;

    const card = document.createElement("div");
    card.className = "result-admin-card";
    card.innerHTML = `
      <div class="result-card-header">
        <div class="result-viewer-name">👤 ${escapeHtml(r.viewerName)}</div>
        <div class="result-meta">${formatDate(r.timestamp)}</div>
        <span class="result-score-badge ${cls}">${r.score}/${r.total} (${pct}%)</span>
      </div>
      <div class="result-preview">
        <span>✅ ${correct} correct</span>
        <span>❌ ${wrong} wrong</span>
        <span>📝 ${r.total} questions</span>
      </div>`;

    card.addEventListener("click", () => openResultDetail(r));
    list.appendChild(card);
  });
}

function openResultDetail(r) {
  const letters = ["A","B","C","D","E","F"];
  const pct = Math.round((r.score / r.total) * 100);

  document.getElementById("resultDetailTitle").textContent = `${r.viewerName}'s Submission`;

  let html = `
    <div class="result-detail-meta">
      <span>👤 <strong>${escapeHtml(r.viewerName)}</strong></span>
      <span>📅 <strong>${formatDate(r.timestamp)}</strong></span>
    </div>
    <div class="result-detail-score">
      <div class="score-big">${r.score}/${r.total}</div>
      <div class="muted">${pct}% — ${scoreLabel(pct)}</div>
    </div>`;

  (r.answers || []).forEach((a, i) => {
    const selLetter = a.selectedIndex !== null ? (letters[a.selectedIndex] || (a.selectedIndex+1)) : "–";
    const corLetter = letters[a.correctIndex] || (a.correctIndex+1);
    html += `
      <div class="detail-item">
        <div class="result-item-header">
          <span class="result-q-num">Question ${i+1}</span>
          <span class="result-badge ${a.isCorrect ? 'badge-correct' : 'badge-incorrect'}">
            ${a.isCorrect ? "✓ Correct" : "✗ Wrong"}
          </span>
        </div>
        <div class="detail-item-q">${escapeHtml(a.questionText)}</div>
        <div class="detail-item-ans">
          <div><span class="ans-label">Selected: </span>${selLetter} — ${escapeHtml(a.selectedText)}</div>
          ${!a.isCorrect ? `<div><span class="ans-label">Correct: </span>${corLetter} — ${escapeHtml(a.correctText)}</div>` : ""}
        </div>
      </div>`;
  });

  document.getElementById("resultDetailBody").innerHTML = html;
  document.getElementById("resultDetailModal").classList.remove("hidden");
}

function scoreLabel(pct) {
  if (pct === 100) return "Perfect!";
  if (pct >= 80)  return "Excellent";
  if (pct >= 60)  return "Good";
  if (pct >= 40)  return "Average";
  return "Needs improvement";
}

function clearResults() {
  if (!confirm("Clear ALL submissions? This cannot be undone!")) return;
  DB.clearResults();
  renderResults();
  showToast("All submissions cleared");
}

// ─────────────────────────────────────────────
// CSV EXPORT
// ─────────────────────────────────────────────
function exportCSV() {
  const results = DB.getResults();
  if (results.length === 0) { showToast("No results to export"); return; }

  const rows = [];
  // Header
  rows.push(["Name","Date","Score","Percentage","Question","Selected Answer","Correct Answer","Result"]);

  results.forEach(r => {
    const pct = Math.round((r.score / r.total) * 100) + "%";
    (r.answers || []).forEach((a, i) => {
      rows.push([
        r.viewerName,
        formatDate(r.timestamp),
        r.score + "/" + r.total,
        pct,
        "Q" + (i+1) + ": " + a.questionText,
        a.selectedText,
        a.correctText,
        a.isCorrect ? "Correct" : "Wrong"
      ]);
    });
  });

  const csv = rows.map(row =>
    row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "quiz_results_" + new Date().toISOString().slice(0,10) + ".csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast("CSV exported ✓");
}

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────
function loadSettings() {
  const s = DB.getSettings();
  document.getElementById("settingTitle").value        = s.title || "";
  document.getElementById("settingDesc").value         = s.description || "";
  document.getElementById("settingShowAnswer").checked = s.showAnswerAfterEach || false;
  document.getElementById("settingPassword").value     = "";
}

function saveSettings() {
  const s = DB.getSettings();
  s.title              = document.getElementById("settingTitle").value.trim() || "Quiz";
  s.description        = document.getElementById("settingDesc").value.trim();
  s.showAnswerAfterEach= document.getElementById("settingShowAnswer").checked;

  const newPw = document.getElementById("settingPassword").value;
  if (newPw) s.adminPassword = newPw;

  DB.saveSettings(s);

  const msg = document.getElementById("saveSettingsMsg");
  msg.classList.remove("hidden");
  setTimeout(() => msg.classList.add("hidden"), 2500);
  showToast("Settings saved ✓");
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2500);
}

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
