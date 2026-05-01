import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json() as {
      to: string;
      subject: string;
      html: string;
    };

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "to, subject, and html required" }, { status: 400 });
    }

    await sendEmail({ to, subject, html });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Email API]", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
