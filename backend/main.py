"""
FastAPI backend for AI Resume Analyser & Interview Prep.
"""

import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from groq import Groq
import io
import random

from chains import (
    get_resume_chain, parse_resume_response,
    parse_questions_response,
    get_evaluation_chain, parse_evaluation_response,
    get_skill_question_chain,
    get_introduction_chain,
    get_behavioral_chain,
    get_model_answer_chain,
)

# Load environment variables
load_dotenv()

# Validate API key
if not os.getenv("GROQ_API_KEY"):
    print("⚠️  WARNING: GROQ_API_KEY not set. AI features will not work.")
    print("   Copy .env.example to .env and add your key.")

app = FastAPI(
    title="AI Resume Analyser",
    description="Upload resumes, get AI analysis, interview questions, and answer evaluation.",
    version="1.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq client for direct audio API access (STT)
groq_client = Groq()


# ── Health Check ──────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Resume Analyser API is running"}


# ── Resume Analysis Endpoint ─────────────────────────────────────────────────

@app.post("/api/analyze-resume")
async def analyze_resume(file: UploadFile = File(...)):
    """Upload a PDF resume and get AI-powered analysis."""
    
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        # Read and extract text from PDF
        contents = await file.read()
        pdf_reader = PdfReader(io.BytesIO(contents))
        
        resume_text = ""
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                resume_text += text + "\n"
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF. The file may be image-based or corrupted.")
        
        # Run the resume analysis chain
        chain = get_resume_chain()
        response = chain.invoke({"resume_text": resume_text})
        analysis = parse_resume_response(response)
        
        return {
            "success": True,
            "analysis": analysis,
            "resume_text": resume_text[:500] + "..." if len(resume_text) > 500 else resume_text
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")



# ── Skill-Based Question Generation Endpoint ─────────────────────────────────

class SkillQuestionRequest(BaseModel):
    skills: list[str]
    resume_summary: str


@app.post("/api/generate-skill-questions")
async def generate_skill_questions(request: SkillQuestionRequest):
    """Generate interview questions based on selected skills from the resume."""
    
    if not request.skills or len(request.skills) == 0:
        raise HTTPException(status_code=400, detail="At least one skill is required.")
    
    if not request.resume_summary.strip():
        raise HTTPException(status_code=400, detail="Resume summary is required.")
    
    try:
        chain = get_skill_question_chain()
        skills_text = ", ".join(request.skills)
        response = chain.invoke({
            "skills": skills_text,
            "resume_summary": request.resume_summary,
            "session_seed": random.randint(1000, 9999)
        })
        questions = parse_questions_response(response)
        
        return {
            "success": True,
            "skills": request.skills,
            **questions
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating skill questions: {str(e)}")



# ── Answer Evaluation Endpoint ────────────────────────────────────────────────

class EvaluationRequest(BaseModel):
    question: str
    user_answer: str


@app.post("/api/evaluate-answer")
async def evaluate_answer(request: EvaluationRequest):
    """Evaluate a candidate's answer to an interview question."""
    
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question is required.")
    
    if not request.user_answer.strip():
        raise HTTPException(status_code=400, detail="Answer is required.")
    
    try:
        chain = get_evaluation_chain()
        response = chain.invoke({
            "question": request.question,
            "user_answer": request.user_answer
        })
        evaluation = parse_evaluation_response(response)
        
        return {
            "success": True,
            **evaluation
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluating answer: {str(e)}")


# ── Introduction Questions Endpoint ───────────────────────────────────────────

class IntroductionRequest(BaseModel):
    resume_summary: str


@app.post("/api/generate-introduction-questions")
async def generate_introduction_questions(request: IntroductionRequest):
    """Generate introduction round questions based on resume."""
    
    if not request.resume_summary.strip():
        raise HTTPException(status_code=400, detail="Resume summary is required.")
    
    try:
        chain = get_introduction_chain()
        response = chain.invoke({"resume_summary": request.resume_summary, "session_seed": random.randint(1000, 9999)})
        questions = parse_questions_response(response)
        return {"success": True, **questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating introduction questions: {str(e)}")


# ── Behavioral Questions Endpoint ─────────────────────────────────────────────

class BehavioralRequest(BaseModel):
    resume_summary: str


@app.post("/api/generate-behavioral-questions")
async def generate_behavioral_questions(request: BehavioralRequest):
    """Generate behavioral/STAR round questions based on resume."""
    
    if not request.resume_summary.strip():
        raise HTTPException(status_code=400, detail="Resume summary is required.")
    
    try:
        chain = get_behavioral_chain()
        response = chain.invoke({"resume_summary": request.resume_summary, "session_seed": random.randint(1000, 9999)})
        questions = parse_questions_response(response)
        return {"success": True, **questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating behavioral questions: {str(e)}")


# ── Model Answer Endpoint (Skip / I Don't Know) ──────────────────────────────

class ModelAnswerRequest(BaseModel):
    question: str


@app.post("/api/get-model-answer")
async def get_model_answer(request: ModelAnswerRequest):
    """Generate an ideal model answer for a question (used when user skips)."""
    
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question is required.")
    
    try:
        chain = get_model_answer_chain()
        response = chain.invoke({"question": request.question})
        result = parse_questions_response(response)
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating model answer: {str(e)}")


# ── Voice Mode: Speech-to-Text (Transcribe) ──────────────────────────────────

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe an audio file to text using Groq Whisper."""
    
    try:
        audio_bytes = await file.read()
        
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file.")
        
        # Use Groq Whisper for ultra-fast STT
        # whisper-large-v3-turbo handles webm/ogg from browser MediaRecorder
        transcription = groq_client.audio.transcriptions.create(
            file=(file.filename or "audio.webm", audio_bytes),
            model="whisper-large-v3-turbo",
            response_format="verbose_json",
            language="en",
        )
        
        text = transcription.text.strip() if hasattr(transcription, 'text') else str(transcription).strip()
        
        if not text:
            return {"success": True, "text": "", "message": "No speech detected."}
        
        return {"success": True, "text": text}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")




if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

