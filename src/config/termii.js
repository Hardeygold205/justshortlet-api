import axios from "axios";
import ENV from "./env.js";

export const termiiApi = axios.create({
  baseURL: ENV.TERMII_BASE_URL,
  timeout: 10000,
});
