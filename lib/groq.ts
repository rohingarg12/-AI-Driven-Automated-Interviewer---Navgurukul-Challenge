import Groq from 'groq-sdk';

// Initialize Groq client
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Updated Models - January 2025
// Note: llama-3.2-90b-vision-preview is DEPRECATED
// Using Llama 4 Scout for vision (multimodal)
export const MODELS = {
  WHISPER: 'whisper-large-v3-turbo',
  LLM: 'llama-3.3-70b-versatile',
  VISION: 'meta-llama/llama-4-scout-17b-16e-instruct',
};

// System prompts
export const PROMPTS = {
  SCREEN_ANALYZER: `You are an expert at analyzing technical content from screen captures.
Analyze this screenshot and identify:
1. What type of content is shown (code, slide, diagram, terminal, UI, documentation)
2. Key technologies, frameworks, or tools visible
3. Main concepts or topics being presented
4. Any code snippets worth discussing
5. Potential interview questions based on what you see

Be specific and technical. Focus on actionable insights for generating interview questions.`,

  QUESTION_GENERATOR: `You are an expert technical interviewer evaluating student project presentations.
Based on the context provided (screen content analysis, speech transcript, technologies detected), 
generate thoughtful interview questions that:

1. Test understanding, not just memorization
2. Ask about design decisions and trade-offs
3. Probe into implementation challenges
4. Explore code quality and best practices
5. Discuss future improvements

Generate exactly {count} questions. Return ONLY a JSON array of question strings.
Example: ["Can you explain why you chose React over Vue for this project?", "How does your authentication flow handle token refresh?"]`,

  FOLLOWUP_GENERATOR: `You are conducting a technical interview.
The student was asked: "{question}"
Their response was: "{response}"
Current screen context: {context}

Generate ONE appropriate follow-up question that either:
- Probes deeper if the answer was superficial
- Clarifies any ambiguities
- Challenges their understanding if they seem confident
- Connects to other aspects of their project

Return ONLY the follow-up question as a string (no quotes, no JSON).`,

  EVALUATOR: `You are evaluating a student's project presentation interview.

Questions and Responses:
{qa_pairs}

Project Context:
{context}

Evaluate and score the student on these criteria (1-10 each):
1. Technical Depth - Understanding of implementation details
2. Clarity of Explanation - Ability to explain concepts clearly  
3. Originality - Unique aspects and creative solutions
4. Implementation Quality - Code quality and architecture decisions
5. Communication - Overall presentation and response quality

Return a JSON object with this exact structure:
{
  "scores": {
    "technical_depth": <number 1-10>,
    "clarity": <number 1-10>,
    "originality": <number 1-10>,
    "implementation": <number 1-10>,
    "communication": <number 1-10>
  },
  "total_score": <weighted average out of 10>,
  "grade": "<A/B/C/D/F>",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "detailed_feedback": "A comprehensive paragraph of constructive feedback...",
  "recommendation": "Pass/Conditional Pass/Needs Review"
}`,
};

// Chat completion
export async function chatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
) {
  const response = await groq.chat.completions.create({
    model: MODELS.LLM,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000,
  });

  return response.choices[0].message.content;
}

// Vision analysis using Llama 4 Scout
export async function analyzeImage(
  imageBase64: string,
  prompt: string
): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model: MODELS.VISION,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    return response.choices[0].message.content || '';
  } catch (error: any) {
    console.error('Vision API error:', error?.message || error);
    return 'Unable to analyze screen content. Continuing without screen analysis.';
  }
}

// Speech to text
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type });
  
  const transcription = await groq.audio.transcriptions.create({
    file,
    model: MODELS.WHISPER,
    language: 'en',
    response_format: 'text',
  });

  return transcription.text;
}