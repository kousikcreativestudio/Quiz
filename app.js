/**
 * app.js — Quiz Viewer Logic
 */

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let questions = [];
let settings  = {};
let current   = 0;
let answers   = {}; // { questionId: selectedOptionIndex }
let viewerName = "";

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
function init() {
  settings  = DB.getSettings();
  questions = DB.getQuestions();

  // Apply dark mode preference
  const saved = localStorage.getItem("quiz_theme");
  if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");

  // Welcome screen
  document.getElementById("welcomeTitle").textContent = settings.title || "Quiz";
  document.getElementById("welcomeDesc").textContent  = settings.description || "Test your knowledge!";
  document.getElementById("questionCountHint").textContent =
    questions.length + " question" + (questions.length !== 1 ? "s" : "") + " · Click to begin";

  // Theme toggle
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  // Start button
  document.getElementById("startQuizBtn").addEventListener("click", startQuiz);

  // Press Enter in name field
  document.getElementById("viewerName").addEventListener("keydown", e => {
    if (e.key === "Enter") startQuiz();
  });

  // Nav buttons
  document.getElementById("prevBtn").addEventListener("click", prevQuestion);
  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
  document.getElementById("submitBtn").addEventListener("click", submitQuiz);
  document.getElementById("retakeBtn").addEventListener("click", retake);
}

// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("quiz_theme", "light");
    document.getElementById("themeToggle").textContent = "🌙";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("quiz_theme", "dark");
    document.getElementById("themeToggle").textContent = "☀️";
  }
}

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
function startQuiz() {
  const nameInput = document.getElementById("viewerName").value.trim();
  if (!nameInput) {
    document.getElementById("viewerName").style.borderColor = "var(--danger)";
    document.getElementById("viewerName").placeholder = "Please enter your name first!";
    document.getElementById("viewerName").focus();
    return;
  }

  if (questions.length === 0) {
    alert("No questions available. Please check back later.");
    return;
  }

  viewerName = nameInput;
  answers    = {};
  current    = 0;

  showScreen("quizScreen");
  document.getElementById("quizTitleBar").textContent    = settings.title || "Quiz";
  document.getElementById("viewerNameBadge").textContent = "👤 " + viewerName;
  document.getElementById("questionTotal").textContent   = questions.length;

  renderQuestion();
}

// ─────────────────────────────────────────────
// RENDER QUESTION
// ─────────────────────────────────────────────
function renderQuestion() {
  const q   = questions[current];
  const num = current + 1;
  const tot = questions.length;

  document.getElementById("questionNum").textContent = num;
  document.getElementById("qNumBadge").textContent   = "Q" + num;
  document.getElementById("questionText").textContent = q.text;

  // Progress bar
  document.getElementById("progressBar").style.width = ((num / tot) * 100) + "%";

  // Re-trigger animation
  const card = document.getElementById("questionCard");
  card.style.animation = "none";
  card.offsetHeight; // reflow
  card.style.animation = "";

  // Options
  const grid = document.getElementById("optionsGrid");
  grid.innerHTML = "";

  const letters = ["A", "B", "C", "D", "E", "F"];
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.dataset.index = i;

    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.textContent = letters[i] || (i + 1);

    const text = document.createElement("span");
    text.textContent = opt;

    btn.appendChild(letter);
    btn.appendChild(text);

    // Restore selection
    const sel = answers[q.id];
    if (sel !== undefined && sel === i) {
      btn.classList.add("selected");
    }

    // Show correct/incorrect if setting enabled and answered
    if (settings.showAnswerAfterEach && sel !== undefined) {
      if (i === q.correct) {
        btn.classList.add("correct");
      } else if (i === sel && sel !== q.correct) {
        btn.classList.add("incorrect");
      }
    }

    btn.addEventListener("click", () => selectOption(i));
    grid.appendChild(btn);
  });

  // Nav buttons
  document.getElementById("prevBtn").style.opacity = current === 0 ? "0.4" : "1";
  document.getElementById("prevBtn").disabled = current === 0;

  if (current === tot - 1) {
    document.getElementById("nextBtn").classList.add("hidden");
    document.getElementById("submitBtn").classList.remove("hidden");
  } else {
    document.getElementById("nextBtn").classList.remove("hidden");
    document.getElementById("submitBtn").classList.add("hidden");
  }
}

// ─────────────────────────────────────────────
// SELECT OPTION
// ─────────────────────────────────────────────
function selectOption(index) {
  const q = questions[current];
  answers[q.id] = index;

  // Update UI
  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach((btn, i) => {
    btn.classList.remove("selected", "correct", "incorrect");

    if (settings.showAnswerAfterEach) {
      if (i === q.correct) {
        btn.classList.add("correct");
      } else if (i === index && index !== q.correct) {
        btn.classList.add("incorrect");
      }
    } else {
      if (i === index) btn.classList.add("selected");
    }
  });
}

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
function nextQuestion() {
  if (current < questions.length - 1) {
    current++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (current > 0) {
    current--;
    renderQuestion();
  }
}

// ─────────────────────────────────────────────
// SUBMIT
// ─────────────────────────────────────────────
function submitQuiz() {
  // Warn if unanswered
  const unanswered = questions.filter(q => answers[q.id] === undefined).length;
  if (unanswered > 0) {
    const proceed = confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`);
    if (!proceed) return;
  }

  // Calculate score
  let score = 0;
  const answerDetails = questions.map(q => {
    const sel     = answers[q.id];
    const correct = q.correct;
    const isRight = sel !== undefined && sel === correct;
    if (isRight) score++;
    return {
      questionId:    q.id,
      questionText:  q.text,
      selectedIndex: sel !== undefined ? sel : null,
      selectedText:  sel !== undefined ? q.options[sel] : "(No answer)",
      correctIndex:  correct,
      correctText:   q.options[correct],
      isCorrect:     isRight
    };
  });

  // Save result
  const result = {
    viewerName,
    score,
    total: questions.length,
    answers: answerDetails
  };
  DB.saveResult(result);

  // Show result screen
  showResultScreen(result);
}

// ─────────────────────────────────────────────
// RESULT SCREEN
// ─────────────────────────────────────────────
function showResultScreen(result) {
  const pct = Math.round((result.score / result.total) * 100);

  document.getElementById("scoreNum").textContent = result.score;
  document.getElementById("scoreDen").textContent = result.total;

  // Score bar colour
  const bar = document.getElementById("scoreBar");
  bar.style.width = "0%";
  if (pct >= 70) bar.style.background = "linear-gradient(90deg, var(--success), #4ade80)";
  else if (pct >= 40) bar.style.background = "linear-gradient(90deg, var(--warning), #fbbf24)";
  else bar.style.background = "linear-gradient(90deg, var(--danger), #f87171)";
  setTimeout(() => { bar.style.width = pct + "%"; }, 100);

  // Icon & message
  let icon, msg, title;
  if (pct === 100)      { icon = "🏆"; msg = "Perfect score! Outstanding!"; title = "Quiz Complete!"; }
  else if (pct >= 80)   { icon = "🎉"; msg = "Excellent work!"; title = "Quiz Complete!"; }
  else if (pct >= 60)   { icon = "👍"; msg = "Good job! Keep it up!"; title = "Quiz Complete!"; }
  else if (pct >= 40)   { icon = "📚"; msg = "Not bad — keep practicing!"; title = "Quiz Complete!"; }
  else                  { icon = "💪"; msg = "Keep studying and try again!"; title = "Quiz Complete!"; }

  document.getElementById("resultIcon").textContent   = icon;
  document.getElementById("resultTitle").textContent  = title;
  document.getElementById("scoreMessage").textContent = msg + " (" + pct + "%)";

  // Answer breakdown
  const details = document.getElementById("resultDetails");
  details.innerHTML = "";
  const letters = ["A","B","C","D","E","F"];

  result.answers.forEach((a, i) => {
    const div = document.createElement("div");
    div.className = "result-item";

    const selLetter = a.selectedIndex !== null ? (letters[a.selectedIndex] || (a.selectedIndex + 1)) : "–";
    const corLetter = letters[a.correctIndex] || (a.correctIndex + 1);

    div.innerHTML = `
      <div class="result-item-header">
        <span class="result-q-num">Question ${i + 1}</span>
        <span class="result-badge ${a.isCorrect ? 'badge-correct' : 'badge-incorrect'}">
          ${a.isCorrect ? "✓ Correct" : "✗ Wrong"}
        </span>
      </div>
      <p class="result-q-text">${escapeHtml(a.questionText)}</p>
      <div class="result-answers">
        <div class="result-answer-row">
          Your answer: <strong>${selLetter} — ${escapeHtml(a.selectedText)}</strong>
        </div>
        ${!a.isCorrect ? `<div class="result-answer-row">
          Correct answer: <strong>${corLetter} — ${escapeHtml(a.correctText)}</strong>
        </div>` : ""}
      </div>
    `;
    details.appendChild(div);
  });

  showScreen("resultScreen");
}

// ─────────────────────────────────────────────
// RETAKE
// ─────────────────────────────────────────────
function retake() {
  answers = {};
  current = 0;
  document.getElementById("viewerName").value = viewerName;
  showScreen("welcomeScreen");
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

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
