import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @deno-types="https://esm.sh/@types/jspdf@2.3.0"
import jsPDF from 'https://esm.sh/jspdf@2.5.1';

// Types
interface BillingData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  email: string;
  subscriptionId: string;
  planName: string;
  planPrice: number;
  billingPeriod: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentMethod?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { subscriptionId } = await req.json();
    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ error: 'Subscription ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch billing data
    const billingData = await fetchBillingData(supabaseClient, user.id, subscriptionId);
    if (!billingData) {
      return new Response(
        JSON.stringify({ error: 'Billing data not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate PDF invoice
    const pdfBuffer = await generateBillingPDF(billingData);

    // Return PDF
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="JDMatchr-Invoice-${billingData.invoiceNumber}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchBillingData(supabaseClient: any, userId: string, subscriptionId: string): Promise<BillingData | null> {
  try {
    // Fetch subscription data
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      console.error('Subscription fetch error:', subError);
      return null;
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return null;
    }

    // Calculate period dates
    const startDate = subscription.current_period_start 
      ? new Date(subscription.current_period_start) 
      : new Date(subscription.created_at);
    
    const endDate = subscription.current_period_end 
      ? new Date(subscription.current_period_end)
      : new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // Add 30 days if no end date

    // Format billing data
    const billingData: BillingData = {
      invoiceNumber: `INV-${subscription.id.slice(-8).toUpperCase()}`,
      date: new Date(subscription.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      customerName: profile.full_name || 'Customer',
      email: profile.email,
      subscriptionId: subscription.id,
      planName: subscription.plan_name.charAt(0).toUpperCase() + subscription.plan_name.slice(1),
      planPrice: subscription.plan_name === 'pro' ? 9.99 : 0,
      billingPeriod: 'Monthly', // Default to monthly
      startDate: startDate.toLocaleDateString('en-US'),
      endDate: endDate.toLocaleDateString('en-US'),
      status: subscription.status,
      paymentMethod: 'Credit Card' // Default for now
    };

    return billingData;
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return null;
  }
}

async function generateBillingPDF(billingData: BillingData): Promise<Uint8Array> {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set dark theme colors
  const colors = {
    primary: [59, 130, 246], // Blue
    text: [242, 242, 242], // Light gray
    textMuted: [179, 179, 179], // Medium gray
    background: [13, 13, 13], // Dark background
    border: [38, 38, 38] // Border color
  };

  // Set background
  doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  doc.rect(0, 0, 210, 297, 'F'); // A4 size

  // Header section
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, 210, 60, 'F');
  
  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('JDMatchr', 20, 35);
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Resume Screening Platform', 20, 45);
  
  // Invoice details (top right)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice #${billingData.invoiceNumber}`, 210 - 20, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${billingData.date}`, 210 - 20, 35, { align: 'right' });
  doc.text(`Status: ${billingData.status.toUpperCase()}`, 210 - 20, 45, { align: 'right' });

  // Customer information
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 80);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(billingData.customerName, 20, 90);
  doc.text(billingData.email, 20, 100);

  // Invoice table header
  const tableY = 120;
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(20, tableY, 170, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', 25, tableY + 8);
  doc.text('BILLING PERIOD', 100, tableY + 8);
  doc.text('AMOUNT', 170, tableY + 8, { align: 'right' });

  // Invoice table content
  const contentY = tableY + 20;
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFont('helvetica', 'normal');
  
  // Service description
  doc.text(`${billingData.planName} Plan Subscription`, 25, contentY);
  doc.setFontSize(8);
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('Access to AI-powered resume screening', 25, contentY + 8);
  
  // Billing period
  doc.setFontSize(10);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.text(`${billingData.startDate} - ${billingData.endDate}`, 100, contentY);
  doc.setFontSize(8);
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text(`(${billingData.billingPeriod})`, 100, contentY + 8);
  
  // Amount
  doc.setFontSize(12);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${billingData.planPrice.toFixed(2)}`, 185, contentY, { align: 'right' });

  // Table border
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.rect(20, tableY, 170, 40);

  // Total section
  const totalY = contentY + 30;
  doc.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.rect(20, totalY, 170, 15, 'F');
  
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount', 25, totalY + 10);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(`$${billingData.planPrice.toFixed(2)}`, 185, totalY + 10, { align: 'right' });

  // Footer
  const footerY = 250;
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for choosing JDMatchr!', 105, footerY, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('For support, contact us at support@jdmatchr.com', 105, footerY + 10, { align: 'center' });

  // Convert to Uint8Array
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}



function generateInvoiceHTML(billingData: BillingData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${billingData.invoiceNumber}</title>
      <style>
        :root {
          --bg-dark: hsl(0 0% 0%);
          --bg: hsl(0 0% 5%);
          --bg-light: hsl(0 0% 10%);
          --text: hsl(0 0% 95%);
          --text-muted: hsl(0 0% 70%);
          --text-subtle: hsl(0 0% 50%);
          --border-custom: hsl(0 0% 15%);
          --border-light: hsl(0 0% 20%);
          --primary: hsl(210 100% 50%);
          --primary-foreground: hsl(0 0% 100%);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Space Grotesk', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: var(--bg-dark);
          color: var(--text);
          line-height: 1.6;
          min-height: 100vh;
          padding: 40px 20px;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          background: var(--bg);
          border: 1px solid var(--border-custom);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .invoice-header {
          background: linear-gradient(135deg, var(--bg-light) 0%, var(--bg) 100%);
          padding: 40px;
          border-bottom: 1px solid var(--border-custom);
          position: relative;
        }

        .invoice-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
          pointer-events: none;
        }

        .header-content {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 20px;
        }

        .company-info h1 {
          color: var(--primary);
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .company-info p {
          color: var(--text-muted);
          margin: 4px 0;
        }

        .invoice-details {
          text-align: right;
        }

        .invoice-details h2 {
          color: var(--text);
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .invoice-details p {
          color: var(--text-muted);
          margin: 6px 0;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-active {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .status-cancelled {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .billing-section {
          padding: 40px;
          border-bottom: 1px solid var(--border-custom);
        }

        .billing-section h3 {
          color: var(--text);
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .billing-section p {
          color: var(--text-muted);
          margin: 6px 0;
        }

        .billing-section strong {
          color: var(--text);
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
        }

        .invoice-table th {
          background: var(--bg-light);
          color: var(--text);
          padding: 20px;
          text-align: left;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border-custom);
        }

        .invoice-table td {
          padding: 24px 20px;
          border-bottom: 1px solid var(--border-custom);
          color: var(--text-muted);
        }

        .invoice-table tr:last-child td {
          border-bottom: none;
        }

        .invoice-table strong {
          color: var(--text);
        }

        .invoice-table small {
          color: var(--text-subtle);
          font-size: 0.75rem;
        }

        .total-row {
          background: var(--bg-light) !important;
        }

        .total-row td {
          font-weight: 600;
          font-size: 1.125rem;
          color: var(--text);
          border-top: 2px solid var(--primary);
        }

        .amount {
          color: var(--primary);
          font-weight: 700;
        }

        .footer {
          padding: 40px;
          text-align: center;
          background: var(--bg-light);
        }

        .footer p {
          color: var(--text-muted);
          margin: 8px 0;
        }

        .footer p:first-child {
          color: var(--text);
          font-weight: 600;
          font-size: 1.125rem;
          margin-bottom: 16px;
        }

        @media (max-width: 640px) {
          body {
            padding: 20px 10px;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .invoice-details {
            text-align: center;
          }

          .company-info h1 {
            font-size: 2rem;
          }

          .billing-section,
          .invoice-header,
          .footer {
            padding: 24px;
          }

          .invoice-table th,
          .invoice-table td {
            padding: 16px 12px;
          }
        }

        @media print {
          body {
            background: white;
            color: black;
          }
          .container {
            background: white;
            border: 1px solid #ddd;
            box-shadow: none;
          }
          .invoice-header {
            background: #f8fafc;
          }
          .status-active {
            background: #dcfce7;
            color: #166534;
          }
          .status-cancelled {
            background: #fef2f2;
            color: #991b1b;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="invoice-header">
          <div class="header-content">
            <div class="company-info">
              <h1>JDMatchr</h1>
              <p>AI-Powered Resume Screening Platform</p>
              <p>support@jdmatchr.com</p>
            </div>
            <div class="invoice-details">
              <h2>Invoice #${billingData.invoiceNumber}</h2>
              <p><strong>Date:</strong> ${billingData.date}</p>
              <p><strong>Status:</strong> 
                <span class="status-badge ${billingData.status === 'active' ? 'status-active' : 'status-cancelled'}">
                  ${billingData.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div class="billing-section">
          <h3>Bill To:</h3>
          <p><strong>${billingData.customerName}</strong></p>
          <p>${billingData.email}</p>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Billing Period</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${billingData.planName} Plan Subscription</strong><br>
                <small>Access to AI-powered resume screening</small>
              </td>
              <td>
                <strong>${billingData.startDate} - ${billingData.endDate}</strong><br>
                <small>(${billingData.billingPeriod})</small>
              </td>
              <td><span class="amount">$${billingData.planPrice.toFixed(2)}</span></td>
            </tr>
            <tr class="total-row">
              <td colspan="2"><strong>Total Amount</strong></td>
              <td><span class="amount">$${billingData.planPrice.toFixed(2)}</span></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Thank you for choosing JDMatchr!</p>
          <p>For support, contact us at support@jdmatchr.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSimplePDF(billingData: BillingData): string {
  // This is a simplified approach - in production you'd use a proper PDF library
  // For now, we'll return the HTML content as a fallback
  return generateInvoiceHTML(billingData);
} 