import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @deno-types="https://esm.sh/@types/jspdf@2.3.0"
import jsPDF from 'https://esm.sh/jspdf@2.5.1';

// Types
interface SubscriptionData {
  id: string;
  invoiceNumber: string;
  planName: string;
  planPrice: number;
  status: string;
  billingPeriod: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface BillingReportData {
  customerName: string;
  email: string;
  reportDate: string;
  subscriptions: SubscriptionData[];
  totalAmount: number;
  totalSubscriptions: number;
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

    // Fetch billing report data
    const reportData = await fetchBillingReportData(supabaseClient, user.id);
    if (!reportData) {
      return new Response(
        JSON.stringify({ error: 'No billing data found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate comprehensive billing report PDF
    const reportPDF = await generateBillingReport(reportData);

    // Return PDF
    return new Response(reportPDF, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="jdmatchr-Billing-Report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating billing report:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchBillingReportData(supabaseClient: any, userId: string): Promise<BillingReportData | null> {
  try {
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

    // Fetch all subscriptions for the user
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (subError) {
      console.error('Subscriptions fetch error:', subError);
      return null;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return null;
    }

    // Format subscription data
    const formattedSubscriptions: SubscriptionData[] = subscriptions.map(sub => {
      // Calculate period dates
      const startDate = sub.current_period_start 
        ? new Date(sub.current_period_start) 
        : new Date(sub.created_at);
      
      const endDate = sub.current_period_end 
        ? new Date(sub.current_period_end)
        : new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // Add 30 days if no end date

      return {
        id: sub.id,
        invoiceNumber: `INV-${sub.id.slice(-8).toUpperCase()}`,
        planName: sub.plan_name.charAt(0).toUpperCase() + sub.plan_name.slice(1),
        planPrice: sub.plan_name === 'pro' ? 9.99 : 0,
        status: sub.status,
        billingPeriod: 'Monthly',
        startDate: startDate.toLocaleDateString('en-US'),
        endDate: endDate.toLocaleDateString('en-US'),
        createdAt: new Date(sub.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    });

    // Calculate totals
    const totalAmount = formattedSubscriptions.reduce((sum, sub) => sum + sub.planPrice, 0);

    const reportData: BillingReportData = {
      customerName: profile.full_name || 'Customer',
      email: profile.email,
      reportDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      subscriptions: formattedSubscriptions,
      totalAmount,
      totalSubscriptions: formattedSubscriptions.length
    };

    return reportData;
  } catch (error) {
    console.error('Error fetching billing report data:', error);
    return null;
  }
}

async function generateBillingReport(reportData: BillingReportData): Promise<Uint8Array> {
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
  doc.rect(0, 0, 210, 70, 'F');
  
  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('jdmatchr', 105, 35, { align: 'center' });
  
  // Report title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive Billing Report', 105, 50, { align: 'center' });
  
  // Report date
  doc.setFontSize(12);
  doc.text(`Generated on: ${reportData.reportDate}`, 105, 62, { align: 'center' });

  // Account information section
  let currentY = 90;
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Information', 20, currentY);
  
  currentY += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer: ${reportData.customerName}`, 20, currentY);
  currentY += 8;
  doc.text(`Email: ${reportData.email}`, 20, currentY);
  currentY += 8;
  doc.text(`Report Period: All Time`, 20, currentY);

  // Summary section
  currentY += 25;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, currentY);
  
  // Summary cards
  currentY += 25;
  const cardWidth = 55;
  const cardHeight = 30;
  const cardSpacing = 8;
  
  // Total Subscriptions card
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(20, currentY, cardWidth, cardHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('TOTAL SUBSCRIPTIONS', 45, currentY + 8, { align: 'center' });
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.totalSubscriptions.toString(), 45, currentY + 18, { align: 'center' });
  
  // Total Spent card
  doc.rect(20 + cardWidth + cardSpacing, currentY, cardWidth, cardHeight, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL SPENT', 45 + cardWidth + cardSpacing, currentY + 8, { align: 'center' });
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${reportData.totalAmount.toFixed(2)}`, 45 + cardWidth + cardSpacing, currentY + 18, { align: 'center' });
  
  // Active Plans card
  const activePlans = reportData.subscriptions.filter(sub => sub.status === 'active').length;
  doc.rect(20 + (cardWidth + cardSpacing) * 2, currentY, cardWidth, cardHeight, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ACTIVE PLANS', 45 + (cardWidth + cardSpacing) * 2, currentY + 8, { align: 'center' });
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(activePlans.toString(), 45 + (cardWidth + cardSpacing) * 2, currentY + 18, { align: 'center' });

  // Subscription History section
  currentY += 50;
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Subscription History', 20, currentY);

  // Table header
  currentY += 15;
  const tableHeaders = ['Invoice #', 'Plan', 'Status', 'Created', 'Amount'];
  const colWidths = [35, 30, 25, 40, 30];
  let colX = 20;
  
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(20, currentY - 5, 170, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  tableHeaders.forEach((header, i) => {
    doc.text(header, colX + 2, currentY + 3);
    colX += colWidths[i];
  });

  // Table content with pagination
  currentY += 15;
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const rowHeight = 20;
  const pageHeight = 297; // A4 height
  const bottomMargin = 50;
  let tableStartY = currentY;
  
  for (let i = 0; i < reportData.subscriptions.length; i++) {
    const sub = reportData.subscriptions[i];
    
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - bottomMargin) {
      // Add page
      doc.addPage();
      
      // Set background for new page
      doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Repeat table header on new page
      currentY = 40;
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(20, currentY - 5, 170, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      colX = 20;
      tableHeaders.forEach((header, j) => {
        doc.text(header, colX + 2, currentY + 3);
        colX += colWidths[j];
      });
      
      currentY += 20;
      tableStartY = currentY - 15;
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    }
    
    colX = 20;
    
    // Alternate row background
    if (i % 2 === 0) {
      doc.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.rect(20, currentY - 5, 170, rowHeight - 2, 'F');
    }
    
    // Invoice number
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(sub.invoiceNumber, colX + 2, currentY + 2);
    colX += colWidths[0];
    
    // Plan name
    doc.setFont('helvetica', 'bold');
    doc.text(`${sub.planName} Plan`, colX + 2, currentY + 2);
    doc.setFont('helvetica', 'normal');
    colX += colWidths[1];
    
    // Status
    const statusColor = sub.status === 'active' ? [34, 197, 94] : 
                       sub.status === 'cancelled' ? [239, 68, 68] : [156, 163, 175];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(sub.status.toUpperCase(), colX + 2, currentY + 2);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFont('helvetica', 'normal');
    colX += colWidths[2];
    
    // Created date
    doc.text(sub.createdAt, colX + 2, currentY + 2);
    // Billing period on second line
    doc.setFontSize(8);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(`${sub.startDate} - ${sub.endDate}`, colX + 2, currentY + 10);
    doc.setFontSize(10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    colX += colWidths[3];
    
    // Amount
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`$${sub.planPrice.toFixed(2)}`, colX + 2, currentY + 6);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    
    currentY += rowHeight;
  }

  // Add footer to the last page
  currentY += 30;
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for choosing jdmatchr!', 105, currentY, { align: 'center' });
  
  currentY += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('AI-Powered Resume Screening Platform', 105, currentY, { align: 'center' });
  
  currentY += 8;
  doc.text('For support, contact us at support@jdmatchr.com', 105, currentY, { align: 'center' });
  
  // Add page numbers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(`Page ${i} of ${totalPages}`, 105, 285, { align: 'center' });
  }

  // Convert to Uint8Array
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
} 