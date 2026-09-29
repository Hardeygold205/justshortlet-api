import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "production" ? ".env" : ".env.local";

dotenv.config({ path: envFile });

const ENV = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.APP_URL,

  // PostgreSQL
  POSTGRES_DATABASE_URL: process.env.POSTGRES_DATABASE_URL,
  POSTGRES_DIRECT_URL: process.env.POSTGRES_DIRECT_URL,

  // Redis
  REDIS_REFRESH_TOKEN_EXPIRES: process.env.REDIS_REFRESH_TOKEN_EXPIRES,
  REDIS_USER_CACHE_TTL: process.env.REDIS_USER_CACHE_TTL,
  REDIS_URL: process.env.REDIS_URL,

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,

  // Storage
  STORAGE_DRIVER: process.env.STORAGE_DRIVER,
  STORAGE_PATH: process.env.STORAGE_PATH,
  STORAGE_URL: process.env.STORAGE_URL,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,

  // Termii
  TERMII_BASE_URL: process.env.TERMII_BASE_URL,
  TERMII_API_KEY: process.env.TERMII_API_KEY,
  TERMII_SENDER_ID: process.env.TERMII_SENDER_ID,
  TERMII_EMAIL_CONFIG_ID: process.env.TERMII_EMAIL_CONFIG_ID,
};

const required = [
  "POSTGRES_DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "STORAGE_DRIVER",
  "STORAGE_PATH",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

for (const key of required) {
  if (!ENV[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export default ENV;
