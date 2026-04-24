import { useState } from 'react';

const JOB_ROLES = [
  { label: 'Frontend Developer', icon: '🎨' },
  { label: 'Backend Developer', icon: '⚙️' },
  { label: 'Full Stack Developer', icon: '🔄' },
  { label: 'Data Scientist', icon: '📊' },
  { label: 'DevOps Engineer', icon: '🚀' },
  { label: 'Machine Learning Engineer', icon: '🤖' },
  { label: 'Product Manager', icon: '📋' },
  { label: 'UI/UX Designer', icon: '✨' },
  { label: 'Mobile Developer', icon: '📱' },
  { label: 'Cloud Architect', icon: '☁️' },
  { label: 'Cybersecurity Analyst', icon: '🔒' },
  { label: 'QA Engineer', icon: '🧪' },
];

export default function InterviewPrep({
  resumeSummary,
  onQuestionsGenerated,
  isLoading,
  setIsLoading,
  questions,
}) {
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');

  const handleGenerateQuestions = async () => {
    if (!selectedRole) {
      setError('Please select a job role.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { generateQuestions } = await import('../api');
      const result = await generateQuestions(selectedRole, resumeSummary);
      onQuestionsGenerated(result.questions, selectedRole);
    } catch (err) {
      setError(err.message || 'Failed to generate questions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <h2 className="section-title">🎯 Interview Preparation</h2>
      <p className="section-subtitle">
        Select your target job role and we'll generate tailored interview questions based on your resume.
      </p>

      <div className="role-selector">
        {JOB_ROLES.map((role) => (
          <button
            key={role.label}
            className={`role-option ${selectedRole === role.label ? 'role-option--selected' : ''}`}
            onClick={() => {
              setSelectedRole(role.label);
              setError('');
            }}
            id={`role-${role.label.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <span className="role-option__icon">{role.icon}</span>
            {role.label}
          </button>
        ))}
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {!questions && (
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn btn--primary btn--lg"
            disabled={!selectedRole || isLoading}
            onClick={handleGenerateQuestions}
            id="generate-questions-btn"
          >
            {isLoading ? (
              <>
                <span
                  className="loader__spinner"
                  style={{ width: 20, height: 20, borderWidth: 2 }}
                />
                Generating Questions...
              </>
            ) : (
              <>🎤 Generate Interview Questions</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
