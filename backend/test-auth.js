import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

const email = "vinod123@gmail.com";
// const password = "Tobi@1225";

const { data, error } = await supabase.auth.signInWithPassword({
  email,
//   password
});

if (error) {
  console.error("Login failed:", error.message);
  process.exit(1);
}

console.log("Login successful!");
console.log("User ID:", data.user.id);
console.log("Access token:", data.session.access_token);