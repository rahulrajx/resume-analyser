import { useState } from 'react';

export default function AnswerEvaluation({ questions }) {
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [errors, setErrors] = useState({});

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleEvaluate = async (question) => {
    const answer = answers[question.id]?.trim();
    if (!answer) {
      setErrors((prev) => ({ ...prev, [question.id]: 'Please write your answer first.' }));
      return;
    }

    setLoadingId(question.id);
    setErrors((prev) => ({ ...prev, [question.id]: '' }));

    try {
      const { evaluateAnswer } = await import('../api');
      const result = await evaluateAnswer(question.question, answer);
      setEvaluations((prev) => ({ ...prev, [question.id]: result }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [question.id]: err.message || 'Failed to evaluate answer.',
      }));
    } finally {
      setLoadingId(null);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  };

  if (!questions || questions.length === 0) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>📝 Answer & Get Evaluated</h2>
      <p className="section-subtitle">
        Write your answers below and get AI-powered feedback with a score and a model answer.
      </p>

      {questions.map((q) => (
        <div key={q.id} className="question-card">
          {/* Header */}
          <div className="question-card__header">
            <span className="question-card__number">Question {q.id}</span>
            <div className="question-card__tags">
              <span className="tag tag--category">{q.category}</span>
              <span className={`tag tag--difficulty-${q.difficulty.toLowerCase()}`}>
                {q.difficulty}
              </span>
            </div>
          </div>

          {/* Question */}
          <p className="question-card__text">{q.question}</p>

          {/* Answer Textarea */}
          <textarea
            className="textarea"
            placeholder="Type your answer here..."
            value={answers[q.id] || ''}
            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            disabled={loadingId === q.id}
            id={`answer-${q.id}`}
          />

          {/* Error */}
          {errors[q.id] && (
            <div className="error-message">⚠️ {errors[q.id]}</div>
          )}

          {/* Evaluate Button */}
          {!evaluations[q.id] && (
            <div style={{ marginTop: '1rem' }}>
              <button
                className="btn btn--success"
                disabled={loadingId === q.id || !answers[q.id]?.trim()}
                onClick={() => handleEvaluate(q)}
                id={`evaluate-btn-${q.id}`}
              >
                {loadingId === q.id ? (
                  <>
                    <span
                      className="loader__spinner"
                      style={{ width: 18, height: 18, borderWidth: 2 }}
                    />
                    Evaluating...
                  </>
                ) : (
                  <>✅ Evaluate My Answer</>
                )}
              </button>
            </div>
          )}

          {/* Evaluation Result */}
          {evaluations[q.id] && (
            <div className="evaluation-result">
              <div className="evaluation-result__row">
                <div className="evaluation-result__score-col">
                  <div className={`score-gauge score-gauge--${getScoreClass(evaluations[q.id].score)}`}
                    style={{ width: 90, height: 90, marginBottom: 0 }}>
                    <div className="score-gauge__circle" style={{ borderWidth: 3 }}>
                      <span className="score-gauge__value" style={{ fontSize: '1.75rem' }}>
                        {evaluations[q.id].score}
                      </span>
                      <span className="score-gauge__label" style={{ fontSize: '0.65rem' }}>
                        / 10
                      </span>
                    </div>
                  </div>
                </div>
                <div className="evaluation-result__feedback-col">
                  <div className="evaluation-result__label">Feedback</div>
                  <p className="evaluation-result__text">{evaluations[q.id].feedback}</p>
                </div>
              </div>

              <div className="evaluation-result__better">
                <div className="evaluation-result__label">💡 Model Answer</div>
                <p className="evaluation-result__text">{evaluations[q.id].better_answer}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
