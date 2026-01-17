import { NextRequest, NextResponse } from 'next/server';

// Skills keywords to detect
const SKILL_KEYWORDS = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
  // Frontend
  'React', 'Vue', 'Angular', 'Next\\.js', 'Svelte', 'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap', 'jQuery',
  // Backend
  'Node\\.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Rails', 'ASP\\.NET',
  // Database
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase', 'SQLite', 'DynamoDB', 'Oracle', 'SQL',
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Linux', 'Nginx',
  // AI/ML
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'NLP', 'Machine Learning', 'Deep Learning', 'AI',
  // Tools
  'Git', 'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum', 'JIRA', 'Figma',
];

// Display names for skills (for output)
const SKILL_DISPLAY_NAMES: Record<string, string> = {
  'C\\+\\+': 'C++',
  'C#': 'C#',
  'Next\\.js': 'Next.js',
  'Node\\.js': 'Node.js',
  'ASP\\.NET': 'ASP.NET',
};

// Education keywords
const EDUCATION_KEYWORDS = [
  'Bachelor', 'Master', 'PhD', 'B.Tech', 'M.Tech', 'B.E.', 'M.E.', 'BCA', 'MCA', 'BSc', 'MSc', 'MBA',
  'Computer Science', 'Information Technology', 'Software Engineering', 'Data Science', 'Engineering',
  'University', 'College', 'Institute', 'School', 'Degree', 'Diploma'
];

// Experience keywords
const EXPERIENCE_KEYWORDS = [
  'Experience', 'Work', 'Employment', 'Internship', 'Project', 'Position', 'Role',
  'Developer', 'Engineer', 'Analyst', 'Manager', 'Lead', 'Intern', 'Consultant',
  'Senior', 'Junior', 'Full Stack', 'Frontend', 'Backend', 'Software'
];

function extractSections(text: string) {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract skills using regex-safe patterns
  const skills: string[] = [];
  SKILL_KEYWORDS.forEach(skillPattern => {
    try {
      const regex = new RegExp(skillPattern, 'i');
      if (regex.test(text)) {
        // Use display name if available, otherwise clean up the pattern
        const displayName = SKILL_DISPLAY_NAMES[skillPattern] || skillPattern.replace(/\\\\/g, '').replace(/\\/g, '');
        if (!skills.includes(displayName)) {
          skills.push(displayName);
        }
      }
    } catch (e) {
      // If regex fails, do simple includes check
      const simpleName = skillPattern.replace(/\\\\/g, '').replace(/\\/g, '');
      if (text.toLowerCase().includes(simpleName.toLowerCase()) && !skills.includes(simpleName)) {
        skills.push(simpleName);
      }
    }
  });

  // Extract education
  const education: string[] = [];
  lines.forEach(line => {
    const hasEducationKeyword = EDUCATION_KEYWORDS.some(keyword => 
      line.toLowerCase().includes(keyword.toLowerCase())
    );
    if (hasEducationKeyword && line.length > 10 && line.length < 200) {
      education.push(line.trim());
    }
  });

  // Extract experience
  const experience: string[] = [];
  let inExperienceSection = false;
  lines.forEach(line => {
    if (line.toLowerCase().includes('experience') || line.toLowerCase().includes('work history')) {
      inExperienceSection = true;
    }
    if (inExperienceSection && line.length > 20 && line.length < 300) {
      const hasExperienceKeyword = EXPERIENCE_KEYWORDS.some(keyword =>
        line.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasExperienceKeyword || /\d{4}/.test(line)) {
        experience.push(line.trim());
      }
    }
    if (line.toLowerCase().includes('education') || line.toLowerCase().includes('projects')) {
      inExperienceSection = false;
    }
  });

  return { skills: [...new Set(skills)], education: education.slice(0, 5), experience: experience.slice(0, 10) };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const fileType = file.type;
    console.log('Processing resume:', fileName, fileType);

    let extractedText = '';

    if (fileType === 'application/pdf') {
      // For PDF files
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
        console.log('PDF parsed successfully, text length:', extractedText.length);
      } catch (pdfError) {
        console.error('PDF parsing failed:', pdfError);
        return NextResponse.json({
          error: 'PDF parsing failed. Please try uploading as an image (PNG/JPG) instead.',
        }, { status: 400 });
      }
    } else if (fileType.startsWith('image/')) {
      // For images - use Groq Vision API
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      
      console.log('Using Groq Vision API for resume OCR...');
      
      try {
        const Groq = (await import('groq-sdk')).default;
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        const response = await groq.chat.completions.create({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${fileType};base64,${base64}`,
                  },
                },
                {
                  type: 'text',
                  text: `Extract ALL text from this resume image. Include:
- Name and contact info
- All skills and technologies
- Work experience with dates and descriptions
- Education details
- Projects
- Certifications

Return the extracted text in a clean, readable format. Be thorough and extract every piece of text visible.`,
                },
              ],
            },
          ],
          max_tokens: 4000,
        });
        
        extractedText = response.choices[0].message.content || '';
        console.log('Groq Vision OCR completed, text length:', extractedText.length);
      } catch (visionError: any) {
        console.error('Groq Vision OCR failed:', visionError);
        return NextResponse.json({
          error: 'Failed to extract text from image. Please try a clearer image or PDF.',
          details: visionError?.message,
        }, { status: 500 });
      }
    } else if (fileType === 'text/plain') {
      // Plain text file
      extractedText = await file.text();
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileType}. Please upload PDF, PNG, JPG, or TXT.` },
        { status: 400 }
      );
    }

    // Extract structured data
    const { skills, education, experience } = extractSections(extractedText);

    console.log('Resume processed:', {
      textLength: extractedText.length,
      skillsFound: skills.length,
      educationFound: education.length,
      experienceFound: experience.length,
    });

    return NextResponse.json({
      fileName,
      fileType,
      extractedText: extractedText.trim(),
      skills,
      education,
      experience,
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
    });
  } catch (error: any) {
    console.error('Resume processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process resume', details: error?.message },
      { status: 500 }
    );
  }
}