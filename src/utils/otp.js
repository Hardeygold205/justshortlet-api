export const OTP_EXPIRY_MINUTES = 5;

export const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));
