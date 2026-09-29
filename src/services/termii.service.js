import { termiiApi } from "../config/termii.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import AppError from "../utils/AppError.js";

export const sendSmsOtp = async (phone, code) => {
  if (!process.env.TERMII_API_KEY || !process.env.TERMII_SENDER_ID) {
    console.log(`[DEV OTP] ${phone}: ${code}`);
    return;
  }
  try {
    await termiiApi.post("/sms/send", {
      // api_key: process.env.TERMII_API_KEY,
      // to: phone,
      // from: process.env.TERMII_SENDER_ID,
      // sms: `Your JustShortlet verification code is ${code}. Expires in 5 minutes.`,
      // type: "plain",
      // channel: "generic",
    });
  } catch (err) {
    throw new AppError(
      "Failed to send SMS. Please try again.",
      STATUS_CODES.INTERNAL_SERVER_ERROR,
    );
  }
};
