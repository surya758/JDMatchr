import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, subject, message } = await req.json()

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send email using Resend (if API key is configured)
    if (RESEND_API_KEY) {
      const emailData = {
        from: 'JDMatchr Contact <noreply@jdmatchr.com>',
        to: ['surya@jdmatchr.com'],
        subject: subject || `New Contact Form Message from ${name}`,
        html: `
          <div style="font-family: 'Space Grotesk', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000; color: #f5f5f5;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">New Contact Form Message</h1>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #f5f5f5; margin: 0 0 15px 0; font-size: 18px;">Contact Details</h2>
              <p style="margin: 5px 0; color: #a3a3a3;"><strong style="color: #f5f5f5;">Name:</strong> ${name}</p>
              <p style="margin: 5px 0; color: #a3a3a3;"><strong style="color: #f5f5f5;">Email:</strong> ${email}</p>
              ${subject ? `<p style="margin: 5px 0; color: #a3a3a3;"><strong style="color: #f5f5f5;">Subject:</strong> ${subject}</p>` : ''}
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 20px;">
              <h2 style="color: #f5f5f5; margin: 0 0 15px 0; font-size: 18px;">Message</h2>
              <p style="margin: 0; color: #a3a3a3; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(59, 130, 246, 0.2);">
              <p style="margin: 0; color: #737373; font-size: 14px;">This message was sent from the JDMatchr contact form.</p>
            </div>
          </div>
        `,
        reply_to: email
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        console.error('Failed to send email via Resend:', await response.text())
        // Don't fail the request if email sending fails
      }
    }

    // Log the contact form submission (you could also store this in a database)
    console.log('Contact form submission:', {
      name,
      email,
      subject: subject || 'No subject',
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contact form submitted successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing contact form:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 