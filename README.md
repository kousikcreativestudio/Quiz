# 📝 Quiz App — Complete Setup Guide

A fully working, customizable quiz website. No server required. Runs in any browser.

---

## 📁 File Structure

```
quiz-website/
├── index.html    ← Quiz viewer page (share this with participants)
├── admin.html    ← Admin panel (add/edit questions, view results)
├── style.css     ← All styling (light + dark mode)
├── app.js        ← Quiz viewer logic
├── admin.js      ← Admin panel logic
├── db.js         ← Data storage (localStorage)
└── README.md     ← This file
```

---

## 🚀 How to Run Locally

### Option A — Double-click (simplest)
1. Open the `quiz-website` folder
2. Double-click `index.html` → opens quiz in browser
3. Double-click `admin.html` → opens admin panel

> Works on Windows, Mac, and Linux. No installation needed.

### Option B — Local server (recommended for development)
If you have Python installed:
```bash
cd quiz-website
python -m http.server 8080
```
Then open: http://localhost:8080

---

## 🔐 Admin Access

1. Open `admin.html` in your browser
2. Default password: **admin123**
3. To change the password:
   - Log in → click **Settings** tab → enter new password → Save Settings
   - OR open `db.js` and change `ADMIN_PASSWORD = "admin123"` at the top

---

## ➕ How to Add a Question

1. Open `admin.html` and log in
2. Click the **Questions** tab (default)
3. Click **+ Add Question**
4. Enter the question text
5. Fill in option A, B, C, D (add more with "+ Add Option")
6. Select the correct answer from the dropdown
7. Click **Save Question**

---

## ✏️ How to Edit a Question

1. In the admin Questions tab, find the question
2. Click **✏️ Edit**
3. Change anything — text, options, correct answer
4. Click **Save Question**

---

## 🗑️ How to Delete a Question

1. In the Questions tab, click **🗑** on any question
2. Confirm the deletion

---

## 🔀 How to Reorder Questions

- Drag the **⠿** handle on the left of any question card and drop it in the new position

---

## 🎛️ Quiz Settings

Go to **Settings** tab in admin:

| Setting | What it does |
|---|---|
| Quiz Title | Shown at top of quiz and welcome screen |
| Quiz Description | Short text shown before quiz starts |
| Admin Password | Protects the admin page |
| Show correct answer | If ON, shows correct/wrong after each question |

---

## 📊 How to View Results

1. Open `admin.html` → log in → click **Results** tab
2. See all submissions with name, score, date
3. Click any submission to see the full breakdown:
   - Each question
   - What the viewer selected
   - What the correct answer was
   - Correct / Wrong per question

---

## 🔍 How to Search / Filter Results

- Use the **search bar** to filter by viewer name
- Use the **sort dropdown** to sort by date or score

---

## ⬇️ How to Export Results as CSV

1. Go to **Results** tab in admin
2. Click **⬇ Export CSV**
3. A `.csv` file downloads to your computer
4. Open in Excel, Google Sheets, or any spreadsheet app

CSV columns: Name, Date, Score, Percentage, Question, Selected Answer, Correct Answer, Result

---

## 🌐 How to Publish Online (Free)

### Option 1 — Netlify (Easiest, free forever)

1. Go to https://netlify.com → sign up free
2. Drag and drop the entire `quiz-website` folder onto the Netlify dashboard
3. Netlify gives you a URL like `https://your-quiz.netlify.app`
4. Share `https://your-quiz.netlify.app` with quiz takers
5. Share `https://your-quiz.netlify.app/admin.html` with yourself (admin)

To update: drag-drop the folder again (or connect to GitHub for auto-deploys)

### Option 2 — GitHub Pages (Free)

1. Create a free account at https://github.com
2. Create a new repository (e.g. `my-quiz`)
3. Upload all files from `quiz-website/` to the repo
4. Go to repo Settings → Pages → Source: Deploy from branch → main → root
5. Your quiz is live at `https://yourusername.github.io/my-quiz/`

### Option 3 — Vercel (Free)

1. Go to https://vercel.com → sign up free
2. Connect your GitHub repo (from Option 2 above)
3. Click Deploy → done!

---

## ⚠️ Important: Results Storage

By default, results are stored in **localStorage** — this means:

- Results are stored in the browser on the computer where someone takes the quiz
- If someone takes the quiz on their phone, results are on their phone
- If you clear browser data, results are lost

### For shared/permanent results: Use Firebase (free)

1. Go to https://firebase.google.com → create a free project
2. Enable **Cloud Firestore** (free Spark plan: 50k reads + 20k writes/day)
3. Follow the instructions at the bottom of `db.js`

This lets results from all devices be stored in one place and visible from any computer in the admin panel.

---

## 🎨 Customization Tips

### Change quiz questions without touching code:
Use the admin panel (admin.html) — all changes save automatically.

### Change colors/theme:
Edit the CSS variables at the top of `style.css`:
```css
:root {
  --primary: #5b5ef6;    ← main purple color
  --success: #22c55e;    ← correct answer green
  --danger:  #ef4444;    ← wrong answer red
}
```

### Add your own default questions:
Edit the `DEFAULT_QUESTIONS` array in `db.js`.
Questions are only loaded from there on the very first run (before admin saves anything).
To reset to defaults: open browser DevTools → Application → Local Storage → delete all `quiz_*` keys.

---

## 🔒 Security Notes

- The admin password is checked in JavaScript (client-side). This protects casual viewers but is not military-grade security.
- For stronger security, add a backend (Node.js, Firebase Functions, etc.) with server-side auth.
- Correct answers ARE visible in browser localStorage (since grading happens in the browser). If you need answer hiding, use a backend.
- For a class/exam context with high stakes, consider a proper LMS (Google Forms, Typeform, etc.).

---

## 💡 Quick Reference

| Task | Where |
|---|---|
| Take the quiz | `index.html` |
| Add/edit questions | `admin.html` → Questions tab |
| View submissions | `admin.html` → Results tab |
| Export CSV | `admin.html` → Results → Export CSV |
| Change quiz title | `admin.html` → Settings tab |
| Change password | `admin.html` → Settings tab |
| Change colors | `style.css` → `:root` variables |
| Change default questions | `db.js` → `DEFAULT_QUESTIONS` array |
