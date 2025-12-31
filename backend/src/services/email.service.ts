/**
 * Email Service with Mailgun Integration
 *
 * For development: Logs emails to console (unless MAILGUN_API_KEY is set)
 * For production: Uses Mailgun to send actual emails
 */

import Mailgun from "mailgun.js";
import formData from "form-data";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Initialize Mailgun client
let mailgunClient: any = null;

const getMailgunClient = () => {
  if (
    !mailgunClient &&
    process.env.MAILGUN_API_KEY &&
    process.env.MAILGUN_DOMAIN
  ) {
    const mailgun = new Mailgun(formData);
    mailgunClient = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
    });
  }
  return mailgunClient;
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const { to, subject, text, html } = options;

  const client = getMailgunClient();

  // If Mailgun is not configured, log to console (development mode)
  if (!client) {
    console.log(
      "\n========== EMAIL (Console Mode - Mailgun Not Configured) =========="
    );
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text}`);
    if (html) {
      console.log(`HTML: ${html.substring(0, 200)}...`);
    }
    console.log(
      "===================================================================\n"
    );
    console.log(
      "💡 To send real emails, configure MAILGUN_API_KEY and MAILGUN_DOMAIN in .env"
    );
    return;
  }

  // Send email via Mailgun
  try {
    const emailFrom = process.env.EMAIL_FROM || "noreply@sandbox.mailgun.org";

    const messageData: any = {
      from: emailFrom,
      to,
      subject,
      text,
    };

    if (html) {
      messageData.html = html;
    }

    const result = await client.messages.create(
      process.env.MAILGUN_DOMAIN!,
      messageData
    );

    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`   Message ID: ${result.id}`);
  } catch (error: any) {
    console.error("❌ Failed to send email via Mailgun:", error.message);

    // In development, log the email content as fallback
    if (process.env.NODE_ENV !== "production") {
      console.log("\n========== EMAIL (Fallback - Mailgun Failed) ==========");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log("======================================================\n");
    }

    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  frontendUrl: string
): Promise<void> => {
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const text = `
You are receiving this email because you (or someone else) has requested a password reset for your account.

Please click on the following link, or paste it into your browser to complete the process:

${resetUrl}

This link will expire in 1 hour.

If you did not request this, please ignore this email and your password will remain unchanged.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #C8102E;">Password Reset Request</h2>
      <p>You are receiving this email because you (or someone else) has requested a password reset for your account.</p>
      <p>Please click on the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #C8102E; 
                  color: white; 
                  padding: 12px 30px; 
                  text-decoration: none; 
                  border-radius: 5px;
                  display: inline-block;
                  font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">
        This link will expire in 1 hour.
      </p>
      <p style="color: #999; font-size: 14px;">
        If you did not request this, please ignore this email and your password will remain unchanged.
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Password Reset Request - Got Your Back",
    text,
    html,
  });
};
