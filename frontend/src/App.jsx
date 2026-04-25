import { useState } from 'react';
import './index.css';
import ResumeUpload from './components/ResumeUpload';
import ResumeAnalysis from './components/ResumeAnalysis';
import AnswerEvaluation from './components/AnswerEvaluation';

const STEPS = [
  { id: 1, label: 'Upload Resume' },
  { id: 2, label: 'Interview' },
];

export default function App() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Resume state
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resumeText, setResumeText] = useState('');

  // Interview state
  const [questions, setQuestions] = useState(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result.analysis);
    setResumeText(result.resume_text);
  };

  const handleStartInterview = async () => {
    const skills = analysisResult?.skills_found || [];
    if (skills.length === 0) return;

    setGeneratingQuestions(true);

    try {
      const { generateSkillQuestions } = await import('./api');
      const resumeSummary = analysisResult?.summary || resumeText;
      const result = await generateSkillQuestions(skills, resumeSummary);
      setQuestions(result.questions);
      setStep(2);
    } catch (err) {
      alert(err.message || 'Failed to generate questions. Please try again.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const goToStep = (targetStep) => {
    if (targetStep === 1) setStep(1);
    if (targetStep === 2 && questions) setStep(2);
  };

  const handleStartOver = () => {
    setStep(1);
    setAnalysisResult(null);
    setResumeText('');
    setQuestions(null);
  };

  // Skills label for interview header
  const skillsLabel = analysisResult?.skills_found?.slice(0, 4).join(', ') +
    (analysisResult?.skills_found?.length > 4 ? ` +${analysisResult.skills_found.length - 4} more` : '');

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <span className="app-header__icon">🧠</span>
        <h1 className="app-header__title">Resume Analyser</h1>
        <p className="app-header__subtitle">
          Upload • Analyse • Prepare • Ace Your Interview
        </p>
      </header>

      {/* Stepper */}
      <nav className="stepper">
        {STEPS.map((s, index) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={`stepper__step ${
                step === s.id ? 'stepper__step--active' : ''
              } ${
                (s.id === 1 && analysisResult) ? 'stepper__step--completed' : ''
              }`}
              onClick={() => goToStep(s.id)}
              style={{ cursor: 'pointer' }}
            >
              <span className="stepper__number">
                {(s.id === 1 && analysisResult) ? '✓' : s.id}
              </span>
              {s.label}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`stepper__connector ${
                  (index === 0 && analysisResult) ? 'stepper__connector--completed' : ''
                }`}
              />
            )}
          </div>
        ))}
      </nav>

      {/* Step 1: Upload & Analysis */}
      {step === 1 && (
        <>
          <ResumeUpload
            onAnalysisComplete={handleAnalysisComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          {analysisResult && (
            <>
              <ResumeAnalysis
                analysis={analysisResult}
                resumeText={resumeText}
              />
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  className="btn btn--primary btn--lg"
                  onClick={handleStartInterview}
                  disabled={generatingQuestions || !analysisResult?.skills_found?.length}
                  id="start-interview-btn"
                >
                  {generatingQuestions ? (
                    <>
                      <span className="loader__spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                      Generating Questions from Your Skills...
                    </>
                  ) : (
                    <>🎤 Start Interview Prep →</>
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Step 2: Answer & Evaluate */}
      {step === 2 && (
        <>
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>
                  🎤 Interview based on your Resume
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Skills: {skillsLabel}
                </p>
              </div>
              <button
                className="btn btn--secondary"
                onClick={handleStartOver}
                id="start-over-btn"
              >
                🔄 Start Over
              </button>
            </div>
          </div>
          <AnswerEvaluation
            questions={questions}
            skills={analysisResult?.skills_found || []}
          />
        </>
      )}

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '3rem 0 1rem',
        color: 'var(--text-muted)',
        fontSize: 'var(--font-size-sm)',
      }}>
        Built with ❤️
      </footer>
    </div>
  );
}
