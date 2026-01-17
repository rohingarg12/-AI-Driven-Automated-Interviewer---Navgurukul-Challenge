import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage, PROMPTS } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const analysis = await analyzeImage(imageBase64, PROMPTS.SCREEN_ANALYZER);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Screen analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze screen' },
      { status: 500 }
    );
  }
}
