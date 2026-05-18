import { useState, useRef, useCallback, useEffect } from 'react';

export default function AnswerEvaluation({
  questions: initialQuestions,
  skills,
  roundType = 'technical',
  roundTime = 600,
  onRoundComplete,
}) {
  const [allQuestions, setAllQuestions] = useState(initialQuestions || []);
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [errors, setErrors] = useState({});

  // Voice mode state
  const [mode, setMode] = useState('text'); // 'text' | 'voice'
  const [recordingId, setRecordingId] = useState(null);
  const [transcribingId, setTranscribingId] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Round Timer state (single timer for the whole round)
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(roundTime);
  const timerExpiredRef = useRef(false);

  // Skip / IDK state
  const [skipped, setSkipped] = useState({}); // { questionId: true }
  const [modelAnswers, setModelAnswers] = useState({}); // { questionId: "..." }
  const [skipLoadingId, setSkipLoadingId] = useState(null);

  // Reset state when questions change (round change)
  useEffect(() => {
    setAllQuestions(initialQuestions || []);
    setAnswers({});
    setEvaluations({});
    setErrors({});
    setSkipped({});
    setModelAnswers({});
    setTimeLeft(roundTime);
    timerExpiredRef.current = false;
  }, [initialQuestions, roundTime]);

  // Round timer tick
  useEffect(() => {
    if (!timerEnabled || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEnabled, timeLeft]);

  // Auto-skip all unanswered when round timer hits 0
  useEffect(() => {
    if (timeLeft !== 0 || timerExpiredRef.current) return;
    timerExpiredRef.current = true;

    allQuestions.forEach(q => {
      if (!evaluations[q.id] && !skipped[q.id]) {
        if (answers[q.id]?.trim()) {
          handleEvaluate(q);
        } else {
          handleSkip(q);
        }
      }
    });
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerClass = (seconds) => {
    if (seconds <= 10) return 'timer--danger';
    if (seconds <= 30) return 'timer--warning';
    return 'timer--normal';
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // ── Voice Recording ──────────────────────────────────────────────────────

  const startRecording = useCallback(async (questionId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
        },
      });

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      const mimeType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });

        if (audioBlob.size === 0) {
          setErrors((prev) => ({ ...prev, [questionId]: 'Recording was empty. Please try again.' }));
          setRecordingId(null);
          return;
        }

        setTranscribingId(questionId);
        try {
          const { transcribeAudio } = await import('../api');
          const result = await transcribeAudio(audioBlob);
          if (result.text) {
            setAnswers((prev) => ({ ...prev, [questionId]: result.text }));
          } else {
            setErrors((prev) => ({
              ...prev,
              [questionId]: result.message || 'No speech detected. Try again.',
            }));
          }
        } catch (err) {
          setErrors((prev) => ({
            ...prev,
            [questionId]: err.message || 'Failed to transcribe audio.',
          }));
        } finally {
          setTranscribingId(null);
        }
      };

      mediaRecorder.start(1000);
      setRecordingId(questionId);
      setErrors((prev) => ({ ...prev, [questionId]: '' }));
    } catch (err) {
      console.error('Microphone access error:', err);
      setErrors((prev) => ({
        ...prev,
        [questionId]: 'Microphone access denied. Please allow microphone permissions.',
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecordingId(null);
  }, []);

  // ── Evaluate ─────────────────────────────────────────────────────────────

  const handleEvaluate = async (question) => {
    const answer = answers[question.id]?.trim();
    if (!answer) {
      setErrors((prev) => ({ ...prev, [question.id]: 'Please write or record your answer first.' }));
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

  // ── Skip / I Don't Know ──────────────────────────────────────────────────

  const handleSkip = async (question) => {
    setSkipLoadingId(question.id);
    setErrors((prev) => ({ ...prev, [question.id]: '' }));

    try {
      const { getModelAnswer } = await import('../api');
      const result = await getModelAnswer(question.question);
      setModelAnswers((prev) => ({ ...prev, [question.id]: result.model_answer }));
      setSkipped((prev) => ({ ...prev, [question.id]: true }));
      // Record as score 0 in evaluations for report card
      setEvaluations((prev) => ({
        ...prev,
        [question.id]: { score: 0, feedback: 'Skipped', skipped: true },
      }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [question.id]: err.message || 'Failed to get model answer.',
      }));
    } finally {
      setSkipLoadingId(null);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  };

  // Session stats
  const evaluatedCount = Object.keys(evaluations).length;
  const totalQuestions = allQuestions.length;
  const allEvaluated = evaluatedCount === totalQuestions && totalQuestions > 0;
  const avgScore =
    evaluatedCount > 0
      ? (
          Object.values(evaluations).reduce((sum, e) => sum + (e.score || 0), 0) /
          evaluatedCount
        ).toFixed(1)
      : 0;

  // Notify parent when round is complete
  useEffect(() => {
    if (allEvaluated && onRoundComplete) {
      const scores = allQuestions.map((q) => ({
        questionId: q.id,
        question: q.question,
        score: evaluations[q.id]?.score || 0,
        skipped: !!skipped[q.id],
        feedback: evaluations[q.id]?.feedback || '',
      }));
      onRoundComplete(scores);
    }
  }, [allEvaluated]);


  if (!allQuestions || allQuestions.length === 0) return null;

  const roundLabels = {
    introduction: { icon: '👋', title: 'Introduction Round', subtitle: 'Introduce yourself and share your motivations.' },
    technical: { icon: '💻', title: 'Technical Round', subtitle: 'Demonstrate your technical knowledge and problem-solving skills.' },
    behavioral: { icon: '🤝', title: 'Behavioral Round', subtitle: 'Share real experiences using the STAR method (Situation, Task, Action, Result).' },
  };

  const roundInfo = roundLabels[roundType] || roundLabels.technical;

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Round Header */}
      <div className="round-header">
        <span className="round-header__icon">{roundInfo.icon}</span>
        <div style={{ flex: 1 }}>
          <h2 className="round-header__title">{roundInfo.title}</h2>
          <p className="round-header__subtitle">{roundInfo.subtitle}</p>
        </div>
        {timerEnabled && !allEvaluated && (
          <div className={`round-timer ${getTimerClass(timeLeft)}`}>
            <span className="round-timer__icon">⏱</span>
            <span className="round-timer__time">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Mode Toggle + Timer Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="mode-toggle" id="mode-toggle">
          <button
            className={`mode-toggle__btn ${mode === 'text' ? 'mode-toggle__btn--active' : ''}`}
            onClick={() => setMode('text')}
            id="mode-text-btn"
          >
            <span className="mode-toggle__icon">📝</span>
            Text
          </button>
          <button
            className={`mode-toggle__btn ${mode === 'voice' ? 'mode-toggle__btn--active' : ''}`}
            onClick={() => setMode('voice')}
            id="mode-voice-btn"
          >
            <span className="mode-toggle__icon">🎤</span>
            Voice
          </button>
        </div>

        <label className="timer-toggle" id="timer-toggle">
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={(e) => setTimerEnabled(e.target.checked)}
          />
          <span className="timer-toggle__label">⏱️ Timer</span>
        </label>
      </div>

      {/* Session Score Summary */}
      {evaluatedCount > 0 && (
        <div className="session-score">
          <div className="session-score__stat">
            <span className="session-score__value">{evaluatedCount}/{totalQuestions}</span>
            <span className="session-score__label">Answered</span>
          </div>
          <div className="session-score__divider" />
          <div className="session-score__stat">
            <span className={`session-score__value session-score__value--${getScoreClass(parseFloat(avgScore))}`}>
              {avgScore}
            </span>
            <span className="session-score__label">Avg Score</span>
          </div>
          <div className="session-score__divider" />
          <div className="session-score__stat">
            <span className="session-score__value">{totalQuestions}</span>
            <span className="session-score__label">Total Qs</span>
          </div>
        </div>
      )}

      {allQuestions.map((q) => {
        const isDone = !!evaluations[q.id] || !!skipped[q.id];

        return (
          <div key={q.id} className={`question-card ${isDone ? 'question-card--done' : ''}`}>
            {/* Header */}
            <div className="question-card__header">
              <span className="question-card__number">
                Question {q.id}
                {skipped[q.id] && <span className="skipped-badge">Skipped</span>}
              </span>
              <div className="question-card__tags">
                <span className="tag tag--category">{q.category}</span>
                <span className={`tag tag--difficulty-${q.difficulty.toLowerCase().replace(/\s+/g, '-')}`}>
                  {q.difficulty}
                </span>
              </div>
            </div>

            {/* Question */}
            <p className="question-card__text">{q.question}</p>

            {/* ── Text Mode ── */}
            {!isDone && mode === 'text' && (
              <textarea
                className="textarea"
                placeholder="Type your answer here..."
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                disabled={loadingId === q.id}
                id={`answer-${q.id}`}
              />
            )}

            {/* ── Voice Mode ── */}
            {!isDone && mode === 'voice' && (
              <div className="voice-recorder" id={`voice-recorder-${q.id}`}>
                <div className="voice-recorder__controls">
                  {recordingId === q.id ? (
                    <button
                      className="voice-recorder__btn voice-recorder__btn--stop"
                      onClick={stopRecording}
                      id={`stop-recording-${q.id}`}
                    >
                      <span className="voice-recorder__pulse" />
                      <span>⏹ Stop Recording</span>
                    </button>
                  ) : (
                    <button
                      className="voice-recorder__btn voice-recorder__btn--start"
                      onClick={() => startRecording(q.id)}
                      disabled={transcribingId === q.id || loadingId === q.id}
                      id={`start-recording-${q.id}`}
                    >
                      🎤 {answers[q.id] ? 'Re-record' : 'Start Recording'}
                    </button>
                  )}
                </div>

                {transcribingId === q.id && (
                  <div className="voice-recorder__transcribing">
                    <span
                      className="loader__spinner"
                      style={{ width: 18, height: 18, borderWidth: 2 }}
                    />
                    <span>Transcribing your answer...</span>
                  </div>
                )}

                {answers[q.id] && transcribingId !== q.id && (
                  <div className="transcription-preview" id={`transcription-${q.id}`}>
                    <div className="transcription-preview__label">📝 Transcribed Answer</div>
                    <p className="transcription-preview__text">{answers[q.id]}</p>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {errors[q.id] && (
              <div className="error-message">⚠️ {errors[q.id]}</div>
            )}

            {/* Action Buttons */}
            {!isDone && (
              <div className="question-card__actions">
                <button
                  className="btn btn--success"
                  disabled={loadingId === q.id || !answers[q.id]?.trim() || skipLoadingId === q.id}
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

                <button
                  className="btn btn--ghost"
                  disabled={skipLoadingId === q.id || loadingId === q.id}
                  onClick={() => handleSkip(q)}
                  id={`skip-btn-${q.id}`}
                >
                  {skipLoadingId === q.id ? (
                    <>
                      <span
                        className="loader__spinner"
                        style={{ width: 18, height: 18, borderWidth: 2 }}
                      />
                      Loading...
                    </>
                  ) : (
                    <>🤷 I Don't Know</>
                  )}
                </button>
              </div>
            )}

            {/* Skipped — Model Answer */}
            {skipped[q.id] && modelAnswers[q.id] && (
              <div className="model-answer-card">
                <div className="model-answer-card__header">💡 Ideal Answer</div>
                <p className="model-answer-card__text">{modelAnswers[q.id]}</p>
              </div>
            )}

            {/* Evaluation Result (not skipped) */}
            {evaluations[q.id] && !skipped[q.id] && (
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
        );
      })}

      {/* Round Complete Message */}
      {allEvaluated && (
        <div className="round-complete">
          <div className="round-complete__message">
            🎉 Round Complete! Average Score: <strong>{avgScore}/10</strong>
          </div>
        </div>
      )}

    </div>
  );
}
