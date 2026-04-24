"""
LangChain chains for Resume Analysis, Question Generation, and Answer Evaluation.
"""

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
import json
import re


# ── LLM Instance ──────────────────────────────────────────────────────────────

def get_llm(temperature=0.7):
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=temperature)


# ── Resume Analysis Chain ─────────────────────────────────────────────────────

RESUME_ANALYSIS_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert resume analyst and career coach. 
Analyze the given resume text and provide a comprehensive evaluation.

You MUST respond with valid JSON in exactly this format:
{{
    "overall_score": <number 1-100>,
    "summary": "<2-3 sentence overview of the candidate>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
    "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>", "<actionable suggestion 4>", "<actionable suggestion 5>"],
    "skills_found": ["<skill 1>", "<skill 2>", "<skill 3>"],
    "experience_level": "<Entry Level | Mid Level | Senior Level | Executive>"
}}

Respond ONLY with the JSON object. No other text."""),
    ("human", "Analyze this resume:\n\n{resume_text}")
])


def get_resume_chain():
    llm = get_llm(temperature=0.3)
    chain = RESUME_ANALYSIS_PROMPT | llm
    return chain


def parse_resume_response(response):
    """Parse the LLM response into structured data."""
    text = response.content
    # Try to extract JSON from the response
    try:
        # Try direct JSON parsing
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON in the response
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json.loads(json_match.group())
        raise ValueError("Could not parse resume analysis response")


# ── Question Generation Chain ─────────────────────────────────────────────────

QUESTION_GENERATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert technical interviewer and hiring manager.
Based on the candidate's resume and the target job role, generate relevant interview questions.

Generate exactly 5 interview questions that:
1. Are specific to the job role
2. Test both technical skills and behavioral competencies
3. Are relevant to the candidate's background from their resume
4. Range from moderate to challenging difficulty

You MUST respond with valid JSON in exactly this format:
{{
    "questions": [
        {{
            "id": 1,
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "<Medium | Hard>"
        }},
        {{
            "id": 2,
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "<Medium | Hard>"
        }},
        {{
            "id": 3,
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "<Medium | Hard>"
        }},
        {{
            "id": 4,
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "<Medium | Hard>"
        }},
        {{
            "id": 5,
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "<Medium | Hard>"
        }}
    ]
}}

Respond ONLY with the JSON object. No other text."""),
    ("human", "Job Role: {role}\n\nCandidate Resume Summary: {resume_summary}")
])


def get_question_chain():
    llm = get_llm(temperature=0.7)
    chain = QUESTION_GENERATION_PROMPT | llm
    return chain


def parse_questions_response(response):
    """Parse the LLM response into structured data."""
    text = response.content
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json.loads(json_match.group())
        raise ValueError("Could not parse questions response")


# ── Answer Evaluation Chain ───────────────────────────────────────────────────

EVALUATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert interview evaluator and career mentor.
Evaluate the candidate's answer to the given interview question.

Provide a thorough assessment with actionable feedback.

You MUST respond with valid JSON in exactly this format:
{{
    "score": <number 1-10>,
    "feedback": "<detailed 2-3 sentence feedback explaining the score>",
    "better_answer": "<a model answer that would score 9-10, written as if the candidate is speaking>"
}}

Respond ONLY with the JSON object. No other text."""),
    ("human", "Question: {question}\n\nCandidate's Answer: {user_answer}")
])


def get_evaluation_chain():
    llm = get_llm(temperature=0.3)
    chain = EVALUATION_PROMPT | llm
    return chain


def parse_evaluation_response(response):
    """Parse the LLM response into structured data."""
    text = response.content
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json.loads(json_match.group())
        raise ValueError("Could not parse evaluation response")
