import nodemailer, { type Transporter } from "nodemailer";

const DEFAULT_FROM = '"Lost & Found" <noreply@lostfound.in>';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Fail fast so a dead SMTP server doesn't hang the auth request.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER);
}

function otpEmailHtml(heading: string, intro: string, otp: string, outro: string) {
  return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${heading}</h2>
        <p>${intro}</p>
        <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <h1 style="margin: 0; letter-spacing: 4px; color: #059669;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>${outro}</p>
      </div>
    `;
}

export async function sendVerificationOTP(email: string, otp: string) {
  if (!smtpConfigured()) {
    // Without SMTP the code only goes to the server log (see .env.example).
    console.log(`[EMAIL NOT CONFIGURED] Verification code for ${email}: ${otp}`);
    return;
  }

  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: email,
      subject: "Verify Your Account - Lost & Found",
      text: `Your Lost & Found verification code is ${otp}. It expires in 10 minutes.`,
      html: otpEmailHtml(
        "Verify Your Email Address",
        "Thank you for signing up for Lost &amp; Found! Please use the following One-Time Password (OTP) to complete your registration:",
        otp,
        "If you didn't request this code, you can safely ignore this email."
      ),
    });
    console.log("Verification email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

export async function sendPasswordResetOTP(email: string, otp: string) {
  if (!smtpConfigured()) {
    console.log(`[EMAIL NOT CONFIGURED] Password reset code for ${email}: ${otp}`);
    return;
  }

  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: email,
      subject: "Password Reset - Lost & Found",
      text: `Your Lost & Found password reset code is ${otp}. It expires in 10 minutes.`,
      html: otpEmailHtml(
        "Password Reset Request",
        "We received a request to reset your password for your Lost &amp; Found account. Please use the following One-Time Password (OTP) to reset your password:",
        otp,
        "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged."
      ),
    });
    console.log("Password reset email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}
