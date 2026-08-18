/**
 * db.js — Quiz App Storage Layer
 *
 * Uses localStorage by default (works 100% offline, no setup needed).
 * All data is saved in the browser on the computer running the quiz.
 *
 * TO USE FIREBASE INSTEAD:
 *   1. Create a free project at https://firebase.google.com
 *   2. Enable Firestore database
 *   3. Follow the instructions at the bottom of this file
 *
 * ADMIN PASSWORD: Change ADMIN_PASSWORD below.
 */

const ADMIN_PASSWORD = "v888"; // <-- CHANGE THIS

// ─────────────────────────────────────────────
// DEFAULT QUIZ DATA (edit freely)
// ─────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  title: "General Knowledge Quiz",
  description: "Test your general knowledge! Answer all questions and see how you score.",
  showAnswerAfterEach: false,
  adminPassword: ADMIN_PASSWORD
};

const DEFAULT_QUESTIONS = [
  {
    id: "q1",
    text: "What is the capital city of India?",
    options: ["Mumbai", "Kolkata", "New Delhi", "Bengaluru"],
    correct: 2
  },
  {
    id: "q2",
    text: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1
  },
  {
    id: "q3",
    text: "Who wrote the play 'Romeo and Juliet'?",
    options: ["Charles Dickens", "Mark Twain", "William Shakespeare", "Jane Austen"],
    correct: 2
  },
  {
    id: "q4",
    text: "What is the chemical symbol for water?",
    options: ["O2", "CO2", "H2O", "NaCl"],
    correct: 2
  },
  {
    id: "q5",
    text: "How many continents are there on Earth?",
    options: ["5", "6", "7", "8"],
    correct: 2
  }
];

// ─────────────────────────────────────────────
// STORAGE KEYS
// ─────────────────────────────────────────────
const KEYS = {
  settings: "quiz_settings",
  questions: "quiz_questions",
  results:   "quiz_results"
};

// ─────────────────────────────────────────────
// DB API (localStorage implementation)
// ─────────────────────────────────────────────
const DB = {

  // ── SETTINGS ──────────────────────────────
  getSettings() {
    const raw = localStorage.getItem(KEYS.settings);
    return raw ? JSON.parse(raw) : { ...DEFAULT_SETTINGS };
  },

  saveSettings(settings) {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  },

  // ── QUESTIONS ─────────────────────────────
  getQuestions() {
    const raw = localStorage.getItem(KEYS.questions);
    if (raw) return JSON.parse(raw);
    // First run: save defaults and return them
    localStorage.setItem(KEYS.questions, JSON.stringify(DEFAULT_QUESTIONS));
    return [...DEFAULT_QUESTIONS];
  },

  saveQuestions(questions) {
    localStorage.setItem(KEYS.questions, JSON.stringify(questions));
  },

  addQuestion(question) {
    const questions = this.getQuestions();
    question.id = "q_" + Date.now();
    questions.push(question);
    this.saveQuestions(questions);
    return question;
  },

  updateQuestion(id, updates) {
    const questions = this.getQuestions();
    const idx = questions.findIndex(q => q.id === id);
    if (idx !== -1) {
      questions[idx] = { ...questions[idx], ...updates };
      this.saveQuestions(questions);
    }
  },

  deleteQuestion(id) {
    const questions = this.getQuestions().filter(q => q.id !== id);
    this.saveQuestions(questions);
  },

  reorderQuestions(questions) {
    this.saveQuestions(questions);
  },

  // ── RESULTS ───────────────────────────────
  getResults() {
    const raw = localStorage.getItem(KEYS.results);
    return raw ? JSON.parse(raw) : [];
  },

  saveResult(result) {
    const results = this.getResults();
    result.id = "r_" + Date.now();
    result.timestamp = new Date().toISOString();
    results.push(result);
    localStorage.setItem(KEYS.results, JSON.stringify(results));
    return result;
  },

  clearResults() {
    localStorage.setItem(KEYS.results, JSON.stringify([]));
  },

  // ── AUTH ──────────────────────────────────
  checkPassword(password) {
    const settings = this.getSettings();
    return password === (settings.adminPassword || ADMIN_PASSWORD);
  }
};

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────
function generateId() {
  return "id_" + Math.random().toString(36).substr(2, 9);
}

function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function scoreColor(score, total) {
  const pct = (score / total) * 100;
  if (pct >= 70) return "score-high";
  if (pct >= 40) return "score-mid";
  return "score-low";
}

/*
═══════════════════════════════════════════════════════════════
  HOW TO SWITCH TO FIREBASE (optional, for shared results)
═══════════════════════════════════════════════════════════════

  1. Go to https://firebase.google.com → "Get started" → create project
  2. Enable "Cloud Firestore" database (start in test mode for now)
  3. In your Firebase project settings → "Web app" → copy your config

  4. Add this to your HTML <head> before db.js:
     <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js"></script>
     <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore-compat.js"></script>

  5. Add this code at the TOP of db.js:

     const firebaseConfig = {
       apiKey: "...",
       authDomain: "...",
       projectId: "...",
       // ...your config
     };
     firebase.initializeApp(firebaseConfig);
     const db_firebase = firebase.firestore();

  6. Replace DB.saveResult with:

     async saveResult(result) {
       result.timestamp = new Date().toISOString();
       await db_firebase.collection("results").add(result);
       return result;
     }

  7. Replace DB.getResults with:

     async getResults() {
       const snap = await db_firebase.collection("results").orderBy("timestamp","desc").get();
       return snap.docs.map(d => ({ id: d.id, ...d.data() }));
     }

  Firebase Firestore free tier (Spark plan):
  - 50,000 reads/day, 20,000 writes/day — more than enough for a quiz app!
═══════════════════════════════════════════════════════════════
*/
