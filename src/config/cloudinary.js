import { v2 as cloudinary } from "cloudinary";
import ENV from "./env.js";

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
  secure: true,
});

(async () => {
  try {
    await cloudinary.api.ping();
    console.log("Connected to Cloudinary");
  } catch (err) {
    console.error("Error connecting to Cloudinary:", err.message);
  }
})();

export default cloudinary;
