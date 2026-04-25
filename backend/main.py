"""
FastAPI backend for AI Resume Analyser & Interview Prep.
"""

import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import io

from chains import (
    get_resume_chain, parse_resume_response,
    parse_questions_response,
    get_evaluation_chain, parse_evaluation_response,
    get_skill_question_chain,
    get_followup_chain,
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
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
            "resume_summary": request.resume_summary
        })
        questions = parse_questions_response(response)
        
        return {
            "success": True,
            "skills": request.skills,
            **questions
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating skill questions: {str(e)}")


# ── Follow-up Question Generation Endpoint ────────────────────────────────────

class FollowupRequest(BaseModel):
    role: Optional[str] = None
    skills: Optional[list[str]] = None
    previous_questions: list[str]
    start_id: int


@app.post("/api/generate-followup-questions")
async def generate_followup_questions(request: FollowupRequest):
    """Generate harder follow-up questions. Works for both role-based and skill-based modes."""
    
    if not request.role and not request.skills:
        raise HTTPException(status_code=400, detail="Either role or skills must be provided.")
    
    if not request.previous_questions:
        raise HTTPException(status_code=400, detail="Previous questions are required.")
    
    try:
        # Build context string
        if request.role:
            context = f"Job Role: {request.role}"
        else:
            context = f"Selected Skills: {', '.join(request.skills)}"
        
        # Format previous questions as numbered list
        prev_qs_text = "\n".join(
            f"{i+1}. {q}" for i, q in enumerate(request.previous_questions)
        )
        
        # Calculate IDs for the new batch
        start = request.start_id
        
        chain = get_followup_chain()
        response = chain.invoke({
            "context": context,
            "previous_questions": prev_qs_text,
            "start_id": start,
            "start_id_plus_1": start + 1,
            "start_id_plus_2": start + 2,
            "start_id_plus_3": start + 3,
            "start_id_plus_4": start + 4,
            "start_id_plus_5": start + 5,
        })
        questions = parse_questions_response(response)
        
        return {
            "success": True,
            **questions
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating follow-up questions: {str(e)}")


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

