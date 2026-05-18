# 📘 Tech Notes — PrepSense

> Technical knowledge, patterns, and learnings from building this project.
> Use this as a reference for interviews and future development.

---

## 1. Session Seed — Forcing LLM Output Variety

**Problem:** LLMs are deterministic — same prompt input = same output, even with high temperature. When a user uploads the same resume twice, they get identical questions.

**Solution:** Inject a random `session_seed` into the prompt.

```python
# Backend generates a random 4-digit number per API call
import random
seed = random.randint(1000, 9999)

# This gets passed into the LangChain prompt:
chain.invoke({
    "resume_summary": resume_text,
    "session_seed": seed  # e.g., 7342
})
```

**Prompt sees:**
```
Session #7342 — Generate fresh, unique questions.
Candidate Resume Summary: Built web apps with React...
```

**Why it works:**
- The LLM treats `Session #7342` and `Session #2851` as **different inputs**
- This breaks any caching and forces varied outputs
- The instruction "Generate fresh, unique questions" reinforces diversity
- Combined with `temperature=0.9`, this guarantees different questions every time

**Analogy:** Asking a teacher "Give me questions (attempt #7342, make them fresh)" vs. the same request without a number — the number alone changes the context enough.

**Important:** The seed is just random noise injected into the prompt to make the input string different each time. That's it — no session tracking, no memory, no magic.

**Files:** `backend/main.py` (seed generation) → `backend/chains.py` (prompt templates)

---

## 2. LangChain + Groq Architecture

**Stack:** LangChain `ChatPromptTemplate` → `ChatGroq` LLM → JSON response → Python parser

```
User Input → FastAPI Endpoint → LangChain Chain → Groq API (Llama 3.3 70B) → Parse JSON → Return
```

**Key design decisions:**
- `temperature=0.3` for resume analysis (consistent scoring)
- `temperature=0.9` for question generation (variety)
- `temperature=0.7` for answer evaluation (balanced)
- All prompts enforce JSON-only output with strict schema

---

## 3. Round-Based Timer Architecture

**Design:** Single countdown timer per round (not per-question).

| Round | Time | Questions |
|---|---|---|
| Introduction | 10 min | 4 |
| Technical | 25 min | 6 |
| Behavioral | 15 min | 4 |

**How auto-skip works:**
```jsx
useEffect(() => {
  if (timeLeft !== 0) return;
  // Timer hit 0 — auto-process all unanswered questions
  allQuestions.forEach(q => {
    if (!evaluated && !skipped) {
      if (hasAnswer) evaluateIt();  // Submit if they typed something
      else skipIt();                // Skip if empty
    }
  });
}, [timeLeft]);
```

**Key:** Uses `useRef` for `timerExpiredRef` to prevent double-firing.

---

## 4. Voice Mode — STT Pipeline

**Flow:** Browser MediaRecorder → WebM audio blob → POST to `/api/transcribe` → Groq Whisper → Text

```
🎤 User speaks → MediaRecorder (webm/opus) → fetch('/api/transcribe') → Groq Whisper v3 Turbo → Text fills textarea
```

**Why Groq Whisper:**
- `whisper-large-v3-turbo` — fastest STT available
- Handles browser's native WebM/Opus format directly
- No audio conversion needed

---

## 5. CORS Gotcha — Dev Server Port Shifting

**Problem:** Vite dev server auto-shifts ports (5173 → 5174 → 5175) when a port is occupied.

**Fix:** Backend CORS allows multiple dev ports:
```python
allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]
```

**Lesson:** Always check which port Vite actually started on.

---

## 6. Prompt Engineering Patterns Used

### Structured JSON Output
```
You MUST respond with valid JSON in exactly this format:
{ ... }
Respond ONLY with the JSON object. No other text.
```
Forces the LLM to return parseable JSON instead of conversational text.

### Progressive Difficulty
```
- Question 1: Very Easy
- Question 2: Easy
- Question 3: Medium
- Question 4: Hard
```
Explicitly numbering difficulty in the prompt ensures a smooth ramp-up.

### Topic Pool with Random Selection
```
Pick 4 topics from this list (vary your selection each time):
- Topic A
- Topic B
- ...8 options total
```
Giving more options than needed + "vary your selection" = natural variety.

---

## 7. Key React Patterns

### Scroll-to-top on step change
```jsx
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, [step]);
```

### Dynamic lazy imports (code splitting)
```jsx
const { analyzeResume } = await import('./api');
```
Only loads API functions when actually needed.

### Round score aggregation
Scores are tracked per-round in `App.jsx` and passed to `ReportCard` for weighted calculation (Intro: 20%, Tech: 50%, Behavioral: 30%).

---

*Last updated: April 26, 2025*
