import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { ResumeData, ApplicationMaterials, TailoredAnswer, OutreachContent, ResumeAnalysis } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schemas for Structured JSON Output ---

const resumeSchema = {
    type: Type.OBJECT,
    properties: {
        legalName: { type: Type.STRING, description: "The full legal name of the candidate." },
        email: { type: Type.STRING, description: "The primary email address of the candidate." },
        phone: { type: Type.STRING, description: "The primary phone number of the candidate." },
        summary: { type: Type.STRING, description: "A 2-3 sentence professional summary from the resume." },
        skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of the top 10 most relevant technical skills or keywords."
        },
        fullText: { type: Type.STRING, description: "The full, plain text content extracted from the resume document." }
    },
    required: ["legalName", "email", "phone", "summary", "skills", "fullText"],
};

const initialAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        jobDetails: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The job title, extracted from the job description text." },
                company: { type: Type.STRING, description: "The company name, extracted from the job description text." },
                url: { type: Type.STRING, description: "The source URL of the job posting, passed in from user input." }
            },
            required: ["title", "company"],
        },
        tailoredAnswers: {
            type: Type.ARRAY,
            description: "A list of questions from the 'Application Questions' input text and their tailored answers. If no questions are provided, return an empty array.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The exact question identified from the application form." },
                    answer: { type: Type.STRING, description: "A concise, tailored answer for the question, based on the candidate's resume and the job description." }
                },
                required: ["question", "answer"]
            }
        },
        resumeAnalysis: {
            type: Type.OBJECT,
            description: "An analysis of the candidate's resume against the job description.",
            properties: {
                score: { type: Type.INTEGER, description: "A score from 0 to 100 representing how well the resume matches the job description." },
                matchingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords present in both the resume and job description." },
                missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Important keywords from the job description missing in the resume." },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable suggestions to improve the resume for this specific job." },
            },
            required: ["score", "matchingKeywords", "missingKeywords", "suggestions"]
        },
    },
    required: ["jobDetails", "tailoredAnswers", "resumeAnalysis"]
};


const answersSchema = {
    type: Type.ARRAY,
    description: "A list of questions from the input text and their tailored answers.",
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING, description: "The exact question identified from the input." },
            answer: { type: Type.STRING, description: "A concise, tailored answer for the question, based on the candidate's resume and the job description." }
        },
        required: ["question", "answer"]
    }
};

// --- AI Service Functions ---

export const parseResume = async (resumePdfInput: { mimeType: string; data: string }): Promise<ResumeData> => {
    const prompt = `Parse the attached PDF resume. Focus only on the content to extract the candidate's information and the full text according to the provided JSON schema.`;
    
    const parts: any[] = [
        { text: prompt },
        { inlineData: { mimeType: resumePdfInput.mimeType, data: resumePdfInput.data } }
    ];

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            responseSchema: resumeSchema,
        },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateInitialAnalysis = async (
    jobDescription: string,
    jobUrl: string,
    applicationQuestions: string,
    resumeText: string
): Promise<ApplicationMaterials> => {
    const hasQuestions = !!applicationQuestions.trim();

    const prompt = `You are an expert career coach. Analyze the candidate's resume text against the provided job description.
Your task is to perform the following and return the output in a single JSON object matching the provided schema:
1.  **Extract Job Details:**
    - From the job description text, extract the 'title' and 'company'.
    - Return the provided job posting URL in the 'jobDetails.url' field.
2.  **Analyze Resume vs. Job Description:**
    - Calculate a match score (0-100).
    - Identify matching and missing keywords.
    - Provide actionable suggestions for resume improvement.
3.  **Answer Application Questions:**
    - If application questions are provided, generate tailored answers based on the resume and job description.
    - If no questions are provided, the 'tailoredAnswers' array should be empty.

**Job Posting URL:**
---
${jobUrl}
---

**Job Description:**
---
${jobDescription}
---

**Candidate's Resume Text:**
---
${resumeText}
---
${hasQuestions ? `\n**Application Questions:**\n---\n${applicationQuestions}\n---\n` : ''}
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: initialAnalysisSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateCuratedResumeText = async (
    jobDescription: string,
    resumeText: string,
    resumeLatexInput: string | null
): Promise<Pick<ResumeAnalysis, 'curatedResumeText'>> => {
    const hasLatex = !!resumeLatexInput;
    const prompt = `You are an expert resume editor. Your task is to curate the provided resume to better align with the job description.

${hasLatex
    ? "A LaTeX resume source has been provided. Edit **only this LaTeX source** to incorporate keywords and suggestions. **Critically, you must not alter the LaTeX structure, commands, or formatting.** Only modify the textual content that a person would read in the final PDF. Return the complete, updated LaTeX source code as a string in the 'curatedResumeText' field."
    : "Generate an improved, keyword-rich version of the resume's text content. Present this as a single block of plain text in the 'curatedResumeText' field."
}

**Job Description:**
---
${jobDescription}
---

**Original Resume Content ${hasLatex ? '(LaTeX Source)' : '(Plain Text)'}:**
---
${hasLatex ? resumeLatexInput : resumeText}
---
`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    curatedResumeText: { type: Type.STRING, description: "The complete, updated text of the resume, edited for the job." }
                },
                required: ["curatedResumeText"]
            },
        },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateOutreachContent = async (
    jobDescription: string,
    resumeText: string
): Promise<OutreachContent> => {
    const prompt = `You are an expert career coach. Using the provided job description and candidate's resume, generate the following outreach materials:
1.  A compelling, professional cover letter.
2.  A concise LinkedIn message to a recruiter.

Return the output in a single JSON object.

**Job Description:**
---
${jobDescription}
---

**Candidate's Resume Text:**
---
${resumeText}
---
`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    coverLetter: { type: Type.STRING, description: "A full, tailored cover letter for the job application." },
                    linkedInMessage: { type: Type.STRING, description: "A concise and professional LinkedIn message to a recruiter." }
                },
                required: ["coverLetter", "linkedInMessage"]
            },
        },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};


export const generateAnswersForQuestions = async (
    jobDescription: string,
    resumeText: string,
    newQuestions: string
): Promise<TailoredAnswer[]> => {
    const prompt = `You are an expert career coach. Given the job description and candidate's resume text below, generate concise, tailored answers for the provided list of application questions. Return the output as a JSON array of objects, where each object has a 'question' and 'answer' key.

**Job Description:**
---
${jobDescription}
---

**Candidate's Resume Text:**
---
${resumeText}
---

**New Application Questions to Answer:**
---
${newQuestions}
---
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    answers: answersSchema
                },
                required: ['answers']
            },
        },
    });

    const jsonText = response.text.trim();
    // The schema is nested under an 'answers' key to ensure valid JSON structure.
    const result = JSON.parse(jsonText);
    return result.answers || [];
}