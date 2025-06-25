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
        from: 'JDMatchr Contact <surya@jdmatchr.com>',
        to: ['skant758@gmail.com'],
        subject: subject || `New Contact Form Message from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3b82f6;">New Contact Form Message - JDMatchr</h2>
            
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
            
            <p><strong>Message:</strong></p>
            <p style="background: #f5f5f5; padding: 15px; border-left: 3px solid #3b82f6;">${message}</p>
            
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This message was sent from the JDMatchr contact form.</p>
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