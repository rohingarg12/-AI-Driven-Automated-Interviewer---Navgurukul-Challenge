'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  RotateCcw,
  Trophy,
  Target,
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useInterviewStore, Evaluation } from '@/lib/store';
import { toast } from 'sonner';

const GRADE_COLORS: Record<string, string> = {
  'A': 'text-green-400',
  'B': 'text-blue-400',
  'C': 'text-yellow-400',
  'D': 'text-orange-400',
  'F': 'text-red-400',
};

const SCORE_LABELS: Record<string, string> = {
  technical_depth: 'Technical Depth',
  clarity: 'Clarity of Explanation',
  originality: 'Originality',
  implementation: 'Implementation Quality',
  communication: 'Communication',
};

export default function EvaluationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const {
    qaPairs,
    screenCaptures,
    transcript,
    detectedTechnologies,
    presentationDuration,
    evaluation,
    setEvaluation,
    reset,
  } = useInterviewStore();

  // Generate evaluation on mount
  useEffect(() => {
    const generateEvaluation = async () => {
      setIsLoading(true);
      try {
        const latestCapture = screenCaptures[screenCaptures.length - 1];

        const response = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qaPairs,
            context: latestCapture?.analysis || '',
            technologies: detectedTechnologies,
            transcript,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setEvaluation(data.evaluation);
          toast.success('Evaluation complete!');
        }
      } catch (error) {
        console.error('Evaluation error:', error);
        toast.error('Failed to generate evaluation');
      } finally {
        setIsLoading(false);
      }
    };

    if (qaPairs.length > 0) {
      generateEvaluation();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Generate PDF report
  const downloadReport = async () => {
    if (!evaluation) return;

    setIsGeneratingPDF(true);
    try {
      // Dynamic import for client-side only
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Title
      doc.setFontSize(24);
      doc.setTextColor(59, 130, 246);
      doc.text('AI Interview Evaluation Report', 20, 20);

      // Grade
      doc.setFontSize(48);
      doc.setTextColor(34, 197, 94);
      doc.text(evaluation.grade, 170, 35);

      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

      // Overall Score
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Overall Score: ${evaluation.total_score.toFixed(1)}/10`, 20, 45);

      // Scores section
      doc.setFontSize(14);
      doc.text('Category Scores:', 20, 60);
      
      let y = 70;
      doc.setFontSize(11);
      Object.entries(evaluation.scores).forEach(([key, value]) => {
        const label = SCORE_LABELS[key] || key;
        doc.text(`${label}: ${value}/10`, 25, y);
        y += 8;
      });

      // Strengths
      y += 10;
      doc.setFontSize(14);
      doc.text('Strengths:', 20, y);
      y += 10;
      doc.setFontSize(11);
      evaluation.strengths.forEach((strength) => {
        doc.text(`• ${strength}`, 25, y);
        y += 8;
      });

      // Areas for improvement
      y += 10;
      doc.setFontSize(14);
      doc.text('Areas for Improvement:', 20, y);
      y += 10;
      doc.setFontSize(11);
      evaluation.improvements.forEach((area) => {
        doc.text(`• ${area}`, 25, y);
        y += 8;
      });

      // Feedback
      y += 10;
      doc.setFontSize(14);
      doc.text('Detailed Feedback:', 20, y);
      y += 10;
      doc.setFontSize(10);
      const feedbackLines = doc.splitTextToSize(evaluation.detailed_feedback, 170);
      doc.text(feedbackLines, 20, y);

      // Recommendation
      y += feedbackLines.length * 5 + 15;
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text(`Recommendation: ${evaluation.recommendation}`, 20, y);

      // Q&A Summary (new page)
      if (qaPairs.length > 0) {
        doc.addPage();
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text('Interview Q&A Summary', 20, 20);

        y = 35;
        doc.setFontSize(11);
        qaPairs.forEach((qa, i) => {
          doc.setTextColor(59, 130, 246);
          const qLines = doc.splitTextToSize(`Q${i + 1}: ${qa.question}`, 170);
          doc.text(qLines, 20, y);
          y += qLines.length * 5 + 3;

          doc.setTextColor(0, 0, 0);
          const aLines = doc.splitTextToSize(`A: ${qa.response}`, 170);
          doc.text(aLines, 20, y);
          y += aLines.length * 5 + 10;

          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });
      }

      // Download
      doc.save('interview-evaluation-report.pdf');
      toast.success('Report downloaded!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Start new interview
  const startNew = () => {
    reset();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Generating Evaluation</h2>
          <p className="text-slate-400">Analyzing your interview responses...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Data Available</h2>
            <p className="text-slate-400 mb-4">
              Please complete the presentation and interview phases first.
            </p>
            <Link href="/presentation">
              <Button>Start Presentation</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/interview">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Phase 3: Evaluation</h1>
              <p className="text-slate-400">Your interview results and feedback</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="success">1. Present</Badge>
            <Badge variant="success">2. Interview</Badge>
            <Badge variant="info">3. Evaluate</Badge>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {/* Overall Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 mb-2">Overall Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">
                        {evaluation.total_score.toFixed(1)}
                      </span>
                      <span className="text-2xl text-slate-500">/10</span>
                    </div>
                    <Badge
                      className={`mt-2 ${
                        evaluation.recommendation === 'Pass'
                          ? 'bg-green-500/20 text-green-400'
                          : evaluation.recommendation === 'Conditional Pass'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {evaluation.recommendation}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className={`text-8xl font-bold ${GRADE_COLORS[evaluation.grade]}`}>
                      {evaluation.grade}
                    </div>
                    <p className="text-slate-400 mt-2">Grade</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(evaluation.scores).map(([key, value], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-400 mb-2">
                      {SCORE_LABELS[key] || key}
                    </p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-white">{value}</span>
                      <span className="text-sm text-slate-500 mb-1">/10</span>
                    </div>
                    <Progress 
                      value={value * 10} 
                      className="mt-2"
                      indicatorClassName={
                        value >= 8 ? 'bg-green-500' :
                        value >= 6 ? 'bg-blue-500' :
                        value >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                      }
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-green-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <Trophy className="w-5 h-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {evaluation.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-400">
                    <TrendingUp className="w-5 h-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {evaluation.improvements.map((area, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Target className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Detailed Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Detailed Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed">
                  {evaluation.detailed_feedback}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Q&A Review */}
          {qaPairs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Interview Q&A Review</CardTitle>
                  <CardDescription>
                    {qaPairs.length} questions answered
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {qaPairs.map((qa, i) => (
                      <div key={i} className="p-4 rounded-lg bg-slate-800/50">
                        <p className="text-blue-400 font-medium mb-2">
                          Q{i + 1}: {qa.question}
                        </p>
                        <p className="text-slate-300">
                          A: {qa.response}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={downloadReport}
              size="lg"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              Download Report (PDF)
            </Button>

            <Button
              onClick={startNew}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Start New Interview
            </Button>
          </div>

          {/* Stats summary */}
          <Card className="bg-slate-900/50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {Math.floor(presentationDuration / 60)}:{(presentationDuration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-slate-400">Presentation Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {qaPairs.length}
                  </div>
                  <div className="text-xs text-slate-400">Questions Answered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {detectedTechnologies.length}
                  </div>
                  <div className="text-xs text-slate-400">Technologies Detected</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {screenCaptures.length}
                  </div>
                  <div className="text-xs text-slate-400">Screens Captured</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}