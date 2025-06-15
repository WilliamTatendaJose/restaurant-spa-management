import { NextRequest, NextResponse } from "next/server"
import { businessSettingsApi } from "@/lib/db"

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
      notificationType = "email" // "email", "whatsapp", or "both"
    } = await request.json()

    if (!customerName || !serviceName || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { success: false, message: "Missing required booking information" },
        { status: 400 }
      )
    }

    // Fetch business settings from database
    const defaultSettings = {
      businessName: "LEWA HOSPITALITY",
      address: "29 Montgomery Road, Highlands, Harare, Zimbabwe",
      phone: "0780045833",
      email: "info@lewa.co.zw",
      website: "www.lewa.co.zw",
    }
    
    const businessSettings = await businessSettingsApi.getSettings(defaultSettings)
    const businessName = businessSettings.businessName || defaultSettings.businessName

    const results = { email: null, whatsapp: null }

    // Format date and time for display
    const formattedDate = new Date(bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    const formattedTime = new Date(`${bookingDate}T${bookingTime}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Send email notification if requested and email is provided
    if ((notificationType === "email" || notificationType === "both") && customerEmail) {
      try {
        if (!process.env.RESEND_API_KEY && (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL)) {
          throw new Error("Email service not configured")
        }

        const emailResponse = await fetch(`${request.nextUrl.origin}/api/bookings/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: customerEmail,
            customerName,
            serviceName,
            bookingDate: formattedDate,
            bookingTime: formattedTime,
            businessSettings, // Pass full business settings
            bookingId
          })
        })

        if (emailResponse.ok) {
          results.email = { success: true, message: "Email confirmation sent" }
        } else {
          const error = await emailResponse.json()
          results.email = { success: false, message: error.message || "Failed to send email" }
        }
      } catch (error) {
        results.email = { success: false, message: (error as Error).message }
      }
    }

    // Send WhatsApp notification if requested and phone is provided
    if ((notificationType === "whatsapp" || notificationType === "both") && customerPhone) {
      try {
        const whatsappResponse = await fetch(`${request.nextUrl.origin}/api/bookings/whatsapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: customerPhone,
            customerName,
            serviceName,
            bookingDate: formattedDate,
            bookingTime: formattedTime,
            businessSettings, // Pass full business settings
            bookingId
          })
        })

        if (whatsappResponse.ok) {
          results.whatsapp = { success: true, message: "WhatsApp notification sent" }
        } else {
          const error = await whatsappResponse.json()
          results.whatsapp = { success: false, message: error.message || "Failed to send WhatsApp" }
        }
      } catch (error) {
        results.whatsapp = { success: false, message: (error as Error).message }
      }
    }

    // Determine overall success
    const hasSuccessfulNotification = 
      (results.email?.success || results.whatsapp?.success) ||
      (!customerEmail && !customerPhone)

    return NextResponse.json({
      success: hasSuccessfulNotification,
      message: hasSuccessfulNotification 
        ? "Booking confirmation notifications sent successfully"
        : "Failed to send booking confirmation notifications",
      results
    })

  } catch (error) {
    console.error("Error sending booking confirmation:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error", 
        error: (error as Error).message 
      },
      { status: 500 }
    )
  }
}