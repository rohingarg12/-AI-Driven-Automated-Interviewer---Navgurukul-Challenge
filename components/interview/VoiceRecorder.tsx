'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  isActive: boolean;
  continuous?: boolean;
}

export function VoiceRecorder({
  onTranscript,
  isActive,
  continuous = true,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const transcribeAudio = async (audioBlob: Blob) => {
    // Check if blob has data
    if (audioBlob.size < 1000) {
      console.warn('Audio blob too small, skipping transcription:', audioBlob.size);
      return;
    }

    setIsTranscribing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      console.log('Sending audio for transcription, size:', audioBlob.size);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.transcript && data.transcript.trim()) {
          console.log('Transcription received:', data.transcript);
          onTranscript(data.transcript);
        }
      } else {
        const errorData = await response.json();
        console.error('Transcription failed:', errorData);
        setError('Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setError('Transcription error');
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });
      streamRef.current = stream;

      // Set up audio level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Monitor audio levels
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        if (isRecording) {
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };

      // Determine best mime type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      console.log('Using mime type:', mimeType);

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available, size:', event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, chunks:', chunksRef.current.length);
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          console.log('Created audio blob, size:', audioBlob.size);
          chunksRef.current = [];
          await transcribeAudio(audioBlob);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Start recording - request data every 1 second for continuous mode
      if (continuous) {
        mediaRecorder.start(1000);
      } else {
        mediaRecorder.start();
      }
      
      setIsRecording(true);
      animationFrameRef.current = requestAnimationFrame(updateLevel);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to access microphone');
    }
  };

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
    setAudioLevel(0);
  }, []);

  // Auto-start/stop based on isActive
  useEffect(() => {
    if (isActive && !isRecording) {
      startRecording();
    } else if (!isActive && isRecording) {
      stopRecording();
    }
    
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isActive, isRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  // Periodic transcription for continuous mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && isRecording && continuous) {
      interval = setInterval(() => {
        if (mediaRecorderRef.current && 
            mediaRecorderRef.current.state === 'recording' &&
            chunksRef.current.length > 0) {
          // Stop and restart to get accumulated audio
          mediaRecorderRef.current.stop();
          
          // Restart after a brief pause
          setTimeout(() => {
            if (isActive && streamRef.current) {
              const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
              const newRecorder = new MediaRecorder(streamRef.current, {
                mimeType,
                audioBitsPerSecond: 128000,
              });
              
              newRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  chunksRef.current.push(event.data);
                }
              };
              
              newRecorder.onstop = async () => {
                if (chunksRef.current.length > 0) {
                  const audioBlob = new Blob(chunksRef.current, { type: mimeType });
                  chunksRef.current = [];
                  await transcribeAudio(audioBlob);
                }
              };
              
              mediaRecorderRef.current = newRecorder;
              newRecorder.start(1000);
            }
          }, 100);
        }
      }, 10000); // Transcribe every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isRecording, continuous]);

  return (
    <div className="space-y-4">
      {/* Recording indicator */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${isRecording ? 'bg-red-500/20' : 'bg-slate-800'}`}>
            {isRecording ? (
              <Mic className="w-6 h-6 text-red-400" />
            ) : (
              <MicOff className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div>
            <p className="font-medium text-white">
              {isRecording ? 'Recording...' : 'Microphone'}
            </p>
            <p className="text-sm text-slate-400">
              {isRecording ? 'Speak clearly' : 'Ready to record'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
          {isTranscribing && (
            <Badge variant="info">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Transcribing
            </Badge>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      {/* Audio level visualization */}
      {isRecording && (
        <div className="flex items-center justify-center gap-1 h-12">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(8, audioLevel * 100 * (1 + Math.sin(i * 0.5 + Date.now() / 200) * 0.5))}%`,
                opacity: audioLevel > 0.05 ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      )}

      {/* Manual controls (when not auto-controlled) */}
      {!isActive && (
        <div className="flex gap-4">
          {!isRecording ? (
            <Button onClick={startRecording} className="flex-1">
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="flex-1">
              <MicOff className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>
      )}
    </div>
  );
}