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
