'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  Brain,
  MessageSquare,
  Volume2,
  Loader2,
  CheckCircle2,
  Clock,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTextToSpeech } from '@/components/interview/TextToSpeech';
import { useInterviewStore } from '@/lib/store';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function InterviewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const {
    screenCaptures,
    transcript,
    detectedTechnologies,
    questions,
    setQuestions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    addQAPair,
    qaPairs,
    setPhase,
  } = useInterviewStore();

  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech({});

  const currentQuestion = questions[currentQuestionIndex] || '';
  const progress = questions.length > 0 
    ? ((currentQuestionIndex + 1) / questions.length) * 100 
    : 0;

  // Timer for current question
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isLoading && currentQuestion) {
      interval = setInterval(() => {
        setElapsedTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading, currentQuestion, currentQuestionIndex]);

  // Generate questions on mount
  useEffect(() => {
    const generateQuestions = async () => {
      setIsLoading(true);
      try {
        // Get latest screen analysis
        const latestCapture = screenCaptures[screenCaptures.length - 1];
        const context = latestCapture?.analysis || '';

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_questions',
            data: {
              context,
              technologies: detectedTechnologies,
              transcript,
              count: 5,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
            toast.success(`Generated ${data.questions.length} interview questions`);
          } else {
            // Fallback questions
            setQuestions([
              'Can you explain the main purpose of your project?',
              'What technologies did you choose and why?',
              'What was the most challenging part of building this?',
              'How would you improve this project given more time?',
              'Can you walk me through the main architecture?',
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to generate questions:', error);
        // Fallback
        setQuestions([
          'Can you explain the main purpose of your project?',
          'What technologies did you choose and why?',
          'What was the most challenging part of building this?',
          'How would you improve this project given more time?',
          'Can you walk me through the main architecture?',
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    generateQuestions();
  }, []);

  // Speak question when it changes
  useEffect(() => {
    if (currentQuestion && !isLoading) {
      speak(currentQuestion);
      setElapsedTime(0);
      setCurrentResponse('');
    }
  }, [currentQuestion, isLoading]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeResponse(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      stopSpeaking(); // Stop AI speaking when user starts talking
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  // Transcribe response
  const transcribeResponse = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'response.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentResponse(data.transcript || '');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe response');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit answer and move to next question
  const submitAnswer = () => {
    if (!currentResponse.trim()) {
      toast.error('Please provide a response first');
      return;
    }

    // Save Q&A pair
    addQAPair({
      question: currentQuestion,
      response: currentResponse,
      timestamp: Date.now(),
    });

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishInterview();
    }
  };

  // Skip current question
  const skipQuestion = () => {
    addQAPair({
      question: currentQuestion,
      response: '[Skipped]',
      timestamp: Date.now(),
    });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishInterview();
    }
  };

  // Finish interview
  const finishInterview = () => {
    setPhase('evaluation');
    toast.success('Interview complete! Generating evaluation...');
    router.push('/evaluation');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Generating Questions</h2>
          <p className="text-slate-400">Analyzing your presentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/presentation">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Phase 2: Interview</h1>
              <p className="text-slate-400">Answer questions about your project</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary">1. Present</Badge>
            <Badge variant="info">2. Interview</Badge>
            <Badge variant="secondary">3. Evaluate</Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-white">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question & Response */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Question */}
            <Card className="border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  AI Question
                  {isSpeaking && (
                    <Badge variant="info" className="ml-2">
                      <Volume2 className="w-3 h-3 mr-1 animate-pulse" />
                      Speaking
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg text-white"
                  >
                    {currentQuestion}
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center gap-2 mt-4 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  Time elapsed: {formatTime(elapsedTime)}
                </div>
              </CardContent>
            </Card>

            {/* Response Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  Your Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recording controls */}
                <div className="flex gap-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                      disabled={isProcessing}
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Hold to Speak
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                      className="flex-1"
                    >
                      <MicOff className="w-5 h-5 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                </div>

                {/* Recording indicator */}
                {isRecording && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-400">Recording...</span>
                  </div>
                )}

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-slate-400">Transcribing...</span>
                  </div>
                )}

                {/* Response transcript */}
                <div className="min-h-[100px] p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  {currentResponse ? (
                    <p className="text-white">{currentResponse}</p>
                  ) : (
                    <p className="text-slate-500 italic">
                      Click "Hold to Speak" and answer the question...
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={submitAnswer}
                    size="lg"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!currentResponse.trim() || isRecording || isProcessing}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {currentQuestionIndex < questions.length - 1
                      ? 'Submit & Next'
                      : 'Submit & Finish'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  <Button
                    onClick={skipQuestion}
                    variant="outline"
                    size="lg"
                    disabled={isRecording || isProcessing}
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Q&A History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Interview Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        i === currentQuestionIndex
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : i < currentQuestionIndex
                          ? 'bg-green-500/10'
                          : 'bg-slate-800/50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i < currentQuestionIndex
                            ? 'bg-green-500 text-white'
                            : i === currentQuestionIndex
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {i < currentQuestionIndex ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <p className={`text-sm flex-1 ${
                        i === currentQuestionIndex ? 'text-white' : 'text-slate-400'
                      }`}>
                        {q.slice(0, 50)}...
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {qaPairs.length}
                    </div>
                    <div className="text-xs text-slate-400">Answered</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {questions.length - qaPairs.length}
                    </div>
                    <div className="text-xs text-slate-400">Remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Finish early */}
            {qaPairs.length >= 3 && currentQuestionIndex < questions.length - 1 && (
              <Button
                onClick={finishInterview}
                variant="outline"
                className="w-full"
              >
                End Interview Early
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}