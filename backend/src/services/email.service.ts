/**
 * Email Service with SMTP Integration
 *
 * For development: Logs emails to console (unless SMTP is configured)
 * For production: Uses SMTP to send actual emails
 */

import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Initialize SMTP transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter && process.env.SMTP_HOST && process.env.SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const { to, subject, text, html } = options;

  const transport = getTransporter();

  // If SMTP is not configured, log to console (development mode)
  if (!transport) {
    console.log(
      "\n========== EMAIL (Console Mode - SMTP Not Configured) =========="
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
      "💡 To send real emails, configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env"
    );
    return;
  }

  // Send email via SMTP
  try {
    const emailFrom =
      process.env.SMTP_FROM_NAME && process.env.SMTP_USER
        ? `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_USER}>`
        : process.env.SMTP_USER || "noreply@example.com";

    const mailOptions: nodemailer.SendMailOptions = {
      from: emailFrom,
      to,
      subject,
      text,
    };

    if (html) {
      mailOptions.html = html;
    }

    const result = await transport.sendMail(mailOptions);

    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`   Message ID: ${result.messageId}`);
  } catch (error: any) {
    console.error("❌ Failed to send email via SMTP:", error.message);

    // In development, log the email content as fallback
    if (process.env.NODE_ENV !== "production") {
      console.log("\n========== EMAIL (Fallback - SMTP Failed) ==========");
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
