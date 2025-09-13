
export interface UserProfile {
  legalName: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  linkedin: string;
  githubUrl: string;
  portfolioUrl: string;
  workAuthorization: string;
  sponsorshipNow: boolean;
  sponsorshipFuture: boolean;
  startDate: string;
  willingToRelocate: string;
}

export interface ResumeData {
    legalName: string;
    email: string;
    phone: string;
    skills: string[];
    summary: string;
    fullText: string; // Added to hold the original resume text for curation
}

export interface JobPosting {
    title: string;
    company: string;
    url?: string;
}

export interface TailoredAnswer {
    question: string;
    answer: string;
}

export interface ResumeAnalysis {
    score: number;
    matchingKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
    curatedResumeText?: string;
}

export interface OutreachContent {
    coverLetter: string;
    linkedInMessage: string;
}

export interface ApplicationMaterials {
    tailoredAnswers: TailoredAnswer[];
    jobDetails: JobPosting;
    resumeAnalysis: ResumeAnalysis;
    outreachContent?: OutreachContent;
}

export interface ApplicationLog {
    job: JobPosting;
    appliedDate: string;
    status: 'Applied' | 'Pending' | 'Rejected';
}