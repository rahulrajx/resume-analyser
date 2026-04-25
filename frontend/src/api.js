const API_BASE = "http://localhost:8000";

export async function analyzeResume(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/analyze-resume`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to analyze resume");
  }

  return response.json();
}

export async function generateSkillQuestions(skills, resumeSummary) {
  const response = await fetch(`${API_BASE}/api/generate-skill-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skills, resume_summary: resumeSummary }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate skill questions");
  }

  return response.json();
}

export async function generateFollowupQuestions(role, skills, previousQuestions, startId) {
  const response = await fetch(`${API_BASE}/api/generate-followup-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: role || null,
      skills: skills || null,
      previous_questions: previousQuestions,
      start_id: startId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate follow-up questions");
  }

  return response.json();
}

export async function evaluateAnswer(question, userAnswer) {
  const response = await fetch(`${API_BASE}/api/evaluate-answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, user_answer: userAnswer }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to evaluate answer");
  }

  return response.json();
}

