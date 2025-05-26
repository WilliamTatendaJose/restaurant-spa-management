import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      throw new Error("SendGrid API key or from email not configured");
    }

    // Parse request body
    const body = await request.json();
    const { to, subject, customerName, receiptId, receiptUrl, receiptData, businessName } = body;

    if (!to || !subject || !receiptUrl) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Missing required parameters" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
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
          <p>Thank you for your visit! Please find your receipt attached below.</p>
          
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
    const message = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html: htmlContent,
      text: `Hello ${customerName || 'valued customer'},\n\nThank you for your visit! Please find your receipt at the following link: ${receiptUrl}\n\nThank you for your business!\n\nBest regards,\n${businessName || 'Spa & Bistro Team'}`,
    };

    // Send email
    await sgMail.send(message);

    // Return success response
    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: "Receipt email sent successfully" 
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
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