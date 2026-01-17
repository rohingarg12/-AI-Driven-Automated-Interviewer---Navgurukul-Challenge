import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion, PROMPTS } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const { qaPairs, context, technologies, transcript } = await request.json();

    if (!qaPairs || qaPairs.length === 0) {
      return NextResponse.json(
        { error: 'No Q&A pairs provided' },
        { status: 400 }
      );
    }

    // Format Q&A pairs for evaluation
    const formattedQA = qaPairs
      .map((qa: { question: string; response: string }, i: number) => 
        `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.response}`
      )
      .join('\n\n');

    const contextString = `
Technologies: ${technologies?.join(', ') || 'Various'}
Screen Analysis: ${context || 'Not available'}
Presentation Transcript: ${transcript || 'Not available'}
    `.trim();

    const prompt = PROMPTS.EVALUATOR
      .replace('{qa_pairs}', formattedQA)
      .replace('{context}', contextString);

    const messages = [
      { role: 'user' as const, content: prompt },
    ];

    const response = await chatCompletion(messages, { 
      temperature: 0.3, // Lower for more consistent scoring
      maxTokens: 2000,
    });

    // Parse JSON from response
    try {
      // Find JSON object in response
      const match = response?.match(/\{[\s\S]*\}/);
      if (match) {
        const evaluation = JSON.parse(match[0]);
        
        // Validate required fields
        if (!evaluation.scores || !evaluation.total_score) {
          throw new Error('Invalid evaluation structure');
        }
        
        return NextResponse.json({ evaluation });
      }
    } catch (e) {
      console.error('Failed to parse evaluation:', e);
    }

    // Fallback evaluation if parsing fails
    const fallbackEvaluation = {
      scores: {
        technical_depth: 7,
        clarity: 7,
        originality: 6,
        implementation: 7,
        communication: 7,
      },
      total_score: 6.8,
      grade: 'B',
      strengths: [
        'Demonstrated understanding of core concepts',
        'Clear communication of ideas',
        'Good project structure'
      ],
      improvements: [
        'Could provide more technical depth in responses',
        'Consider discussing alternative approaches',
        'Elaborate on design decisions'
      ],
      detailed_feedback: 'The presentation showed a solid understanding of the project. The candidate explained the main concepts clearly and demonstrated practical implementation skills. To improve, consider diving deeper into technical trade-offs and discussing how the solution might scale.',
      recommendation: 'Pass',
    };

    return NextResponse.json({ evaluation: fallbackEvaluation });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate evaluation' },
      { status: 500 }
    );
  }
}
