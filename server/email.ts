import { Resend } from "resend";

let connectionSettings: any;

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (hostname && xReplitToken) {
    try {
      connectionSettings = await fetch(
        "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
        {
          headers: {
            Accept: "application/json",
            "X-Replit-Token": xReplitToken,
          },
        }
      )
        .then((res) => res.json())
        .then((data) => data.items?.[0]);

      if (connectionSettings?.settings?.api_key) {
        return {
          apiKey: connectionSettings.settings.api_key,
          fromEmail: connectionSettings.settings.from_email || "onboarding@resend.dev",
        };
      }
    } catch {
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    return { apiKey, fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev" };
  }

  throw new Error("Resend not configured: no API key found");
}

async function getResendClient(): Promise<{ client: Resend; fromEmail: string }> {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const { client, fromEmail } = await getResendClient();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin:0;padding:40px 16px;">
        <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:40px 36px;">
          <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;font-weight:600;letter-spacing:0.5px;">Reset your password</h1>
          <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin:0 0 28px;">
            We received a request to reset the password for your Lumen Fidei account. Click the button below to choose a new password.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:1.5px;text-transform:uppercase;padding:12px 28px;border-radius:6px;">
            Reset Password
          </a>
          <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:28px 0 0;line-height:1.6;">
            This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email — your password will not change.
          </p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:28px 0 20px;" />
          <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;">
            Lumen Fidei &mdash; Catholic Healing &amp; Deliverance Formation
          </p>
        </div>
      </body>
    </html>
  `;

  await client.emails.send({
    from: `Lumen Fidei <${fromEmail}>`,
    to,
    subject: "Reset your Lumen Fidei password",
    html,
  });
}
