import { useState } from 'react';
import './index.css';
import ResumeUpload from './components/ResumeUpload';
import ResumeAnalysis from './components/ResumeAnalysis';
import InterviewPrep from './components/InterviewPrep';
import AnswerEvaluation from './components/AnswerEvaluation';

const STEPS = [
  { id: 1, label: 'Upload Resume' },
  { id: 2, label: 'Interview Prep' },
  { id: 3, label: 'Evaluation' },
];

export default function App() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Resume state
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resumeText, setResumeText] = useState('');

  // Interview state
  const [questions, setQuestions] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result.analysis);
    setResumeText(result.resume_text);
  };

  const handleQuestionsGenerated = (qs, role) => {
    setQuestions(qs);
    setSelectedRole(role);
    setStep(3);
  };

  const goToStep = (targetStep) => {
    // Only allow going to completed or current step
    if (targetStep === 1) setStep(1);
    if (targetStep === 2 && analysisResult) setStep(2);
    if (targetStep === 3 && questions) setStep(3);
  };

  const handleProceedToInterview = () => {
    setStep(2);
  };

  const handleStartOver = () => {
    setStep(1);
    setAnalysisResult(null);
    setResumeText('');
    setQuestions(null);
    setSelectedRole('');
  };

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
                (s.id === 1 && analysisResult) ||
                (s.id === 2 && questions)
                  ? 'stepper__step--completed'
                  : ''
              }`}
              onClick={() => goToStep(s.id)}
              style={{ cursor: 'pointer' }}
            >
              <span className="stepper__number">
                {((s.id === 1 && analysisResult) || (s.id === 2 && questions))
                  ? '✓'
                  : s.id}
              </span>
              {s.label}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`stepper__connector ${
                  (index === 0 && analysisResult) || (index === 1 && questions)
                    ? 'stepper__connector--completed'
                    : ''
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
                  onClick={handleProceedToInterview}
                  id="proceed-to-interview-btn"
                >
                  🎤 Proceed to Interview Prep →
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Step 2: Interview Prep */}
      {step === 2 && (
        <InterviewPrep
          resumeSummary={analysisResult?.summary || resumeText}
          onQuestionsGenerated={handleQuestionsGenerated}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          questions={questions}
        />
      )}

      {/* Step 3: Answer & Evaluate */}
      {step === 3 && (
        <>
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>
                  🎤 Interview: {selectedRole}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Answer each question and get AI-powered feedback
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
          <AnswerEvaluation questions={questions} />
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
