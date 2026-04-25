"""
LangChain chains for Resume Analysis, Question Generation, and Answer Evaluation.
"""

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
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


# ── Shared JSON Parser ────────────────────────────────────────────────────────

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


# ── Skill-Based Question Generation Chain ─────────────────────────────────────

SKILL_QUESTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert technical interviewer.
Based on the candidate's selected skills, generate targeted interview questions
with PROGRESSIVE DIFFICULTY — starting easy and building up to hard.

Generate exactly 6 interview questions in this exact difficulty order:
- Question 1: Very Easy — A basic definition or "What is X?" question about one of the skills
- Question 2: Easy — A fundamental concept question about one of the skills
- Question 3: Easy — Simple applied knowledge combining skills
- Question 4: Medium — Scenario-based / practical application of the skills
- Question 5: Medium — Applied problem-solving using the skills together
- Question 6: Hard — Deep technical / architecture question involving the skills

All questions must:
1. Be directly related to the selected skills
2. Test practical, real-world knowledge
3. Cover different skills across the questions when possible

You MUST respond with valid JSON in exactly this format:
{{
    "questions": [
        {{
            "id": 1,
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Very Easy"
        }},
        {{
            "id": 2,
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Easy"
        }},
        {{
            "id": 3,
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Easy"
        }},
        {{
            "id": 4,
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Medium"
        }},
        {{
            "id": 5,
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Medium"
        }},
        {{
            "id": 6,
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Hard"
        }}
    ]
}}

Respond ONLY with the JSON object. No other text."""),
    ("human", "Selected Skills: {skills}\n\nCandidate Resume Summary: {resume_summary}")
])


def get_skill_question_chain():
    llm = get_llm(temperature=0.7)
    chain = SKILL_QUESTION_PROMPT | llm
    return chain


# ── Follow-up Question Generation Chain ────────────────────────────────────────

FOLLOWUP_QUESTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert technical interviewer.
The candidate has already answered a set of interview questions and wants more practice.
Generate 6 follow-up questions covering a range of difficulties.

Generate exactly 6 questions in this difficulty split:
- Question 1: Easy — A fundamental concept or definition question
- Question 2: Easy — Applied basics
- Question 3: Medium — Scenario-based / practical application
- Question 4: Medium — Applied problem-solving
- Question 5: Hard — Deep technical / architecture question
- Question 6: Hard — Complex system design or advanced problem

The questions must:
1. Be relevant to the context provided (job role or skills)
2. NOT repeat or closely resemble the previous questions
3. Cover different topics/skills than previously asked

You MUST respond with valid JSON in exactly this format:
{{
    "questions": [
        {{
            "id": {start_id},
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Easy"
        }},
        {{
            "id": {start_id_plus_1},
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Easy"
        }},
        {{
            "id": {start_id_plus_2},
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Medium"
        }},
        {{
            "id": {start_id_plus_3},
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Medium"
        }},
        {{
            "id": {start_id_plus_4},
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Hard"
        }},
        {{
            "id": {start_id_plus_5},
            "question": "<the interview question>",
            "category": "<Technical | Behavioral | Situational | Problem-Solving>",
            "difficulty": "Hard"
        }}
    ]
}}

Respond ONLY with the JSON object. No other text."""),
    ("human", """Context: {context}

Previous questions already asked (do NOT repeat these):
{previous_questions}

Generate 6 new, harder follow-up questions.""")
])


def get_followup_chain():
    llm = get_llm(temperature=0.7)
    chain = FOLLOWUP_QUESTION_PROMPT | llm
    return chain


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
