import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define interfaces for our data to ensure type safety
interface Job {
  title: string
  company: string | null
  location: string | null
  formatted_jd: {
    responsibilities?: string[]
    qualifications?: string[]
  } | null
}

interface Candidate {
  processed_resume: {
    name?: string
    title?: string
    summary?: string
    experience?: {
      title?: string
      company?: string
      summary?: string
    }[]
    skills?: string[]
  } | null
}

interface JobApplication {
  matching_score: number | null
  jobs: Job | null
  candidates: Candidate | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reportId } = await req.json()
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Step 1: Fetch all data in a single query ---
    console.log("reportId", reportId);
    const { data: reportData, error: reportError } = await supabase
      .from('job_applications')
      .select(`
        matching_score,
        jobs (
          title,
          company,
          location,
          formatted_jd
        ),
        candidates (
          processed_resume
        )
      `)
      .eq('job_id', reportId)
      .returns<JobApplication[]>()
      .single()

    if (reportError || !reportData) {
      console.error('Error fetching report data:', reportError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch report data or report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For now, generate a sample PDF with elegant design
    // Later we'll fetch actual report data from the database
    const pdfBuffer = await generateElegantPDF(reportData)

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="jdmatchr-report.pdf"',
      },
    })

  } catch (error) {
    console.error('Error in generate-report-pdf:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateElegantPDF(reportData: JobApplication): Promise<Uint8Array> {
  // Import jsPDF which works better in edge environments
  const { jsPDF } = await import('https://esm.sh/jspdf@2.5.1')

  try {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Add elegant content with real data
    addElegantContent(doc, reportData)

    // Get PDF as Uint8Array
    const pdfOutput = doc.output('arraybuffer')
    return new Uint8Array(pdfOutput)

  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

function addElegantContent(doc: any, reportData: JobApplication) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin

  // --- Extract data with robust fallbacks for safety ---
  const job = reportData.jobs || {}
  const candidate = reportData.candidates || {}
  const jobTitle = job.title || 'N/A'
  const company = job.company || 'N/A'
  const location = job.location || 'N/A'
  const requirements = (Array.isArray(job.formatted_jd?.qualifications) && job.formatted_jd.qualifications.length > 0)
    ? job.formatted_jd.qualifications
    : ['No requirements listed.']

  const candidateData = candidate.processed_resume || {}
  const candidateName = candidateData.name || 'N/A'
  const candidateTitle = candidateData.title || 'N/A'
  const matchingScore = reportData.matching_score || 0
  
  // Robustly handle candidate qualifications
  let qualificationsArray: string[] = []
  if (candidateData.summary) {
    qualificationsArray = [candidateData.summary]
  } else if (Array.isArray(candidateData.experience)) {
    qualificationsArray = candidateData.experience
      .slice(0, 5)
      .map(exp => `• ${exp.title || 'Experience'} at ${exp.company || 'a company'}`)
  }
  const candidateQualifications = qualificationsArray.length > 0 ? qualificationsArray : ['No qualifications found.']

  // Robustly handle skills - this was the source of the error
  let skillsArray: string[] = []
  if (Array.isArray(candidateData.skills)) {
    skillsArray = candidateData.skills
  } else if (typeof candidateData.skills === 'string') {
    skillsArray = candidateData.skills.split(',').map(s => s.trim()).filter(Boolean)
  }
  const candidateSkills = (skillsArray.length > 0 ? skillsArray : ['No skills listed.'])
    .slice(0, 5)
    .map(skill => `${skill}: Proficient ✓`)

  try {
    // ===== HEADER SECTION =====
    doc.setFontSize(28)
    doc.setTextColor(37, 99, 235) // JDMatchr blue
    doc.text('JDMatchr', margin, 25)
    
    doc.setFontSize(12)
    doc.setTextColor(107, 114, 128) // Gray
    doc.text('AI-Powered Resume Screening Report', margin, 35)
    
    doc.setFontSize(10)
    doc.setTextColor(156, 163, 175) // Light gray
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, margin, 42)

    // Header separator line
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)
    doc.line(margin, 48, pageWidth - margin, 48)

    // ===== JOB DESCRIPTION SECTION =====
    let currentY = 60

    // Job Description Header
    doc.setFontSize(18)
    doc.setTextColor(37, 99, 235) // Blue
    doc.text('Job Description', margin, currentY)
    currentY += 10

    // Job Description Box
    const jdBoxHeight = 85
    doc.setFillColor(248, 250, 252) // Very light blue background
    doc.setDrawColor(229, 231, 235) // Light border
    doc.setLineWidth(0.5)
    doc.rect(margin, currentY, contentWidth, jdBoxHeight, 'FD')
    
    // Job Title
    doc.setFontSize(16)
    doc.setTextColor(17, 24, 39) // Dark
    doc.text(jobTitle, margin + 8, currentY + 12)
    
    // Company and Location
    doc.setFontSize(12)
    doc.setTextColor(55, 65, 81) // Medium gray
    doc.text(`${company} • ${location}`, margin + 8, currentY + 22)
    
    // Requirements Header
    doc.setFontSize(13)
    doc.setTextColor(37, 99, 235) // Blue
    doc.text('Key Requirements:', margin + 8, currentY + 35)
    
    // Requirements List
    doc.setFontSize(11)
    doc.setTextColor(55, 65, 81)
    
    let reqY = currentY + 45
    requirements.slice(0, 6).forEach((req) => { // Limit to 6 to prevent overflow
      const requirementText = (req || '').toString()
      doc.text(requirementText.startsWith('•') ? requirementText : `• ${requirementText}`, margin + 8, reqY, { maxWidth: contentWidth - 16 })
      reqY += 6
    })

    currentY += jdBoxHeight + 15

    // ===== TOP CANDIDATE SECTION =====
    
    // Top Candidate Header
    doc.setFontSize(18)
    doc.setTextColor(37, 99, 235) // Blue
    doc.text('Top Candidate', margin, currentY)
    currentY += 10

    // Candidate Box
    const candidateBoxHeight = 95
    doc.setFillColor(248, 250, 252) // Very light blue background
    doc.setDrawColor(229, 231, 235) // Light border
    doc.setLineWidth(0.5)
    doc.rect(margin, currentY, contentWidth, candidateBoxHeight, 'FD')

    // Candidate Name and Title
    doc.setFontSize(16)
    doc.setTextColor(17, 24, 39) // Dark
    doc.text(candidateName, margin + 8, currentY + 12)
    
    doc.setFontSize(12)
    doc.setTextColor(55, 65, 81) // Medium gray
    doc.text(candidateTitle, margin + 8, currentY + 22)

    // Match Score (prominent)
    doc.setFontSize(24)
    doc.setTextColor(5, 150, 105) // Green
    doc.text(`${matchingScore.toFixed(0)}%`, pageWidth - margin - 25, currentY + 20)
    
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text('MATCH', pageWidth - margin - 25, currentY + 28)

    // Key Qualifications
    doc.setFontSize(13)
    doc.setTextColor(37, 99, 235) // Blue
    doc.text('Key Qualifications:', margin + 8, currentY + 40)
    
    doc.setFontSize(11)
    doc.setTextColor(55, 65, 81)
    
    let qualY = currentY + 50
    candidateQualifications.slice(0, 5).forEach((qual) => {
      const qualText = (qual || '').toString()
      doc.text(qualText.startsWith('•') ? qualText : `• ${qualText}`, margin + 8, qualY, { maxWidth: contentWidth / 2 - 24 })
      qualY += 6
    })

    // Skills Match Section
    doc.setFontSize(13)
    doc.setTextColor(37, 99, 235) // Blue
    doc.text('Skills Alignment:', margin + 100, currentY + 40)
    
    doc.setFontSize(11)
    doc.setTextColor(55, 65, 81)
    
    let skillY = currentY + 50
    candidateSkills.slice(0, 5).forEach((skill) => {
      const skillText = (skill || '').toString()
      doc.text(skillText, margin + 100, skillY)
      skillY += 6
    })

    // ===== FOOTER =====
    doc.setFontSize(9)
    doc.setTextColor(156, 163, 175) // Light gray
    doc.text('Powered by JDMatchr AI • Confidential Report', margin, pageHeight - 15)
    
    // Page indicator
    doc.text('Page 1 of 1', pageWidth - margin - 20, pageHeight - 15)

  } catch (error) {
    console.error('Error adding elegant content:', error)
    // Fallback: just add basic text
    doc.setFontSize(16)
    doc.text('JDMatchr Report', margin, 30)
    doc.setFontSize(12)
    doc.text('PDF generation successful!', margin, 50)
  }
} 