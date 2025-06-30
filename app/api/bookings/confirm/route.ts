import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { bookingsApi, businessSettingsApi } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      bookingId,
      customerName,
      customerEmail,
      customerPhone,
      serviceName,
      bookingDate,
      bookingTime,
      notificationType,
    } = await request.json();

    // Validate required fields
    if (!bookingId || !customerName || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required booking information' },
        { status: 400 }
      );
    }

    // Update booking status to confirmed if not already
    try {
      await bookingsApi.update(bookingId, {
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
    }

    // Get business settings for email template
    const businessSettings = await businessSettingsApi.getSettings({
      businessName: 'LEWA HOSPITALITY',
      address: '29 Montgomery Road, Highlands, Harare, Zimbabwe',
      phone: '',
      email: '',
      website: 'www.lewa.co.zw',
    });

    // Send confirmation email using Resend
    const emailSuccess = await sendBookingConfirmationEmail({
      customerName,
      customerEmail,
      customerPhone,
      serviceName,
      bookingDate,
      bookingTime,
      bookingId,
      businessSettings,
    });

    if (emailSuccess.success) {
      return NextResponse.json({
        success: true,
        message: 'Booking confirmation sent successfully',
        emailId: emailSuccess.emailId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: emailSuccess.error || 'Failed to send confirmation email',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in booking confirmation API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Send booking confirmation email using Resend
async function sendBookingConfirmationEmail({
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  bookingDate,
  bookingTime,
  bookingId,
  businessSettings,
}: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  bookingId: string;
  businessSettings: any;
}) {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Format the booking details
    const formattedDate = new Date(bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = new Date(
      `1970-01-01T${bookingTime}`
    ).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const businessName = businessSettings?.businessName || 'LEWA HOSPITALITY';
    const businessAddress =
      businessSettings?.address ||
      '29 Montgomery Road, Highlands, Harare, Zimbabwe';
    const businessPhone = businessSettings?.phone || '';
    const businessEmail = businessSettings?.email || '';
    const businessWebsite = businessSettings?.website || 'www.lewa.co.zw';

    // Create professional email template
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
                  <td style="padding: 8px 0; color: #1e293b;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Time:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${formattedTime}</td>
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
            
            ${
              businessPhone || businessEmail
                ? `
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #4b5563;">Contact Information</h4>
              ${businessPhone ? `<p style="margin: 5px 0; color: #475569;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="margin: 5px 0; color: #475569;">✉️ ${businessEmail}</p>` : ''}
              ${businessWebsite ? `<p style="margin: 5px 0; color: #475569;">🌐 ${businessWebsite}</p>` : ''}
            </div>
            `
                : ''
            }
            
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

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [customerEmail],
      subject: `✅ Booking Confirmed - ${serviceName} on ${formattedDate}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    console.log('📧 Booking confirmation email sent successfully:', {
      to: customerEmail,
      subject: `✅ Booking Confirmed - ${serviceName} on ${formattedDate}`,
      emailId: data?.id,
      timestamp: new Date().toISOString(),
    });

    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: (error as Error).message };
  }
}
