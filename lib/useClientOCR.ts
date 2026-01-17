'use client';

import { useState, useCallback, useRef } from 'react';
import Tesseract from 'tesseract.js';

interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
}

interface UseOCROptions {
  onProgress?: (progress: number) => void;
  onComplete?: (result: OCRResult) => void;
  onError?: (error: Error) => void;
}

export function useClientOCR(options: UseOCROptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastResult, setLastResult] = useState<OCRResult | null>(null);
  const processingRef = useRef(false);

  const runOCR = useCallback(async (imageSource: string | Blob | File): Promise<OCRResult | null> => {
    if (processingRef.current) {
      console.log('OCR already in progress, skipping...');
      return null;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setProgress(0);
    const startTime = Date.now();

    try {
      console.log('Starting client-side Tesseract OCR...');

      const result = await Tesseract.recognize(
        imageSource,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const prog = Math.round(m.progress * 100);
              setProgress(prog);
              options.onProgress?.(prog);
            }
          },
        }
      );

      const processingTime = Date.now() - startTime;
      const ocrResult: OCRResult = {
        text: result.data.text.trim(),
        confidence: result.data.confidence,
        processingTime,
      };

      console.log(`OCR completed in ${processingTime}ms, confidence: ${ocrResult.confidence.toFixed(1)}%`);
      setLastResult(ocrResult);
      options.onComplete?.(ocrResult);

      return ocrResult;
    } catch (error: any) {
      console.error('OCR error:', error);
      options.onError?.(error);
      return null;
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      setProgress(0);
    }
  }, [options]);

  const runOCROnBase64 = useCallback(async (base64: string, mimeType: string = 'image/png'): Promise<OCRResult | null> => {
    const dataUrl = base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`;
    return runOCR(dataUrl);
  }, [runOCR]);

  return {
    runOCR,
    runOCROnBase64,
    isProcessing,
    progress,
    lastResult,
  };
}

export function extractTechnologiesFromText(text: string): string[] {
  const techKeywords = [
    'React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'Node.js', 'Express',
    'Python', 'Django', 'Flask', 'FastAPI', 'JavaScript', 'TypeScript',
    'Java', 'Spring', 'C++', 'C#', '.NET', 'Go', 'Rust', 'PHP', 'Ruby',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux',
    'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'OpenCV',
    'Git', 'GitHub', 'REST', 'GraphQL', 'API', 'HTML', 'CSS', 'Tailwind',
    'Machine Learning', 'Deep Learning', 'AI', 'NLP'
  ];

  const found: string[] = [];
  techKeywords.forEach(tech => {
    if (text.toLowerCase().includes(tech.toLowerCase()) && !found.includes(tech)) {
      found.push(tech);
    }
  });

  return found;
}