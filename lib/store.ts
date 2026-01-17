import { create } from 'zustand';

export interface ScreenCapture {
  timestamp: number;
  imageBase64: string;
  analysis?: string;
  ocrText?: string;
}

export interface ResumeData {
  fileName: string;
  fileType: string;
  extractedText: string;
  skills: string[];
  experience: string[];
  education: string[];
  uploadedAt: number;
}

export interface QAPair {
  question: string;
  response: string;
  timestamp: number;
  questionType?: 'project' | 'resume' | 'technical' | 'behavioral';
  audioUrl?: string;
}

export interface Evaluation {
  scores: {
    technical_depth: number;
    clarity: number;
    originality: number;
    implementation: number;
    communication: number;
  };
  total_score: number;
  grade: string;
  strengths: string[];
  improvements: string[];
  detailed_feedback: string;
  recommendation: string;
}

export interface CaptureLog {
  timestamp: number;
  type: 'screenshot' | 'ocr' | 'speech' | 'resume' | 'analysis';
  content: string;
  preview?: string;
}

interface InterviewState {
  // Phase
  phase: 'setup' | 'presentation' | 'interview' | 'evaluation';
  setPhase: (phase: 'setup' | 'presentation' | 'interview' | 'evaluation') => void;

  // Resume data
  resume: ResumeData | null;
  setResume: (resume: ResumeData | null) => void;

  // Presentation data
  screenCaptures: ScreenCapture[];
  addScreenCapture: (capture: ScreenCapture) => void;
  transcript: string;
  setTranscript: (text: string) => void;
  appendTranscript: (text: string) => void;
  detectedTechnologies: string[];
  setDetectedTechnologies: (techs: string[]) => void;
  addDetectedTechnology: (tech: string) => void;
  presentationDuration: number;
  setPresentationDuration: (duration: number) => void;

  // Capture logs (for live display)
  captureLogs: CaptureLog[];
  addCaptureLog: (log: CaptureLog) => void;
  clearCaptureLogs: () => void;

  // Interview data
  questions: string[];
  setQuestions: (questions: string[]) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  qaPairs: QAPair[];
  addQAPair: (pair: QAPair) => void;

  // Evaluation
  evaluation: Evaluation | null;
  setEvaluation: (evaluation: Evaluation) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  phase: 'setup' as const,
  resume: null,
  screenCaptures: [],
  transcript: '',
  detectedTechnologies: [],
  presentationDuration: 0,
  captureLogs: [],
  questions: [],
  currentQuestionIndex: 0,
  qaPairs: [],
  evaluation: null,
};

export const useInterviewStore = create<InterviewState>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  setResume: (resume) => set({ resume }),

  addScreenCapture: (capture) =>
    set((state) => ({
      screenCaptures: [...state.screenCaptures.slice(-29), capture],
    })),

  setTranscript: (transcript) => set({ transcript }),
  
  appendTranscript: (text) =>
    set((state) => ({
      transcript: state.transcript + (state.transcript ? ' ' : '') + text,
    })),

  setDetectedTechnologies: (detectedTechnologies) => set({ detectedTechnologies }),
  
  addDetectedTechnology: (tech) =>
    set((state) => ({
      detectedTechnologies: state.detectedTechnologies.includes(tech)
        ? state.detectedTechnologies
        : [...state.detectedTechnologies, tech],
    })),
  
  setPresentationDuration: (presentationDuration) => set({ presentationDuration }),

  addCaptureLog: (log) =>
    set((state) => ({
      captureLogs: [...state.captureLogs.slice(-49), log],
    })),

  clearCaptureLogs: () => set({ captureLogs: [] }),

  setQuestions: (questions) => set({ questions }),
  
  setCurrentQuestionIndex: (currentQuestionIndex) => set({ currentQuestionIndex }),

  addQAPair: (pair) =>
    set((state) => ({
      qaPairs: [...state.qaPairs, pair],
    })),

  setEvaluation: (evaluation) => set({ evaluation }),

  reset: () => set(initialState),
}));