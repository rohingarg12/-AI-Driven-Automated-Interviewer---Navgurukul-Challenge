import { NextRequest, NextResponse } from 'next/server';

// Edge TTS endpoint (using browser's built-in speech synthesis as fallback)
// For production, you'd use the edge-tts npm package server-side
// This route provides voice options and lets the client handle TTS

export async function GET(request: NextRequest) {
  // Return available voices for client-side TTS
  const voices = [
    { id: 'en-US-GuyNeural', name: 'Guy (US Male)', lang: 'en-US' },
    { id: 'en-US-JennyNeural', name: 'Jenny (US Female)', lang: 'en-US' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)', lang: 'en-GB' },
    { id: 'en-IN-NeerjaNeural', name: 'Neerja (Indian Female)', lang: 'en-IN' },
    { id: 'en-IN-PrabhatNeural', name: 'Prabhat (Indian Male)', lang: 'en-IN' },
  ];

  return NextResponse.json({ voices });
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'en-US-GuyNeural' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // For now, we'll use client-side Web Speech API
    // In production, you could integrate with edge-tts or other TTS services
    
    // Return the text back - client will handle TTS
    return NextResponse.json({ 
      text,
      voice,
      useClientTTS: true,
      message: 'Use Web Speech API on client for TTS'
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
