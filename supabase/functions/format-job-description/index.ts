import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JDFormatRequest {
  content: string;
}

interface FormattedJD {
  title: string;
  company?: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  benefits?: string[];
  summary: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content }: JDFormatRequest = await req.json();

    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Job description content is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Prepare the prompt for Gemini
    const prompt = `
You are an expert HR assistant. Analyze the following job description and extract information into a structured format. 

The job description content:
"""
${content}
"""

Please extract and format the information into the following JSON structure. If certain information is not available, leave those fields empty or with empty arrays:

{
  "title": "Job title extracted from the content",
  "company": "Company name if mentioned",
  "location": "Location if mentioned (city, state, remote, etc.)",
  "employmentType": "Full-time, Part-time, Contract, Internship, etc.",
  "experienceLevel": "Entry, Mid, Senior, etc. or specific years mentioned",
  "requiredSkills": ["List of technical and non-technical skills that are explicitly required"],
  "preferredSkills": ["List of skills that are nice-to-have or preferred"],
  "responsibilities": ["List of key job responsibilities and duties"],
  "qualifications": ["List of educational requirements, certifications, experience requirements"],
  "benefits": ["List of benefits, perks, compensation details if mentioned"],
  "summary": "A concise 2-3 sentence summary of the role and what the ideal candidate should have"
}

Focus on accuracy and be comprehensive. Extract as much relevant information as possible while maintaining the structure. Return only the JSON object, no additional text.
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
            maxOutputTokens: 2048,
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
    let formattedJD: FormattedJD;
    try {
      // Clean up the response in case there's extra text
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : generatedText;
      formattedJD = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', generatedText);
      throw new Error('Failed to parse structured response from AI');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        formattedJD,
        originalContent: content 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in format-job-description function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to format job description',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 