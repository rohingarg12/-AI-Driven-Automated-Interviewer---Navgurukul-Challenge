'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Camera,
  FileText,
  Mic,
  Brain,
  ChevronDown,
  ChevronUp,
  Image,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInterviewStore, CaptureLog } from '@/lib/store';

const TYPE_CONFIG: Record<CaptureLog['type'], { icon: any; color: string; label: string }> = {
  screenshot: { icon: Camera, color: 'text-blue-400', label: 'Screenshot' },
  ocr: { icon: FileText, color: 'text-purple-400', label: 'OCR Text' },
  speech: { icon: Mic, color: 'text-green-400', label: 'Speech' },
  resume: { icon: FileText, color: 'text-yellow-400', label: 'Resume' },
  analysis: { icon: Brain, color: 'text-pink-400', label: 'AI Analysis' },
};

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function LiveCaptureDisplay() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedLog, setSelectedLog] = useState<CaptureLog | null>(null);
  const { captureLogs, screenCaptures } = useInterviewStore();

  const latestCapture = screenCaptures[screenCaptures.length - 1];

  return (
    <Card className="border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4 text-cyan-400" />
            Live Capture Monitor
            {captureLogs.length > 0 && (
              <Badge variant="info" className="ml-2">
                {captureLogs.length} events
              </Badge>
            )}
          </CardTitle>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="space-y-4">
              {/* Latest Screenshot Preview */}
              {latestCapture && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    Latest Screenshot
                  </p>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                    <img
                      src={`data:image/jpeg;base64,${latestCapture.imageBase64}`}
                      alt="Latest capture"
                      className="w-full h-full object-contain"
                    />
                    {latestCapture.analysis && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white/80 line-clamp-2">
                          {latestCapture.analysis.substring(0, 150)}...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Capture Event Log */}
              <div className="space-y-2">
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Capture Events
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {captureLogs.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Waiting for captures...
                    </p>
                  ) : (
                    captureLogs.slice().reverse().map((log, i) => {
                      const config = TYPE_CONFIG[log.type];
                      const Icon = config.icon;
                      
                      return (
                        <motion.div
                          key={`${log.timestamp}-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`
                            p-2 rounded-lg bg-slate-800/50 border border-slate-700/50
                            cursor-pointer hover:bg-slate-800 transition-colors
                            ${selectedLog === log ? 'ring-1 ring-blue-500' : ''}
                          `}
                          onClick={() => setSelectedLog(selectedLog === log ? null : log)}
                        >
                          <div className="flex items-start gap-2">
                            <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-white">
                                  {config.label}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {formatTime(log.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {log.content}
                              </p>
                            </div>
                          </div>

                          {/* Expanded preview */}
                          <AnimatePresence>
                            {selectedLog === log && log.preview && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-2 pt-2 border-t border-slate-700"
                              >
                                <pre className="text-xs text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                  {log.preview}
                                </pre>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-700">
                {Object.entries(TYPE_CONFIG).map(([type, config]) => {
                  const count = captureLogs.filter(l => l.type === type).length;
                  const Icon = config.icon;
                  return (
                    <div key={type} className="text-center">
                      <Icon className={`w-4 h-4 ${config.color} mx-auto mb-1`} />
                      <p className="text-lg font-bold text-white">{count}</p>
                      <p className="text-xs text-slate-500">{config.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
