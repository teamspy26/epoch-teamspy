import nodemailer from "nodemailer";

function makeTransporter() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD env var is missing");

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: { user, pass },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean }> {
  try {
    const transporter = makeTransporter();
    await transporter.sendMail({
      from: `"Prasadam 🙏" <${process.env.GMAIL_USER?.trim()}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] ✓ Sent to ${to} — ${subject}`);
    return { success: true };
  } catch (err) {
    console.error(`[Email] ✗ Failed to send to ${to}:`, err);
    return { success: false };
  }
}

// ── Templates ──────────────────────────────────────────────────────────────────

function wrap(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8faf9;font-family:sans-serif;">
<div style="max-width:540px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
  <div style="background:#1D9E75;padding:28px 32px;">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🙏 Prasadam</h1>
    <p style="margin:4px 0 0;color:#b2f0da;font-size:13px;">Feeding communities, reducing waste</p>
  </div>
  <div style="padding:28px 32px;">
    <h2 style="margin:0 0 16px;color:#0f2d24;font-size:18px;">${title}</h2>
    ${body}
  </div>
  <div style="background:#f8faf9;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#94a3b8;font-size:12px;">You're receiving this because you're registered on Prasadam. © 2026 Prasadam</p>
  </div>
</div></body></html>`;
}

export function buildRestaurantBroadcastEmail({
  ngoName,
  servingsNeeded,
  beneficiaryCount,
  urgency,
  address,
}: {
  ngoName: string;
  servingsNeeded: number;
  beneficiaryCount: number;
  urgency: string;
  address: string;
}): string {
  const urgencyColor = urgency === "critical" ? "#ef4444" : urgency === "high" ? "#f97316" : "#1D9E75";
  return wrap(
    "🍱 Food Needed Nearby — Can You Help?",
    `<p style="color:#374151;line-height:1.6;">An NGO in your area is looking for surplus food donations.</p>
    <div style="background:#f0fdf7;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#14532d;font-size:14px;"><strong>NGO:</strong> ${ngoName}</p>
      <p style="margin:0 0 8px;color:#14532d;font-size:14px;"><strong>Servings needed:</strong> ${servingsNeeded}</p>
      <p style="margin:0 0 8px;color:#14532d;font-size:14px;"><strong>Beneficiaries:</strong> ${beneficiaryCount} people</p>
      <p style="margin:0 0 8px;font-size:14px;"><strong>Urgency:</strong> <span style="color:${urgencyColor};font-weight:700;">${urgency.toUpperCase()}</span></p>
      <p style="margin:0;color:#14532d;font-size:14px;"><strong>Delivery to:</strong> ${address}</p>
    </div>
    <p style="color:#374151;line-height:1.6;">If you have surplus food available, <strong>open the Prasadam app and post a listing</strong>. Our system will automatically match you with this request and notify you.</p>
    <p style="color:#374151;line-height:1.6;">Together we can make sure this food reaches people who need it today. 🙏</p>`
  );
}

export function buildMatchFoundEmail({
  ngoName,
  restaurantName,
  servingsAvailable,
}: {
  ngoName: string;
  restaurantName: string;
  servingsAvailable: number;
}): string {
  return wrap(
    "Match Found! 🎉",
    `<p style="color:#374151;line-height:1.6;">Dear <strong>${ngoName}</strong>,</p>
    <p style="color:#374151;line-height:1.6;">Great news! <strong>${restaurantName}</strong> has <strong>${servingsAvailable} servings</strong> available and has been matched with your request.</p>
    <div style="background:#f0fdf7;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#14532d;font-size:14px;">⏳ We are waiting for <strong>${restaurantName}</strong> to approve the match. You will receive another email once confirmed.</p>
    </div>
    <p style="color:#374151;line-height:1.6;">Thank you for using Prasadam to feed your community! 🙏</p>`
  );
}

export function buildApprovalEmail({
  ngoName,
  restaurantName,
  servingsNeeded,
  pickupAddress,
  matchId,
}: {
  ngoName: string;
  restaurantName: string;
  servingsNeeded: number;
  pickupAddress: string;
  matchId: string;
}): string {
  return wrap(
    "Your Request is Approved! ✅",
    `<p style="color:#374151;line-height:1.6;">Dear <strong>${ngoName}</strong>,</p>
    <p style="color:#374151;line-height:1.6;"><strong>${restaurantName}</strong> has approved your food request!</p>
    <div style="background:#f0fdf7;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#14532d;font-size:14px;"><strong>Servings:</strong> ${servingsNeeded}</p>
      <p style="margin:0 0 8px;color:#14532d;font-size:14px;"><strong>Pickup Address:</strong> ${pickupAddress}</p>
      <p style="margin:0;color:#14532d;font-size:14px;"><strong>Match ID:</strong> ${matchId}</p>
    </div>
    <p style="color:#374151;line-height:1.6;">A volunteer is being assigned to deliver your food. You'll be notified when they are on their way. 🚴</p>`
  );
}

export function buildRestaurantMatchEmail({
  restaurantName,
  ngoName,
  servingsNeeded,
  beneficiaryCount,
  urgency,
  slaMinutes,
}: {
  restaurantName: string;
  ngoName: string;
  servingsNeeded: number;
  beneficiaryCount: number;
  urgency: string;
  slaMinutes: number;
}): string {
  const urgencyColor = urgency === "critical" ? "#ef4444" : urgency === "high" ? "#f97316" : "#1D9E75";
  return wrap(
    "Food Request Matched to You 🍽️",
    `<p style="color:#374151;line-height:1.6;">Dear <strong>${restaurantName}</strong>,</p>
    <p style="color:#374151;line-height:1.6;">A food request from <strong>${ngoName}</strong> has been matched to your surplus listing.</p>
    <div style="background:#f0fdf7;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#14532d;font-size:14px;"><strong>NGO:</strong> ${ngoName}</p>
      <p style="margin:0 0 8px;color:#14532d;font-size:14px;"><strong>Servings needed:</strong> ${servingsNeeded}</p>
      <p style="margin:0 0 8px;color:#14532d;font-size:14px;"><strong>Beneficiaries:</strong> ${beneficiaryCount} people</p>
      <p style="margin:0;font-size:14px;"><strong>Urgency:</strong> <span style="color:${urgencyColor};font-weight:700;">${urgency.toUpperCase()}</span></p>
    </div>
    <p style="color:#374151;line-height:1.6;"><strong>Please open the Prasadam app and approve or decline within ${slaMinutes} minutes.</strong></p>
    <p style="color:#374151;line-height:1.6;">By approving, you'll help feed ${beneficiaryCount} people today. 🙏</p>`
  );
}

export function buildVolunteerAssignedEmail({
  volunteerName,
  restaurantName,
  pickupAddress,
  ngoName,
  dropAddress,
  servings,
}: {
  volunteerName: string;
  restaurantName: string;
  pickupAddress: string;
  ngoName: string;
  dropAddress: string;
  servings: number;
}): string {
  return wrap(
    "New Delivery Assigned to You 🚴",
    `<p style="color:#374151;line-height:1.6;">Dear <strong>${volunteerName}</strong>,</p>
    <p style="color:#374151;line-height:1.6;">You have a new Prasadam delivery assigned to you!</p>
    <div style="background:#f0fdf7;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 12px;color:#14532d;font-size:14px;font-weight:700;">📍 Pickup</p>
      <p style="margin:0 0 4px;color:#374151;font-size:14px;"><strong>${restaurantName}</strong></p>
      <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">${pickupAddress}</p>
      <p style="margin:0 0 12px;color:#14532d;font-size:14px;font-weight:700;">🏠 Delivery</p>
      <p style="margin:0 0 4px;color:#374151;font-size:14px;"><strong>${ngoName}</strong></p>
      <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">${dropAddress}</p>
      <p style="margin:0;color:#14532d;font-size:14px;"><strong>Servings:</strong> ${servings}</p>
    </div>
    <p style="color:#374151;line-height:1.6;">Open the Prasadam app to view the full details and start your delivery. Thank you for volunteering! 🙏</p>`
  );
}

export function buildDeliveryCompleteEmail({
  ngoName,
  volunteerName,
  servings,
  restaurantName,
}: {
  ngoName: string;
  volunteerName: string;
  servings: number;
  restaurantName: string;
}): string {
  return wrap(
    "Food Delivered! 🎉",
    `<p style="color:#374151;line-height:1.6;">Dear <strong>${ngoName}</strong>,</p>
    <p style="color:#374151;line-height:1.6;">Your food delivery is complete!</p>
    <div style="background:#f0fdf7;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#14532d;font-size:14px;"><strong>From:</strong> ${restaurantName}</p>
      <p style="margin:0 0 8px;color:#14532d;font-size:14px;"><strong>Delivered by:</strong> ${volunteerName}</p>
      <p style="margin:0;color:#14532d;font-size:14px;"><strong>Servings delivered:</strong> ${servings}</p>
    </div>
    <p style="color:#374151;line-height:1.6;">Thank you to everyone who made this happen. Together, we're fighting hunger one meal at a time. 🙏</p>`
  );
}
