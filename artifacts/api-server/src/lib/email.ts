import { Resend } from "resend";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

const STAR_MAP: Record<number, string> = {
  1: "★☆☆☆☆",
  2: "★★☆☆☆",
  3: "★★★☆☆",
  4: "★★★★☆",
  5: "★★★★★",
};

const PLATFORM_LABEL: Record<string, string> = {
  google: "Google",
  zomato: "Zomato",
  tripadvisor: "TripAdvisor",
};

export async function sendTeamInviteEmail({ to, inviteUrl, role }: { to: string; inviteUrl: string; role: string }): Promise<void> {
  const resend = getResend();
  const fromAddress = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const roleLabel = role === "manager" ? "Manager" : "Staff";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Souklick</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Team invitation</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">You've been invited to join a team</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
              You've been invited to join a Souklick workspace as a <strong>${roleLabel}</strong>. Click below to set up your account and get started.
            </p>
            <a href="${inviteUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              Accept invite →
            </a>
            <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">This invite expires in 48 hours. If you weren't expecting this, you can safely ignore it.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              If the button doesn't work: <a href="${inviteUrl}" style="color:#9ca3af;">${inviteUrl}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: `You've been invited to join a Souklick workspace`,
    html,
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }): Promise<void> {
  const resend = getResend();
  const fromAddress = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Souklick</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Password reset</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">Reset your password</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
              We received a request to reset your Souklick password. Click the button below to choose a new one. This link expires in 1 hour.
            </p>
            <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              Reset password →
            </a>
            <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
              If you didn't request this, you can safely ignore this email. Your password won't change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              If the button doesn't work, copy this link: <a href="${resetUrl}" style="color:#9ca3af;">${resetUrl}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: "Reset your Souklick password",
    html,
  });
}

export async function sendWelcomeEmail({ to, fullName }: { to: string; fullName: string }): Promise<void> {
  const resend = getResend();
  const fromAddress = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  const firstName = fullName.split(" ")[0];

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Souklick</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Welcome aboard</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Hi ${firstName} 👋</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
              Welcome to Souklick — your command centre for managing customer reviews across all your locations.
            </p>
            <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111827;">Here's how to get started:</p>
            <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:2;color:#374151;">
              <li>Add your first location</li>
              <li>Connect your review platforms (Google, Zomato, TripAdvisor)</li>
              <li>Set your AI brand voice so responses sound like you</li>
            </ol>
            <a href="${process.env.APP_URL ?? "https://souklick.com"}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              Open Souklick →
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You're on a 14-day free trial. No credit card needed until you're ready to upgrade.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: `Welcome to Souklick, ${firstName}!`,
    html,
  });
}

export async function sendTrialWarningEmail({ to, fullName, daysLeft }: { to: string; fullName: string; daysLeft: number }): Promise<void> {
  const resend = getResend();
  const fromAddress = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const appUrl = process.env.APP_URL ?? "https://souklick.com";
  const firstName = fullName.split(" ")[0];
  const urgencyColor = daysLeft === 1 ? "#dc2626" : "#d97706";
  const dayLabel = daysLeft === 1 ? "1 day" : `${daysLeft} days`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Souklick</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Trial reminder</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">Hi ${firstName}, your trial ends in <span style="color:${urgencyColor};">${dayLabel}</span></p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
              Your Souklick free trial is expiring soon. After it ends, you'll lose access to your review dashboard, AI responses, and email alerts.
            </p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
              Upgrade now to keep everything running without interruption.
            </p>
            <a href="${appUrl}/upgrade" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              Upgrade now →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You're receiving this because your Souklick trial is ending soon.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: `Your Souklick trial ends in ${dayLabel} — upgrade to keep access`,
    html,
  });
}

export async function sendReminderEmail({
  to,
  customerName,
  locationName,
  platform,
  reviewUrl,
  reminderNumber,
}: {
  to: string;
  customerName: string;
  locationName: string;
  platform: string;
  reviewUrl: string;
  reminderNumber: 1 | 2;
}): Promise<void> {
  const resend = getResend();
  const fromAddress = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const firstName = customerName.split(" ")[0];
  const platformLabel = PLATFORM_LABEL[platform] ?? platform;
  const isLast = reminderNumber === 2;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${locationName}</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${isLast ? "Last reminder" : "Quick follow-up"}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Hi ${firstName}</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
              ${isLast
                ? `This is our last reminder — we won't bother you again after this. If you have a spare moment, a review on ${platformLabel} would mean the world to the team at <strong>${locationName}</strong>.`
                : `Just a quick follow-up from the team at <strong>${locationName}</strong>. We'd still love to hear about your experience — it only takes a minute!`
              }
            </p>
            <a href="${reviewUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              Leave a review on ${platformLabel} →
            </a>
            <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
              Thank you for your support!
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You received this because a team member at ${locationName} invited you to leave a review.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: isLast
      ? `Last reminder: How was your visit to ${locationName}?`
      : `Quick reminder: share your experience at ${locationName}`,
    html,
  });
}

export async function sendReviewRequestEmail({
  to,
  customerName,
  locationName,
  platform,
  reviewUrl,
}: {
  to: string;
  customerName: string;
  locationName: string;
  platform: string;
  reviewUrl: string;
}): Promise<void> {
  const resend = getResend();
  const fromAddress = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const firstName = customerName.split(" ")[0];
  const platformLabel = PLATFORM_LABEL[platform] ?? platform;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${locationName}</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">We'd love your feedback</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Hi ${firstName} 👋</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
              Thank you for visiting <strong>${locationName}</strong>. We hope you had a great experience!
            </p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
              If you have a moment, we'd really appreciate it if you could share your thoughts on ${platformLabel}. It means a lot to us and helps other guests find us.
            </p>
            <a href="${reviewUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              Leave a review on ${platformLabel} →
            </a>
            <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
              Takes less than 2 minutes. Thank you for your support!
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You received this because a team member at ${locationName} invited you to leave a review.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: `How was your visit to ${locationName}? We'd love your feedback`,
    html,
  });
}

interface LocationDigestData {
  name: string;
  newReviews: number;
  avgRating: number | null;
  responseRate: number;
  worstReview: { reviewerName: string; rating: number; reviewText: string | null } | null;
}

export async function sendWeeklyDigestEmail({
  to,
  fullName,
  weekStart,
  weekEnd,
  locations,
}: {
  to: string;
  fullName: string;
  weekStart: Date;
  weekEnd: Date;
  locations: LocationDigestData[];
}): Promise<void> {
  const resend = getResend();
  const fromAddress = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const appUrl = process.env.APP_URL ?? "https://souklick.com";
  const firstName = fullName.split(" ")[0];

  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekLabel = `${fmt(weekStart)} – ${fmt(weekEnd)}`;

  const ratingColor = (r: number | null) => {
    if (r == null) return "#6b7280";
    if (r >= 4.0) return "#16a34a";
    if (r >= 3.0) return "#d97706";
    return "#dc2626";
  };

  const responseRateColor = (r: number) => {
    if (r >= 80) return "#16a34a";
    if (r >= 50) return "#d97706";
    return "#dc2626";
  };

  const locationRows = locations.map((loc) => {
    const worstBlock = loc.worstReview
      ? `<tr><td style="padding:0 0 16px;">
          <div style="background:#fef2f2;border-left:3px solid #fca5a5;border-radius:0 6px 6px 0;padding:12px 16px;">
            <p style="margin:0 0 4px;font-size:12px;color:#b91c1c;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Needs attention</p>
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#111827;">${loc.worstReview.reviewerName} — ${"★".repeat(loc.worstReview.rating)}${"☆".repeat(5 - loc.worstReview.rating)}</p>
            ${loc.worstReview.reviewText ? `<p style="margin:0;font-size:13px;color:#374151;line-height:1.5;">${loc.worstReview.reviewText.slice(0, 200)}${loc.worstReview.reviewText.length > 200 ? "…" : ""}</p>` : ""}
          </div>
        </td></tr>`
      : "";

    return `
      <tr><td style="padding:0 0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#f9fafb;padding:14px 20px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">${loc.name}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:0 8px 16px 0;border-right:1px solid #f3f4f6;width:33%;">
                    <p style="margin:0 0 2px;font-size:26px;font-weight:800;color:#111827;">${loc.newReviews}</p>
                    <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">New reviews</p>
                  </td>
                  <td style="text-align:center;padding:0 8px 16px;border-right:1px solid #f3f4f6;width:33%;">
                    <p style="margin:0 0 2px;font-size:26px;font-weight:800;color:${ratingColor(loc.avgRating)};">${loc.avgRating != null ? loc.avgRating.toFixed(1) + "★" : "—"}</p>
                    <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Avg rating</p>
                  </td>
                  <td style="text-align:center;padding:0 0 16px 8px;width:33%;">
                    <p style="margin:0 0 2px;font-size:26px;font-weight:800;color:${responseRateColor(loc.responseRate)};">${loc.responseRate}%</p>
                    <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Response rate</p>
                  </td>
                </tr>
                ${worstBlock}
              </table>
            </td>
          </tr>
        </table>
      </td></tr>`;
  }).join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Souklick</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Weekly digest · ${weekLabel}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px 4px;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;">Your week in reviews, ${firstName}</p>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;">Here's how your locations performed over the past 7 days.</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${locationRows}
            </table>
            <a href="${appUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;margin-bottom:8px;">
              Open dashboard →
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You're receiving this weekly digest from Souklick.
              <a href="${appUrl}/settings/notifications" style="color:#9ca3af;">Manage preferences</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: `Your weekly review digest — ${weekLabel}`,
    html,
  });
}

interface ReviewAlertPayload {
  to: string[];
  reviewerName: string;
  rating: number;
  reviewText: string | null;
  locationName: string;
  platform: string;
  appUrl: string;
}

export async function sendReviewAlerts(payload: ReviewAlertPayload): Promise<void> {
  if (payload.to.length === 0) return;

  const resend = getResend();
  const stars = STAR_MAP[payload.rating] ?? "★".repeat(payload.rating);
  const platformLabel = PLATFORM_LABEL[payload.platform] ?? payload.platform;
  const excerpt = payload.reviewText
    ? payload.reviewText.length > 300
      ? payload.reviewText.slice(0, 297) + "…"
      : payload.reviewText
    : "No review text provided.";

  const ratingColor = payload.rating <= 2 ? "#dc2626" : payload.rating === 3 ? "#d97706" : "#16a34a";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Souklick</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">New review alert</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">
              ${platformLabel} · ${payload.locationName}
            </p>
            <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">${payload.reviewerName}</p>

            <p style="margin:0 0 20px;font-size:20px;color:${ratingColor};letter-spacing:2px;">${stars}</p>

            <div style="background:#f9fafb;border-left:3px solid #e5e7eb;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">${excerpt.replace(/\n/g, "<br>")}</p>
            </div>

            <a href="${payload.appUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              View &amp; Respond →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You're receiving this because you have email alerts turned on in Souklick.
              <a href="${payload.appUrl}/settings/notifications" style="color:#9ca3af;">Manage preferences</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const fromAddress = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const subject = `New ${payload.rating}★ review at ${payload.locationName} — ${payload.reviewerName}`;

  // Send to each recipient individually to avoid exposing other emails
  await Promise.all(
    payload.to.map((email) =>
      resend.emails.send({ from: fromAddress, to: email, subject, html })
    )
  );
}

export async function sendPrivateFeedbackAlertEmail({
  organizationId,
  locationName,
  customerName,
  rating,
  feedbackText,
}: {
  organizationId: string;
  locationName: string;
  customerName: string;
  rating: number;
  feedbackText: string | null;
}): Promise<void> {
  const owners = await db
    .select({ email: usersTable.email, fullName: usersTable.fullName })
    .from(usersTable)
    .where(eq(usersTable.organizationId, organizationId));

  if (owners.length === 0) return;

  const resend = getResend();
  const fromAddress = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const stars = STAR_MAP[rating] ?? "★".repeat(rating);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${locationName}</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Private feedback received</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">A customer left private feedback</p>
            <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">This was not posted publicly — it was captured by your feedback funnel.</p>
            <table cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;width:100%;margin-bottom:20px;">
              <tr>
                <td>
                  <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">From: ${customerName}</p>
                  <p style="margin:0 0 8px;font-size:22px;">${stars}</p>
                  ${feedbackText ? `<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-style:italic;">"${feedbackText}"</p>` : `<p style="margin:0;font-size:13px;color:#9ca3af;">No additional comments.</p>`}
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#6b7280;">
              Consider reaching out to ${customerName} directly to resolve their concern before it becomes a public review.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Sent by Souklick · Private feedback is never shared publicly.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await Promise.all(
    owners.map((o) =>
      resend.emails.send({
        from: fromAddress,
        to: o.email,
        subject: `⚠️ Private feedback at ${locationName} — ${stars}`,
        html,
      })
    )
  );
}
