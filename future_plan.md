# 🚀 Future Plan: Polish & Originality

> **Status:** Saved for future implementation  
> **Priority order:** Feature A → Feature B → Feature C  
> **Each feature is independently deployable.**

---

## Current Project State

| Feature | Status |
|---|---|
| Resume Upload + PDF Parsing | ✅ Done |
| AI Resume Analysis (score, strengths, weaknesses, skills) | ✅ Done |
| Multi-Round Interview (Introduction → Technical → Behavioral) | ✅ Done |
| Answer Evaluation (score, feedback, model answer) | ✅ Done |
| Voice Mode — STT (Groq Whisper) | ✅ Done |
| Round Timer (with auto-submit + practice mode toggle) | ✅ Done |
| "I Don't Know" / Skip + Show Model Answer | ✅ Done |
| Final Report Card Dashboard | ✅ Done |
| Hero Section + Product Branding | ⬜ Feature A |
| Skill Picker Before Technical Round | ⬜ Feature B |
| Interview History (localStorage) | ⬜ Feature C |

---

## Quick Fixes (bundled into Feature A)

- Replace "AI Mock Interview" → **"PrepSense"** (or your preferred name)
- Replace `🧠` header icon → gradient text logo
- Replace "Built with ❤️" → `© 2025 PrepSense | Built by Rahul Raj`
- Tone down emojis: keep round icons (👋💻🤝), remove 🧠🚀📄🔄📋 from buttons
- Remove "Load More Questions" button + follow-up code (simplifies the flow)

---

## Feature A: Hero Section + Branding Polish

**Difficulty:** 🟢 Easy | **~30 min**

### What Changes

Add a hero/tagline section above the upload area on the landing page. Rebrand the app with a product name and clean footer.

### File Changes

#### [MODIFY] `frontend/src/App.jsx`
- Replace header: `🧠 AI Mock Interview` → **"PrepSense"** with gradient text, no emoji
- Add hero section below header (only visible on step 1, before upload):
  ```
  Ace your next interview with AI
  Upload your resume. Practice 3 rounds. Get your score.
  ────────
  ✓ AI-Powered Analysis  ✓ 3 Interview Rounds  ✓ Instant Feedback
  ```
- Replace footer text: `Built with ❤️` → `© 2025 PrepSense | Built by Rahul Raj`
- Clean up button text: Remove excessive emojis from button labels
- Remove "Load More Questions" — remove `hideLoadMore` prop logic

#### [MODIFY] `frontend/src/components/AnswerEvaluation.jsx`
- Remove `loadingMore`, `loadMoreError`, `handleLoadMore` state and function
- Remove the "Load More Questions" button section at the bottom
- Remove the `role` prop (no longer needed without follow-up)

#### [MODIFY] `frontend/src/api.js`
- Remove `generateFollowupQuestions()` function (dead code after Load More removal)

#### [MODIFY] `frontend/src/index.css`
- Add `.hero` section styles (gradient text, feature badges)
- Update `.app-header` to remove emoji icon reliance

#### [MODIFY] `frontend/index.html`
- Update `<title>` to "PrepSense — AI Interview Simulator"
- Add `<meta name="description">` tag

---

## Feature B: Skill Picker Before Technical Round

**Difficulty:** 🟢 Easy | **~40 min**

### What Changes

After completing the Introduction Round, show a skill selection screen where users choose which skills to be tested on, instead of auto-picking all skills.

### File Changes

#### [MODIFY] `frontend/src/App.jsx`
- Add `selectedSkills` state: `useState([])`
- Add `showSkillPicker` state: `useState(false)`
- When Introduction completes → show skill picker instead of directly generating technical questions
- After user picks skills → calls `generateSkillQuestions(selectedSkills, resumeSummary)` → step 3

#### [NEW] `frontend/src/components/SkillPicker.jsx`
New component that renders:
```
Select the skills you want to be tested on:

[✓ React]  [✓ Python]  [✓ Node.js]  [ ] Docker]  [ ] AWS]

Selected: 4 skills    [Start Technical Round →]
```

Props:
- `skills` — array of all skills from resume analysis
- `onStart(selectedSkills)` — callback when user clicks start

Features:
- Toggle skill tags on/off
- Minimum 2 skills required
- "Select All" / "Deselect All" shortcuts
- Disabled state if < 2 selected

#### [MODIFY] `frontend/src/index.css`
- Add `.skill-picker` styles: grid of toggleable skill tags
- Active/inactive states with transitions

---

## Feature C: Interview History (localStorage)

**Difficulty:** 🟡 Medium | **~1 hr**

### What Changes

Save completed interview results to `localStorage` so users can see past performances on the landing page.

### File Changes

#### [MODIFY] `frontend/src/App.jsx`
- Add `interviewHistory` state, initialized from `localStorage`
- When report card is shown → save to history:
  ```js
  {
    id: Date.now(),
    date: new Date().toLocaleDateString(),
    scores: roundScores,
    overallScore: 73,
    verdict: "Strong Candidate",
    skills: selectedSkills
  }
  ```
- Pass `history` to `InterviewHistory` component on landing page
- Clear history button

#### [NEW] `frontend/src/components/InterviewHistory.jsx`
Displays on the landing page (step 1), below the upload section:
```
📊 Previous Interviews

┌──────────────────────────────────────────┐
│  Apr 25, 2025   │  Overall: 73%  │  Strong  │
│  Skills: React, Python, Node.js          │
├──────────────────────────────────────────┤
│  Apr 23, 2025   │  Overall: 58%  │  Moderate│
│  Skills: Java, Spring Boot               │
└──────────────────────────────────────────┘

[Clear History]
```

Features:
- Shows last 5 interviews
- Color-coded verdict badge (reuse report card styles)
- "Clear History" button
- Empty state: "No previous interviews yet"

#### [MODIFY] `frontend/src/components/ReportCard.jsx`
- Add `onSaveToHistory` callback prop
- Call it when report card renders with the score data

#### [MODIFY] `frontend/src/index.css`
- Add `.interview-history` card styles
- History item cards with date, score, verdict badge

---

## Bonus Ideas (Future-Future)

| Feature | Difficulty | Description |
|---|---|---|
| 💻 Code Editor Round | 🔴 Hard | Embed Monaco editor, run code against test cases |
| 📹 Video Recording | 🔴 Hard | Record user via webcam for body language review |
| 📊 Analytics Dashboard | 🟡 Medium | Track improvement over multiple interview sessions |
| 🌐 Share Results | 🟢 Easy | Generate shareable link with interview score |
| 🎯 Company-Specific Prep | 🟡 Medium | "Prepare for Google" — use company-specific question patterns |
