import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateText, vertexProject, MODEL_LITE } from "../_shared/vertex.ts";

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

    // Fail fast on a missing service account, before building the prompt.
    vertexProject();

    // Prepare the prompt for Gemini
    const prompt = `
You are an expert HR assistant. Analyze the following job description and extract information into a structured format. 

The job description content:
"""
${content}
"""

IMPORTANT: You must return ONLY valid JSON. Do not include any markdown formatting, code blocks, or additional text.

Extract and format the information into this EXACT JSON structure:

{
  "title": "Job title extracted from the content",
  "company": "Company name if mentioned",
  "location": "Location if mentioned (city, state, remote, etc.)",
  "employmentType": "Full-time, Part-time, Contract, Internship, etc.",
  "experienceLevel": "Entry, Mid, Senior, etc. or specific years mentioned",
  "requiredSkills": ["Skill 1", "Skill 2", "Skill 3"],
  "preferredSkills": ["Preferred skill 1", "Preferred skill 2"],
  "responsibilities": ["Responsibility 1", "Responsibility 2"],
  "qualifications": ["Qualification 1", "Qualification 2"],
  "benefits": ["Benefit 1", "Benefit 2"],
  "summary": "A concise 2-3 sentence summary of the role"
}

JSON FORMATTING RULES:
- All strings must be properly quoted with double quotes
- All array elements must be properly quoted and comma-separated
- No trailing commas in arrays or objects
- No incomplete array elements
- If information is not available, use empty string "" or empty array []
- Ensure all brackets and braces are properly closed

Return ONLY the JSON object with no additional text, formatting, or explanations.
`;

    // Call Vertex AI
    const generatedText = await generateText({
      model: MODEL_LITE,
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
        responseMimeType: "application/json"
      },
    });
    
    // Function to repair common JSON issues
    const repairJson = (jsonString: string): string => {
      let repaired = jsonString;
      
      // Remove markdown code blocks
      repaired = repaired.replace(/```json|```/g, '').trim();
      
      // Fix incomplete array elements (like "fairness" without quotes or proper ending)
      repaired = repaired.replace(/,\s*([a-zA-Z][^"]*)\s*\]/g, ']'); // Remove incomplete trailing elements
      repaired = repaired.replace(/,\s*([a-zA-Z][^"]*)\s*,/g, ','); // Remove incomplete middle elements
      
      // Fix unquoted strings in arrays
      repaired = repaired.replace(/:\s*\[\s*([^"\]]+)\s*\]/g, (match, content) => {
        const items = content.split(',').map((item: string) => {
          const trimmed = item.trim();
          if (trimmed && !trimmed.startsWith('"')) {
            return `"${trimmed.replace(/"/g, '\\"')}"`;
          }
          return trimmed;
        }).filter((item: string) => item && item !== '""');
        return `: [${items.join(', ')}]`;
      });
      
      // Fix trailing commas
      repaired = repaired.replace(/,\s*}/g, '}');
      repaired = repaired.replace(/,\s*]/g, ']');
      
      // Fix missing quotes around object keys
      repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      return repaired;
    };
    
    // Parse the JSON response from Gemini
    let formattedJD: FormattedJD;
    try {
      // First, try to parse the raw response
      const cleanedText = generatedText.replace(/```json|```/g, '').trim();
      formattedJD = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Initial JSON parse failed, attempting repair...');
      console.error('Raw response:', generatedText);
      
      try {
        // Attempt to repair and parse again
        const repairedText = repairJson(generatedText);
        console.log('Repaired JSON:', repairedText);
        formattedJD = JSON.parse(repairedText);
      } catch (repairError) {
        console.error('JSON repair also failed:', repairError);
        console.error('Repaired text:', repairJson(generatedText));
        
        // Fallback: create a basic structure with the original content
        formattedJD = {
          title: "Job Position",
          company: "",
          location: "",
          employmentType: "",
          experienceLevel: "",
          requiredSkills: [],
          preferredSkills: [],
          responsibilities: [],
          qualifications: [],
          benefits: [],
          summary: "Unable to parse job description. Please review the original content."
        };
      }
    }

    // Validate and sanitize the parsed object
    const sanitizedJD: FormattedJD = {
      title: typeof formattedJD.title === 'string' ? formattedJD.title : "Job Position",
      company: typeof formattedJD.company === 'string' ? formattedJD.company : "",
      location: typeof formattedJD.location === 'string' ? formattedJD.location : "",
      employmentType: typeof formattedJD.employmentType === 'string' ? formattedJD.employmentType : "",
      experienceLevel: typeof formattedJD.experienceLevel === 'string' ? formattedJD.experienceLevel : "",
      requiredSkills: Array.isArray(formattedJD.requiredSkills) ? formattedJD.requiredSkills.filter(skill => typeof skill === 'string' && skill.trim()) : [],
      preferredSkills: Array.isArray(formattedJD.preferredSkills) ? formattedJD.preferredSkills.filter(skill => typeof skill === 'string' && skill.trim()) : [],
      responsibilities: Array.isArray(formattedJD.responsibilities) ? formattedJD.responsibilities.filter(resp => typeof resp === 'string' && resp.trim()) : [],
      qualifications: Array.isArray(formattedJD.qualifications) ? formattedJD.qualifications.filter(qual => typeof qual === 'string' && qual.trim()) : [],
      benefits: Array.isArray(formattedJD.benefits) ? formattedJD.benefits.filter(benefit => typeof benefit === 'string' && benefit.trim()) : [],
      summary: typeof formattedJD.summary === 'string' ? formattedJD.summary : "Job description processed successfully."
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        formattedJD: sanitizedJD,
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