import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { 
      phoneNumber, 
      customerName, 
      serviceName, 
      bookingDate, 
      bookingTime, 
      businessSettings,
      bookingId 
    } = await request.json();

    if (!phoneNumber || !customerName || !serviceName || !bookingDate || !bookingTime) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Missing required parameters" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const businessName = businessSettings?.businessName || 'LEWA HOSPITALITY';
    const businessPhone = businessSettings?.phone || '';
    const businessAddress = businessSettings?.address || '29 Montgomery Road, Highlands, Harare, Zimbabwe';

    // Format phone number (ensure it starts with +)
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.startsWith('263')) { // Zimbabwe country code
      formattedNumber = '263' + formattedNumber;
    }
    formattedNumber = '+' + formattedNumber;

    // Create booking confirmation message with business details
    const messageContent = `🎉 *Booking Confirmed!*

Hi ${customerName}! Your booking at ${businessName} has been confirmed.

📅 *Booking Details:*
• Service: ${serviceName}
• Date: ${bookingDate}
• Time: ${bookingTime}
• Booking ID: ${bookingId?.substring(0, 8) || 'N/A'}

📋 *Important Reminders:*
• Arrive 15 minutes early
• Bring valid ID
• Contact us to reschedule
• 24hr cancellation policy

${businessPhone || businessAddress ? `📞 *Contact Us:*` : ''}${businessPhone ? `\n• Phone: ${businessPhone}` : ''}${businessAddress ? `\n• Address: ${businessAddress}` : ''}

Looking forward to serving you! 🌟`;

    // Method 1: WhatsApp Business API (Free tier - 1000 messages/month)
    if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const whatsappResponse = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedNumber,
            type: 'text',
            text: {
              body: messageContent
            }
          })
        });

        if (whatsappResponse.ok) {
          const result = await whatsappResponse.json();
          return new NextResponse(
            JSON.stringify({ 
              success: true, 
              message: "Booking confirmation sent via WhatsApp Business API",
              messageId: result.messages?.[0]?.id,
              method: "whatsapp_business_api"
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        } else {
          console.error("WhatsApp Business API error:", await whatsappResponse.text());
        }
      } catch (error) {
        console.error("WhatsApp Business API error:", error);
      }
    }

    // Method 2: Twilio (fallback)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
      try {
        const twilio = require('twilio');
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        await twilioClient.messages.create({
          body: messageContent,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${formattedNumber}`,
        });
        
        return new NextResponse(
          JSON.stringify({ 
            success: true, 
            message: "Booking confirmation sent via Twilio WhatsApp",
            method: "twilio"
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      } catch (twilioError) {
        console.error("Twilio WhatsApp error:", twilioError);
      }
    }

    // Method 3: Green API (Free tier - 3000 messages/month)
    if (process.env.GREEN_API_INSTANCE_ID && process.env.GREEN_API_ACCESS_TOKEN) {
      try {
        const greenApiResponse = await fetch(`https://api.green-api.com/waInstance${process.env.GREEN_API_INSTANCE_ID}/sendMessage/${process.env.GREEN_API_ACCESS_TOKEN}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: `${formattedNumber}@c.us`,
            message: messageContent
          })
        });

        if (greenApiResponse.ok) {
          return new NextResponse(
            JSON.stringify({ 
              success: true, 
              message: "Booking confirmation sent via Green API",
              method: "green_api"
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        }
      } catch (error) {
        console.error("Green API error:", error);
      }
    }

    // Method 4: WhatsApp Web automation (using puppeteer - requires server setup)
    if (process.env.ENABLE_WHATSAPP_WEB_AUTOMATION === 'true') {
      try {
        // This would require a separate service running puppeteer
        const automationResponse = await fetch(`${process.env.WHATSAPP_AUTOMATION_SERVICE_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formattedNumber,
            message: messageContent
          })
        });

        if (automationResponse.ok) {
          return new NextResponse(
            JSON.stringify({ 
              success: true, 
              message: "Booking confirmation sent via WhatsApp Web automation",
              method: "web_automation"
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        }
      } catch (error) {
        console.error("WhatsApp Web automation error:", error);
      }
    }

    // Fallback: Generate WhatsApp deep link (doesn't actually send, just opens WhatsApp)
    const encodedMessage = encodeURIComponent(messageContent);
    const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: "WhatsApp link generated - please click to send manually",
        whatsappLink,
        directLink: true,
        method: "deep_link",
        note: "This opens WhatsApp with pre-filled message. User needs to click send."
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending booking confirmation via WhatsApp:", error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: "Failed to send booking confirmation via WhatsApp", 
        error: (error as Error).message 
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}