import { useMemo } from 'react';

export default function ReportCard({ roundScores, onRetake }) {
  const rounds = useMemo(() => {
    const entries = [
      { key: 'introduction', icon: '👋', label: 'Introduction', weight: 0.2 },
      { key: 'technical', icon: '💻', label: 'Technical', weight: 0.5 },
      { key: 'behavioral', icon: '🤝', label: 'Behavioral', weight: 0.3 },
    ];

    return entries.map((r) => {
      const scores = roundScores[r.key] || [];
      const total = scores.length;
      const skippedCount = scores.filter((s) => s.skipped).length;
      const avgScore = total > 0
        ? scores.reduce((sum, s) => sum + (s.score || 0), 0) / total
        : 0;

      return { ...r, scores, total, skippedCount, avgScore };
    });
  }, [roundScores]);

  const overallScore = useMemo(() => {
    let weightedSum = 0;
    let totalWeight = 0;

    rounds.forEach((r) => {
      if (r.total > 0) {
        weightedSum += r.avgScore * r.weight;
        totalWeight += r.weight;
      }
    });

    return totalWeight > 0 ? (weightedSum / totalWeight) * 10 : 0;
  }, [rounds]);

  const verdict = useMemo(() => {
    if (overallScore >= 80) return { text: 'Strong Candidate', class: 'verdict--strong', emoji: '🏆' };
    if (overallScore >= 60) return { text: 'Moderate Candidate', class: 'verdict--moderate', emoji: '📊' };
    return { text: 'Needs Improvement', class: 'verdict--weak', emoji: '📝' };
  }, [overallScore]);

  // Aggregate strengths and improvements from feedback
  const insights = useMemo(() => {
    const strengths = [];
    const improvements = [];

    rounds.forEach((r) => {
      r.scores.forEach((s) => {
        if (s.skipped) return;
        if (s.score >= 7) {
          strengths.push(`Strong performance on: "${s.question.substring(0, 60)}..." (${s.score}/10)`);
        } else if (s.score <= 4) {
          improvements.push(`Review: "${s.question.substring(0, 60)}..." (${s.score}/10)`);
        }
      });
    });

    return {
      strengths: strengths.slice(0, 4),
      improvements: improvements.slice(0, 4),
    };
  }, [rounds]);

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="report-card" id="report-card">
      {/* Header */}
      <div className="report-card__header">
        <span className="report-card__trophy">{verdict.emoji}</span>
        <h2 className="report-card__title">Interview Report Card</h2>
      </div>

      {/* Round Scores */}
      <div className="report-card__rounds">
        {rounds.map((r) => {
          const percentage = (r.avgScore / 10) * 100;
          const scoreClass = r.avgScore >= 7 ? 'high' : r.avgScore >= 4 ? 'medium' : 'low';

          return (
            <div key={r.key} className="report-card__round">
              <div className="report-card__round-header">
                <span className="report-card__round-icon">{r.icon}</span>
                <span className="report-card__round-label">{r.label}</span>
                <span className={`report-card__round-score report-card__round-score--${scoreClass}`}>
                  {r.avgScore.toFixed(1)} / 10
                </span>
              </div>
              <div className="report-card__bar-track">
                <div
                  className={`report-card__bar-fill report-card__bar-fill--${scoreClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="report-card__round-meta">
                <span>{r.total} questions</span>
                {r.skippedCount > 0 && (
                  <span className="report-card__skipped">{r.skippedCount} skipped</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Score */}
      <div className="report-card__overall">
        <div className="report-card__overall-score">
          <span className="report-card__percentage">{Math.round(overallScore)}%</span>
          <span className="report-card__percentage-label">Overall Score</span>
        </div>
        <div className={`report-card__verdict ${verdict.class}`}>
          {verdict.text}
        </div>
      </div>

      {/* Strengths */}
      {insights.strengths.length > 0 && (
        <div className="report-card__section">
          <h3 className="report-card__section-title">✅ Strengths</h3>
          <ul className="report-card__list">
            {insights.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {insights.improvements.length > 0 && (
        <div className="report-card__section">
          <h3 className="report-card__section-title">⚠️ Areas to Improve</h3>
          <ul className="report-card__list">
            {insights.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="report-card__actions">
        <button className="btn btn--primary btn--lg" onClick={onRetake} id="retake-btn">
          🔄 Retake Interview
        </button>
        <button className="btn btn--secondary btn--lg" onClick={handleDownload} id="download-btn">
          📥 Download as PDF
        </button>
      </div>
    </div>
  );
}
