import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Handle different input types
    let audioBlob: Blob;
    
    if (audioFile instanceof File) {
      audioBlob = audioFile;
    } else if (audioFile instanceof Blob) {
      audioBlob = audioFile;
    } else {
      return NextResponse.json(
        { error: 'Invalid audio file format' },
        { status: 400 }
      );
    }

    // Check file size
    if (audioBlob.size < 100) {
      return NextResponse.json(
        { error: 'Audio file is too small or empty' },
        { status: 400 }
      );
    }

    console.log('Received audio file:', {
      size: audioBlob.size,
      type: audioBlob.type,
    });

    // Convert to array buffer and create a proper File object
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determine file extension based on mime type
    let extension = 'webm';
    if (audioBlob.type.includes('mp4')) extension = 'mp4';
    else if (audioBlob.type.includes('ogg')) extension = 'ogg';
    else if (audioBlob.type.includes('wav')) extension = 'wav';
    else if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) extension = 'mp3';

    // Create a File object that Groq SDK expects
    const file = new File([buffer], `audio.${extension}`, { 
      type: audioBlob.type || 'audio/webm'
    });

    console.log('Sending to Groq:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      language: 'en',
      response_format: 'text',
    });

    console.log('Transcription result:', transcription);

    // Handle different response formats
    let transcriptText = '';
    if (typeof transcription === 'string') {
      transcriptText = transcription;
    } else if (transcription && typeof transcription === 'object') {
      transcriptText = (transcription as any).text || JSON.stringify(transcription);
    }

    return NextResponse.json({ transcript: transcriptText.trim() });
  } catch (error: any) {
    console.error('Transcription error:', error);
    
    // Return more detailed error info
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio',
        details: error?.message || 'Unknown error',
        status: error?.status || 500,
      },
      { status: error?.status || 500 }
    );
  }
}