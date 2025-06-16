import { NextRequest, NextResponse } from "next/server";
import { Resend } from 'resend';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    // Check for Resend API key first, fallback to SendGrid
    if (process.env.RESEND_API_KEY) {
      return await sendWithResend(request);
    } else if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
      return await sendWithSendGrid(request);
    } else {
      throw new Error("No email service configured. Please set RESEND_API_KEY or SENDGRID credentials");
    }
  } catch (error) {
    console.error("Error sending receipt email:", error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: "Failed to send receipt email", 
        error: (error as Error).message 
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

// Generate PDF receipt using Puppeteer
async function generateReceiptPDF(receiptData: any, businessName: string) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Format date for receipt
    const formattedDate = new Date(receiptData?.date || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create HTML template for PDF
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333; 
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 20px; 
          }
          .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .receipt-info { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .receipt-id { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          th, td { 
            padding: 10px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold; 
          }
          .total-row { 
            font-weight: bold; 
            font-size: 16px; 
            background-color: #f9f9f9; 
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            font-size: 14px; 
            color: #666; 
          }
          .payment-method {
            margin: 20px 0;
            padding: 10px;
            background-color: #f0f0f0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${businessName}</div>
          <div>29 Montgomery Road, Highlands, Harare, Zimbabwe</div>
          <div>www.lewa.co.zw</div>
        </div>
        
        <div class="receipt-info">
          <div class="receipt-id">Receipt #${receiptData?.id?.substring(0, 8) || 'N/A'}</div>
          <div>Date: ${formattedDate}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${receiptData?.items?.map((item: any) => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">$${item.price?.toFixed(2) || '0.00'}</td>
                <td style="text-align: right;">$${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; font-weight: bold;">Subtotal:</td>
              <td style="text-align: right; font-weight: bold;">$${receiptData?.subtotal?.toFixed(2) || '0.00'}</td>
            </tr>
            ${receiptData?.tax > 0 ? `
            <tr>
              <td colspan="3" style="text-align: right; font-weight: bold;">Tax (${receiptData?.taxRate || 0}%):</td>
              <td style="text-align: right; font-weight: bold;">$${receiptData?.tax?.toFixed(2) || '0.00'}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">TOTAL:</td>
              <td style="text-align: right;">$${receiptData?.total?.toFixed(2) || '0.00'}</td>
            </tr>
          </tfoot>
        </table>
        
        <div class="payment-method">
          <strong>Payment Method:</strong> ${receiptData?.paymentMethod || 'Cash'}
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This receipt was generated electronically.</p>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlTemplate);
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function sendWithResend(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const { 
    to, 
    subject, 
    customerName, 
    receiptId, 
    receiptUrl, 
    receiptData, 
    businessName 
  } = await request.json();

  if (!to || !subject) {
    return new NextResponse(
      JSON.stringify({ success: false, message: "Missing required parameters" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  // Generate PDF attachment if receipt data is available
  let pdfAttachment = null;
  if (receiptData) {
    try {
      const pdfBuffer = await generateReceiptPDF(receiptData, businessName || 'LEWA HOSPITALITY');
      pdfAttachment = {
        filename: `receipt-${receiptId?.substring(0, 8) || 'receipt'}.pdf`,
        content: pdfBuffer,
      };
    } catch (error) {
      console.error('Error generating PDF attachment:', error);
      // Continue without attachment if PDF generation fails
    }
  }

  // Create receipt email content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6b7280; padding: 20px; text-align: center; border-bottom: 3px solid #4a5568;">
        <h2 style="color: white; margin: 0;">${businessName || 'LEWA HOSPITALITY'}</h2>
      </div>
      <div style="padding: 20px;">
        <p>Hello ${customerName || 'valued customer'},</p>
        <p>Thank you for your visit! Please find your receipt ${pdfAttachment ? 'attached as a PDF and' : ''} detailed below.</p>
        
        ${receiptData ? `
          <div style="background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Receipt #${receiptId?.substring(0, 8) || 'N/A'}</h3>
            <p>Date: ${new Date(receiptData.date || Date.now()).toLocaleDateString()}</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <th style="text-align: left; padding: 8px;">Item</th>
                <th style="text-align: right; padding: 8px;">Qty</th>
                <th style="text-align: right; padding: 8px;">Price</th>
              </tr>
              ${receiptData.items?.map((item: { name: any; quantity: any; price: number; }) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px;">${item.name}</td>
                  <td style="text-align: right; padding: 8px;">${item.quantity}</td>
                  <td style="text-align: right; padding: 8px;">$${item.price?.toFixed(2) || '0.00'}</td>
                </tr>
              `).join('') || ''}
              <tr>
                <td colspan="2" style="text-align: right; padding: 8px;"><strong>Total:</strong></td>
                <td style="text-align: right; padding: 8px;"><strong>$${receiptData.total?.toFixed(2) || '0.00'}</strong></td>
              </tr>
              <tr>
                <td colspan="2" style="text-align: right; padding: 8px;"><strong>Payment Method:</strong></td>
                <td style="text-align: right; padding: 8px;">${receiptData.paymentMethod || 'Cash'}</td>
              </tr>
            </table>
          </div>
        ` : ''}
        
        ${receiptUrl ? `
          <p>You can also view or download your receipt online by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${receiptUrl}" target="_blank" style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Online Receipt</a>
          </div>
        ` : ''}
        
        <p>Thank you for your business!</p>
        <p>Best regards,<br>${businessName || 'LEWA HOSPITALITY Team'}</p>
      </div>
      <div style="background-color: #374151; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
        <p>This is an automated email. Please do not reply.</p>
      </div>
    </div>
  `;

  // Prepare email data
  const emailData: any = {
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: [to],
    subject,
    html: htmlContent,
  };

  // Add PDF attachment if available
  if (pdfAttachment) {
    emailData.attachments = [pdfAttachment];
  }

  const { data, error } = await resend.emails.send(emailData);

  if (error) {
    throw new Error(error.message);
  }

  return new NextResponse(
    JSON.stringify({ 
      success: true, 
      message: `Receipt email sent successfully via Resend${pdfAttachment ? ' with PDF attachment' : ''}`,
      emailId: data?.id,
      attachmentIncluded: !!pdfAttachment
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

async function sendWithSendGrid(request: NextRequest) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const { 
    to, 
    subject, 
    customerName, 
    receiptId, 
    receiptUrl, 
    receiptData, 
    businessName 
  } = await request.json();

  if (!to || !subject || !receiptUrl) {
    return new NextResponse(
      JSON.stringify({ success: false, message: "Missing required parameters" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  // Generate PDF attachment if receipt data is available
  let pdfAttachment = null;
  if (receiptData) {
    try {
      const pdfBuffer = await generateReceiptPDF(receiptData, businessName || 'LEWA HOSPITALITY');
      pdfAttachment = {
        content: pdfBuffer.toString('base64'),
        filename: `receipt-${receiptId?.substring(0, 8) || 'receipt'}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      };
    } catch (error) {
      console.error('Error generating PDF attachment:', error);
      // Continue without attachment if PDF generation fails
    }
  }

  // Format date for email
  const formattedDate = new Date(receiptData?.date || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Create email content with HTML template
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #4a5568;">
        <h2>${businessName || 'Spa & Bistro'}</h2>
      </div>
      <div style="padding: 20px;">
        <p>Hello ${customerName || 'valued customer'},</p>
        <p>Thank you for your visit! Please find your receipt ${pdfAttachment ? 'attached as a PDF and' : ''} detailed below.</p>
        
        ${receiptData ? `
          <div style="background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Receipt #${receiptId?.substring(0, 8) || 'N/A'}</h3>
            <p>Date: ${formattedDate}</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <th style="text-align: left; padding: 8px;">Item</th>
                <th style="text-align: right; padding: 8px;">Qty</th>
                <th style="text-align: right; padding: 8px;">Price</th>
              </tr>
              ${receiptData.items?.map((item: { name: any; quantity: any; price: number; }) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px;">${item.name}</td>
                  <td style="text-align: right; padding: 8px;">${item.quantity}</td>
                  <td style="text-align: right; padding: 8px;">$${item.price.toFixed(2)}</td>
                </tr>
              `).join('') || ''}
              <tr>
                <td colspan="2" style="text-align: right; padding: 8px;"><strong>Subtotal:</strong></td>
                <td style="text-align: right; padding: 8px;">$${receiptData.subtotal?.toFixed(2) || '0.00'}</td>
              </tr>
              <tr>
                <td colspan="2" style="text-align: right; padding: 8px;"><strong>Tax (${receiptData.taxRate}%):</strong></td>
                <td style="text-align: right; padding: 8px;">$${receiptData.tax?.toFixed(2) || '0.00'}</td>
              </tr>
              <tr>
                <td colspan="2" style="text-align: right; padding: 8px;"><strong>Total:</strong></td>
                <td style="text-align: right; padding: 8px;"><strong>$${receiptData.total?.toFixed(2) || '0.00'}</strong></td>
              </tr>
              <tr>
                <td colspan="2" style="text-align: right; padding: 8px;"><strong>Payment Method:</strong></td>
                <td style="text-align: right; padding: 8px;">${receiptData.paymentMethod || 'Cash'}</td>
              </tr>
            </table>
          </div>
        ` : ''}
        
        <p>You can also view or download your receipt by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${receiptUrl}" target="_blank" style="background-color: #4a5568; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Receipt</a>
        </div>
        
        <p>Thank you for your business!</p>
        <p>Best regards,<br>${businessName || 'Spa & Bistro Team'}</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #718096;">
        <p>This is an automated email. Please do not reply.</p>
      </div>
    </div>
  `;

  // Prepare email message
  const message: any = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html: htmlContent,
    text: `Hello ${customerName || 'valued customer'},\n\nThank you for your visit! Please find your receipt at the following link: ${receiptUrl}\n\nThank you for your business!\n\nBest regards,\n${businessName || 'Spa & Bistro Team'}`,
  };

  // Add PDF attachment if available
  if (pdfAttachment) {
    message.attachments = [pdfAttachment];
  }

  // Send email
  await sgMail.send(message);

  // Return success response
  return new NextResponse(
    JSON.stringify({ 
      success: true, 
      message: `Receipt email sent successfully via SendGrid${pdfAttachment ? ' with PDF attachment' : ''}`,
      attachmentIncluded: !!pdfAttachment
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}