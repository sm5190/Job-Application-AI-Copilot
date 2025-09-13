import React, { useState } from 'react';
import type { UserProfile, ApplicationLog, ResumeData, ApplicationMaterials } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { DEFAULT_USER_PROFILE } from './constants';
import { 
    parseResume, 
    generateInitialAnalysis,
    generateCuratedResumeText,
    generateOutreachContent,
    generateAnswersForQuestions 
} from './services/geminiService';
import { JobInputForm } from './components/JobSearchForm';
import { CopilotView } from './components/ApplicationView';
import { LogView } from './components/LogView';
import { ProfileModal } from './components/ProfileModal';
import { UserIcon, DocumentTextIcon } from './components/icons';

type AppStep = 'input' | 'copilot' | 'log';

const readFileAsBase64 = (file: File): Promise<{ mimeType: string, data: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const data = result.split(',')[1];
            resolve({ mimeType: file.type, data });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


function App() {
    const [step, setStep] = useState<AppStep>('input');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for on-demand generation
    const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
    const [isGeneratingResume, setIsGeneratingResume] = useState(false);
    const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
    
    // Data state
    const [currentJobDescription, setCurrentJobDescription] = useState<string>('');
    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [applicationMaterials, setApplicationMaterials] = useState<ApplicationMaterials | null>(null);
    const [originalLatex, setOriginalLatex] = useState<string>('');
    const [isLatexCurated, setIsLatexCurated] = useState<boolean>(false);
    
    const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('jobright-user-profile', DEFAULT_USER_PROFILE);
    const [applicationLog, setApplicationLog] = useLocalStorage<ApplicationLog[]>('jobright-application-log', []);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    const handleAnalyzeJob = async (jobDescription: string, jobUrl: string, applicationQuestions: string, pdfResumeFile: File, latexResumeText: string) => {
        setIsLoading(true);
        setError(null);
        try {
            setCurrentJobDescription(jobDescription);
            const hasLatex = !!latexResumeText.trim();
            setIsLatexCurated(hasLatex);
            if (hasLatex) {
                setOriginalLatex(latexResumeText);
            }

            const pdfResumeInput = await readFileAsBase64(pdfResumeFile);
            const parsedResume = await parseResume(pdfResumeInput);
            setResumeData(parsedResume);

            const initialMaterials = await generateInitialAnalysis(
                jobDescription,
                jobUrl,
                applicationQuestions,
                parsedResume.fullText
            );
            
            setApplicationMaterials(initialMaterials);
            setStep('copilot');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred. The AI might be unable to process the document. Please try again.');
            setStep('input');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateCuratedResume = async () => {
        if (!resumeData || !applicationMaterials) return;
        setIsGeneratingResume(true);
        setError(null);
        try {
            const result = await generateCuratedResumeText(currentJobDescription, resumeData.fullText, originalLatex || null);
            setApplicationMaterials(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    resumeAnalysis: {
                        ...prev.resumeAnalysis,
                        curatedResumeText: result.curatedResumeText
                    }
                }
            });
        } catch (err) {
            console.error(err);
            setError("Failed to generate the curated resume. Please try again.");
        } finally {
            setIsGeneratingResume(false);
        }
    };

    const handleGenerateOutreach = async () => {
        if (!resumeData || !applicationMaterials) return;
        setIsGeneratingOutreach(true);
        setError(null);
        try {
            const outreachContent = await generateOutreachContent(currentJobDescription, resumeData.fullText);
            setApplicationMaterials(prev => {
                if (!prev) return null;
                return { ...prev, outreachContent };
            });
        } catch (err) {
            console.error(err);
            setError("Failed to generate outreach content. Please try again.");
        } finally {
            setIsGeneratingOutreach(false);
        }
    };

    const handleGenerateMoreAnswers = async (questions: string) => {
        if (!resumeData || !applicationMaterials) return;
        setIsGeneratingAnswers(true);
        try {
            const newAnswers = await generateAnswersForQuestions(currentJobDescription, resumeData.fullText, questions);
            setApplicationMaterials(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    tailoredAnswers: [...prev.tailoredAnswers, ...newAnswers]
                }
            });
        } catch (err) {
             console.error(err);
             setError(err instanceof Error ? err.message : 'An unknown error occurred while generating answers.');
        } finally {
            setIsGeneratingAnswers(false);
        }
    };

    const handleLogApplication = (logEntry: ApplicationLog) => {
        setApplicationLog(prev => [logEntry, ...prev]);
        setStep('log');
    };

    const handleStartNew = () => {
        setError(null);
        setResumeData(null);
        setApplicationMaterials(null);
        setIsLatexCurated(false);
        setCurrentJobDescription('');
        setOriginalLatex('');
        setStep('input');
    };

    const renderContent = () => {
        switch (step) {
            case 'input':
                return <JobInputForm onAnalyze={handleAnalyzeJob} isLoading={isLoading} applicationLog={applicationLog} />;
            case 'copilot':
                if (!applicationMaterials || !resumeData) return <div>Something went wrong. Please start over.</div>;
                return <CopilotView 
                            materials={applicationMaterials} 
                            userProfile={userProfile} 
                            resumeData={resumeData} 
                            isLatexCurated={isLatexCurated} 
                            onLogApplication={handleLogApplication} 
                            onBack={handleStartNew}
                            onGenerateMoreAnswers={handleGenerateMoreAnswers}
                            isGeneratingAnswers={isGeneratingAnswers}
                            onGenerateCuratedResume={handleGenerateCuratedResume}
                            isGeneratingResume={isGeneratingResume}
                            onGenerateOutreach={handleGenerateOutreach}
                            isGeneratingOutreach={isGeneratingOutreach}
                        />;
            case 'log':
                return <LogView logs={applicationLog} onStartNew={handleStartNew} />;
            default:
                return <div>Invalid step</div>;
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 'input': return 'New Application Analysis';
            case 'copilot': return 'Review Your AI-Generated Toolkit';
            case 'log': return 'Application History';
            default: return '';
        }
    };

    return (
        <div className="min-h-screen bg-gray-dark font-sans p-4 sm:p-8">
            <header className="flex justify-between items-center max-w-6xl mx-auto mb-8">
                <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-8 h-8 text-brand-secondary" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Jobright AI Copilot</h1>
                </div>
                 <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center space-x-2 py-2 px-4 rounded-md text-sm font-medium text-white bg-gray-medium hover:bg-gray-600 transition-colors"
                    aria-label="Open user profile settings"
                >
                    <UserIcon className="w-5 h-5"/>
                    <span>Profile</span>
                </button>
            </header>
            
            <main className="max-w-6xl mx-auto">
                 <div className="mb-8 text-center">
                    <h2 className="text-xl text-gray-300 font-semibold">{getStepTitle()}</h2>
                </div>

                {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 max-w-3xl mx-auto" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>}
                
                {renderContent()}
            </main>
            
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                profile={userProfile}
                onSave={setUserProfile}
            />
        </div>
    );
}

export default App;