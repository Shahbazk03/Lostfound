import nodemailer from "nodemailer";

// In a real app, use environment variables for these.
// E.g., process.env.SMTP_HOST, process.env.SMTP_PORT, process.env.SMTP_USER, process.env.SMTP_PASS
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationOTP(email: string, otp: string) {
  // If no SMTP user is provided, we can log the OTP to the console for development
  if (!process.env.SMTP_USER) {
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Lost & Found" <noreply@lostfound.in>',
    to: email,
    subject: "Verify Your Account - Lost & Found",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Thank you for signing up for Lost & Found! Please use the following One-Time Password (OTP) to complete your registration:</p>
        <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <h1 style="margin: 0; letter-spacing: 4px; color: #059669;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
