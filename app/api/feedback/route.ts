import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customer_name,
      customer_email,
      service_type,
      overall_rating,
      service_quality,
      staff_friendliness,
      cleanliness,
      value_for_money,
      comments,
      recommend,
      visit_date,
      improvements,
      status = 'pending',
      created_at = new Date().toISOString(),
    } = body;

    // Validate required fields
    if (!customer_name || !customer_email || !overall_rating) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: customer_name, customer_email, and overall_rating are required',
        },
        { status: 400 }
      );
    }

    // Validate rating is between 1-5
    if (overall_rating < 1 || overall_rating > 5) {
      return NextResponse.json(
        { error: 'Overall rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Insert feedback into database
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        {
          customer_name,
          customer_email,
          service_type,
          overall_rating,
          service_quality: service_quality || 0,
          staff_friendliness: staff_friendliness || 0,
          cleanliness: cleanliness || 0,
          value_for_money: value_for_money || 0,
          comments,
          recommend,
          visit_date: visit_date || null,
          improvements,
          status,
          created_at,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save feedback to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
