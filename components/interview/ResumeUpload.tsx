'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import Tesseract from 'tesseract.js';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Briefcase,
  GraduationCap,
  Code,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useInterviewStore, ResumeData } from '@/lib/store';
import { toast } from 'sonner';

// Skills to detect
const SKILL_KEYWORDS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'C',
  'React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap', 'jQuery',
  'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Rails',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase', 'SQLite', 'SQL',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Linux', 'Git',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'Machine Learning', 'Deep Learning', 'AI', 'NLP',
  'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum',
];

const EDUCATION_KEYWORDS = [
  'Bachelor', 'Master', 'PhD', 'B.Tech', 'M.Tech', 'B.E.', 'M.E.', 'BCA', 'MCA', 'BSc', 'MSc', 'MBA',
  'Computer Science', 'Information Technology', 'Software Engineering', 'Engineering',
  'University', 'College', 'Institute', 'Degree'
];

const EXPERIENCE_KEYWORDS = [
  'Experience', 'Work', 'Internship', 'Developer', 'Engineer', 'Analyst', 'Manager', 'Lead', 'Intern',
  'Senior', 'Junior', 'Full Stack', 'Frontend', 'Backend', 'Software'
];

function extractSkills(text: string): string[] {
  const skills: string[] = [];
  SKILL_KEYWORDS.forEach(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      skills.push(skill);
    }
  });
  return [...new Set(skills)];
}

function extractEducation(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  const education: string[] = [];
  lines.forEach(line => {
    const hasKeyword = EDUCATION_KEYWORDS.some(kw => line.toLowerCase().includes(kw.toLowerCase()));
    if (hasKeyword && line.length > 10 && line.length < 200) {
      education.push(line.trim());
    }
  });
  return education.slice(0, 5);
}

function extractExperience(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  const experience: string[] = [];
  lines.forEach(line => {
    const hasKeyword = EXPERIENCE_KEYWORDS.some(kw => line.toLowerCase().includes(kw.toLowerCase()));
    if ((hasKeyword || /\d{4}/.test(line)) && line.length > 20 && line.length < 300) {
      experience.push(line.trim());
    }
  });
  return experience.slice(0, 10);
}

export function ResumeUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const { resume, setResume, addCaptureLog } = useInterviewStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setOcrProgress(0);

    try {
      let extractedText = '';

      if (file.type.startsWith('image/')) {
        // Use Tesseract.js for OCR (client-side)
        console.log('Starting Tesseract OCR...');
        toast.info('Running OCR on your resume image...');

        const result = await Tesseract.recognize(
          file,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                const progress = Math.round(m.progress * 100);
                setOcrProgress(progress);
                console.log(`OCR Progress: ${progress}%`);
              }
            },
          }
        );

        extractedText = result.data.text;
        console.log('Tesseract OCR completed, confidence:', result.data.confidence);
        console.log('Extracted text length:', extractedText.length);

      } else if (file.type === 'application/pdf') {
        // For PDF, send to server
        toast.info('Processing PDF...');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/resume', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to process PDF');
        }
        extractedText = data.extractedText;

      } else if (file.type === 'text/plain') {
        extractedText = await file.text();
      } else {
        throw new Error('Unsupported file type. Please upload PNG, JPG, PDF, or TXT.');
      }

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Could not extract enough text from the file. Please try a clearer image.');
      }

      // Extract structured data
      const skills = extractSkills(extractedText);
      const education = extractEducation(extractedText);
      const experience = extractExperience(extractedText);

      const resumeData: ResumeData = {
        fileName: file.name,
        fileType: file.type,
        extractedText: extractedText.trim(),
        skills,
        education,
        experience,
        uploadedAt: Date.now(),
      };

      setResume(resumeData);
      
      // Add to capture log
      addCaptureLog({
        timestamp: Date.now(),
        type: 'resume',
        content: `Resume uploaded: ${file.name} (${skills.length} skills detected)`,
        preview: extractedText.substring(0, 300) + '...',
      });

      toast.success(`Resume processed! Found ${skills.length} skills using Tesseract OCR.`);
    } catch (err: any) {
      console.error('Resume processing error:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  }, [setResume, addCaptureLog]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const clearResume = () => {
    setResume(null);
    setError(null);
  };

  if (resume) {
    return (
      <Card className="border-green-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              Resume Uploaded
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={clearResume}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
            <FileText className="w-8 h-8 text-blue-400" />
            <div>
              <p className="font-medium text-white">{resume.fileName}</p>
              <p className="text-sm text-slate-400">
                {resume.extractedText.split(/\s+/).length} words extracted via OCR
              </p>
            </div>
          </div>

          {/* Skills */}
          {resume.skills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-slate-300">Skills Detected ({resume.skills.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {resume.skills.slice(0, 15).map((skill, i) => (
                  <Badge key={i} variant="secondary">{skill}</Badge>
                ))}
                {resume.skills.length > 15 && (
                  <Badge variant="outline">+{resume.skills.length - 15} more</Badge>
                )}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.education.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-slate-300">Education</span>
              </div>
              <ul className="space-y-1">
                {resume.education.slice(0, 3).map((edu, i) => (
                  <li key={i} className="text-sm text-slate-400 truncate">{edu}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Experience */}
          {resume.experience.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-slate-300">Experience</span>
              </div>
              <ul className="space-y-1">
                {resume.experience.slice(0, 3).map((exp, i) => (
                  <li key={i} className="text-sm text-slate-400 truncate">{exp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Show/Hide extracted text */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExtractedText(!showExtractedText)}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showExtractedText ? 'Hide' : 'Show'} Extracted Text (OCR Output)
          </Button>

          <AnimatePresence>
            {showExtractedText && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-lg bg-slate-900/50 max-h-60 overflow-y-auto">
                  <p className="text-xs text-slate-500 mb-2">Raw OCR Output (Tesseract.js):</p>
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                    {resume.extractedText}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-400" />
          Upload Resume (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
                <div>
                  <p className="text-white font-medium">Running Tesseract OCR...</p>
                  <p className="text-sm text-slate-400">Extracting text from your resume</p>
                </div>
                {ocrProgress > 0 && (
                  <div className="max-w-xs mx-auto">
                    <Progress value={ocrProgress} className="h-2" />
                    <p className="text-xs text-slate-500 mt-1">{ocrProgress}% complete</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <Upload className={`w-12 h-12 mx-auto ${isDragActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <div>
                  <p className="text-white">
                    {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    or click to browse
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Supports PNG, JPG, PDF, TXT • Uses Tesseract.js OCR
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500 text-center">
          Resume data will be used to generate personalized interview questions
        </p>
      </CardContent>
    </Card>
  );
}