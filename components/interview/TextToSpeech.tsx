'use client';

import { useCallback, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextToSpeechProps {
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export function useTextToSpeech({ onSpeakingChange }: TextToSpeechProps = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(
    (text: string, options?: { rate?: number; pitch?: number; voice?: string }) => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Configure voice
      utterance.rate = options?.rate ?? 1;
      utterance.pitch = options?.pitch ?? 1;

      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.name.includes('Guy') ||
          v.name.includes('Daniel') ||
          v.name.includes('English') && v.name.includes('Male')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        onSpeakingChange?.(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        onSpeakingChange?.(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        onSpeakingChange?.(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [onSpeakingChange]
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    onSpeakingChange?.(false);
  }, [onSpeakingChange]);

  return { speak, stop, isSpeaking };
}

// TTS Control Component
export function TTSControl() {
  const [enabled, setEnabled] = useState(true);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setEnabled(!enabled)}
      title={enabled ? 'Mute AI voice' : 'Unmute AI voice'}
    >
      {enabled ? (
        <Volume2 className="w-5 h-5 text-slate-400" />
      ) : (
        <VolumeX className="w-5 h-5 text-slate-500" />
      )}
    </Button>
  );
}
