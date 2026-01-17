import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion, PROMPTS } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'generate_questions': {
        const { context, technologies, transcript, count = 5 } = data;

        const prompt = PROMPTS.QUESTION_GENERATOR.replace('{count}', count.toString());
        
        const messages = [
          { role: 'system' as const, content: prompt },
          {
            role: 'user' as const,
            content: `Context from screen captures:
${context || 'No screen context available'}

Technologies detected: ${technologies?.join(', ') || 'Not specified'}

Student's presentation transcript:
${transcript || 'No transcript available'}

Generate ${count} interview questions.`,
          },
        ];

        const response = await chatCompletion(messages, { temperature: 0.7 });

        // Parse JSON array from response
        try {
          // Find JSON array in response
          const match = response?.match(/\[[\s\S]*\]/);
          if (match) {
            const questions = JSON.parse(match[0]);
            return NextResponse.json({ questions });
          }
        } catch (e) {
          console.error('Failed to parse questions:', e);
        }

        // Fallback: split by newlines if JSON parsing fails
        const questions = response
          ?.split('\n')
          .filter((line) => line.trim() && line.includes('?'))
          .slice(0, count) || [];

        return NextResponse.json({ questions });
      }

      case 'generate_followup': {
        const { question, response: studentResponse, context } = data;

        const prompt = PROMPTS.FOLLOWUP_GENERATOR
          .replace('{question}', question)
          .replace('{response}', studentResponse)
          .replace('{context}', context || 'No additional context');

        const messages = [
          { role: 'user' as const, content: prompt },
        ];

        const followup = await chatCompletion(messages, { temperature: 0.7 });

        return NextResponse.json({ followup: followup?.trim() });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
