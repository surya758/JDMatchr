import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobContext {
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

interface CandidateProfile {
  id: string;
  name: string;
  fileName?: string;
  profile: {
    personalInfo: any;
    experience: any;
    skills: any;
    education: any;
    certifications: any;
    projects: any;
    notablePoints: any;
    overallProfile: any;
  };
}

interface AIMatchingResult {
  candidateId: string;
  candidateName: string;
  matchingScore: number;
  summary: string;
  keyStrengths: string[];
  potentialConcerns: string[];
  fitAnalysis: {
    technicalFit: number;
    experienceFit: number;
    culturalFit: number;
    growthPotential: number;
  };
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'pass';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { job, candidates } = await req.json() as {
      job: JobContext;
      candidates: CandidateProfile[];
    }

    if (!job || !candidates || candidates.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Job description and candidates are required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })

    // Create the AI prompt for candidate matching
    const prompt = `You are an expert HR professional and recruitment specialist. Your task is to analyze candidates against a job requirement and provide intelligent matching scores and insights.

JOB REQUIREMENTS:
Title: ${job.title}
Company: ${job.company || 'Not specified'}
Location: ${job.location || 'Not specified'}
Employment Type: ${job.employmentType || 'Not specified'}
Experience Level: ${job.experienceLevel || 'Not specified'}

Required Skills: ${job.requiredSkills.join(', ')}
Preferred Skills: ${job.preferredSkills.join(', ')}
Responsibilities: ${job.responsibilities.join('; ')}
Qualifications: ${job.qualifications.join('; ')}
Summary: ${job.summary}

CANDIDATES TO ANALYZE:
${candidates.map((candidate, index) => `
CANDIDATE ${index + 1}:
ID: ${candidate.id}
Name: ${candidate.name}
File: ${candidate.fileName || 'Unknown'}

Personal Info:
- Name: ${candidate.profile.personalInfo.name || 'Not provided'}
- Email: ${candidate.profile.personalInfo.email || 'Not provided'}
- Phone: ${candidate.profile.personalInfo.phone || 'Not provided'}
- Location: ${candidate.profile.personalInfo.location || 'Not provided'}
- LinkedIn: ${candidate.profile.personalInfo.linkedin || 'Not provided'}
- GitHub: ${candidate.profile.personalInfo.github || 'Not provided'}

Experience:
- Total Years: ${candidate.profile.experience.totalYears || 0}
- Current Role: ${candidate.profile.experience.currentRole || 'Not specified'}
- Companies: ${candidate.profile.experience.companies?.join(', ') || 'Not specified'}
- Key Achievements: ${candidate.profile.experience.keyAchievements?.join('; ') || 'None listed'}

Skills:
- Technical: ${candidate.profile.skills.technical?.join(', ') || 'None listed'}
- Soft Skills: ${candidate.profile.skills.soft?.join(', ') || 'None listed'}
- Tools: ${candidate.profile.skills.tools?.join(', ') || 'None listed'}
- Languages: ${candidate.profile.skills.languages?.join(', ') || 'None listed'}
- Frameworks: ${candidate.profile.skills.frameworks?.join(', ') || 'None listed'}

Education:
${candidate.profile.education?.map((edu: any) => `- ${edu.degree} from ${edu.institution} (${edu.year})`).join('\n') || 'Not specified'}

Certifications:
${candidate.profile.certifications?.join(', ') || 'None listed'}

Projects:
${candidate.profile.projects?.map((project: any) => `- ${project.name}: ${project.description} (${project.technologies?.join(', ')})`).join('\n') || 'None listed'}

Notable Points:
- Unique Experiences: ${candidate.profile.notablePoints.uniqueExperiences?.join('; ') || 'None'}
- Standout Achievements: ${candidate.profile.notablePoints.standoutAchievements?.join('; ') || 'None'}
- Potential Red Flags: ${candidate.profile.notablePoints.potentialRedFlags?.join('; ') || 'None'}
- Career Progression: ${candidate.profile.notablePoints.careerProgression || 'Not specified'}
- Industry Diversity: ${candidate.profile.notablePoints.industryDiversity?.join(', ') || 'Not specified'}

Overall Profile:
- Seniority Level: ${candidate.profile.overallProfile.seniorityLevel || 'Not specified'}
- Potential Fit: ${candidate.profile.overallProfile.potentialFit || 'Not specified'}
`).join('\n---\n')}

ANALYSIS INSTRUCTIONS:
1. **COMPARATIVE ANALYSIS IS CRITICAL**: You must compare candidates against each other, not just against the job requirements
2. **RANK CANDIDATES RELATIVELY**: Ensure there's a clear hierarchy with varied scores (don't give everyone 75-85%)
3. **DIFFERENTIATE SCORES**: The best candidate should score significantly higher than average ones
4. **IDENTIFY STANDOUTS**: Look for what makes each candidate unique compared to others
5. Analyze each candidate holistically against the job requirements
6. Consider both hard skills (technical requirements) and soft skills (cultural fit)
7. Look for transferable skills and growth potential
8. Consider industry context and role-specific nuances
9. Evaluate career progression and trajectory
10. Identify both strengths and potential concerns
11. Provide actionable insights for HR decision-making

**IMPORTANT**: This is a RANKING exercise. You should have:
- 1-2 top candidates (80-95% scores)
- 2-3 middle candidates (60-79% scores)  
- 1-2 lower candidates (40-69% scores)
- Reject clearly unsuitable candidates (below 40%)

Compare candidates directly and explain WHY one is better than another.

For each candidate, provide a detailed analysis in the following JSON format:

{
  "matchingResults": [
    {
      "candidateId": "candidate_0",
      "candidateName": "Full Name",
      "matchingScore": 85,
      "summary": "A concise 2-3 sentence summary of why this candidate is/isn't a good fit",
      "keyStrengths": ["Strength 1", "Strength 2", "Strength 3"],
      "potentialConcerns": ["Concern 1", "Concern 2"] or [],
      "fitAnalysis": {
        "technicalFit": 90,
        "experienceFit": 80,
        "culturalFit": 85,
        "growthPotential": 95
      },
      "recommendation": "strong_hire" | "hire" | "maybe" | "pass"
    }
  ]
}

SCORING GUIDELINES (USE FULL RANGE):
- 90-100: Exceptional match, rare find, perfect or near-perfect fit
- 80-89: Strong match, highly recommended, clear standout
- 70-79: Good match, worth considering, solid candidate
- 60-69: Moderate match, has potential, some gaps but trainable
- 50-59: Weak match, significant gaps, questionable fit
- 40-49: Poor match, major misalignment, not recommended
- Below 40: Completely unsuitable, reject

**CRITICAL**: Use the FULL scoring range. Don't cluster everyone around 70-80%. 
- Best candidate should be 85-95%
- Worst suitable candidate should be 45-65%
- Spread scores across the range based on RELATIVE comparison

RECOMMENDATION GUIDELINES:
- strong_hire: 85+ score, minimal concerns, excellent fit
- hire: 75+ score, minor concerns, good fit
- maybe: 60+ score, some concerns but potential
- pass: Below 60 or major red flags

**COMPARATIVE ANALYSIS EXAMPLES:**
- "Candidate A scores 92% due to 8 years direct experience vs Candidate B's 65% with only 2 years"
- "Candidate C ranks higher (78%) than Candidate D (52%) because of stronger technical skills match"
- "While both have similar experience, Candidate E (83%) shows better career progression than Candidate F (71%)"

**FINAL CHECKLIST:**
✓ Did I compare candidates against each other?
✓ Do my scores show clear differentiation (not all 70-80%)?
✓ Did I explain WHY one candidate ranks higher than another?
✓ Do I have a clear top performer and clear lower performers?
✓ Are my recommendations justified by the scores?

Be thorough but concise. Focus on practical insights that help HR make informed decisions. Consider the specific role context - a marketing role requires different evaluation criteria than a software engineering role.

Return ONLY the JSON response, no additional text.`

    // Get AI analysis
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    console.log('AI Response:', responseText)

    // Parse the JSON response
    let matchingResults: AIMatchingResult[]
    try {
      // Clean up the response text
      let cleanedResponse = responseText.trim()
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const parsed = JSON.parse(cleanedResponse)
      matchingResults = parsed.matchingResults || []
      
      // Validate and sort results by score
      matchingResults = matchingResults
        .filter(result => result && typeof result.matchingScore === 'number')
        .sort((a, b) => b.matchingScore - a.matchingScore)
      
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Raw response:', responseText)
      
      // Fallback response if parsing fails
      matchingResults = candidates.map((candidate, index) => ({
        candidateId: candidate.id,
        candidateName: candidate.name,
        matchingScore: 70,
        summary: `${candidate.name} has relevant experience for this ${job.title} role.`,
        keyStrengths: candidate.profile.skills.technical?.slice(0, 3) || ['Experience'],
        potentialConcerns: [],
        fitAnalysis: {
          technicalFit: 70,
          experienceFit: 70,
          culturalFit: 70,
          growthPotential: 75
        },
        recommendation: 'maybe' as const
      }))
    }

    return new Response(
      JSON.stringify({
        success: true,
        matchingResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-candidate-matching:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to match candidates' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 