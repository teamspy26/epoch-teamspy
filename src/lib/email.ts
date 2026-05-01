import nodemailer from "nodemailer";

function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    console.warn("[Email] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping email");
    return;
  }
  await transport.sendMail({
    from: `"Prasadam 🙏" <${process.env.GMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export function buildApprovalEmail(params: {
  ngoName: string;
  restaurantName: string;
  servingsNeeded: number;
  pickupAddress: string;
  matchId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f8faf9;padding:24px;color:#1e293b">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:32px">🙏</span>
      <h1 style="color:#1D9E75;font-size:22px;margin:8px 0">Food Request Approved!</h1>
    </div>

    <p style="font-size:15px;line-height:1.6">Dear <strong>${params.ngoName}</strong>,</p>
    <p style="font-size:15px;line-height:1.6">
      Great news! <strong>${params.restaurantName}</strong> has approved your food request for
      <strong>${params.servingsNeeded} servings</strong>. A volunteer is being dispatched to collect and deliver the food to you.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:20px 0">
      <p style="margin:0 0 8px 0;font-size:13px;color:#166534;font-weight:600">Delivery Details</p>
      <p style="margin:0;font-size:13px;color:#15803d">📍 Pickup from: ${params.pickupAddress}</p>
      <p style="margin:4px 0 0 0;font-size:12px;color:#6b7280">Match ID: ${params.matchId}</p>
    </div>

    <p style="font-size:14px;color:#64748b;line-height:1.6">
      You will receive another notification once a volunteer is assigned and food is on the way.
      Thank you for your trust in Prasadam — together we ensure no food goes to waste. 🌱
    </p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:12px;color:#94a3b8;text-align:center">
      Prasadam · प्रसादम् · Blessed food for all · Built with love in India
    </p>
  </div>
</body>
</html>`;
}

export function buildMatchFoundEmail(params: {
  ngoName: string;
  restaurantName: string;
  servingsAvailable: number;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f8faf9;padding:24px;color:#1e293b">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:32px">✨</span>
      <h1 style="color:#1D9E75;font-size:22px;margin:8px 0">Match Found!</h1>
    </div>
    <p style="font-size:15px;line-height:1.6">Dear <strong>${params.ngoName}</strong>,</p>
    <p style="font-size:15px;line-height:1.6">
      We found a match for your food request! <strong>${params.restaurantName}</strong> has
      <strong>${params.servingsAvailable} servings</strong> available.
      We're waiting for their confirmation — you'll get another email once approved.
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:12px;color:#94a3b8;text-align:center">Prasadam · Built with love in India</p>
  </div>
</body>
</html>`;
}
