import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message, receiptUrl, businessName } = body;

    if (!phoneNumber) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Missing phone number" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Check if Twilio is configured
    if (process.env.TWILIO_ACCOUNT_SID && 
        process.env.TWILIO_AUTH_TOKEN && 
        process.env.TWILIO_WHATSAPP_NUMBER) {
      
      // Initialize Twilio client
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      // Format phone number (ensure it has country code)
      const formattedNumber = formatPhoneNumber(phoneNumber);
      
      // Create message content
      const messageContent = message || 
        `Thank you for visiting ${businessName || 'Spa & Bistro'}! Here's your receipt: ${receiptUrl}`;
      
      // Send WhatsApp message via Twilio
      await twilioClient.messages.create({
        body: messageContent,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${formattedNumber}`,
        mediaUrl: receiptUrl ? [receiptUrl] : undefined
      });
      
      return new NextResponse(
        JSON.stringify({ 
          success: true, 
          message: "Receipt sent via WhatsApp successfully",
          method: "twilio"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    } else {
      // Fallback to WhatsApp deep link if Twilio is not configured
      const messageText = encodeURIComponent(
        message || `Thank you for visiting ${businessName || 'Spa & Bistro'}! Here's your receipt: ${receiptUrl}`
      );
      
      // Create a WhatsApp deep link
      const whatsappLink = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${messageText}`;
      
      return new NextResponse(
        JSON.stringify({ 
          success: true, 
          message: "WhatsApp deep link generated successfully",
          link: whatsappLink,
          method: "deeplink"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: "Failed to send WhatsApp message", 
        error: (error as Error).message 
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

/**
 * Ensures phone number is in international format
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number with country code
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Check if number already has country code
  if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
    return digitsOnly;
  }
  
  // Add US country code (modify this logic for other countries)
  return `1${digitsOnly}`;
}