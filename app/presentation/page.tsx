'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Monitor,
  Mic,
  Brain,
  Clock,
  Loader2,
  CheckCircle2,
  Sparkles,
  FileText,
  ScanText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScreenCapture } from '@/components/interview/ScreenCapture';
import { VoiceRecorder } from '@/components/interview/VoiceRecorder';
import { LiveCaptureDisplay } from '@/components/interview/LiveCaptureDisplay';
import { useClientOCR, extractTechnologiesFromText } from '@/lib/useClientOCR';
import { useInterviewStore } from '@/lib/store';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function PresentationPage() {
  const router = useRouter();
  const [isPresenting, setIsPresenting] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [screenContext, setScreenContext] = useState('');
  const [latestOCR, setLatestOCR] = useState('');
  const [ocrCount, setOcrCount] = useState(0);
  
  const {
    addScreenCapture,
    transcript,
    appendTranscript,
    detectedTechnologies,
    addDetectedTechnology,
    setPresentationDuration,
    setPhase,
    addCaptureLog,
    resume,
  } = useInterviewStore();

  // Client-side OCR hook
  const { runOCROnBase64, isProcessing: isRunningOCR, progress: ocrProgress } = useClientOCR({
    onComplete: (result) => {
      console.log('OCR completed:', result.text.substring(0, 100));
      setLatestOCR(result.text);
      setOcrCount(prev => prev + 1);
      
      // Extract technologies from OCR text
      const techs = extractTechnologiesFromText(result.text);
      techs.forEach(tech => addDetectedTechnology(tech));
      
      // Add to capture log
      addCaptureLog({
        timestamp: Date.now(),
        type: 'ocr',
        content: `Tesseract OCR: ${result.text.split(/\s+/).length} words (${result.confidence.toFixed(0)}% conf)`,
        preview: result.text.substring(0, 500),
      });
    },
  });

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPresenting) {
      interval = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPresenting]);

  // Analyze screen capture with AI Vision (Groq)
  const analyzeScreen = useCallback(async (imageBase64: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      if (response.ok) {
        const data = await response.json();
        setScreenContext(data.analysis);

        // Add to capture log
        addCaptureLog({
          timestamp: Date.now(),
          type: 'analysis',
          content: 'AI Vision analyzed screen content',
          preview: data.analysis.substring(0, 500),
        });

        // Extract technologies from analysis
        const techKeywords = [
          'React', 'Vue', 'Angular', 'Next.js', 'Python', 'JavaScript', 'TypeScript',
          'Node.js', 'Django', 'Flask', 'FastAPI', 'MongoDB', 'PostgreSQL', 'MySQL',
          'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'TensorFlow', 'PyTorch',
          'Machine Learning', 'API', 'REST', 'GraphQL', 'Tailwind', 'CSS', 'HTML',
          'Java', 'C++', 'Go', 'Rust', 'Redis', 'Firebase', 'Supabase', 'Git'
        ];
        
        techKeywords.forEach(tech => {
          if (data.analysis.toLowerCase().includes(tech.toLowerCase())) {
            addDetectedTechnology(tech);
          }
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [addCaptureLog, addDetectedTechnology]);

  // Handle screen capture
  const handleCapture = useCallback((imageBase64: string) => {
    addScreenCapture({
      timestamp: Date.now(),
      imageBase64,
    });

    // Add to capture log
    addCaptureLog({
      timestamp: Date.now(),
      type: 'screenshot',
      content: 'Screen captured',
    });
  }, [addScreenCapture, addCaptureLog]);

  // Handle significant screen change - run both OCR and AI analysis
  const handleScreenChange = useCallback(async (imageBase64: string) => {
    // Run client-side Tesseract OCR
    runOCROnBase64(imageBase64);
    
    // Run AI Vision analysis (server-side)
    analyzeScreen(imageBase64);
  }, [runOCROnBase64, analyzeScreen]);

  // Handle transcript
  const handleTranscript = useCallback((text: string) => {
    appendTranscript(text);
    
    // Add to capture log
    addCaptureLog({
      timestamp: Date.now(),
      type: 'speech',
      content: `Speech: "${text.substring(0, 50)}..."`,
      preview: text,
    });
    
    toast.success('Speech captured', { duration: 1000 });
  }, [appendTranscript, addCaptureLog]);

  // Start presentation
  const startPresentation = () => {
    setIsPresenting(true);
    setDuration(0);
    setOcrCount(0);
    toast.success('Presentation started! Share your screen and explain your project.');
  };

  // End presentation and proceed to interview
  const endPresentation = async () => {
    setIsPresenting(false);
    setPresentationDuration(duration);
    setPhase('interview');

    toast.success('Presentation complete! Preparing interview questions...');
    
    // Navigate to interview
    router.push('/interview');
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/setup">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Phase 1: Presentation</h1>
              <p className="text-slate-400 text-sm">Share your screen and explain your project</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="font-mono text-lg text-white">{formatTime(duration)}</span>
            </div>

            {/* OCR Counter */}
            <Badge variant="secondary" className="gap-1">
              <ScanText className="w-3 h-3" />
              OCR: {ocrCount}
            </Badge>

            {/* Phase indicator */}
            <div className="hidden md:flex gap-2">
              <Badge variant="success">0. Setup</Badge>
              <Badge variant="info">1. Present</Badge>
              <Badge variant="secondary">2. Interview</Badge>
              <Badge variant="secondary">3. Evaluate</Badge>
            </div>
          </div>
        </div>

        {/* Resume banner if uploaded */}
        {resume && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
            <FileText className="w-5 h-5 text-yellow-400" />
            <div className="flex-1">
              <span className="text-yellow-400 font-medium">Resume: </span>
              <span className="text-yellow-200">{resume.fileName}</span>
              <span className="text-yellow-400/70 ml-2">({resume.skills.length} skills)</span>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Left: Screen capture & Voice */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Monitor className="w-5 h-5 text-blue-400" />
                  Screen Capture
                  {isAnalyzing && (
                    <Badge variant="info" className="ml-2">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      AI Vision
                    </Badge>
                  )}
                  {isRunningOCR && (
                    <Badge variant="secondary" className="ml-1">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      OCR {ocrProgress}%
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScreenCapture
                  onCapture={handleCapture}
                  onScreenChange={handleScreenChange}
                  isActive={isPresenting}
                  captureInterval={5000}
                />
              </CardContent>
            </Card>

            {/* Voice recorder */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mic className="w-5 h-5 text-purple-400" />
                  Voice Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceRecorder
                  onTranscript={handleTranscript}
                  isActive={isPresenting}
                  continuous={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Middle: Live Capture Display + OCR Output */}
          <div className="space-y-4">
            <LiveCaptureDisplay />
            
            {/* Latest OCR Text */}
            <Card className="border-purple-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ScanText className="w-4 h-4 text-purple-400" />
                  Tesseract OCR Output
                  {isRunningOCR && (
                    <div className="ml-auto flex items-center gap-2">
                      <Progress value={ocrProgress} className="w-16 h-1.5" />
                      <span className="text-xs text-slate-400">{ocrProgress}%</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 overflow-y-auto p-2 rounded-lg bg-slate-900/50 text-xs text-slate-400 font-mono">
                  {latestOCR ? (
                    <>
                      <p className="text-green-400 mb-2">✓ Text extracted from screen:</p>
                      {latestOCR.substring(0, 600)}
                      {latestOCR.length > 600 && '...'}
                    </>
                  ) : (
                    <p className="text-slate-500 italic">
                      OCR output will appear here when screen changes are detected...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Status & Controls */}
          <div className="space-y-4">
            {/* Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="w-5 h-5 text-green-400" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-white">{Math.min(duration / 180 * 100, 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(duration / 180 * 100, 100)} />
                  <p className="text-xs text-slate-500 mt-1">Recommended: 3-5 min</p>
                </div>

                {/* Detected technologies */}
                <div>
                  <p className="text-sm text-slate-400 mb-2">Technologies ({detectedTechnologies.length})</p>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {detectedTechnologies.length > 0 ? (
                      detectedTechnologies.slice(0, 15).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm">
                        Start presenting...
                      </span>
                    )}
                    {detectedTechnologies.length > 15 && (
                      <Badge variant="secondary" className="text-xs">
                        +{detectedTechnologies.length - 15}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* AI Vision output preview */}
                {screenContext && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">AI Vision</p>
                    <div className="p-2 rounded-lg bg-slate-800/50 text-xs text-slate-300 max-h-20 overflow-y-auto">
                      {screenContext.slice(0, 150)}...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transcript */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Transcript</span>
                  <Badge variant="secondary" className="text-xs">
                    {transcript.split(' ').filter(Boolean).length} words
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-28 overflow-y-auto p-2 rounded-lg bg-slate-800/50 text-sm text-slate-300">
                  {transcript || (
                    <span className="text-slate-500 italic">
                      Speech will appear here...
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="space-y-3">
              {!isPresenting ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button
                    onClick={startPresentation}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Presentation
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={endPresentation}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={duration < 30}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    End & Interview
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  {duration < 30 && (
                    <p className="text-xs text-center text-slate-500">
                      Present for at least 30 seconds
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Tips */}
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="text-blue-300 font-medium">Tips:</p>
                    <ul className="text-blue-200/70 mt-1 space-y-1">
                      <li>• Show code & architecture</li>
                      <li>• Explain your decisions</li>
                      <li>• Demo features</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}