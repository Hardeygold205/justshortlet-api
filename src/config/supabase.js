import { createClient } from "@supabase/supabase-js";
import ENV from "./env.js";

export const supabaseClient = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
);

export const supabaseAdmin = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY,
);

(async () => {
  try {
    const { error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
    if (error) throw error;
    console.log("Connected to Supabase");
  } catch (err) {
    console.error("Error connecting to Supabase:", err.message);
  }
})();