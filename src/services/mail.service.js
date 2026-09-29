import nodemailer from "nodemailer";
import { STATUS_CODES } from "../constants/statusCode.js";
import AppError from "../utils/AppError.js";

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

export const sendEmailOtp = async (email, code) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) {
    console.log(`[DEV OTP] ${email}: ${code}`);
    return;
  }
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Your JustShortlet verification code",
      text: `Your JustShortlet verification code is ${code}. It expires in 5 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="margin:0 0 12px">Verify your email</h2>
          <p>Use the code below to complete your verification:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:20px 0">${code}</p>
          <p style="color:#666">This code expires in 5 minutes. If you didn't request it, you can ignore this email.</p>
        </div>`,
    });
  } catch (err) {
    console.error("Mail error:", err.message);
    throw new AppError(
      "Failed to send email. Please try again.",
      STATUS_CODES.INTERNAL_SERVER_ERROR,
    );
  }
};
