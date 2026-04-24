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

export async function generateQuestions(role, resumeSummary) {
  const response = await fetch(`${API_BASE}/api/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, resume_summary: resumeSummary }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate questions");
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
