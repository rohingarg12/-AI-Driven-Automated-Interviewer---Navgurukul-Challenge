'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, MonitorOff, Camera } from 'lucide-react';
import { canvasToBase64 } from '@/lib/utils';

interface ScreenCaptureProps {
  onCapture: (imageBase64: string) => void;
  onScreenChange: (imageBase64: string) => void;
  isActive: boolean;
  captureInterval?: number;
}

export function ScreenCapture({
  onCapture,
  onScreenChange,
  isActive,
  captureInterval = 5000,
}: ScreenCaptureProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureCount, setCaptureCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFrameRef = useRef<string | null>(null);
  
  // Use refs for callbacks to avoid dependency issues
  const onCaptureRef = useRef(onCapture);
  const onScreenChangeRef = useRef(onScreenChange);
  
  // Update refs when callbacks change
  useEffect(() => {
    onCaptureRef.current = onCapture;
    onScreenChangeRef.current = onScreenChange;
  }, [onCapture, onScreenChange]);

  const startScreenShare = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setIsSharing(true);
    } catch (err) {
      console.error('Screen share error:', err);
      setError('Failed to start screen sharing. Please try again.');
    }
  };

  const stopScreenShare = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSharing(false);
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isSharing) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Make sure video has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    const imageBase64 = canvasToBase64(canvas);
    
    return imageBase64;
  }, [isSharing]);

  // Capture frames at interval when active
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isActive || !isSharing) {
      return;
    }

    console.log('Starting screen capture interval...');

    // Small delay to ensure video is ready
    const startCapture = () => {
      const frame = captureFrame();
      if (frame) {
        console.log('Captured frame, size:', frame.length);
        onCaptureRef.current(frame);
        setCaptureCount(prev => prev + 1);
        
        // Check for significant change
        if (lastFrameRef.current && 
            Math.abs(frame.length - lastFrameRef.current.length) > 1000) {
          console.log('Screen change detected, running analysis...');
          onScreenChangeRef.current(frame);
        }
        lastFrameRef.current = frame;
      }
    };

    // Initial capture after short delay
    const initialTimeout = setTimeout(startCapture, 1000);

    // Set up interval for subsequent captures
    intervalRef.current = setInterval(startCapture, captureInterval);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isSharing, captureInterval, captureFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, [stopScreenShare]);

  return (
    <div className="space-y-4">
      {/* Video preview */}
      <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          muted
        />
        
        {!isSharing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <Monitor className="w-16 h-16 mb-4" />
            <p>Click "Share Screen" to begin</p>
          </div>
        )}

        {isSharing && (
          <Badge 
            variant="success" 
            className="absolute top-4 left-4"
          >
            <Camera className="w-3 h-3 mr-1" />
            Recording
          </Badge>
        )}

        {isActive && isSharing && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">
              Captures: {captureCount}
            </span>
          </div>
        )}
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex gap-4">
        {!isSharing ? (
          <Button
            onClick={startScreenShare}
            className="flex-1"
            size="lg"
          >
            <Monitor className="w-5 h-5 mr-2" />
            Share Screen
          </Button>
        ) : (
          <Button
            onClick={stopScreenShare}
            variant="destructive"
            className="flex-1"
            size="lg"
          >
            <MonitorOff className="w-5 h-5 mr-2" />
            Stop Sharing
          </Button>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}