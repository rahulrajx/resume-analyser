export default function ResumeAnalysis({ analysis, resumeText }) {
  if (!analysis) return null;

  const {
    overall_score,
    summary,
    strengths = [],
    weaknesses = [],
    suggestions = [],
    skills_found = [],
    experience_level,
  } = analysis;

  const getScoreClass = (score) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  return (
    <div className="glass-card glass-card--accent" style={{ marginTop: '2rem' }}>
      <h2 className="section-title">🔍 Resume Analysis</h2>

      {/* Score Gauge */}
      <div className={`score-gauge score-gauge--${getScoreClass(overall_score)}`}>
        <div className="score-gauge__circle">
          <span className="score-gauge__value">{overall_score}</span>
          <span className="score-gauge__label">Score</span>
        </div>
      </div>

      {/* Experience Level */}
      {experience_level && (
        <div style={{ textAlign: 'center' }}>
          <span className="experience-badge">
            🎯 {experience_level}
          </span>
        </div>
      )}

      {/* Summary */}
      <div className="summary-box">{summary}</div>

      {/* Skills */}
      {skills_found.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            🛠️ Skills Identified
          </h3>
          <div className="skills-grid">
            {skills_found.map((skill, i) => (
              <span key={i} className="tag tag--skill">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Cards Grid */}
      <div className="analysis-grid">
        {/* Strengths */}
        <div className="analysis-card">
          <div className="analysis-card__header">
            <span className="analysis-card__icon">💪</span>
            Strengths
          </div>
          <ul className="analysis-card__list">
            {strengths.map((s, i) => (
              <li key={i} className="analysis-card__list-item">{s}</li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="analysis-card">
          <div className="analysis-card__header">
            <span className="analysis-card__icon">⚡</span>
            Areas to Improve
          </div>
          <ul className="analysis-card__list">
            {weaknesses.map((w, i) => (
              <li key={i} className="analysis-card__list-item">{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="analysis-card" style={{ marginTop: '1.5rem' }}>
          <div className="analysis-card__header">
            <span className="analysis-card__icon">💡</span>
            Actionable Suggestions
          </div>
          <ul className="analysis-card__list">
            {suggestions.map((s, i) => (
              <li key={i} className="analysis-card__list-item">{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
