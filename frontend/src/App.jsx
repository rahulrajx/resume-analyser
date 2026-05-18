import { useState, useEffect } from 'react';
import './index.css';
import ResumeUpload from './components/ResumeUpload';
import ResumeAnalysis from './components/ResumeAnalysis';
import AnswerEvaluation from './components/AnswerEvaluation';
import ReportCard from './components/ReportCard';

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Introduction' },
  { id: 3, label: 'Technical' },
  { id: 4, label: 'Behavioral' },
  { id: 5, label: 'Report Card' },
];

const TIME_PER_ROUND = {
  introduction: 600,   // 10 minutes
  technical: 1500,     // 25 minutes
  behavioral: 900,     // 15 minutes
};

export default function App() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Resume state
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resumeText, setResumeText] = useState('');

  // Round state
  const [introQuestions, setIntroQuestions] = useState(null);
  const [techQuestions, setTechQuestions] = useState(null);
  const [behavioralQuestions, setBehavioralQuestions] = useState(null);
  const [generatingRound, setGeneratingRound] = useState(null);

  // Scores
  const [roundScores, setRoundScores] = useState({
    introduction: [],
    technical: [],
    behavioral: [],
  });

  // Round completion tracking
  const [completedRounds, setCompletedRounds] = useState({
    introduction: false,
    technical: false,
    behavioral: false,
  });

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result.analysis);
    setResumeText(result.resume_text);
  };

  const getResumeSummary = () => {
    return analysisResult?.summary || resumeText;
  };

  // Generate questions for a specific round
  const generateRoundQuestions = async (round) => {
    setGeneratingRound(round);
    const resumeSummary = getResumeSummary();

    try {
      if (round === 'introduction') {
        const { generateIntroductionQuestions } = await import('./api');
        const result = await generateIntroductionQuestions(resumeSummary);
        setIntroQuestions(result.questions);
        setStep(2);
      } else if (round === 'technical') {
        const { generateSkillQuestions } = await import('./api');
        const skills = analysisResult?.skills_found || [];
        const result = await generateSkillQuestions(skills, resumeSummary);
        setTechQuestions(result.questions);
        setStep(3);
      } else if (round === 'behavioral') {
        const { generateBehavioralQuestions } = await import('./api');
        const result = await generateBehavioralQuestions(resumeSummary);
        setBehavioralQuestions(result.questions);
        setStep(4);
      }
    } catch (err) {
      alert(err.message || `Failed to generate ${round} questions.`);
    } finally {
      setGeneratingRound(null);
    }
  };

  // Start the interview (Introduction round)
  const handleStartInterview = () => {
    generateRoundQuestions('introduction');
  };

  // Handle round completion
  const handleRoundComplete = (round) => (scores) => {
    setRoundScores((prev) => ({ ...prev, [round]: scores }));
    setCompletedRounds((prev) => ({ ...prev, [round]: true }));
  };

  // Move to next round
  const handleNextRound = (nextRound) => {
    generateRoundQuestions(nextRound);
  };

  // Show report card
  const handleShowReport = () => {
    setStep(5);
  };

  // Retake everything
  const handleRetake = () => {
    setStep(1);
    setAnalysisResult(null);
    setResumeText('');
    setIntroQuestions(null);
    setTechQuestions(null);
    setBehavioralQuestions(null);
    setRoundScores({ introduction: [], technical: [], behavioral: [] });
    setCompletedRounds({ introduction: false, technical: false, behavioral: false });
  };

  const goToStep = (targetStep) => {
    if (targetStep === 1) setStep(1);
    if (targetStep === 2 && introQuestions) setStep(2);
    if (targetStep === 3 && techQuestions) setStep(3);
    if (targetStep === 4 && behavioralQuestions) setStep(4);
    if (targetStep === 5 && completedRounds.behavioral) setStep(5);
  };

  const skillsLabel = analysisResult?.skills_found?.slice(0, 4).join(', ') +
    (analysisResult?.skills_found?.length > 4 ? ` +${analysisResult.skills_found.length - 4} more` : '');

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-header__title">PrepSense</h1>
        <p className="app-header__subtitle">AI-Powered Interview Simulator</p>
      </header>

      {/* Hero Section — only on landing page */}
      {step === 1 && !analysisResult && (
        <div className="hero">
          <h2 className="hero__headline">Practice Smarter, Interview Better</h2>
          <p className="hero__tagline">
            Upload your resume. Practice 3 interview rounds. Get instant feedback and a score.
          </p>
          <div className="hero__features">
            <span className="hero__feature">AI-Powered Analysis</span>
            <span className="hero__feature">3 Interview Rounds</span>
            <span className="hero__feature">Instant Feedback</span>
            <span className="hero__feature">Voice Mode</span>
          </div>
        </div>
      )}

      {/* Stepper */}
      <nav className="stepper">
        {STEPS.map((s, index) => {
          const isCompleted =
            (s.id === 1 && analysisResult) ||
            (s.id === 2 && completedRounds.introduction) ||
            (s.id === 3 && completedRounds.technical) ||
            (s.id === 4 && completedRounds.behavioral);

          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                className={`stepper__step ${
                  step === s.id ? 'stepper__step--active' : ''
                } ${isCompleted ? 'stepper__step--completed' : ''}`}
                onClick={() => goToStep(s.id)}
                style={{ cursor: 'pointer' }}
              >
                <span className="stepper__number">
                  {isCompleted ? '✓' : s.id}
                </span>
                {s.label}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`stepper__connector ${
                    isCompleted ? 'stepper__connector--completed' : ''
                  }`}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Step 1: Upload & Analysis */}
      {step === 1 && (
        <>
          {/* Start Interview — prominent position BEFORE analysis details */}
          {analysisResult && (
            <div className="start-interview-banner">
              <div className="start-interview-banner__info">
                <span className="start-interview-banner__score">
                  Resume Score: <strong>{analysisResult.overall_score}/100</strong>
                </span>
                <span className="start-interview-banner__level">
                  {analysisResult.experience_level}
                </span>
              </div>
              <button
                className="btn btn--primary btn--lg"
                onClick={handleStartInterview}
                disabled={generatingRound || !analysisResult?.skills_found?.length}
                id="start-interview-btn"
              >
                {generatingRound ? (
                  <>
                    <span className="loader__spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    Preparing Interview...
                  </>
                ) : (
                  <>Start Mock Interview →</>
                )}
              </button>
            </div>
          )}

          <ResumeUpload
            onAnalysisComplete={handleAnalysisComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          {analysisResult && (
            <ResumeAnalysis
              analysis={analysisResult}
              resumeText={resumeText}
            />
          )}
        </>
      )}

      {/* Step 2: Introduction Round */}
      {step === 2 && (
        <>
          <div className="glass-card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Round 1 of 3 — Let's get to know you
                </p>
              </div>
              <button className="btn btn--secondary" onClick={handleRetake} id="start-over-btn">
                Start Over
              </button>
            </div>
          </div>
          <AnswerEvaluation
            questions={introQuestions}
            roundType="introduction"
            roundTime={TIME_PER_ROUND.introduction}
            onRoundComplete={handleRoundComplete('introduction')}
          />
          {completedRounds.introduction && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                className="btn btn--primary btn--lg"
                onClick={() => handleNextRound('technical')}
                disabled={generatingRound}
                id="next-round-btn"
              >
                {generatingRound === 'technical' ? (
                  <>
                    <span className="loader__spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    Preparing Technical Round...
                  </>
                ) : (
                  <>Next: Technical Round →</>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Step 3: Technical Round */}
      {step === 3 && (
        <>
          <div className="glass-card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Round 2 of 3 — Skills: {skillsLabel}
                </p>
              </div>
              <button className="btn btn--secondary" onClick={handleRetake} id="start-over-btn">
                Start Over
              </button>
            </div>
          </div>
          <AnswerEvaluation
            questions={techQuestions}
            skills={analysisResult?.skills_found || []}
            roundType="technical"
            roundTime={TIME_PER_ROUND.technical}
            onRoundComplete={handleRoundComplete('technical')}
          />
          {completedRounds.technical && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                className="btn btn--primary btn--lg"
                onClick={() => handleNextRound('behavioral')}
                disabled={generatingRound}
                id="next-round-btn"
              >
                {generatingRound === 'behavioral' ? (
                  <>
                    <span className="loader__spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    Preparing Behavioral Round...
                  </>
                ) : (
                  <>Next: Behavioral Round →</>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Step 4: Behavioral Round */}
      {step === 4 && (
        <>
          <div className="glass-card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Round 3 of 3 — Share your experiences using STAR method
                </p>
              </div>
              <button className="btn btn--secondary" onClick={handleRetake} id="start-over-btn">
                Start Over
              </button>
            </div>
          </div>
          <AnswerEvaluation
            questions={behavioralQuestions}
            roundType="behavioral"
            roundTime={TIME_PER_ROUND.behavioral}
            onRoundComplete={handleRoundComplete('behavioral')}
          />
          {completedRounds.behavioral && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                className="btn btn--primary btn--lg"
                onClick={handleShowReport}
                id="show-report-btn"
              >
                View Report Card →
              </button>
            </div>
          )}
        </>
      )}

      {/* Step 5: Report Card */}
      {step === 5 && (
        <ReportCard
          roundScores={roundScores}
          onRetake={handleRetake}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        © 2025 PrepSense | Built by Rahul Raj
      </footer>
    </div>
  );
}
