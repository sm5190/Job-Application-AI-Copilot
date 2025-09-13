
import React, { useState } from 'react';
import type { UserProfile, ResumeData, ApplicationLog, ApplicationMaterials, TailoredAnswer } from '../types';
import { ClipboardCopyIcon, DocumentTextIcon, UserIcon, CheckCircleIcon, DownloadIcon, Spinner, ExternalLinkIcon } from './icons';

type CopilotTab = 'answers' | 'analysis' | 'outreach';

interface CopilotViewProps {
  materials: ApplicationMaterials;
  userProfile: UserProfile;
  resumeData: ResumeData;
  isLatexCurated: boolean;
  onLogApplication: (log: ApplicationLog) => void;
  onBack: () => void;
  onGenerateMoreAnswers: (questions: string) => Promise<void>;
  isGeneratingAnswers: boolean;
  onGenerateCuratedResume: () => Promise<void>;
  isGeneratingResume: boolean;
  onGenerateOutreach: () => Promise<void>;
  isGeneratingOutreach: boolean;
}

export const CopilotView: React.FC<CopilotViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<CopilotTab>('analysis');

  const { materials, userProfile, resumeData, onLogApplication, onBack } = props;

  const handleLog = () => {
    const logEntry: ApplicationLog = {
      job: materials.jobDetails,
      appliedDate: new Date().toLocaleDateString(),
      status: 'Applied',
    };
    onLogApplication(logEntry);
  };

  const combinedProfile = {
      ...userProfile,
      legalName: resumeData.legalName || userProfile.legalName,
      email: resumeData.email || userProfile.email,
      phone: resumeData.phone || userProfile.phone,
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
        <div className="bg-gray-medium p-6 rounded-lg shadow-2xl mb-8">
            <h2 className="text-2xl font-bold text-white">AI-Generated Application Toolkit</h2>
            <p className="text-gray-300">
                For: <span className="font-semibold text-white">{materials.jobDetails.title}</span> at <span className="font-semibold text-white">{materials.jobDetails.company}</span>
                {materials.jobDetails.url && (
                    <a href={materials.jobDetails.url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center text-brand-secondary hover:underline text-sm">
                        View Job
                        <ExternalLinkIcon className="w-4 h-4 ml-1" />
                    </a>
                )}
            </p>
            <div className="mt-4 border-b border-gray-700">
                <nav className="-mb-px flex space-x-6">
                    <TabButton name="Resume Analysis" isActive={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} />
                    <TabButton name="Outreach Content" isActive={activeTab === 'outreach'} onClick={() => setActiveTab('outreach')} />
                    <TabButton name="Form Answers" isActive={activeTab === 'answers'} onClick={() => setActiveTab('answers')} />
                </nav>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                {activeTab === 'analysis' && <ResumeAnalysisView analysis={materials.resumeAnalysis} isLatexCurated={props.isLatexCurated} onGenerate={props.onGenerateCuratedResume} isGenerating={props.isGeneratingResume} />}
                {activeTab === 'outreach' && <OutreachContentView content={materials.outreachContent} onGenerate={props.onGenerateOutreach} isGenerating={props.isGeneratingOutreach} />}
                {activeTab === 'answers' && <FormAnswersView answers={materials.tailoredAnswers} onGenerateMoreAnswers={props.onGenerateMoreAnswers} isGenerating={props.isGeneratingAnswers} />}
            </div>

            <div className="lg:col-span-1">
                 <div className="bg-gray-medium p-6 rounded-lg shadow-2xl h-fit sticky top-8">
                    <h3 className="text-xl font-bold text-white mb-4">Actions & Your Info</h3>
                     <div className="space-y-3 mb-6">
                        <CopyableField label="Name" value={combinedProfile.legalName} />
                        <CopyableField label="Email" value={combinedProfile.email} />
                        <CopyableField label="Phone" value={combinedProfile.phone} />
                        <CopyableField label="LinkedIn" value={combinedProfile.linkedin} />
                        <CopyableField label="GitHub" value={combinedProfile.githubUrl} />
                        <CopyableField label="Portfolio" value={combinedProfile.portfolioUrl} />
                    </div>
                     <div className="pt-6 border-t border-gray-700 flex flex-col space-y-3">
                        <button onClick={handleLog} className="w-full py-2 px-6 rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-blue-800">
                            I've Applied! Log It.
                        </button>
                         <button type="button" onClick={onBack} className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-gray-600 hover:bg-gray-500">Back to Start</button>
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

const TabButton: React.FC<{name: string, isActive: boolean, onClick: () => void}> = ({ name, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            isActive
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-400'
        }`}
    >
        {name}
    </button>
);

// --- Sub-Views for Tabs ---

const ResumeAnalysisView: React.FC<{analysis: ApplicationMaterials['resumeAnalysis'], isLatexCurated: boolean, onGenerate: () => void, isGenerating: boolean}> = ({ analysis, isLatexCurated, onGenerate, isGenerating }) => (
    <div className="bg-gray-medium p-8 rounded-lg shadow-2xl space-y-8">
        <div className="flex items-center justify-between bg-gray-dark p-4 rounded-lg">
            <h3 className="text-xl font-bold text-white">Resume Match Score</h3>
            <div className="text-4xl font-bold text-brand-secondary">{analysis.score}<span className="text-2xl text-gray-400">/100</span></div>
        </div>

        <div>
            <h4 className="text-lg font-semibold text-white mb-3">Keyword Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KeywordList title="Matching Keywords" keywords={analysis.matchingKeywords} color="text-green-400" />
                <KeywordList title="Missing Keywords" keywords={analysis.missingKeywords} color="text-yellow-400" />
            </div>
        </div>

        <div>
            <h4 className="text-lg font-semibold text-white mb-3">AI Suggestions for Improvement</h4>
            <ul className="space-y-2 list-disc list-inside text-gray-300">
                {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
        </div>
        
        {analysis.curatedResumeText ? (
            <GeneratedContentBlock 
                title={isLatexCurated ? "AI-Curated LaTeX Resume" : "AI-Curated Resume Text"}
                content={analysis.curatedResumeText} 
                download={isLatexCurated ? { filename: 'curated_resume.tex', mimetype: 'text/x-latex' } : undefined}
            />
        ) : (
             <OnDemandBlock
                title="Generate Curated Resume"
                description={isLatexCurated ? "Click to have the AI edit your LaTeX source code to better match this job." : "Click to have the AI rewrite your resume's text content with better keywords for this job."}
                buttonText="Generate Curated Resume"
                onGenerate={onGenerate}
                isGenerating={isGenerating}
            />
        )}
    </div>
);

const OutreachContentView: React.FC<{content?: ApplicationMaterials['outreachContent'], onGenerate: () => void, isGenerating: boolean}> = ({ content, onGenerate, isGenerating }) => (
    <div className="bg-gray-medium p-8 rounded-lg shadow-2xl space-y-8">
        {content ? (
            <>
                <GeneratedContentBlock title="Cover Letter" content={content.coverLetter} height="400px"/>
                <GeneratedContentBlock title="LinkedIn Recruiter Message" content={content.linkedInMessage} />
            </>
        ) : (
            <OnDemandBlock
                title="Generate Outreach Content"
                description="The AI can write a tailored cover letter and a concise LinkedIn message to a recruiter for this specific role."
                buttonText="Generate Outreach Content"
                onGenerate={onGenerate}
                isGenerating={isGenerating}
            />
        )}
    </div>
);

const FormAnswersView: React.FC<{
    answers: TailoredAnswer[];
    onGenerateMoreAnswers: (questions: string) => Promise<void>;
    isGenerating: boolean;
}> = ({ answers, onGenerateMoreAnswers, isGenerating }) => {
    const [newQuestions, setNewQuestions] = useState('');

    const handleSubmit = async () => {
        if (!newQuestions.trim()) return;
        await onGenerateMoreAnswers(newQuestions);
        setNewQuestions('');
    };
    
    return (
     <div className="bg-gray-medium p-8 rounded-lg shadow-2xl space-y-6">
        <div className="space-y-4">
            {answers.length > 0 ? (
                answers.map((item, index) => (
                    <AnswerCard key={index} item={item} />
                ))
            ) : (
                <div className="text-center text-gray-400 bg-gray-dark p-6 rounded-md">
                    <h3 className="font-semibold text-white">No Application Questions Found</h3>
                    <p>You didn't provide any questions in the input form. If you add some, the AI will generate tailored answers for you here.</p>
                </div>
            )}
        </div>

        <div className="pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Generate More Answers</h3>
            <p className="text-sm text-gray-400 mb-4">Paste more questions from the application form below and the AI will generate answers for them.</p>
            <textarea
                value={newQuestions}
                onChange={e => setNewQuestions(e.target.value)}
                placeholder="e.g., Describe a challenging project you worked on. What are your salary expectations?"
                rows={5}
                className="w-full bg-gray-dark border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                disabled={isGenerating}
            />
            <button
                onClick={handleSubmit}
                disabled={isGenerating || !newQuestions.trim()}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-dark focus:ring-brand-secondary disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                {isGenerating ? (
                    <>
                    <Spinner />
                    Generating...
                    </>
                ) : (
                    'Generate Answers'
                )}
            </button>
        </div>
    </div>
    );
}


// --- Reusable Components ---

const OnDemandBlock: React.FC<{ title: string, description: string, buttonText: string, onGenerate: () => void, isGenerating: boolean }> = ({ title, description, buttonText, onGenerate, isGenerating }) => (
    <div className="text-center bg-gray-dark p-8 rounded-lg">
        <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
        <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full max-w-xs mx-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-dark focus:ring-brand-secondary disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
        {isGenerating ? (
            <>
                <Spinner />
                Generating...
            </>
        ) : (
            buttonText
        )}
        </button>
    </div>
);


const KeywordList: React.FC<{title: string, keywords: string[], color: string}> = ({ title, keywords, color }) => (
    <div className="bg-gray-dark p-4 rounded-md">
        <h5 className={`font-semibold mb-2 ${color}`}>{title}</h5>
        <div className="flex flex-wrap gap-2">
            {keywords.map(k => <span key={k} className="bg-gray-700 text-gray-200 px-2 py-1 text-xs rounded-full">{k}</span>)}
        </div>
    </div>
);

const GeneratedContentBlock: React.FC<{
    title: string; 
    content: string; 
    height?: string;
    download?: { filename: string; mimetype: string };
}> = ({ title, content, height = '200px', download }) => {
    const [copied, setCopied] = React.useState(false);
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!download) return;
        const blob = new Blob([content], { type: `${download.mimetype};charset=utf-8;` });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", download.filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-semibold text-white">{title}</h4>
                 <div className="flex items-center gap-2">
                    {download && (
                         <button onClick={handleDownload} className="text-sm text-brand-secondary hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors">
                            <DownloadIcon className="w-4 h-4" />
                            Download .tex
                        </button>
                    )}
                    <button onClick={copyToClipboard} className="text-sm text-brand-secondary hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors">
                        <ClipboardCopyIcon className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy Text'}
                    </button>
                 </div>
            </div>
            <pre className="w-full bg-gray-dark p-4 rounded-md text-gray-200 whitespace-pre-wrap font-sans text-sm" style={{ height, overflowY: 'auto' }}>{content}</pre>
        </div>
    );
}

const AnswerCard: React.FC<{ item: TailoredAnswer }> = ({ item }) => {
    const [copied, setCopied] = React.useState(false);
    const copyToClipboard = () => {
        navigator.clipboard.writeText(item.answer);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gray-dark p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-400 mb-2">{item.question}</p>
            <div className="flex justify-between items-start gap-4">
                 <p className="text-gray-200 text-base flex-grow">{item.answer}</p>
                 <button onClick={copyToClipboard} className="text-sm text-brand-secondary hover:text-white flex items-center gap-1 flex-shrink-0 px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600">
                    <ClipboardCopyIcon className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>
    );
};

const CopyableField: React.FC<{ label: string; value: string }> = ({ label, value }) => {
    const [copied, setCopied] = React.useState(false);
    const copyToClipboard = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div onClick={copyToClipboard} className="bg-gray-dark p-2.5 rounded-md cursor-pointer hover:bg-gray-800 transition-colors">
            <div className="flex justify-between items-center">
                 <div>
                    <label className="block text-xs font-medium text-gray-400">{label}</label>
                    <p className="text-sm text-white truncate">{value || 'Not set'}</p>
                 </div>
                {copied && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" /> Copied</span>}
            </div>
        </div>
    )
}