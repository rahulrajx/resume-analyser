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

IMPORTANT: Generate DIFFERENT questions every time, even for the same skills.
Vary the angle, scenario, and phrasing. Never repeat the same question twice.

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
    ("human", "Session #{session_seed} — Generate fresh, unique questions.\n\nSelected Skills: {skills}\n\nCandidate Resume Summary: {resume_summary}")
])


def get_skill_question_chain():
    llm = get_llm(temperature=0.9)
    chain = SKILL_QUESTION_PROMPT | llm
    return chain



# ── Introduction Question Generation Chain ────────────────────────────────────

INTRODUCTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a friendly interviewer conducting the introduction round.
Generate exactly 4 unique introduction questions for a candidate with the given profile.

IMPORTANT: Generate DIFFERENT questions every time. Vary the wording, angle, and framing.
Do NOT repeat generic questions like "Tell me about yourself" — be creative and specific to the candidate's background.

Pick 4 topics from this list (vary your selection each time):
- Self introduction with a unique twist
- Motivation for their specific field/industry
- What excites them about technology/their domain
- Strengths and how they've applied them
- A weakness they've worked to overcome
- Career goals and aspirations
- What they'd bring to a new team
- Their most proud professional achievement

Difficulty: Conversational and easy. Make the candidate comfortable.

You MUST respond with valid JSON in exactly this format:
{{
    "questions": [
        {{"id": 1, "question": "<the question>", "category": "Introduction", "difficulty": "Easy"}},
        {{"id": 2, "question": "<the question>", "category": "Introduction", "difficulty": "Easy"}},
        {{"id": 3, "question": "<the question>", "category": "Introduction", "difficulty": "Easy"}},
        {{"id": 4, "question": "<the question>", "category": "Introduction", "difficulty": "Easy"}}
    ]
}}

Respond ONLY with the JSON object. No other text."""),
    ("human", "Session #{session_seed} — Generate fresh, unique questions.\nCandidate Resume Summary:\n{resume_summary}")
])


def get_introduction_chain():
    llm = get_llm(temperature=0.9)
    chain = INTRODUCTION_PROMPT | llm
    return chain


# ── Behavioral / STAR Question Generation Chain ──────────────────────────────

BEHAVIORAL_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a senior hiring manager conducting a behavioral interview.
Generate exactly 4 unique situational questions that require STAR-method answers
(Situation, Task, Action, Result).

IMPORTANT: Generate DIFFERENT questions every time. Vary scenarios, context, and phrasing.
Do NOT reuse the same generic situations — tailor them to the candidate's background.

Pick 4 topics from this list (vary your selection each time):
- Teamwork & collaboration on a difficult project
- Handling pressure, tight deadlines, or competing priorities
- Resolving conflict with a colleague or stakeholder
- A time they failed and what they learned
- Leading or mentoring others
- Adapting to unexpected changes or setbacks
- Going above and beyond expectations
- Making a tough decision with limited information
- Dealing with ambiguity or unclear requirements

Difficulty: Medium. These should require thoughtful, structured answers.

You MUST respond with valid JSON in exactly this format:
{{
    "questions": [
        {{"id": 1, "question": "<the question>", "category": "Behavioral", "difficulty": "Medium"}},
        {{"id": 2, "question": "<the question>", "category": "Behavioral", "difficulty": "Medium"}},
        {{"id": 3, "question": "<the question>", "category": "Behavioral", "difficulty": "Medium"}},
        {{"id": 4, "question": "<the question>", "category": "Behavioral", "difficulty": "Medium"}}
    ]
}}

Respond ONLY with the JSON object. No other text."""),
    ("human", "Session #{session_seed} — Generate fresh, unique questions.\nCandidate Resume Summary:\n{resume_summary}")
])


def get_behavioral_chain():
    llm = get_llm(temperature=0.9)
    chain = BEHAVIORAL_PROMPT | llm
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


# ── Model Answer Chain (Skip / I Don't Know) ──────────────────────────────────

MODEL_ANSWER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert interview coach.
Provide the ideal, comprehensive answer to this interview question.
Write it as if the candidate is speaking — first person, natural tone.
Keep it concise but thorough (3-5 sentences).

You MUST respond with valid JSON in exactly this format:
{{
    "model_answer": "<the ideal answer>"
}}

Respond ONLY with the JSON object. No other text."""),
    ("human", "Interview Question: {question}")
])


def get_model_answer_chain():
    llm = get_llm(temperature=0.3)
    chain = MODEL_ANSWER_PROMPT | llm
    return chain
