'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Brain,
  Mic,
  Monitor,
  FileText,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Target,
  Eye,
  Zap,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FEATURES = [
  {
    icon: Upload,
    title: 'Resume Upload',
    description: 'Upload your resume for personalized questions based on your skills & experience',
    color: 'text-yellow-400',
  },
  {
    icon: Monitor,
    title: 'Screen Capture + OCR',
    description: 'AI captures your screen and extracts text using Tesseract OCR',
    color: 'text-blue-400',
  },
  {
    icon: Mic,
    title: 'Voice Recognition',
    description: 'Real-time speech-to-text using Groq Whisper with 95%+ accuracy',
    color: 'text-purple-400',
  },
  {
    icon: Eye,
    title: 'AI Vision Analysis',
    description: 'Llama 4 Scout understands code, diagrams, and UI from your screen',
    color: 'text-cyan-400',
  },
  {
    icon: Brain,
    title: 'Smart Questions',
    description: 'Context-aware questions based on your resume + project presentation',
    color: 'text-green-400',
  },
  {
    icon: Target,
    title: 'Detailed Evaluation',
    description: 'Scoring on technical depth, clarity, originality & implementation',
    color: 'text-pink-400',
  },
];

const PROCESS_STEPS = [
  { step: 1, title: 'Upload Resume', desc: 'Optional but recommended' },
  { step: 2, title: 'Present Project', desc: 'Share screen & explain' },
  { step: 3, title: 'Answer Questions', desc: 'AI asks personalized questions' },
  { step: 4, title: 'Get Feedback', desc: 'Detailed evaluation report' },
];

export default function HomePage() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/setup');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-pink-600/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by Groq + Llama 4 + Tesseract OCR
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              AI Project{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                Interviewer
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              Upload your resume, present your project, and let AI conduct an adaptive interview.
              Get personalized questions and detailed feedback.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={handleStart}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8"
              >
                Start Interview
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Badge variant="outline" className="px-4 py-2">
                <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                100% Free - No API costs
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-12 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PROCESS_STEPS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">{item.step}</span>
                </div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400">Comprehensive AI-powered interview system</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:border-slate-600 transition-colors">
                  <CardContent className="pt-6">
                    <feature.icon className={`w-10 h-10 ${feature.color} mb-4`} />
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Captured Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-white mb-3">What AI Captures & Analyzes</h2>
            <p className="text-slate-400">Live preview of everything being processed</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-yellow-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-yellow-400" />
                  <h3 className="font-semibold text-white">From Your Resume</h3>
                </div>
                <ul className="space-y-2">
                  {['Skills & technologies', 'Work experience', 'Education background', 'Project descriptions'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Monitor className="w-6 h-6 text-blue-400" />
                  <h3 className="font-semibold text-white">From Your Screen</h3>
                </div>
                <ul className="space-y-2">
                  {['Code snippets (OCR)', 'UI/UX design', 'Architecture diagrams', 'Terminal output'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mic className="w-6 h-6 text-purple-400" />
                  <h3 className="font-semibold text-white">From Your Voice</h3>
                </div>
                <ul className="space-y-2">
                  {['Technical explanations', 'Design decisions', 'Problem-solving approach', 'Communication clarity'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-green-400" />
                  <h3 className="font-semibold text-white">AI Generates</h3>
                </div>
                <ul className="space-y-2">
                  {['Personalized questions', 'Follow-up probes', 'Technical deep-dives', 'Detailed evaluation'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-white mb-6">Tech Stack</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Next.js 15', 'React 19', 'Groq API', 'Llama 4 Scout', 'Whisper STT',
              'Tesseract OCR', 'Zustand', 'Tailwind CSS', 'Framer Motion'
            ].map((tech) => (
              <Badge key={tech} variant="outline" className="text-sm">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
          <p className="text-slate-400 mb-8">
            Upload your resume and present your project to get personalized interview questions
          </p>
          <Button
            size="lg"
            onClick={handleStart}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8"
          >
            Begin Interview Setup
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center text-slate-500 text-sm">
          Built for Navgurukul AI/ML Challenge • Powered by Groq, Llama, Whisper & Tesseract
        </div>
      </footer>
    </div>
  );
}