import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DOCXResumeRequest {
  docxData: string; // base64 encoded DOCX data
  fileName?: string;
}

interface ProcessedResume {
  fileName: string;
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    github?: string;
    portfolio?: string;
  };
  experience: {
    totalYears: number;
    currentRole?: string;
    currentCompany?: string;
    positions: Array<{
      title: string;
      company: string;
      duration: string;
      keyResponsibilities: string[];
      achievements?: string[];
    }>;
  };
  skills: {
    technical: string[];
    soft: string[];
    tools: string[];
    languages?: string[];
    frameworks?: string[];
  };
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
    gpa?: string;
    relevantCourses?: string[];
  }>;
  certifications: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies?: string[];
    achievements?: string[];
  }>;
  notablePoints: {
    uniqueExperiences: string[];
    standoutAchievements: string[];
    potentialRedFlags: string[];
    careerProgression: string;
    industryDiversity: string[];
  };
  summary: string;
  overallProfile: {
    seniorityLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
    primaryExpertise: string[];
    careerFocus: string;
    potentialFit: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { docxData, fileName }: DOCXResumeRequest = await req.json();

    if (!docxData) {
      return new Response(
        JSON.stringify({ error: 'DOCX data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Import Buffer for word-extractor compatibility
    const { Buffer } = await import("node:buffer");
    
    // Convert base64 to proper Buffer for word-extractor
    const buffer = Buffer.from(docxData, 'base64');

    // Import word-extractor dynamically (this works in Deno)
    const { default: WordExtractor } = await import("npm:word-extractor@1.0.4");
    const extractor = new WordExtractor();

    let extractedContent = '';
    
    try {
      // Extract document with headers and footers
      const doc = await extractor.extract(buffer);
      
      // Get all parts of the document
      const headers = doc.getHeaders() || '';
      const body = doc.getBody() || '';
      const footers = doc.getFooters() || '';
      
      // Combine all content with clear separation
      extractedContent = [
        headers ? `HEADERS:\n${headers}` : '',
        body ? `CONTENT:\n${body}` : '',
        footers ? `FOOTERS:\n${footers}` : ''
      ].filter(section => section.length > 0).join('\n\n');
      
      console.log('DOCX extraction successful:', { 
        headersLength: headers.length, 
        bodyLength: body.length, 
        footersLength: footers.length 
      });
      
    } catch (extractError) {
      console.error('Word-extractor failed:', extractError);
      throw new Error('Failed to extract content from DOCX file');
    }

    if (!extractedContent || extractedContent.trim().length === 0) {
      throw new Error('No content could be extracted from the DOCX file');
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Comprehensive resume analysis prompt
    const prompt = `
You are an expert HR analyst and resume parser. Analyze the following DOCX resume content (including headers, body, and footers) and extract comprehensive information into a structured format. Be thorough and look for subtle details that might indicate exceptional talent, unique experiences, or potential concerns.

Resume content:
"""
${extractedContent}
"""

Extract and format the information into the following JSON structure. If certain information is not available, use empty strings or empty arrays. Be comprehensive and analytical:

{
  "fileName": "${fileName || 'resume.docx'}",
  "personalInfo": {
    "name": "Full name extracted from resume (often in headers)",
    "email": "Email address if found",
    "phone": "Phone number if found",
    "location": "City, State/Country if mentioned",
    "linkedIn": "LinkedIn profile URL if mentioned",
    "github": "GitHub profile URL if mentioned",
    "portfolio": "Portfolio/website URL if mentioned"
  },
  "experience": {
    "totalYears": 0,
    "currentRole": "Current job title if employed",
    "currentCompany": "Current company if employed",
    "positions": [
      {
        "title": "Job title",
        "company": "Company name",
        "duration": "Start date - End date or 'Present'",
        "keyResponsibilities": ["List of main responsibilities"],
        "achievements": ["Quantified achievements, metrics, awards"]
      }
    ]
  },
  "skills": {
    "technical": ["Programming languages, technical skills"],
    "soft": ["Leadership, communication, problem-solving, etc."],
    "tools": ["Software, platforms, tools"],
    "languages": ["Spoken languages with proficiency if mentioned"],
    "frameworks": ["Frameworks, libraries, technologies"]
  },
  "education": [
    {
      "degree": "Degree type and major",
      "institution": "University/College name",
      "year": "Graduation year if mentioned",
      "gpa": "GPA if mentioned",
      "relevantCourses": ["Relevant coursework if mentioned"]
    }
  ],
  "certifications": ["Professional certifications, licenses"],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description of the project",
      "technologies": ["Technologies used"],
      "achievements": ["Results, metrics, impact"]
    }
  ],
  "notablePoints": {
    "uniqueExperiences": ["Unusual or standout experiences that set them apart"],
    "standoutAchievements": ["Impressive accomplishments, awards, recognition"],
    "potentialRedFlags": ["Gaps in employment, frequent job changes, or concerning patterns"],
    "careerProgression": "Analysis of career growth and trajectory",
    "industryDiversity": ["Different industries or domains they've worked in"]
  },
  "summary": "A comprehensive 3-4 sentence summary of the candidate's profile, strengths, and potential",
  "overallProfile": {
    "seniorityLevel": "Entry|Mid|Senior|Lead|Executive",
    "primaryExpertise": ["Main areas of expertise"],
    "careerFocus": "Primary career focus or specialization",
    "potentialFit": "Assessment of what types of roles this person would excel in"
  }
}

Focus on:
1. Extracting ALL relevant information comprehensively, especially from headers/footers
2. Identifying unique selling points and differentiators
3. Noting any red flags or concerns
4. Assessing career progression and growth
5. Understanding the person's potential beyond just skills
6. Looking for "dark horse" qualities - hidden potential, unique combinations, undervalued experiences

Be analytical and thorough. Return only the JSON object, no additional text.
`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 65536,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const generatedText = geminiData.candidates[0].content.parts[0].text;
    
    // Parse the JSON response from Gemini
    let processedResume: ProcessedResume;
    try {
      // Clean up the response in case there's extra text
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : generatedText;
      processedResume = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', generatedText);
      throw new Error('Failed to parse structured response from AI');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedResume,
        source: 'docx',
        originalContent: extractedContent,
        extractedText: generatedText // Include raw response for debugging
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in process-resume-docx function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process DOCX resume',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 