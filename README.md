# 🧠 AI Resume Analyser & Interview Prep

An AI-powered web app that analyzes resumes, generates tailored interview questions, and evaluates your answers — all powered by OpenAI's GPT-4o-mini via LangChain.

## ✨ Features

- **📄 Resume Analysis** — Upload a PDF resume and get an AI-powered score, strengths, weaknesses, skills breakdown, and actionable suggestions.
- **🎯 Interview Prep** — Select a target job role and receive 5 tailored interview questions based on your resume.
- **✅ Answer Evaluation** — Type your answers and get scored (1–10) with detailed feedback and a model answer.

## 🛠️ Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 19, Vite 8                    |
| Backend  | Python, FastAPI, Uvicorn            |
| AI/LLM   | LangChain, Groq LPU (Llama 3.3 70B)|
| PDF      | PyPDF2                              |

## 📁 Project Structure

```
resume analysier/
├── backend/
│   ├── main.py              # FastAPI server (3 API endpoints)
│   ├── chains.py            # LangChain chains & prompt templates
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables (not committed)
│   └── .env.example         # Template for .env setup
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app with 3-step flow
│   │   ├── api.js           # API service layer
│   │   ├── index.css        # Full design system (dark theme)
│   │   └── components/
│   │       ├── ResumeUpload.jsx      # PDF upload with drag & drop
│   │       ├── ResumeAnalysis.jsx    # Score gauge & analysis cards
│   │       ├── InterviewPrep.jsx     # Role selector & question gen
│   │       └── AnswerEvaluation.jsx  # Answer input & AI feedback
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Groq API Key** (free) — [Get one here](https://console.groq.com/keys)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "resume analysier"
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and add your OpenAI API key
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Run the App

Open **two terminals**:

**Terminal 1 — Backend** (from project root):
```bash
cd backend
python main.py
```
> Backend runs at: http://localhost:8000

**Terminal 2 — Frontend** (from project root):
```bash
cd frontend
npm run dev
```
> Frontend runs at: http://localhost:5173

### 5. Use the App

1. Open http://localhost:5173 in your browser
2. Upload a PDF resume
3. Review the AI analysis (score, strengths, weaknesses, skills)
4. Select a target job role
5. Answer the generated interview questions
6. Get AI-powered feedback on your answers

## 📡 API Endpoints

| Method | Endpoint                  | Description                     |
|--------|---------------------------|---------------------------------|
| GET    | `/`                       | Health check                    |
| POST   | `/api/analyze-resume`     | Upload PDF, get analysis        |
| POST   | `/api/generate-questions` | Generate interview questions    |
| POST   | `/api/evaluate-answer`    | Evaluate a candidate's answer   |

## 📝 License

This project is for educational purposes.
