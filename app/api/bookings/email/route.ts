import { NextRequest, NextResponse } from "next/server"
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    // Check for Resend API key first, fallback to SendGrid
    if (process.env.RESEND_API_KEY) {
      return await sendWithResend(request)
    } else if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
      return await sendWithSendGrid(request)
    } else {
      throw new Error("No email service configured. Please set RESEND_API_KEY or SENDGRID credentials");
    }
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: "Failed to send booking confirmation email", 
        error: (error as Error).message 
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

async function sendWithResend(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const { 
    to, 
    customerName, 
    serviceName, 
    bookingDate, 
    bookingTime, 
    businessSettings,
    bookingId 
  } = await request.json();

  if (!to || !customerName || !serviceName || !bookingDate || !bookingTime) {
    return new NextResponse(
      JSON.stringify({ success: false, message: "Missing required parameters" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const businessName = businessSettings?.businessName || 'LEWA HOSPITALITY';
  const businessAddress = businessSettings?.address || '29 Montgomery Road, Highlands, Harare, Zimbabwe';
  const businessPhone = businessSettings?.phone || '';
  const businessEmail = businessSettings?.email || '';
  const businessWebsite = businessSettings?.website || 'www.lewa.co.zw';

  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #6b7280; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">${businessName}</h2>
          ${businessAddress ? `<p style="color: #e5e7eb; margin: 5px 0 0 0; font-size: 14px;">${businessAddress}</p>` : ''}
        </div>
        <div style="padding: 30px; background-color: #f8fafc;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #16a34a; margin-top: 0; text-align: center;">✅ Booking Confirmed!</h3>
            
            <p>Dear ${customerName},</p>
            
            <p>Great news! Your booking has been confirmed. We're excited to see you!</p>
            
            <div style="background-color: #f1f5f9; border-left: 4px solid #6b7280; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h4 style="margin-top: 0; color: #4b5563;">Booking Details</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Service:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Date:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${bookingDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Time:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${bookingTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Booking ID:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-family: monospace;">${bookingId?.substring(0, 8) || 'N/A'}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>📋 Important Reminders:</strong><br>
                • Please arrive 15 minutes before your appointment<br>
                • Bring a valid ID for verification<br>
                • Contact us if you need to reschedule<br>
                • Cancellations must be made at least 24 hours in advance
              </p>
            </div>
            
            <p>If you have any questions or need to make changes to your booking, please don't hesitate to contact us.</p>
            
            ${businessPhone || businessEmail ? `
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #4b5563;">Contact Information</h4>
              ${businessPhone ? `<p style="margin: 5px 0; color: #475569;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="margin: 5px 0; color: #475569;">✉️ ${businessEmail}</p>` : ''}
              ${businessWebsite ? `<p style="margin: 5px 0; color: #475569;">🌐 ${businessWebsite}</p>` : ''}
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="margin: 0; color: #64748b;">Looking forward to serving you!</p>
            </div>
          </div>
        </div>
        <div style="background-color: #374151; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            ${businessName}<br>
            This is an automated confirmation email. Please do not reply to this message.
          </p>
        </div>
      </div>
    `;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: [to],
    subject: `✅ Booking Confirmed - ${serviceName} on ${bookingDate}`,
    html: htmlContent,
  });

  if (error) {
    throw new Error(error.message);
  }

  return new NextResponse(
    JSON.stringify({ 
      success: true, 
      message: "Booking confirmation email sent successfully via Resend",
      emailId: data?.id
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

async function sendWithSendGrid(request: NextRequest) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const { 
    to, 
    customerName, 
    serviceName, 
    bookingDate, 
    bookingTime, 
    businessSettings,
    bookingId 
  } = await request.json();

  if (!to || !customerName || !serviceName || !bookingDate || !bookingTime) {
    return new NextResponse(
      JSON.stringify({ success: false, message: "Missing required parameters" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const businessName = businessSettings?.businessName || 'LEWA HOSPITALITY';
  const businessAddress = businessSettings?.address || '29 Montgomery Road, Highlands, Harare, Zimbabwe';
  const businessPhone = businessSettings?.phone || '';
  const businessEmail = businessSettings?.email || '';
  const businessWebsite = businessSettings?.website || 'www.lewa.co.zw';

  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #6b7280; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">${businessName}</h2>
          ${businessAddress ? `<p style="color: #e5e7eb; margin: 5px 0 0 0; font-size: 14px;">${businessAddress}</p>` : ''}
        </div>
        <div style="padding: 30px; background-color: #f8fafc;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #16a34a; margin-top: 0; text-align: center;">✅ Booking Confirmed!</h3>
            
            <p>Dear ${customerName},</p>
            
            <p>Great news! Your booking has been confirmed. We're excited to see you!</p>
            
            <div style="background-color: #f1f5f9; border-left: 4px solid #6b7280; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h4 style="margin-top: 0; color: #4b5563;">Booking Details</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Service:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Date:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${bookingDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Time:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${bookingTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Booking ID:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-family: monospace;">${bookingId?.substring(0, 8) || 'N/A'}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>📋 Important Reminders:</strong><br>
                • Please arrive 15 minutes before your appointment<br>
                • Bring a valid ID for verification<br>
                • Contact us if you need to reschedule<br>
                • Cancellations must be made at least 24 hours in advance
              </p>
            </div>
            
            <p>If you have any questions or need to make changes to your booking, please don't hesitate to contact us.</p>
            
            ${businessPhone || businessEmail ? `
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #4b5563;">Contact Information</h4>
              ${businessPhone ? `<p style="margin: 5px 0; color: #475569;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="margin: 5px 0; color: #475569;">✉️ ${businessEmail}</p>` : ''}
              ${businessWebsite ? `<p style="margin: 5px 0; color: #475569;">🌐 ${businessWebsite}</p>` : ''}
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="margin: 0; color: #64748b;">Looking forward to serving you!</p>
            </div>
          </div>
        </div>
        <div style="background-color: #374151; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            ${businessName}<br>
            This is an automated confirmation email. Please do not reply to this message.
          </p>
        </div>
      </div>
    `;

  const message = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `✅ Booking Confirmed - ${serviceName} on ${bookingDate}`,
    html: htmlContent,
    text: `Dear ${customerName},\n\nYour booking has been confirmed!\n\nService: ${serviceName}\nDate: ${bookingDate}\nTime: ${bookingTime}\nBooking ID: ${bookingId?.substring(0, 8) || 'N/A'}\n\nPlease arrive 15 minutes before your appointment. Contact us if you need to make any changes.\n\n${businessPhone ? `Phone: ${businessPhone}\n` : ''}${businessEmail ? `Email: ${businessEmail}\n` : ''}\nThank you,\n${businessName} Team`,
  };

  await sgMail.send(message);

  return new NextResponse(
    JSON.stringify({ 
      success: true, 
      message: "Booking confirmation email sent successfully via SendGrid" 
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}