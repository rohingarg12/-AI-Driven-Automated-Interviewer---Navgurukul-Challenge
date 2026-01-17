'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  Monitor,
  Mic,
  Brain,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResumeUpload } from '@/components/interview/ResumeUpload';
import { useInterviewStore } from '@/lib/store';

const INTERVIEW_PHASES = [
  {
    title: 'Resume Analysis',
    description: 'AI extracts skills and experience from your resume',
    icon: FileText,
    color: 'text-yellow-400',
  },
  {
    title: 'Screen Presentation',
    description: 'Share your screen and present your project',
    icon: Monitor,
    color: 'text-blue-400',
  },
  {
    title: 'Voice Recording',
    description: 'Explain your project while AI listens',
    icon: Mic,
    color: 'text-green-400',
  },
  {
    title: 'AI Interview',
    description: 'Answer personalized questions based on your resume & project',
    icon: Brain,
    color: 'text-purple-400',
  },
];

export default function SetupPage() {
  const router = useRouter();
  const { resume, setPhase } = useInterviewStore();

  const handleStartPresentation = () => {
    setPhase('presentation');
    router.push('/presentation');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Interview Setup</h1>
              <p className="text-slate-400">Prepare your resume and get ready</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="info">1. Setup</Badge>
            <Badge variant="secondary">2. Present</Badge>
            <Badge variant="secondary">3. Interview</Badge>
            <Badge variant="secondary">4. Results</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Resume Upload */}
          <div className="space-y-6">
            <ResumeUpload />

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Tips for Best Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    Use a clear, well-formatted resume
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    Include your technical skills and projects
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    PNG/JPG images work best for OCR
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    Prepare your project screen for sharing
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right: Process Overview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interview Process</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {INTERVIEW_PHASES.map((phase, i) => (
                    <motion.div
                      key={phase.title}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/50"
                    >
                      <div className={`p-2 rounded-lg bg-slate-800 ${phase.color}`}>
                        <phase.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{phase.title}</h3>
                        <p className="text-sm text-slate-400">{phase.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What AI will analyze */}
            <Card className="border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <Brain className="w-5 h-5" />
                  What AI Analyzes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Resume skills & experience',
                    'Code on your screen',
                    'UI/UX design',
                    'Architecture diagrams',
                    'Your verbal explanation',
                    'Technical terminology',
                    'Project documentation',
                    'Problem-solving approach',
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-slate-400"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Start Button */}
            <Button
              onClick={handleStartPresentation}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {resume ? 'Start with Resume' : 'Start without Resume'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            {!resume && (
              <p className="text-center text-sm text-slate-500">
                You can skip resume upload, but questions will be based only on your presentation
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}