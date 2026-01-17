import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('Starting OCR processing...');
    const startTime = Date.now();

    // Use Tesseract.js for OCR
    const result = await Tesseract.recognize(
      `data:image/png;base64,${imageBase64}`,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      }
    );

    const ocrText = result.data.text.trim();
    const confidence = result.data.confidence;
    const processingTime = Date.now() - startTime;

    console.log(`OCR completed in ${processingTime}ms, confidence: ${confidence}%`);
    console.log('Extracted text preview:', ocrText.substring(0, 200));

    // Extract code-like content
    const codePatterns = ocrText.match(/```[\s\S]*?```|function\s+\w+|const\s+\w+|import\s+.*from|class\s+\w+/g) || [];
    
    // Extract technologies mentioned
    const techKeywords = [
      'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Python', 'JavaScript',
      'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'REST', 'GraphQL',
      'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
      'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap', 'Material-UI'
    ];
    
    const detectedTech = techKeywords.filter(tech => 
      ocrText.toLowerCase().includes(tech.toLowerCase())
    );

    return NextResponse.json({
      text: ocrText,
      confidence,
      processingTime,
      codeSnippets: codePatterns,
      detectedTechnologies: detectedTech,
      wordCount: ocrText.split(/\s+/).filter(Boolean).length,
    });
  } catch (error: any) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed', details: error?.message },
      { status: 500 }
    );
  }
}
