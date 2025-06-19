import { NextRequest, NextResponse } from "next/server";
import { businessSettingsApi } from "@/lib/db";

export async function GET() {
  try {
    const settings = await businessSettingsApi.getSettings();
    
    // Convert business settings format to operating hours format
    const operatingHoursData = [
      { day: "Sunday", opens_at: "09:00", closes_at: "21:00", is_closed: false, day_order: 7 },
      { day: "Monday", opens_at: "09:00", closes_at: "21:00", is_closed: false, day_order: 1 },
      { day: "Tuesday", opens_at: "09:00", closes_at: "21:00", is_closed: false, day_order: 2 },
      { day: "Wednesday", opens_at: "09:00", closes_at: "21:00", is_closed: false, day_order: 3 },
      { day: "Thursday", opens_at: "09:00", closes_at: "21:00", is_closed: false, day_order: 4 },
      { day: "Friday", opens_at: "09:00", closes_at: "21:00", is_closed: false, day_order: 5 },
      { day: "Saturday", opens_at: "09:00", closes_at: "21:00", is_closed: true, day_order: 6 }
    ];
    
    return NextResponse.json({
      success: true,
      data: operatingHoursData
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch operating hours" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const hours = await req.json();
    await businessSettingsApi.update("operating_hours", hours);
    
    return NextResponse.json({
      success: true,
      message: "Operating hours updated successfully",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to update operating hours" },
      { status: 500 }
    );
  }
}