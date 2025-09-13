import React, { useState, useRef } from 'react';
import { Spinner, UploadIcon } from './icons';
import type { ApplicationLog } from '../types';

interface JobInputFormProps {
  onAnalyze: (jobDescription: string, jobUrl: string, applicationQuestions: string, pdfResumeFile: File, latexResumeText: string) => void;
  isLoading: boolean;
  applicationLog: ApplicationLog[];
}

export const JobInputForm: React.FC<JobInputFormProps> = ({ onAnalyze, isLoading, applicationLog }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [applicationQuestions, setApplicationQuestions] = useState('');
  const [pdfResumeFile, setPdfResumeFile] = useState<File | null>(null);
  const [latexResumeText, setLatexResumeText] = useState('');
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const pdfResumeFileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setJobUrl(url);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setDuplicateWarning(null);
      return;
    }

    const existingLog = applicationLog.find(log => log.job.url && log.job.url === trimmedUrl);
    if (existingLog) {
      setDuplicateWarning(`You've already logged an application for this job on ${existingLog.appliedDate}.`);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handlePdfResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
       if (file.size > 2 * 1024 * 1024) { // 2MB limit
          setError('PDF Resume file is too large. Please upload a file under 2MB.');
          setPdfResumeFile(null);
          return;
       }
      setPdfResumeFile(file);
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateWarning) return;
    setError('');

    if (!jobDescription.trim()) {
      setError('Please paste the job description.');
      return;
    }
    if (!pdfResumeFile) {
        setError('Please upload your PDF resume to continue.');
        return;
    }
    onAnalyze(jobDescription, jobUrl, applicationQuestions, pdfResumeFile, latexResumeText);
  };

  const isFormDisabled = !!duplicateWarning;

  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-medium p-8 rounded-lg shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">AI Application Copilot</h2>
      <p className="text-center text-gray-light mb-8">Provide the job details and your materials. The AI will curate your resume and generate tailored content.</p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <fieldset className="space-y-6">
            <legend className="text-xl font-semibold text-white w-full pb-3 border-b border-gray-600">Job Details</legend>
            
            <div>
                <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-300 mb-2">Job Post URL (Optional)</label>
                <p className="text-xs text-gray-400 mb-2">Providing a URL enables duplicate application tracking.</p>
                <input
                    type="url"
                    id="jobUrl"
                    value={jobUrl}
                    onChange={handleUrlChange}
                    placeholder="https://example.com/careers/job-123"
                    className="w-full bg-gray-dark border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                />
                {duplicateWarning && (
                    <div className="mt-2 text-sm text-yellow-200 bg-yellow-900/50 border border-yellow-700 p-3 rounded-md">
                        <p className="font-semibold">Duplicate Application Found</p>
                        <p>{duplicateWarning}</p>
                    </div>
                )}
            </div>

            <div>
              <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-300 mb-2">Paste Job Description (Required)</label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the full job description from the company's career page or job board..."
                rows={8}
                className="w-full bg-gray-dark border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary disabled:bg-gray-700 disabled:cursor-not-allowed"
                required
                disabled={isFormDisabled}
              />
            </div>
        </fieldset>

        <fieldset className="space-y-6">
            <legend className="text-xl font-semibold text-white w-full pb-3 border-b border-gray-600">Your Materials</legend>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Upload PDF Resume (Required)</label>
               <p className="text-xs text-gray-400 mb-2">Used for analysis and generating cover letters.</p>
              <div 
                onClick={() => !isFormDisabled && pdfResumeFileInputRef.current?.click()}
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md ${isFormDisabled ? 'cursor-not-allowed bg-gray-700' : 'cursor-pointer hover:border-brand-secondary'}`}
              >
                <div className="space-y-1 text-center">
                  <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                  {pdfResumeFile ? (
                      <p className="text-sm text-green-400">{pdfResumeFile.name}</p>
                  ) : (
                      <div className="flex text-sm text-gray-400">
                        <p className="pl-1">Click to upload</p>
                      </div>
                  )}
                  <p className="text-xs text-gray-500">.pdf files (Max 2MB)</p>
                </div>
              </div>
              <input type="file" ref={pdfResumeFileInputRef} onChange={handlePdfResumeChange} accept=".pdf" className="hidden" disabled={isFormDisabled} />
            </div>

            <div>
                <label htmlFor="latexResume" className="block text-sm font-medium text-gray-300 mb-2">Paste LaTeX Resume (Optional)</label>
                <p className="text-xs text-gray-400 mb-2">Provide your .tex source to get an AI-curated version back.</p>
                <textarea
                    id="latexResume"
                    value={latexResumeText}
                    onChange={e => setLatexResumeText(e.target.value)}
                    placeholder="Paste the full source code of your .tex resume file here..."
                    rows={8}
                    className="w-full bg-gray-dark border border-gray-600 rounded-md px-4 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary disabled:bg-gray-700 disabled:cursor-not-allowed"
                    disabled={isFormDisabled}
                />
            </div>

            <div>
                <label htmlFor="applicationQuestions" className="block text-sm font-medium text-gray-300 mb-2">Paste Application Questions (Optional)</label>
                <p className="text-xs text-gray-400 mb-2">Paste any open-ended questions from the application form for the AI to answer.</p>
                <textarea
                    id="applicationQuestions"
                    value={applicationQuestions}
                    onChange={e => setApplicationQuestions(e.target.value)}
                    placeholder="e.g., Why are you interested in this role? What is your greatest strength?"
                    rows={5}
                    className="w-full bg-gray-dark border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary disabled:bg-gray-700 disabled:cursor-not-allowed"
                    disabled={isFormDisabled}
                />
            </div>
        </fieldset>


        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={isLoading || isFormDisabled}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-dark focus:ring-brand-secondary disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Spinner />
              Generating Content...
            </>
          ) : (
            'Generate Application Content'
          )}
        </button>
      </form>
    </div>
  );
};