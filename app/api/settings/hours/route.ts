import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET endpoint to fetch operating hours
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("operating_hours")
      .select("*")
      .order("day_order", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch operating hours from database" },
        { status: 500 }
      );
    }

    // If no data exists, return default operating hours
    if (!data || data.length === 0) {
      const defaultHours = [
        { day: "Monday", opens_at: "09:00", closes_at: "18:00", is_closed: false, day_order: 1 },
        { day: "Tuesday", opens_at: "09:00", closes_at: "18:00", is_closed: false, day_order: 2 },
        { day: "Wednesday", opens_at: "09:00", closes_at: "18:00", is_closed: false, day_order: 3 },
        { day: "Thursday", opens_at: "09:00", closes_at: "18:00", is_closed: false, day_order: 4 },
        { day: "Friday", opens_at: "09:00", closes_at: "19:00", is_closed: false, day_order: 5 },
        { day: "Saturday", opens_at: "10:00", closes_at: "16:00", is_closed: false, day_order: 6 },
        { day: "Sunday", opens_at: "10:00", closes_at: "14:00", is_closed: true, day_order: 7 },
      ];
      
      return NextResponse.json({
        success: true,
        data: defaultHours,
      });
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}