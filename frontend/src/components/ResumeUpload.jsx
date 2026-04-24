import { useState, useRef } from 'react';

export default function ResumeUpload({ onAnalysisComplete, isLoading, setIsLoading }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setError('');

    try {
      const { analyzeResume } = await import('../api');
      const result = await analyzeResume(file);
      onAnalysisComplete(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <h2 className="section-title">📄 Upload Your Resume</h2>
      <p className="section-subtitle">
        Upload your resume in PDF format and our AI will analyze it for you.
      </p>

      <div
        className={`upload-zone ${dragOver ? 'upload-zone--dragover' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        id="resume-upload-zone"
      >
        <span className="upload-zone__icon">
          {file ? '✅' : '☁️'}
        </span>
        <p className="upload-zone__text">
          {file ? file.name : 'Drop your PDF resume here'}
        </p>
        <p className="upload-zone__hint">
          {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or click to browse • PDF only • Max 10MB'}
        </p>
        {file && (
          <div className="upload-zone__file-info">
            📎 {file.name}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
          id="resume-file-input"
        />
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button
          className="btn btn--primary btn--lg"
          disabled={!file || isLoading}
          onClick={handleUpload}
          id="analyze-resume-btn"
        >
          {isLoading ? (
            <>
              <span className="loader__spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              Analyzing...
            </>
          ) : (
            <>🚀 Analyze Resume</>
          )}
        </button>
      </div>
    </div>
  );
}
