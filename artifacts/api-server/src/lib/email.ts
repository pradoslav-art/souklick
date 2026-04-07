import { Resend } from "resend";

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
