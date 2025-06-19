import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { to, subject, html } = await req.json();
  try {
    const data = await resend.emails.send({
      from: "support@techrehub.co.zw", // Change to your verified sender
      to,
      subject,
      html,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}
